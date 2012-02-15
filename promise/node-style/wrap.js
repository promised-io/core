if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "../defer"
], function(defer){
  "use strict";

  var slice = [].slice;

  /**
  * promise.node-style.wrap(func[, callbackNotDeclared]) -> Function
  * - func (Function): Node-style async function which takes a callback as its last argument
  * - callbackNotDeclared (Boolean): If the function does not define a callback method on its arguments, pass `true`
  *
  * Create a wrapper a Node-style asynchronous function.
  **/
  return function wrap(func, callbackNotDeclared){
    var arity = func.length;

    return function(){
      var deferred = defer();

      if(callbackNotDeclared === true){
        arity = arguments.length + 1;
      }
      arguments.length = arity;
      arguments[arity - 1] = function(error, result){
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
        func.apply(this, arguments);
      }catch(error){
        deferred.reject(error);
      }

      return deferred.promise;
    };
  };
});
