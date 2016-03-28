var Promise = require("bluebird");

function Throttler(options) {

  var max = options.max || 100;
  var retryInterval = options.retryInterval || 1000;
  var unit = options.unit || 'second';
  var db = options.db;
  var key = options.key || 'default_key';
  var collectionName = options.collection || 'fn-throttler';
  var outstanding = 0;
  var maxRetries = options.maxRetries || Infinity;

  var unitLookup = {
    'second': 1000,
    'minute': 1000 * 60,
    'hour': 1000 * 60 * 60,
    'day': 1000 * 60 * 60 * 24,
  };
  var denominator = unitLookup[unit] || 1000;

  function getCount() {
    var timestamp = Date.now();
    return db.collection(collectionName)
      .findOneAndUpdate({
        key: key + '_' + Math.floor(timestamp / denominator)
      }, {
        $inc: {
          counter: 1
        },
        $set: {
          updated: timestamp
        }
      }, {
        upsert: true,
        returnOriginal: false
      });
  }

  function getOK() {
    return getCount()
      .then(d => {
        if (d.value.counter <= max) return 'OK';
        throw 'WAIT';
      });
  }

  function run(fn, args) {
    return new Promise(function(resolve, reject) {
      function retryFunction() {
        return getOK()
          .then(() => {
            return Promise.resolve(fn(args))
              .then(resolve, reject);
          }, d => {
            if (d === 'WAIT') {
              return Promise.delay(retryInterval)
                .then(retryFunction);
            } else throw d;
          })
          .catch(e => console.log('error:' + e));
      }
      return retryFunction();
    });
  }

  function next(data, retry) {
    if (!retry) outstanding += 1;
    return getCount()
      .then(d => {
        if (d.value.counter <= max) {
          outstanding -= 1;
          return data;
        }
        if (retry > maxRetries) throw 'MAX_RETRIES';
        return Promise.delay(retryInterval)
          .then(() => next(data, (retry || 0) + 1));
      });
  }

  return {
    run: run,
    getOK: getOK,
    getCount: getCount,
    next: next,
    outstanding: outstanding,
  };
}

module.exports = Throttler;