if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "../promise/node-style/wrap",
  "../promise/defer"
], function(testCase, assert, wrap, defer){
  return testCase("promise/node-style/wrap", {
    "returning value": function(){
      var obj = {};
      return wrap(function(cb){ cb(null, obj); })().then(function(result){
        assert.same(result, obj);
      }, function(){
        assert.fail("should not be rejected!");
      });
    },

    "throwing error": function(){
      var obj = {};
      return wrap(function(){ throw obj; })().then(function(){
        assert.fail("should not be resolved!");
      }, function(result){
        assert.same(result, obj);
      });
    },

    "callback with error": function(){
      var obj = {};
      return wrap(function(cb){ cb(obj); })().then(function(){
        assert.fail("should not be resolved!");
      }, function(result){
        assert.same(result, obj);
      });
    },

    "with thisObject": function(){
      var obj = {};
      wrap(function(){ assert.same(this, obj); }).call(obj);
    },

    "passing arguments": function(){
      var obj1 = {}, obj2 = {};
      wrap(function(arg1, arg2, cb){
        assert.same(arg1, obj1);
        assert.same(arg2, obj2);
      })(obj1, obj2);
    },

    "multiple results": function(){
      var obj1 = {}, obj2 = {};
      wrap(function(cb){ cb(null, obj1, obj2); })().then(function(results){
        assert.same(results[0], obj1);
        assert.same(results[1], obj2);
        assert.same(results.length, 2);
      }, function(){
        assert.fail("should not be rejected!");
      });
    },

    "with undeclared callback": function(){
      var obj1 = {}, obj2 = {};
      return wrap(function(arg1, arg2){
        assert.same(arg1, obj1);
        assert.same(arg2, obj2);
        arguments[arguments.length - 1](null, arg1, arg2);
      }, true)(obj1, obj2).then(function(results){
        assert.same(results[0], obj1);
        assert.same(results[1], obj2);
        assert.same(results.length, 2);
      }, function(error){
        assert.fail("should not be rejected!");
      });
    }
  });
});
