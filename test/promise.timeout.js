if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "../promise/defer",
  "../promise/timeout",
  "../promise"
], function(testCase, assert, defer, timeout, errors){
  return testCase("promise/timeout", {
    beforeEach: function(){
      var self = this;
      this.canceler = function(reason){};
      this.deferred = defer(function(reason){ return self.canceler(reason); });
    },

    "on a deferred instance": function(done){
      this.canceler = function(reason){
        assert(reason instanceof errors.TimeoutError);
        done();
      };
      var returnValue = this.deferred.timeout(0);
      assert.same(returnValue, this.deferred.promise);
    },

    "with a deferred": function(done){
      this.canceler = function(reason){
        assert(reason instanceof errors.TimeoutError);
        done();
      };
      var returnValue = timeout(this.deferred, 0);
      assert.same(returnValue, this.deferred);
    },

    "with a promise": function(done){
      this.canceler = function(reason){
        assert(reason instanceof errors.TimeoutError);
        done();
      };
      var returnValue = timeout(this.deferred.promise, 0);
      assert.same(returnValue, this.deferred.promise);
    },

    "with a fulfilled promise": function(done){
      this.canceler = function(reason){
        assert.fail("Canceler shouldn't be called, the deferred has already been resolved.");
      };
      this.deferred.resolve();

      var returnValue = timeout(this.deferred.promise, 0);
      assert.same(returnValue, this.deferred.promise);
      setTimeout(done, 1);
    },

    "with a foreign promise, without cancel": function(done){
      var foreign = { then: function(){} };
      var returnValue = timeout(foreign, 0);
      assert.same(returnValue, foreign);
      setTimeout(done, 1);
    },

    "with a foreign promise, with cancel": function(done){
      var foreign = {
        then: function(){},
        cancel: function(reason){
          assert(reason instanceof errors.TimeoutError);
          done();
        }
      };
      var returnValue = timeout(foreign, 0);
      assert.same(returnValue, foreign);
    }
  });
});
