if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "./when",
  "../lib/adapters!lang"
], function(defer, when, lang){
  /**
   * promise.seq(array[, startingValue]) -> promise.Promise
   * - array (Array): List of functions
   * - startingValue (?): The value to pass to the first function
   *
   * Takes an array of asynchronous functions (that return promises) and
   * executes them sequentially. Each function is called with the return
   * value of the previous function
   *
   * Returns a new promise for the result of the last function. If one of
   * the promises returned by the asynchronous functions is rejected,
   * the returned promise is rejected and processing halts. Canceling the
   * returned promise will halt processing and cancel the promise returned
   * by the asynchronous function that last executed.
   **/
  return function seq(array, startingValue){
    // Copy array so behavior can't be altered while processing.
    array = array.slice();

    var currentPromise;
    var ix = 0;

    var halting = false;
    var deferred = defer(function(reason){
      halting = true;
      // Don't pass the reason to the current promise, such signaling will
      // require a different strategy.
      currentPromise.cancel();
      return reason;
    });

    // If the current promise is canceled because we are canceled, that
    // rejection shouldn't be used as the result of our promise.
    var rejectUnlessHalting = function(error){
      !halting && deferred.reject(error);
    };

    var next = function(value){
      if(halting || deferred.isFulfilled()){
        return;
      }

      var nextAction = array && array[ix];
      if(nextAction){
        try{
          ix++;
          currentPromise = when(nextAction(value), next, rejectUnlessHalting);
        }catch(error){
          deferred.reject(error);
        }
      }else{
        deferred.resolve(value);
      }
    };
    next(startingValue);

    return deferred.promise;
  };
});
