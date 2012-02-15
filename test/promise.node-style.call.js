if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "../promise/node-style/call",
  "../promise/defer"
], function(testCase, assert, call, defer){
  return testCase("promise/node-style/call", {
    "returning value": function(){
      var obj = {};
      return call(function(cb){ cb(null, obj); }).then(function(result){
        assert.same(result, obj);
      }, function(){
        assert.fail("should not be rejected!");
      });
    },

    "throwing error": function(){
      var obj = {};
      return call(function(){ throw obj; }).then(function(){
        assert.fail("should not be resolved!");
      }, function(result){
        assert.same(result, obj);
      });
    },

    "callback with error": function(){
      var obj = {};
      return call(function(cb){ cb(obj); }).then(function(){
        assert.fail("should not be resolved!");
      }, function(result){
        assert.same(result, obj);
      });
    },

    "with thisObject": function(){
      var obj = {};
      call(function(){ assert.same(this, obj); }, obj);
    },

    "passing arguments": function(){
      var obj1 = {}, obj2 = {};
      call(function(arg1, arg2, cb){
        assert.same(arg1, obj1);
        assert.same(arg2, obj2);
      }, null, obj1, obj2);
    },

    "multiple results": function(){
      var obj1 = {}, obj2 = {};
      call(function(cb){ cb(null, obj1, obj2); }).then(function(results){
        assert.same(results[0], obj1);
        assert.same(results[1], obj2);
        assert.same(results.length, 2);
      }, function(){
        assert.fail("should not be rejected!");
      });
    }
  });
});
