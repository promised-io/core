if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "./test-case/refute",
  "../promise/defer",
  "../promise/first"
], function(testCase, assert, refute, defer, first){
  return testCase("promise/first", {
    beforeEach: function(){
      this.deferred = defer();
    },

    "with array argument": function(){
      var obj = {};
      first([this.deferred, defer().resolve(obj), {}]).then(function(result){
        assert.same(result, obj);
      });
      this.deferred.resolve({});
    },

    "with object argument": function(){
      var obj = {};
      first({ a: this.deferred, b: defer().resolve(obj), c: {} }).then(function(result){
        assert.same(result, obj);
      });
      this.deferred.resolve({});
    },

    "without arguments": function(){
      first().then(function(result){
        assert.same(arguments.length, 1);
        refute.defined(result);
      });
    },

    "with single non-object argument": function(){
      first(null).then(function(result){
        assert.same(arguments.length, 1);
        refute.defined(result);
      });
    },

    "with empty array": function(){
      first([]).then(function(result){
        refute.defined(result);
      });
    },

    "with empty object": function(){
      first({}).then(function(result){
        refute.defined(result);
      });
    },

    "with one rejected promise": function(){
      var obj = {};
      first([this.deferred, defer().reject(obj), {}]).then(null, function(result){
        assert.same(result, obj);
      });
    },

    "with one promise rejected later": function(){
      var obj = {};
      first([this.deferred, defer(), defer()]).then(null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
    },

    "with multiple promises rejected later": function(){
      var obj = {};
      var deferred2 = defer();
      first([this.deferred, deferred2, defer()]).then(null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
      deferred2.reject({});
    },

    "cancel only affects returned promise, not those we're waiting for": function(){
      var obj = {};
      var deferred2 = defer(function(){
        assert.fail("Canceler for deferred2 should never be called.");
      });
      var promise = first([this.deferred, deferred2, defer()]).then(null, function(result){
        assert.same(result, obj);
      });
      promise.cancel(obj);
    }
  });
});
