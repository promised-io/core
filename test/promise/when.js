if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/when",
  "../../promise/Promise",
  "../../promise/Deferred"
], function(buster, defer, when, Promise, Deferred){
  buster.testCase("promise/when", {
    setUp: function(){
      this.deferred = defer();
      this.count = buster.assertions.count;
    },

    "returns the same promise without callbacks": function(){
      var obj = {};
      var promise1 = when(obj);
      assert.isInstance(promise1, Promise, "promise.Promise");
      var promise2 = when(this.deferred.promise);
      assert.isInstance(promise2, Promise, "promise.Promise");
      assert.same(this.deferred.promise, promise2);
    },

    "with a result value": function(){
      var obj = {};
      when(obj, function(result){
        assert.same(result, obj);
      });
    },

    "with a promise that gets resolved": function(){
      var obj = {};
      when(this.deferred.promise, function(result){
        assert.same(result, obj);
      });
      this.deferred.resolve(obj);
      assert.ran(this.count + 1);
    },

    "with a promise that gets rejected": function(){
      var obj = {};
      when(this.deferred.promise, null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
      assert.ran(this.count + 1);
    },

    "with a promise that gets progress": function(){
      var obj = {};
      when(this.deferred.promise, null, null, function(result){
        assert.same(result, obj);
      });
      this.deferred.progress(obj);
      assert.ran(this.count + 1);
    },

    "with chaining of the result": function(){
      function square(n){ return n * n; }

      when(2, square).then(square).then(function(n){
        assert.same(n, 16);
      });
      assert.ran(this.count + 1);
    },

    "converts foreign promises": function(){
      var _callback;
      var foreign = { then: function(cb){ _callback = cb; } };
      var promise = when(foreign);
      assert.isInstance(promise, Promise, "promise.Promise");

      var obj = {};
      promise.then(function(result){
        assert.same(result, obj);
      });
      _callback(obj);
      assert.ran(this.count + 2);
    }
  });
});
