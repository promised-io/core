if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "./_makeProducerTest",
  "../../stream/RepeatProducer"
], function(buster, makeTest, RepeatProducer){
  makeTest("stream/RepeatProducer", RepeatProducer, function(values, source){
    return {
      usesSource: true,
      instance: new RepeatProducer(source)
    };
  });
});
