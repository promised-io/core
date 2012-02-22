if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* class promise.Promise
*
* Promise base class. All promises will be instances of this class.
**/
define([
  "compose"
], function(Compose){
  "use strict";

  function throwAbstract(){
    throw new TypeError("abstract");
  }
  var slice = [].slice;

  return Compose({
    /**
    * promise.Promise#then([callback, errback, progback]) -> promise.Promise
    * - callback (Function): Callback to be invoked when the promise is resolved
    * - errback (Function): Callback to be invoked when the promise is rejected
    * - progback (Function): Callback to be invoked when the promise emits a progress update
    *
    * Add new callbacks to the promise. Returns a new promise for the result
    * of the callback(s).
    **/
    then: function(callback, errback, progback){
      throwAbstract();
    },

    /**
    * promise.Promise#cancel([reason]) -> Boolean | reason
    * - reason (?): A message that may be sent to the deferred's canceler, explaining why it's being canceled.
    *
    * Signal the promise that we're no longer interested in the result.
    * The deferred may subsequently cancel its operation and reject the
    * promise. Can affect other promises that originate with the same
    * deferred. Returns the rejection reason if the deferred was canceled
    * normally.
    **/
    cancel: function(reason){
      throwAbstract();
    },

    /**
    * promise.Promise#isResolved() -> Boolean
    *
    * Checks whether the promise has been resolved.
    **/
    isResolved: function(){
      throwAbstract();
    },

    /**
    * promise.Promise#isRejected() -> Boolean
    *
    * Checks whether the promise has been rejected.
    **/
    isRejected: function(){
      throwAbstract();
    },

    /**
    * promise.Promise#isFulfilled() -> Boolean
    *
    * Checks whether the promise has been resolved or rejected.
    **/
    isFulfilled: function(){
      throwAbstract();
    },

    /**
    * promise.Promise#isCanceled() -> Boolean
    *
    * Checks whether the promise has been canceled.
    **/
    isCanceled: function(){
      throwAbstract();
    },

    /**
    * promise.Promise#fail(errback) -> promise.Promise
    *
    * Add new errbacks to the promise.
    **/
    fail: function(errback){
      return this.then(null, errback);
    },

    /**
    * promise.Promise#both(callbackOrErrback) -> promise.Promise
    *
    * Add a callback to be invoked when the promise is resolved or rejected.
    **/
    both: function(callbackOrErrback){
      return this.then(callbackOrErrback, callbackOrErrback);
    },

    /**
    * promise.Promise#inflect(callback) -> promise.Promise
    * - callback (Function): function(error, value){ … }
    *
    * Support appending a Node-style callback to the promise. The rejection
    * value will be passed as the first argument to `callback`, the resolve
    * value as the second.
    **/
    inflect: function(callback){
      return this.then(
          function(result){ return callback(null, result); },
          callback);
    },

    /**
    * promise.Promise#get(name) -> promise.Promise
    * - name (String | Number): Name of property to get
    *
    * Gets the value of a property from the fulfilled promise value.
    *
    * ## Example
    *
    *     var deferred = defer();
    *     deferred.promise.get("foo").then(console.log);
    *     deferred.resolve({ foo: "bar" });
    *     // Logs "bar"
    *
    **/
    get: function(name){
      return this.then(function(result){
        return result[name];
      });
    },

    /**
    * promise.Promise#invoke(name[, args]) -> promise.Promise
    * - name (String | Number): Name of method to invoke
    * - args (Array): Subsequent arguments are passed to the method.
    *
    * Invokes a method on the fulfilled promise value. Returns a promise
    * for the return value.
    *
    * ## Example
    *
    *     var deferred = defer();
    *     deferred.promise.invoke("foo", [42]).then(console.log);
    *     deferred.resolve({ foo: function(v){ return v; } });
    *     // Logs 42
    *
    **/
    invoke: function(name, args){
      return this.then(function(result){
        return result[name].apply(result, args);
      });
    },

    /**
    * promise.Promise#put(name, value) -> promise.Promise
    * - name (String | Number): Name of property to set
    * - value (?): New value of property
    *
    * Sets the value of a property on the fulfilled promise value. Returns a
    * promise for the property value.
    *
    * ## Example
    *
    *     var deferred = defer();
    *     deferred.promise.put("foo", 42);
    *     var obj = {};
    *     deferred.resolve(obj);
    *     // obj.foo === 42
    *
    **/
    put: function(name, value){
      return this.then(function(result){
        return result[name] = value;
      });
    },

    /**
    * promise.Promise#del(name) -> promise.Promise
    * - name (String): Name of property to delete
    *
    * Delete the value of a property on the fulfilled promise value. Returns
    * a promise for the delete operation.
    *
    * ## Example
    *
    *     var deferred = defer();
    *     deferred.promise.del("foo").then(console.log);
    *     deferred.resolve({ foo: "bar" });
    *     // Logs true
    *
    **/
    del: function(name){
      return this.then(function(result){
        return delete result[name];
      });
    },

    /**
    * promise.Promise#change(value) -> promise.Promise
    * - value (?): Value of returned promise
    *
    * Returns a new promise that'll be resolved with the new value, but not
    * until the promise has been fulfilled.
    *
    * ## Example
    *
    *     var deferred = defer();
    *     deferred.promise.change(42).then(console.log);
    *     deferred.resolve(10);
    *     // Logs 42
    *
    **/
    change: function(value){
      return this.then(function(){
        return value;
      });
    },

    /**
    * promise.Promise#call(thisObject[, args]) -> promise.Promise
    * - thisObject (?)
    * - args (?): Subsequent arguments are passed to the method.
    *
    * Invoke the fulfilled promise value. Returns a promise for the invocation
    * result.
    *
    * ## Example
    *
    *     var deferred = defer();
    *     deferred.promise.call(null, 42).then(console.log);
    *     deferred.resolve(function(v){ return v; });
    *     // Logs 42
    *
    **/
    call: function(thisObject){
      var args = slice.call(arguments, 1);
      return this.then(function(func){
        return func.apply(thisObject, args);
      });
    },

    /**
    * promise.Promise#apply(thisObject[, args]) -> promise.Promise
    * - thisObject (?)
    * - args (Array): Subsequent arguments are passed to the method.
    *
    * Invoke the fulfilled promise value. Returns a promise for the invocation
    * result.
    *
    * ## Example
    *
    *     var deferred = defer();
    *     deferred.promise.apply(null, [42]).then(console.log);
    *     deferred.resolve(function(v){ return v; });
    *     // Logs 42
    *
    **/
    apply: function(thisObject, args){
      return this.then(function(func){
        return func.apply(thisObject, args);
      });
    }
  });
});
