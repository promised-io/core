if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./stream-utils/makeProducerTest",
  "../stream/ArrayProducer"
], function(makeTest, ArrayProducer){
  return makeTest("stream/ArrayProducer", ArrayProducer, function(values){
    return {
      instance: new ArrayProducer(values)
    };
  });
});
