if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "../lib/adapters!timers"
], function(defer, timers){
  "use strict";

  /**
  * promise.delay([ms]) -> promise.Promise
  * - ms (Number): Delay in milliseconds
  *
  * Resolves a promise after a delay. In case `ms` is not passed, the promise
  * is resolved as quickly as the host environment allows. For example under
  * Node it'd use `process.nextTick()`.
  **/
  return function delay(ms){
    var clearId;
    var deferred = defer(function(){
      if(clearId){
        timers.clear(clearId);
      }
    });

    if(arguments.length === 0){
      timers.immediate(deferred.resolve);
    }else{
      var start = new Date().getTime();
      clearId = timers.set(function(){
        var passed = new Date().getTime() - start;
        if(passed < ms){
          return delay(ms - passed).then(deferred.resolve);
        }
        deferred.resolve();
      }, ms);
    }

    return deferred.promise;
  };
});
