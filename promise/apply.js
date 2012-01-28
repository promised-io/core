if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "./when"
], function(defer, when){
  /**
   * promise.apply(func[, thisObject, args]) -> promise.Promise
   * - func (Function)
   * - thisObject (?)
   * - args (Array): Arguments to be passed to the method.
   *
   * Invoke a function and return a promise for the result. Automatically
   * catches errors and returns a rejected promise instead.
   **/
  return function apply(func, thisObject, args){
    try{
      return when(func.apply(thisObject, args));
    }catch(error){
      return defer().reject(error);
    }
  };
});
