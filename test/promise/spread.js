if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/spread"
], function(buster, defer, spread){
  buster.testCase("promise/spread", {
    setUp: function(){
      this.deferred = defer();
    },

    "with array argument": function(){
      var obj1 = {}, obj2 = {}, obj3 = {};
      spread([this.deferred, defer().resolve(obj2), obj3], function(arg1, arg2, arg3){
        assert.same(arg1, obj1);
        assert.same(arg2, obj2);
        assert.same(arg3, obj3);
      });
      this.deferred.resolve(obj1);
    },

    "with object argument": function(){
      var obj1 = {}, obj2 = {}, obj3 = {};
      spread({ a: this.deferred, b: defer().resolve(obj2), c: obj3 }, function(result){
        assert.same(result.a, obj1);
        assert.same(result.b, obj2);
        assert.same(result.c, obj3);
      });
      this.deferred.resolve(obj1);
    },

    "without arguments": function(){
      spread().then(function(result){
        assert.same(arguments.length, 1);
        refute.defined(result);
      });
    },

    "with single non-object argument": function(){
      spread(null, function(result){
        assert.same(arguments.length, 1);
        refute.defined(result);
      });
    },

    "with empty array": function(){
      spread([], function(){
        assert.same(arguments.length, 0);
      });
    },

    "with empty object": function(){
      spread({}, function(result){
        assert.equals(result, {});
      });
    },

    "with one rejected promise": function(){
      var obj = {};
      spread([this.deferred, defer().reject(obj), {}], null, function(result){
        assert.same(result, obj);
      });
    },

    "with one promise rejected later": function(){
      var obj = {};
      spread([this.deferred, defer(), defer()], null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
    },

    "with multiple promises rejected later": function(){
      var obj = {};
      var deferred2 = defer();
      spread([this.deferred, deferred2, defer()], null, function(result){
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
      var promise = spread([this.deferred, deferred2, defer()], null, function(result){
        assert.same(result, obj);
      });
      promise.cancel(obj);
    },

    "with promise for array": function(){
      var obj1 = {}, obj2 = {};
      spread(this.deferred, function(arg1, arg2){
        assert.same(arg1, obj1);
        assert.same(arg2, obj2);
      });
      this.deferred.resolve([obj1, obj2]);
    },

    "with rejected promise for array": function(){
      var obj = {};
      spread(this.deferred, null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
    }
  });
});
