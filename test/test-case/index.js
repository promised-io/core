if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "assert"
], function(assert){
  "use strict";

  var exports = function(name, obj){
    var testCase = {};
    testCase[name] = visit(obj);
    return testCase;
  };
  exports.Skip = {};

  exports._count = 0;
  exports._failures = [];
  exports.assert = function(){
    return exports.assert.ok.apply(exports.assert, arguments);
  };
  for(var method in assert){
    exports.assert[method] = (function(fn){
      return function(){
        exports._count++;
        try{
          return fn.apply(this, arguments);
        }catch(error){
          exports._failures.push(error);
          throw error;
        }
      };
    })(assert[method]);
  }
  assert.defined = function(value, message){
    exports._count++;
    if(typeof value === "undefined"){
      assert.fail(value, "undefined", message, "==", assert.defined);
    }
  };
  exports.assert.same = exports.assert.strictEqual;
  exports.assert.exception = exports.assert["throws"];

  var refute = exports.refute = function(){
    exports._count++;
    return exports.refute.ok.apply(exports.refute, arguments);
  };
  refute.ok = function(value, message){
    return exports.assert.ok(!value, message);
  };
  refute.defined = function(value, message){
    exports._count++;
    if(typeof value !== "undefined"){
      assert.fail(value, "undefined", message, "!=", refute.defined);
    }
  };
  refute.equal = exports.assert.notEqual;
  refute.deepEqual = exports.assert.notDeepEqual;
  refute.strictEqual = refute.same = exports.assert.notStrictEqual;
  refute.exception = refute["throws"] = exports.assert.doesNotThrow;

  function visit(obj){
    for(var key in obj){
      if(typeof obj[key] === "function"){
        switch(key){
          case "before":
          case "beforeEach":
          case "after":
          case "afterEach":
            break;
          default:
            obj[key] = wrap(obj[key]);
        }
      }else if(obj[key] === exports.Skip){
        delete obj[key];
      }else if(typeof obj[key] === "object"){
        visit(obj[key]);
      }
    }
    return obj;
  }

  function wrap(fn){
    return function(done){
      exports._count = 0;
      exports._failures = [];
      if(fn.length){
        fn.call(this, testAssertions);
      }else{
        var promise = fn.call(this);
        if(promise && typeof promise.then === "function"){
          promise.then(function(){ testAssertions(); }, testAssertions);
        }else{
          testAssertions();
        }
      }

      function testAssertions(error){
        if(exports._failures.length){
          error = exports._failures[0];
        }

        if(error instanceof Error || error != null){
          done(error);
        }else if(exports._count === 0){
          done(new Error("No assertions!"));
        }else{
          done();
        }
      }
    };
  }

  return exports;
});
