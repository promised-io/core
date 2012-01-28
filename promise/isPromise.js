if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(function(){
  "use strict";

  /**
   * promise.isPromise(value) -> Boolean
   *
   * Tests whether the value is a promise, based on duck typing. That is, does
   * it have a `then()` method?
   **/
  return function isPromise(value){
    return value && typeof value.then === "function";
  };
});
