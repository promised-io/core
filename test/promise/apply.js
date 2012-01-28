if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/apply",
  "../../promise/defer"
], function(buster, apply, defer){
  buster.testCase("promise/apply", {
    setUp: function(){
      this.count = buster.assertions.count;
    },

    "returning value": function(){
      var obj = {};
      return apply(function(){ return obj; }).then(function(result){
        assert.same(result, obj);
      }, function(){
        assert.fail("should not be rejected!");
      });
    },

    "returning promise": function(){
      var obj = {};
      var deferred = defer();
      apply(function(){ return deferred.promise; }).then(function(result){
        assert.same(result, obj);
      }, function(){
        assert.fail("should not be rejected!");
      });
      deferred.resolve(obj);
    },

    "throwing error": function(){
      var obj = {};
      return apply(function(){ throw obj; }).then(function(){
        assert.fail("should not be resolved!");
      }, function(result){
        assert.same(result, obj);
      });
    },

    "with thisObject": function(){
      var obj = {};
      apply(function(){ assert.same(this, obj); }, obj);
    },

    "passing arguments": function(){
      var obj1 = {}, obj2 = {};
      apply(function(arg1, arg2){
        assert.same(arg1, obj1);
        assert.same(arg2, obj2);
      }, null, [obj1, obj2]);
    }
  });
});
