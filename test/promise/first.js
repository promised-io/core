if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/first"
], function(buster, defer, first){
  buster.testCase("promise/first", {
    setUp: function(){
      this.deferred = defer();
      this.count = buster.assertions.count;
    },

    "with array argument": function(){
      var obj = {};
      first([this.deferred, defer().resolve(obj), {}]).then(function(result){
        assert.same(result, obj);
      });
      this.deferred.resolve({});
      assert.ran(this.count + 1);
    },

    "with object argument": function(){
      var obj = {};
      first({ a: this.deferred, b: defer().resolve(obj), c: {} }).then(function(result){
        assert.same(result, obj);
      });
      this.deferred.resolve({});
      assert.ran(this.count + 1);
    },

    "without arguments": function(){
      assert.exception(function(){
        first();
      }, "TypeError");
    },

    "with single non-object argument": function(){
      assert.exception(function(){
        first();
      }, "TypeError");
    },

    "with empty array": function(){
      first([]).then(function(result){
        refute.defined(result);
      });
      assert.ran(this.count + 1);
    },

    "with empty object": function(){
      first({}).then(function(result){
        refute.defined(result);
      });
      assert.ran(this.count + 1);
    },

    "with one rejected promise": function(){
      var obj = {};
      first([this.deferred, defer().reject(obj), {}]).then(null, function(result){
        assert.same(result, obj);
      });
      assert.ran(this.count + 1);
    },

    "with one promise rejected later": function(){
      var obj = {};
      first([this.deferred, defer(), defer()]).then(null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
      assert.ran(this.count + 1);
    },

    "with multiple promises rejected later": function(){
      var obj = {};
      var deferred2 = defer();
      first([this.deferred, deferred2, defer()]).then(null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
      deferred2.reject({});
      assert.ran(this.count + 1);
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
      assert.ran(this.count + 1);
    }
  });
});
