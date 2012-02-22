if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* promise
**/
define([
  "./promise/_errors",
  "./promise/defer",
  "./promise/when"
], function(errors, defer, when){
  "use strict";

  return {
    CancelError: errors.CancelError,
    TimeoutError: errors.TimeoutError,
    defer: defer,
    when: when
  };
});
