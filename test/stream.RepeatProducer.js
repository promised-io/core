if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./stream-utils/makeProducerTest",
  "../stream/RepeatProducer"
], function(makeTest, RepeatProducer){
  return makeTest("stream/RepeatProducer", RepeatProducer, function(values, source){
    return {
      usesSource: true,
      instance: new RepeatProducer(source)
    };
  });
});
