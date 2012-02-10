if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "./test-case/refute",
  "../promise/delay"
], function(testCase, assert, refute, delay){
  return testCase("promise/delay", {
    "immediate": function(done){
      var promise = delay();
      refute(promise.isResolved());
      setTimeout(function(){
        assert(promise.isResolved());
        done();
      }, 0);
    },

    "with regular timeout": function(done){
      var promise = delay(1);
      refute(promise.isResolved());
      setTimeout(function(){
        assert(promise.isResolved());
        done();
      }, 2);
    },

    "immediate, canceled": function(){
      var promise = delay();
      refute(promise.isResolved());
      promise.cancel();
      assert(promise.isCanceled());
    },

    "regular, canceled": function(){
      var promise = delay(1);
      refute(promise.isResolved());
      promise.cancel();
      assert(promise.isCanceled());
    }
  });
});
