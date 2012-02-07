if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "./_makeStreamTest",
  "../../stream/Stream",
  "../../stream/ArrayProducer"
], function(buster, makeTest, Stream, ArrayProducer){
  makeTest("stream/Stream with ArrayProducer", Stream, true, function(values, source){
    return {
      usesSource: true,
      instance: new Stream(new ArrayProducer(values))
    };
  });
});
