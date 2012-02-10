if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "../promise/defer",
  "../promise/Promise",
  "../promise/Deferred"
], function(testCase, assert, defer, Promise, Deferred){
  return testCase("promise/defer", {
    "provides promise": function(){
      assert(defer().promise instanceof Promise);
    },

    "returns a Deferred": function(){
      assert(defer() instanceof Deferred);
    }
  });
});
