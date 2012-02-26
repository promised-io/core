if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* promise.tracer
*
* Trace promise fulfillment. Calling `.trace()` or `.traceError()` on a promise
* enables tracing. Will emit `resolved`, `rejected` or `progress` events.
**/
define([
  "./Promise",
  "../lib/adapters!emitter",
  "../lib/adapters!lang"
], function(Promise, Emitter, lang){
  var slice = [].slice;

  var emitter = new Emitter;

  Promise.prototype.trace = function(){
    var args = slice.call(arguments);
    this.then(
      function(value){ emitter.emit.apply(emitter, ["resolved", value].concat(args)); },
      function(error){ emitter.emit.apply(emitter, ["rejected", error].concat(args)); },
      function(update){ emitter.emit.apply(emitter, ["progress", update].concat(args)); }
    );
    return this;
  };

  Promise.prototype.traceRejected = function(){
    var args = slice.call(arguments);
    this.fail(function(error){ emitter.emit.apply(emitter, ["rejected", error].concat(args)); });
    return this;
  };

  return emitter.exports;
});
