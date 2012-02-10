if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "../promise/call",
  "../promise/defer"
], function(testCase, assert, call, defer){
  return testCase("promise/call", {
    "returning value": function(){
      var obj = {};
      return call(function(){ return obj; }).then(function(result){
        assert.same(result, obj);
      }, function(){
        assert.fail("should not be rejected!");
      });
    },

    "returning promise": function(){
      var obj = {};
      var deferred = defer();
      call(function(){ return deferred.promise; }).then(function(result){
        assert.same(result, obj);
      }, function(){
        assert.fail("should not be rejected!");
      });
      deferred.resolve(obj);
    },

    "throwing error": function(){
      var obj = {};
      return call(function(){ throw obj; }).then(function(){
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
      call(function(arg1, arg2){
        assert.same(arg1, obj1);
        assert.same(arg2, obj2);
      }, null, obj1, obj2);
    }
  });
});
