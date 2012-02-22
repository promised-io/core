if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* stream
**/
define([
  "./stream/_errors",
  "./stream/Stream",
  "./stream/Producer",
  "./stream/RepeatProducer",
  "./stream/ArrayProducer"
], function(errors, Stream, Producer, RepeatProducer, ArrayProducer){
  "use strict";

  return {
    ExhaustionError: errors.ExhaustionError,
    StopConsumption: errors.StopConsumption,
    Stream: Stream,
    Producer: Producer,
    RepeatProducer: RepeatProducer,
    ArrayProducer: ArrayProducer
  };
});
