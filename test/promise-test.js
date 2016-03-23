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
      maxPerSecond: 1,
      db: db,
    });
    return th.getOK()
      .then(d => assert.equal(d, 'OK'));
  });

  it('should get a WAIT after initial OK', function() {
    var th = Throttler({
      maxPerSecond: 1,
      db: db,
    });
    th.getOK();
    th.getOK()
      .then(console.log, e => assert.fail(e, 'WAIT'));
  });

  after(function(done) {
    db.collection('test').remove({})
      .then(() => done());
  });

});