if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "./test-case/refute",
  "../promise/defer",
  "../promise/later",
  "../promise/Promise",
  "../promise/Deferred"
], function(testCase, assert, refute, defer, later, Promise, Deferred){
  return testCase("promise/later", {
    beforeEach: function(){
      this.deferred = defer();
    },

    "returns the same promise without callbacks": function(){
      var obj = {};
      var promise1 = later(obj);
      assert(promise1 instanceof Promise);
      var promise2 = later(this.deferred.promise);
      assert(promise2 instanceof Promise);
      assert.same(this.deferred.promise, promise2);
    },

    "with a result value": function(){
      var obj = {};
      var promise = later(obj, function(result){
        assert.same(result, obj);
      });
      refute(promise.isFulfilled());
    },

    "with a fulfilled promise": function(){
      var obj = {};
      this.deferred.resolve(obj);
      var promise = later(this.deferred.promise);
      refute(promise.isFulfilled());
      return promise.then(function(result){
        assert.same(result, obj);
      });
    },

    "with a promise that gets resolved": function(){
      var obj = {};
      later(this.deferred.promise, function(result){
        assert.same(result, obj);
      });
      this.deferred.resolve(obj);
    },

    "with a promise that gets rejected": function(){
      var obj = {};
      later(this.deferred.promise, null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
    },

    "with a promise that gets progress": function(){
      var obj = {};
      later(this.deferred.promise, null, null, function(result){
        assert.same(result, obj);
      });
      this.deferred.progress(obj);
    },

    "with chaining of the result": function(){
      function square(n){ return n * n; }

      return later(2, square).then(square).then(function(n){
        assert.same(n, 16);
      });
    },

    "converts foreign promises": function(){
      var _callback;
      var foreign = { then: function(cb){ _callback = cb; } };
      var promise = later(foreign);

      var obj = {};
      promise.then(function(result){
        assert(promise instanceof Promise);
        assert.same(result, obj);
      });
      _callback(obj);
      return promise;
    }
  });
});
