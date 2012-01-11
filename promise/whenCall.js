if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "./when"
], function(defer, when){
  /**
   * promise.whenCall(func[, callback, errback, progback]) -> promise.Promise
   * - func (Function): Callback to execute the initial action
   * - callback (Function): Callback to be invoked when the promise is resolved, or a non-promise is received
   * - errback (Function): Callback to be invoked when the promise is rejected
   * - progback (Function): Callback to be invoked when the promise emits a progress update
   *
   * Convenience function for catching synchronously and asynchronously thrown
   * errors. Used like [[promise.when]] except you execute the initial action in a callback.
   **/
  return function whenCall(func, callback, errback, progback){
    var valueOrPromise;
    try{
      valueOrPromise = func();
    }catch(error){
      return defer().reject(error).fail(errback);
    }
    return when(valueOrPromise, callback, errback, progback);
  };
});
