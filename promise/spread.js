if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./when",
  "./all",
  "../lib/adapters!lang"
], function(when, all, lang){
  "use strict";

  /**
  * promise.spread(arrayOrPromise[, callback, errback, progback]) -> promise.Promise
  * - arrayOrPromise (?): Either an array or a promise
  * - callback (Function): Callback to be invoked when the promise is resolved, or a non-promise is received
  * - errback (Function): Callback to be invoked when the promise is rejected
  * - progback (Function): Callback to be invoked when the promise emits a progress update
  *
  * Takes an array (or a promise for one), applies [[promise.all]] to it, and
  * then will invoke the `callback` with the resulting array used for its
  * arguments. If applying [[promise.all]] does not result in an array, its 
  * result will be passed to `callback` regardless.
  **/
  return function spread(arrayOrPromise, callback, errback, progback){
    return when(arrayOrPromise, function(objectOrArray){
      return all(objectOrArray).then(callback && function(objectOrArray){
        if(lang.isArray(objectOrArray)){
          return callback.apply(undefined, objectOrArray);
        }else{
          return callback(objectOrArray);
        }
      }, errback);
    }, errback, progback);
  };
});
