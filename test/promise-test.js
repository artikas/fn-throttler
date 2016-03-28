var Promise = require('bluebird');
var mongo = require('mongodb');
var Throttler = require('../src');
var assert = require('assert');

var db;

describe('Retrieve OK to go ahead', function() {

  before(function(done) {
    mongo.connect('mongodb://localhost:27017/fn-throttler-test')
      .then(d => {
        db = d;
        done();
      });
  });

  it('should get initial ok', function() {
    var th = Throttler({
      collection: 'test',
      max: 1,
      unit: 'second',
      db: db,
    });
    return th.getOK()
      .then(d => assert.equal(d, 'OK'));
  });

  it('should get a WAIT after initial OK', function() {
    var th = Throttler({
      max: 1,
      unit: 'second',
      db: db,
    });
    th.getOK();
    th.getOK()
      .then(console.log, e => assert.fail(e, 'WAIT'));
  });

  it('spreads requests across time', function() {
    this.timeout(10000);

    var th = Throttler({
      max: 1,
      db: db,
    });

    function fn(d) {
      return [d, new Date()];
    }

    return Promise.map([1, 2, 3, 4, 5], d => {
        return Promise.resolve(d)
          .then(th.next)
          .then(fn);
      })
      .then(d => {
        d.forEach((x, i) => i && assert(d[i][1] - d[i - 1][1] >= 1000));
        console.log(d);
      });
  });

  after(function(done) {
    db.collection('test').remove({})
      .then(() => done());
  });

});


describe('throttler', function() {


});