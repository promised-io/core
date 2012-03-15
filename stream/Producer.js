if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* class stream.Producer
*
* Abstract base class for producers defined in Promised-IO.
**/
define([
  "compose"
], function(Compose){
  "use strict";

  return Compose({
    /**
    * stream.Producer#consume(callback) -> promise.Promise
    * - callback (Function)
    *
    * `consume()` is the only required method on a producer. It must return a
    * promise for when consumption has finished. If consumption finishes
    * because all values have been consumed, the returned promise *must* be
    * resolved with a `true` value.
    *
    * The callback function *must* be called with each produced value and
    * index, no further arguments. If the callback throws
    * [[stream.StopConsumption]], consumption *must* be stopped and the
    * returned promise resolved with a `false` value, even if consumption is
    * stopped after the last value has been produced.
    *
    * If the callback returns a promise it is providing backpressure.
    * Consumption *must* be paused until the promise is resolved. If the
    * promise is rejected with [[stream.StopConsumption]], consumption *must*
    * be stopped and the returned promise resolved with a `false` value,
    * even if consumption is stopped after the last value has been produced.
    * If the promise is rejected with any other value, consumption
    * *must* be stopped and the returned promise *must* be rejected with the
    * error value.
    *
    * Each invocation of `consume()` *must* produce the same values. If no
    * further invocations are possible, [[stream.ExhaustionError]] *must*
    * be thrown.
    *
    * Consumption *must* begin on the next tick, both when initially starting
    * and after backpressure.
    **/
    consume: Compose.required,

    /**
    * stream.Producer#destroy()
    *
    * Destroy the producer, should be used if the producer won't be consumed.
    * Behavior when invoked during consumption is undefined. Producers are not
    * required to provide this method. May throw errors.
    **/

    /**
    * stream.Producer#isRepeatable -> Boolean
    *
    * Flag indicating the producer is repeatable. Tested for by streams etc.
    * If a producer is repeatable, [[stream.Producer#consume consume()]] can
    * be invoked multiple times.
    **/
    isRepeatable: false
  });
});
