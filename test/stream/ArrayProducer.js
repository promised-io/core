if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "./_makeProducerTest",
  "../../stream/ArrayProducer"
], function(buster, makeTest, ArrayProducer){
  makeTest("stream/ArrayProducer", ArrayProducer, function(values){
    return {
      instance: new ArrayProducer(values)
    };
  });
});
