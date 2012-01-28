if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "./when"
], function(defer, when){
  var slice = [].slice;

  /**
   * promise.call(func[, thisObject, args]) -> promise.Promise
   * - func (Function)
   * - thisObject (?)
   * - args (?): Subsequent arguments are passed to the method.
   *
   * Invoke a function and return a promise for the result.
   **/
  return function call(func, thisObject){
    try{
      return when(func.apply(thisObject, slice.call(arguments, 2)));
    }catch(error){
      return defer().reject(error);
    }
  };
});
