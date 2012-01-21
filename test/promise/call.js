if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/call",
  "../../promise/defer"
], function(buster, call, defer){
  buster.testCase("promise/call", {
    setUp: function(){
      this.count = buster.assertions.count;
    },

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
    }
  });
});
