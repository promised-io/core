if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/whenCall",
  "../../promise/defer"
], function(buster, whenCall, defer){
  buster.testCase("promise/whenCall", {
    setUp: function(){
      this.count = buster.assertions.count;
    },

    "returning value": function(){
      var obj = {};
      return whenCall(function(){ return obj; }, function(result){
        assert.same(result, obj);
      }, function(){
        assert.fail("should not be rejected!");
      });
    },

    "returning promise": function(){
      var obj = {};
      var deferred = defer();
      whenCall(function(){ return deferred.promise; }, function(result){
        assert.same(result, obj);
      }, function(){
        assert.fail("should not be rejected!");
      });
      deferred.resolve(obj);
    },

    "throwing error": function(){
      var obj = {};
      return whenCall(function(){ throw obj; }, function(){
        assert.fail("should not be resolved!");
      }, function(result){
        assert.same(result, obj);
      });
    }
  });
});
