if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
 * class stream.ArrayProducer < stream.RepeatProducer
 *
 * A producer based on a regular array.
 **/
define([
  "compose",
  "./RepeatProducer",
  "../promise/defer"
], function(Compose, RepeatProducer, defer){
  "use strict";

  return RepeatProducer.extend(function(source){
    this._values = this._source;
    this._finished = true;
  });
});
