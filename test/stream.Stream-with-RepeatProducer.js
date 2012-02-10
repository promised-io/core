if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./stream-utils/makeStreamTest",
  "../stream/Stream",
  "../stream/RepeatProducer"
], function(makeTest, Stream, RepeatProducer){
  return makeTest("stream/Stream with RepeatProducer", Stream, true, function(values, source){
    return {
      usesSource: true,
      instance: new Stream(new RepeatProducer(source))
    };
  });
});
