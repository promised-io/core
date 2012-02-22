if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./isPromise"
], function(isPromise){
  "use strict";

  /**
  * promise.asap(valueOrPromise[, callback, errback, progback]) -> value | promise.Promise
  * - valueOrPromise (?): Either a regular value or a promise.
  * - callback (Function): Callback to be invoked when the promise is resolved, or a non-promise is received
  * - errback (Function): Callback to be invoked when the promise is rejected
  * - progback (Function): Callback to be invoked when the promise emits a progress update
  *
  * Accepts promises but also transparently handles non-promises. Returns the
  * result of the callback(s), as a promise if a promise was received, but as
  * a regular value otherwise. If a non-promise is pasesd, errors thrown from
  * `callback` will *not* be caught.
  *
  * Does not convert foreign promises into [[promise.Promise]].
  **/
  return function asap(valueOrPromise, callback, errback, progback){
    if(isPromise(valueOrPromise)){
      return valueOrPromise.then(callback, errback, progback);
    }
    return callback ? callback(valueOrPromise) : valueOrPromise;
  };
});
