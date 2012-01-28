if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
 * class promise.Deferred
 *
 * Deferred base class.
 **/
define([
  "compose",
  "../lib/adapters!lang",
  "../promise",
  "./Promise",
  "./isPromise",
  "./timeout"
], function(Compose, lang, errors, Promise, isPromise, timeout){
  "use strict";

  var PROGRESS = 0,
      RESOLVED = 1,
      REJECTED = 2;
  var FULFILLED_ERROR_MESSAGE = "This deferred has already been fulfilled.";

 /**
   * new promise.Deferred([canceler])
   * - canceler (Function): Function to be invoked when the deferred is canceled. The canceler receives the reason the deferred was canceled as its argument. The deferred is rejected with its return value, if any.
   *
   **/
  var Deferred = Compose(function(canceler){
    var promise = this.promise = new Promise;
    var fulfilled, result;
    var canceled = false;
    var waiting = [];

    /**
     * promise.Deferred#isResolved() -> Boolean
     *
     * Checks whether the deferred has been resolved.
     **/
    this.isResolved = promise.isResolved = function(){
      return fulfilled === RESOLVED;
    };

    /**
     * promise.Deferred#isRejected() -> Boolean
     *
     * Checks whether the deferred has been rejected.
     **/
    this.isRejected = promise.isRejected = function(){
      return fulfilled === REJECTED;
    };

    /**
     * promise.Deferred#isFulfilled() -> Boolean
     *
     * Checks whether the deferred has been resolved or rejected.
     **/
    this.isFulfilled = promise.isFulfilled = function(){
      return !!fulfilled;
    };

    /**
     * promise.Deferred#isCanceled() -> Boolean
     *
     * Checks whether the deferred has been canceled.
     **/
    this.isCanceled = promise.isCanceled = function(){
      return canceled;
    };

    /**
     * promise.Deferred#progress([update, strict]) -> promise.Promise
     * - strict (Boolean): if strict, will throw an error if the deferred is fulfilled.
     *
     * Emit a progress update on the deferred. Returns the original promise
     * for the deferred.
     **/
    this.progress = function(update, strict){
      if(!fulfilled){
        signalWaiting(waiting, PROGRESS, update);
        return promise;
      }else if(strict === true){
        throw new Error(FULFILLED_ERROR_MESSAGE);
      }else{
        return promise;
      }
    };

    /**
     * promise.Deferred#resolve([value, strict]) -> promise.Promise
     * - strict (Boolean): if strict, will throw an error if the deferred has already been fulfilled.
     *
     * Resolve the deferred. Returns the original promise for the deferred.
     **/
    this.resolve = function(value, strict){
      if(!fulfilled){
        // Set fulfilled, store value. After signaling waiting listeners unset
        // waiting.
        signalWaiting(waiting, fulfilled = RESOLVED, result = value);
        waiting = null;
        return promise;
      }else if(strict === true){
        throw new Error(FULFILLED_ERROR_MESSAGE);
      }else{
        return promise;
      }
    };

    /**
     * promise.Deferred#reject([error, strict]) -> promise.Promise
     * - strict (Boolean): if strict, will throw an error if the deferred has already been fulfilled.
     *
     * Reject the deferred. Returns the original promise for the deferred.
     **/
    this.reject = function(error, strict){
      if(!fulfilled){
        signalWaiting(waiting, fulfilled = REJECTED, result = error);
        waiting = null;
        return promise;
      }else if(strict === true){
        throw new Error(FULFILLED_ERROR_MESSAGE);
      }else{
        return promise;
      }
    };

    /**
     * promise.Deferred#then([callback, errback, progback]) -> promise.Promise
     * - callback (Function): Callback to be invoked when the promise is resolved
     * - errback (Function): Callback to be invoked when the promise is rejected
     * - progback (Function): Callback to be invoked when the promise emits a progress update
     *
     * Add new callbacks to the deferred. Returns a new promise for the result
     * of the callback(s).
     **/
    this.then = promise.then = function(callback, errback, progback){
      var listener = [progback, callback, errback];
      // Ensure we cancel the promise we're waiting for, or if callback/errback
      // have returned a promise, cancel that one.
      listener.cancel = promise.cancel;
      listener.deferred = new Deferred(function(reason){
        // Check whether cancel is really available, returned promises are not
        // required to expose `cancel`
        return listener.cancel && listener.cancel(reason);
      });
      if(fulfilled && !waiting){
        signalListener(listener, fulfilled, result);
      }else{
        waiting.push(listener);
      }
      return listener.deferred.promise;
    };

    /**
     * promise.Deferred#cancel([reason, strict]) -> Boolean | reason
     * - reason (?): A message that may be sent to the deferred's canceler, explaining why it's being canceled.
     * - strict (Boolean): if strict, will throw an error if the deferred has already been fulfilled.
     *
     * Signal the deferred that we're no longer interested in the result.
     * The deferred may subsequently cancel its operation and reject the
     * promise. Can affect other promises that originate with the same
     * deferred. Returns the rejection reason if the deferred was canceled
     * normally.
     **/
    this.cancel = promise.cancel = function(reason, strict){
      // Cancel can be called even after the deferred is fulfilled
      if(!fulfilled){
        canceled = true;
        if(canceler){
          reason = canceler(reason);
        }
        if(!fulfilled){
          // Allow canceler to provide its own reason, but fall back to a CancelError
          if(typeof reason === "undefined"){
            reason = new errors.CancelError;
          }
          signalWaiting(waiting, fulfilled = REJECTED, result = reason);
          waiting = null;
          return reason;
        }
      }else if(strict === true){
        throw new Error(FULFILLED_ERROR_MESSAGE);
      }
    };

    lang.freezeObject(promise);
  }, {
    /**
     * promise.Deferred#timeout(ms = 0) -> promise.Promise
     * - ms (Number): How long to wait until the promise is cancelled.
     *
     * Cancels the deferred if it is not fulfilled within the specified time.
     * Returns the promise for the deferred.
     **/
    timeout: function(ms){
      return timeout(this.promise, ms);
    },

    /**
     * promise.Deferred#resolverCallback(callback) -> Function
     * - callback (Function)
     *
     * Creates a new function that will invoke the specified callback and use
     * its return value to resolve the deferred. Automatically catches errors
     * and rejects the deferred instead.
     * 
     * ## Example
     *
     *     setTimeout(deferred.resolverCallback(function(){
     *       return doSomething();
     *     }), 100);
     *
     **/
    resolverCallback: function(callback){
      var deferred = this;
      return function(){
        if(deferred.isFulfilled()){
          return;
        }

        var result, isError;
        try{
          result = callback();
        }catch(error){
          isError = true;
          result = error;
        }
        if(!deferred.isFulfilled()){
          if(isError){
            deferred.reject(result);
          }else{
            deferred.resolve(result);
          }
        }
      };
    }
  });

  function signalWaiting(waiting, type, result){
    for(var i = 0; i < waiting.length; i++){
      signalListener(waiting[i], type, result);
    }
  }

  function signalListener(listener, type, result){
    var func = listener[type];
    var deferred = listener.deferred;
    if(func){
      try{
        var newResult = func(result);
        if(isPromise(newResult)){
          listener.cancel = newResult.cancel;
          newResult.then(
              // Only make resolvers if they're actually going to be used
              makeDeferredSignaler(deferred, RESOLVED),
              makeDeferredSignaler(deferred, REJECTED),
              makeDeferredSignaler(deferred, PROGRESS));
          return;
        }
        signalDeferred(deferred, RESOLVED, newResult);
      }catch(error){
        signalDeferred(deferred, REJECTED, error);
      }
    }else{
      signalDeferred(deferred, type, result);
    }
  }

  function makeDeferredSignaler(deferred, type){
    return function(value){
      signalDeferred(deferred, type, value);
    };
  }

  function signalDeferred(deferred, type, result){
    if(!deferred.isCanceled()){
      switch(type){
        case PROGRESS:
          deferred.progress(result);
          break;
        case RESOLVED:
          deferred.resolve(result);
          break;
        case REJECTED:
          deferred.reject(result);
          break;
      }
    }
  }

  return Deferred;
});
