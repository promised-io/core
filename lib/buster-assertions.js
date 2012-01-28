if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster"
], function(buster){
  buster.assertions.add("isInstance", {
    assert: function(actual, expected, expectedName){
      this.expectedName = expectedName || expected.name;
      return actual instanceof expected;
    },
    assertMessage: "Expected ${0} to be an instance of ${expectedName}",
    refuteMessage: "Expected ${0} to not be an instance of ${expectedName}",
    expect: "isInstance"
  });

  return buster;
});
