if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./stream-utils/makeStreamTest",
  "../stream/Stream",
  "../stream/ArrayProducer"
], function(makeTest, Stream, ArrayProducer){
  return makeTest("stream/Stream with ArrayProducer", Stream, true, function(values, source){
    return {
      usesSource: true,
      instance: new Stream(new ArrayProducer(values))
    };
  });
});
