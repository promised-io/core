if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(function(){
  /**
   * promise.isPromise(value) -> Boolean
   *
   * Tests whether the value is a promise, based on duck typing.
   **/
  return function isPromise(value){
    return value && typeof value.then === "function";
  };
});
