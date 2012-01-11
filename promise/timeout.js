if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["../promise"], function(errors){
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
    setTimeout(function(){
      promiseLike.cancel && promiseLike.cancel(new errors.TimeoutError);
    }, ms || 0);
    return promiseLike;
  };
});
