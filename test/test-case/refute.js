if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./index"
], function(testCase){
  return testCase.refute;
});
