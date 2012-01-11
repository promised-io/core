if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "../lib/adapters!timers"
], function(defer, timers){
  /**
   * promise.delay([ms]) -> promise.Promise
   * - ms (Number): Delay in milliseconds
   *
   * Resolves a promise after a delay. In case `ms` is `undefined`, the promise
   * is resolved as quickly as the host environment allows. For example under
   * Node it'd use `process.nextTick()`.
   **/
  return function delay(ms){
    var clearId;
    var deferred = defer(function(reason){
      clearId && timers.clear(clearId);
      return reason;
    });

    if(typeof ms === "undefined"){
      timers.immediate(deferred.resolve);
    }else{
      clearId = timers.set(deferred.resolve, ms);
    }

    return deferred.promise;
  };
});
