var Promise = require("bluebird");

function Throttler(options) {

  var maxPerSecond = options.maxPerSecond || 100;
  var retryInterval = options.retryInterval || 1000;
  var db = options.db;
  var key = options.key || 'default_key';

  function getCount() {
    var timestamp = Date.now();
    return db.collection('throttling')
      .findOneAndUpdate({
        key: key + '_' + Math.floor(timestamp / 1000)
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
        if (d.value.counter <= maxPerSecond) return 'OK';
        throw 'WAIT';
      });
  }

  function run(fn, args) {
    // todo: eliminate new Promise. Only workaround for dealing with 'spread' after the promise
    return new Promise(function(resolve, reject) {
      function retryFunction() {
        return getOK()
          .then(() => {
            return Promise.resolve(fn(args))
              .then(resolve, reject);
          }, d => {
            if (d === 'WAIT') {
              console.log('retrying...');
              return Promise.delay(retryInterval)
                .then(retryFunction);
            } else throw d;
          })
          .catch(e => console.log('error:' + e));
      }

      return retryFunction();
    });
  }

  return {
    run: run
  };
}

module.exports = Throttler;