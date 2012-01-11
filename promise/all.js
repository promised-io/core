if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "./when",
  "../lib/adapters!lang"
], function(defer, when, lang){
  /**
   * promise.all(objectOrArray) -> promise.Promise
   * - objectOrArray (Object | Array): Accepts both arrays and objects
   *
   * Takes multiple promises and returns a new promise that is fulfilled
   * when all promises have been fulfilled.
   *
   * Returns a new promise that is fulfilled when all promises have been
   * fulfilled. If one of those promises is rejected, the returned promise
   * is also rejected. Canceling the returned promise will *not* cancel any
   * passed promises. The promise will be fulfilled with a list of results if
   * invoked with an array, or an object of results when passed an object
   * (using the same keys). If passed neither an object or array it is
   * resolved with an undefined value.
   **/
  return function all(objectOrArray){
    var object, array;
    if(lang.isArray(objectOrArray)){
      array = objectOrArray;
    }else if(objectOrArray && typeof objectOrArray === "object"){
      object = objectOrArray;
    }else{
      throw new TypeError;
    }

    var results;
    var keyLookup = [];
    if(object){
      array = [];
      lang.forIn(object, function(valueOrPromise, key){
        keyLookup.push(key);
        array.push(valueOrPromise);
      });
      results = {};
    }else if(array){
      results = [];
    }

    if(!array || !array.length){
      return defer().resolve(results);
    }

    var deferred = defer();
    deferred.promise.both(function(){
      results = keyLookup = null;
    });
    var waiting = array.length;
    lang.some(array, function(valueOrPromise, index){
      if(!object){
        keyLookup.push(index);
      }
      when(valueOrPromise, function(value){
        if(!deferred.isFulfilled()){
          results[keyLookup[index]] = value;
          if(--waiting === 0){
            deferred.resolve(results);
          }
        }
      }, deferred.reject);
      return deferred.isFulfilled();
    });
    return deferred.promise;
  };
});
