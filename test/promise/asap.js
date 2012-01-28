if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/asap"
], function(buster, defer, asap){
  buster.testCase("promise/asap", {
    setUp: function(){
      this.deferred = defer();
    },

    "returns the value without callbacks": function(){
      var obj = {};
      assert.same(obj, asap(obj));
    },

    "with a callback": function(){
      var obj = {};
      asap(obj, function(result){
        assert.same(result, obj);
      });
    },

    "returns the return value of the callback": function(){
      var squared = asap(2, function(result){
        return result * result;
      });
      assert.same(squared, 4);
    },

    "with a promise that gets resolved": function(){
      var obj = {};
      asap(this.deferred.promise, function(result){
        assert.same(result, obj);
      });
      this.deferred.resolve(obj);
    },

    "with a promise that gets rejected": function(){
      var obj = {};
      asap(this.deferred.promise, null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
    },

    "with a promise that gets progress": function(){
      var obj = {};
      asap(this.deferred.promise, null, null, function(result){
        assert.same(result, obj);
      });
      this.deferred.progress(obj);
    }
  });
});
