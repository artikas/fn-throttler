# fn-throttler
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Test Coverage][circle-image]][circle-url]
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/artikas/fn-throttler/master/LICENSE)

**fn-throttler.js** uses promises to implement a generic rate limiter that can be used to throttle the rate at which promises (or functions) are run. It currently uses a MongoDB instance to synchronize across multiple cores (or clusters).

## Installation

Use NPM to install:

    npm install fn-throttler

## Usage

### 1.) Initialize
```javascript

var Throttler = require('fn-throttler');

    var th = new Throttler({
      max: 100,
      unit: 'second',
      retryInterval: 1000,
      db: $db,
    });
```

The following options are currently available:

* `max` - Maximum attempts per time interval. Defautls to 100.
* `unit` - Unit for time interval. Supports 'second', 'minute', 'hour' and 'day'. Defaults to 'second'. Can take a numeric value in ms to support an arbitrary time unit. For example to enforce a limit per 5 minutes, 'unit' would be 300000 (1000 * 60 * 5).
* `db` - MongoDB connection
* `key` - Unique key for object. Defaults to 'default_key'.
* `collectionName` - MongoDB collection name
* `maxRetries` - Maximum number of retries nextToken() will attempt before rejecting. If not specified, nextToken() will keep reattempting until it resolves.
* `retryInterval` - Interval between attempts. Defautls to 1000ms.

### 2.) Throttle
```javascript


  function throttlePromise() {
    ...
    //throttle - will check the limit and either fulfill or retry after a delay
    return th.nextToken()
    .then(()=>{
      return myPromise();
    }

}
```

##API

### `getToken([data])`

Increases request count by 1. Promise resolves if the rate limit hasn't been reached yet. Otherwise the promise is rejected. Optional param 'data' is returned as the fulfilled value.

### `nextToken([data], [retry])`

Similar to getToken(), but retries on rejection until the 'retry' limit (if any) is reached. Resolves with 'data' as the value so that nextToken() can be easily used as a promise in the promise chain.

Chaining example:
```javascript
...
return getRequestParams();
.then(d => nextToken(d))
.then(d => APIrequest(d)
.then(d => 'Success')
... 
```

### `runFn(fn, args)`
Similar to nextToken(), but takes in a function (which it promisifies) and an argument array. Once successful, returns a resolved promise with the output of the function as the value. 

### `getCurrentCount()`
Returns the number of fulfilled requests for the current time window.

### `outstandingReqs()`
Return the number of requests currently waiting to be executed.

### `options()`
Returns `options` param from initialization.


[npm-image]: https://img.shields.io/npm/v/fn-throttler.svg
[npm-url]: https://npmjs.org/package/fn-throttler
[circle-image]: https://circleci.com/gh/artikas/fn-throttler.png?style=shield
[circle-url]: https://circleci.com/gh/artikas/fn-throttler/tree/master
[downloads-image]: https://img.shields.io/npm/dm/fn-throttler.svg
[downloads-url]: https://npmjs.org/package/fn-throttler
