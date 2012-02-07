if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "./_makeStreamTest",
  "../../stream/Stream",
  "../../stream/RepeatProducer"
], function(buster, makeTest, Stream, RepeatProducer){
  makeTest("stream/Stream with RepeatProducer", Stream, true, function(values, source){
    return {
      usesSource: true,
      instance: new Stream(new RepeatProducer(source))
    };
  });
});
