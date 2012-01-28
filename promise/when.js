if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "./Promise",
  "./isPromise"
], function(defer, Promise, isPromise){
  "use strict";

  /**
   * promise.when(valueOrPromise[, callback, errback, progback]) -> promise.Promise
   * - valueOrPromise (?): Either a regular value or a promise.
   * - callback (Function): Callback to be invoked when the promise is resolved, or a non-promise is received
   * - errback (Function): Callback to be invoked when the promise is rejected
   * - progback (Function): Callback to be invoked when the promise emits a progress update
   *
   * Accepts promises but also transparently handles non-promises. Returns a
   * promise for the result of the callback(s), but if no callbacks are
   * specified may return the original promise. Can be used to convert foreign
   * promises into [[promise.Promise]].
   **/
   return function when(valueOrPromise, callback, errback, progback){
     var receivedPromise = isPromise(valueOrPromise);
     var nativePromise = receivedPromise && valueOrPromise instanceof Promise;
     if(!receivedPromise){
       valueOrPromise = defer().resolve(valueOrPromise);
     }else if(!nativePromise){
       var deferred = defer(valueOrPromise.cancel);
       valueOrPromise.then(deferred.resolve, deferred.reject, deferred.progress);
       valueOrPromise = deferred.promise;
     }
     if(callback || errback || progback){
       return valueOrPromise.then(callback, errback, progback);
     }
     return valueOrPromise;
   };
});
