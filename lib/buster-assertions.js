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

  buster.assertions.add("ran", {
    assert: function(expected){
      this.count = buster.assertions.count - 1; // Exclude ourselves
      return this.count === expected;
    },
    assertMessage: "Expected to have run ${0} assertions, got ${count}",
    refuteMessage: "Expected to not have run ${0} assertions",
    expect: "toHaveRun"
  });

  return buster;
});
