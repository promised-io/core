if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "./test-case/refute",
  "../promise/defer",
  "../promise/isPromise"
], function(testCase, assert, refute, defer, isPromise){
  return testCase("promise/isPromise", {
    "tests correctly": function(){
      refute(isPromise(true));
      assert(isPromise(defer()));
      assert(isPromise(defer().promise));
    }
  });
});
