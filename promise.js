if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
 * promise
 **/
define([
  "exports",
  "./lib/errorFactory"
], function(exports, errorFactory){
  "use strict";

  /**
   * class promise.CancelError
   *
   * Default rejection value if a deferred is canceled without a reason.
   **/
  exports.CancelError = errorFactory("CancelError", "The deferred was cancelled.");

  /**
   * class promise.TimeoutError
   *
   * Default cancelation reason if a deferred times out.
   **/
  exports.TimeoutError = errorFactory("TimeoutError", "The deferred timed out because it took too long to fulfill.");
});
