if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./stream-utils/makeStreamTest",
  "../stream/Stream"
], function(makeTest, Stream){
  return makeTest("stream/Stream", Stream, false, function(values, source){
    return {
      usesSource: true,
      instance: new Stream(source)
    };
  });
});
