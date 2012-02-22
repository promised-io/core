if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "../promise",
  "../promise/asap",
  "../lib/adapters!timers"
], function(errors, asap, timers){
  "use strict";

  /**
   * promise.timeout(promiseLike, ms = 0) -> promiseLike
   * - ms (Number): How long to wait until the promise is cancelled.
   *
   * Cancels the promise if it is not fulfilled within the specified time.
   * Can be passed a promise-like object. This object is not required to have
   * a `cancel` method but it won't work without it. Returns the received
   * promise value for chaining.
   **/
  return function timeout(promiseLike, ms){
    if(promiseLike.cancel){
      var id = timers.set(function(){
        promiseLike.cancel(new errors.TimeoutError);
      }, ms || 0);
      var clear = function(){ timers.clear(id); };
      asap(promiseLike, clear, clear);
    }
    return promiseLike;
  };
});
