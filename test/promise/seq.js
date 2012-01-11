if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/seq"
], function(buster, defer, seq){
  buster.testCase("promise/seq", {
    setUp: function(){
      this.deferred = defer();
      this.count = buster.assertions.count;
    },

    "with an empty array": function(){
      var obj = {};
      seq([], obj).then(function(result){
        assert.same(result, obj);
      });
      assert.ran(this.count + 1);
    },

    "fibonacci": function(){
      var prev = 0;
      var calculate = function(n){
        var result = prev + n;
        prev = n;
        return result;
      };
      seq([calculate, calculate, calculate, calculate], 1).then(function(result){
        assert.same(result, 5);
      });
      assert.ran(this.count + 1);
    },

    "fibonacci, asynchronous": function(){
      var prev = 0;
      var calculate = function(n){
        var deferred = defer();
        setTimeout(function(){
          var result = prev + n;
          prev = n;
          deferred.resolve(result);
        }, 0);
        return deferred.promise;
      };
      return seq([calculate, calculate, calculate, calculate], 1).then(function(result){
        assert.same(result, 5);
      }, function(){
        assert.fail("should not be rejected!");
      });
    },

    "is halted when canceled": function(){
      var obj = {};

      var ran = 0;
      var count = function(){
        ran++;
        var deferred = defer();
        setTimeout(deferred.resolve, 0);
        return deferred.promise;
      };

      var promise = seq([count, count, function(){ ran++; promise.cancel(obj); }, function(){ ran++; }]);
      return promise.then(function(){
        assert.fail("should not be resolved!");
      }, function(result){
        assert.same(ran, 3);
        assert.same(result, obj);
      });
    },

    "current promise is also canceled, but without reason": function(){
      var obj = {};

      var ran = 0;
      var count = function(){
        ran++;
        var deferred = defer();
        setTimeout(deferred.resolve, 0);
        return deferred.promise;
      };
      var promise = seq([
        count,
        count,
        function(){
          ran++;
          var deferred = defer(function(reason){
            refute.defined(reason);
          });
          setTimeout(function(){
            promise.cancel(obj);
          }, 0);
          return deferred.promise;
        },
        function(){ ran++; }
      ]);
      return promise.then(function(){
        assert.fail("should not be resolved!");
      }, function(result){
        assert.same(ran, 3);
        assert.same(result, obj);
      });
    }
  });
});
