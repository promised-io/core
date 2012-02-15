if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "../defer"
], function(defer){
  "use strict";

  var slice = [].slice;

  /**
  * promise.node-style.apply(func[, thisObject, args]) -> promise.Promise
  * - func (Function)
  * - thisObject (?)
  * - args (Array): Arguments to be passed to the method.
  *
  * Invoke a Node-style asynchronous function and return a promise for the
  * result. Only works if `func` declares the callback function in its
  * arguments.
  **/
  return function apply(func, thisObject, args){
    var deferred = defer();

    if(!args){
      args = [];
    }
    args[func.length - 1] = function(error, result){
      if(error){
        deferred.reject(error);
      }else{
        if(arguments.length > 2){
          // if there are multiple success values, we return an array
          deferred.resolve(slice.call(arguments, 1));
        }else{
          deferred.resolve(result);
        }
      }
    };

    try{
      func.apply(thisObject, args);
    }catch(error){
      deferred.reject(error);
    }

    return deferred.promise;
  };
});
