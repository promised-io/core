if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "./when",
  "../lib/adapters!lang"
], function(defer, when, lang){
  "use strict";

  /**
  * promise.first(objectOrArray) -> promise.Promise
  * - objectOrArray (Object | Array): Accepts both arrays and objects
  *
  * Takes multiple promises and returns a new promise that is fulfilled
  * when the first of these promises is fulfilled. Canceling the returned
  * promise will *not* cancel any passed promises. The promise will be
  * fulfilled with the value of the first fulfilled promise.
  **/
  return function first(objectOrArray){
    var array;
    if(lang.isArray(objectOrArray)){
      array = objectOrArray;
    }else if(objectOrArray && typeof objectOrArray === "object"){
      array = [];
      lang.forIn(objectOrArray, function(valueOrPromise){
        array.push(valueOrPromise);
      });
    }

    if(!array || !array.length){
      return defer().resolve();
    }

    var deferred = defer();
    lang.forEach(array, function(valueOrPromise){
      when(valueOrPromise, deferred.resolve, deferred.reject);
    });
    return deferred.promise;
  };
});
