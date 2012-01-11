if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/Promise",
  "../../promise/Deferred"
], function(buster, defer, Promise, Deferred){
  buster.testCase("promise/defer", {
    "provides promise": function(){
      assert.isInstance(defer().promise, Promise, "promise.Promise");
    },

    "returns a Deferred": function(){
      assert.isInstance(defer(), Deferred, "promise.Deferred");
    }
  });
});
