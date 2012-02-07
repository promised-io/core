if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "./_makeStreamTest",
  "../../stream/Stream"
], function(buster, makeTest, Stream){
  makeTest("stream/Stream", Stream, false, function(values, source){
    return {
      usesSource: true,
      instance: new Stream(source)
    };
  });
});
