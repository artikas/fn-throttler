# fn-throttler
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Test Coverage][circle-image]][circle-url]
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/artikas/fn-throttler/master/LICENSE)

**fn-throttler.js** uses promises to implement a rate limiter that can be used in conjunction with any function/promise. It currently uses a MongoDB instance to synchronize across multiple cores (or clusters).

## Usage

### Initialize
```javascript

var Throttler = require('fn-throttler');

    var th = new Throttler({
      maxPerSecond: 100,
      retryInterval: 1000,
      db: $db,
    });
```
### Throttle
```javascript


  function throttleFunction() {
    ...
    //throttle - will check limit and either fulfill or retry after a delay
    return th.next()
    .then(()=>{
      return myfunction();
    }

}
```

[npm-image]: https://img.shields.io/npm/v/fn-throttler.svg
[npm-url]: https://npmjs.org/package/fn-throttler
[circle-image]: https://circleci.com/gh/artikas/fn-throttler.png?style=shield
[circle-url]: https://circleci.com/gh/artikas/fn-throttler/tree/master
[downloads-image]: https://img.shields.io/npm/dm/fn-throttler.svg
[downloads-url]: https://npmjs.org/package/fn-throttler