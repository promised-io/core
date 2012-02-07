if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
 * stream
 **/
define([
  "exports",
  "./lib/errorFactory"
], function(exports, errorFactory){
  "use strict";

  /**
   * class stream.ExhaustionError
   *
   * Error value if a stream producer is exhausted, meaning it can no longer
   * produce values.
   **/
  exports.ExhaustionError = errorFactory("ExhaustionError", "The stream producer has been exhausted.");

  /**
   * class stream.StopConsumption
   *
   * Error value to stop a stream producer. Throw or use as a rejection value
   * for a backpressure promise.
   **/
  exports.StopConsumption = errorFactory("StopConsumption");
});
