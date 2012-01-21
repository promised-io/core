if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./defer",
  "./when"
], function(defer, when){
  /**
   * promise.call(func) -> promise.Promise
   * - func (Function): Callback to execute the initial action
   *
   * Convenience function for catching synchronously and asynchronously thrown
   * errors. Always returns a promise.
   **/
  return function call(func){
    try{
      return when(func());
    }catch(error){
      return defer().reject(error);
    }
  };
});
