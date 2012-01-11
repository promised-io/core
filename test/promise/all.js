if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/all"
], function(buster, defer, all){
  buster.testCase("promise/all", {
    setUp: function(){
      this.deferred = defer();
      this.count = buster.assertions.count;
    },

    "with array argument": function(){
      var obj1 = {}, obj2 = {}, obj3 = {};
      all([this.deferred, defer().resolve(obj2), obj3]).then(function(result){
        assert.same(result[0], obj1);
        assert.same(result[1], obj2);
        assert.same(result[2], obj3);
      });
      this.deferred.resolve(obj1);
      assert.ran(this.count + 3);
    },

    "with object argument": function(){
      var obj1 = {}, obj2 = {}, obj3 = {};
      all({ a: this.deferred, b: defer().resolve(obj2), c: obj3 }).then(function(result){
        assert.same(result.a, obj1);
        assert.same(result.b, obj2);
        assert.same(result.c, obj3);
      });
      this.deferred.resolve(obj1);
      assert.ran(this.count + 3);
    },

    "without arguments": function(){
      assert.exception(function(){
        all();
      }, "TypeError");
    },

    "with single non-object argument": function(){
      assert.exception(function(){
        all();
      }, "TypeError");
    },

    "with empty array": function(){
      all([]).then(function(result){
        assert.equals(result, []);
      });
      assert.ran(this.count + 1);
    },

    "with empty object": function(){
      all({}).then(function(result){
        assert.equals(result, {});
      });
      assert.ran(this.count + 1);
    },

    "with one rejected promise": function(){
      var obj = {};
      all([this.deferred, defer().reject(obj), {}]).then(null, function(result){
        assert.same(result, obj);
      });
      assert.ran(this.count + 1);
    },

    "with one promise rejected later": function(){
      var obj = {};
      all([this.deferred, defer(), defer()]).then(null, function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
      assert.ran(this.count + 1);
    },

    "with multiple promises rejected later": function(){
      var obj = {};
      var deferred2 = defer();
      all([this.deferred, deferred2, defer()]).then(null, function(result){
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
      var promise = all([this.deferred, deferred2, defer()]).then(null, function(result){
        assert.same(result, obj);
      });
      promise.cancel(obj);
      assert.ran(this.count + 1);
    }
  });
});
