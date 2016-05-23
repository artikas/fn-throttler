var Promise = require("bluebird");

function Throttler(options) {

  var max = options.max || Infinity;
  var unit = options.unit || 'second';
  var db = options.db;
  var key = options.key || 'default_key';
  var collectionName = options.collection || 'fn-throttler';
  var outstandingReqs = 0;
  var maxRetries = options.maxRetries || Infinity;

  var unitLookup = {
    'second': 1000,
    'minute': 1000 * 60,
    'hour': 1000 * 60 * 60,
    'day': 1000 * 60 * 60 * 24,
  };
  var denominator = typeof unit === 'string' ? (unitLookup[unit] || 1000) : unit;
  var retryInterval = options.retryInterval || denominator;

  function getCurrentCount() {
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

  function getToken(data) {
    return getCurrentCount()
      .then(d => {
        if (d.value.counter <= max) return (data || 'OK');
        throw 'WAIT';
      });
  }

  function runFn(fn, args) {
    return new Promise(function(resolve, reject) {
      function retryFunction() {
        return getToken()
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

  function nextToken(data, retry) {
    if (!retry) outstandingReqs += 1;
    return getCurrentCount()
      .then(d => {
        if (d.value.counter <= max) {
          outstandingReqs -= 1;
          return data;
        }
        if (retry > maxRetries) throw 'MAX_RETRIES';
        return Promise.delay(retryInterval)
          .then(() => nextToken(data, (retry || 0) + 1));
      });
  }

  return {
    runFn: runFn,
    getToken: getToken,
    getCurrentCount: getCurrentCount,
    nextToken: nextToken,
    outstandingReqs: outstandingReqs,
    options: options,
  };
}

module.exports = Throttler;
