if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/isPromise"
], function(buster, defer, isPromise){
  buster.testCase("promise/isPromise", {
    "tests correctly": function(){
      refute(isPromise(true));
      assert(isPromise(defer()));
      assert(isPromise(defer().promise));
    }
  });
});
