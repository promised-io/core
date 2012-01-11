if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer",
  "../../promise/Promise",
  "../../promise/Deferred",
  "../../promise"
], function(buster, defer, Promise, Deferred, errors){
  buster.testCase("promise/Deferred", {
    setUp: function(){
      this.deferred = defer();
      this.count = buster.assertions.count;
    },

    "resolve": {
      "deferred and promise receive same results": function(){
        var obj = {};
        this.deferred.promise.then(function(result){
          assert.same(result, obj);
        });
        this.deferred.then(function(result){
          assert.same(result, obj);
        });
        this.deferred.resolve(obj);
        assert.ran(this.count + 2);
      },

      "returns promise": function(){
        var obj = {};
        var returnedPromise = this.deferred.resolve(obj);
        assert.isInstance(returnedPromise, Promise, "promise.Promise");
        assert.same(returnedPromise, this.deferred.promise);
        returnedPromise.then(function(result){
          assert.same(result, obj);
        });
        assert.ran(this.count + 3);
      },

      "and isResolved() returns true": function(){
        refute(this.deferred.isResolved());
        this.deferred.resolve();
        assert(this.deferred.isResolved());
      },

      "and isFulfilled() returns true": function(){
        refute(this.deferred.isFulfilled());
        this.deferred.resolve();
        assert(this.deferred.isFulfilled());
      },

      "is ignored after having been fulfilled": function(){
        var deferred = this.deferred;
        this.deferred.resolve();
        refute.exception(function(){
          deferred.resolve();
        });
      },

      "throws error after having been fulfilled and strict": function(){
        var deferred = this.deferred;
        this.deferred.resolve();
        assert.exception(function(){
          deferred.resolve({}, true);
        });
      },

      "results are cached": function(){
        var obj = {};
        this.deferred.resolve(obj);
        this.deferred.then(function(result){
          assert.same(result, obj);
        });
        assert.ran(this.count + 1);
      },

      "is already bound to the deferred": function(){
        var obj = {};
        this.deferred.then(function(result){
          assert.same(result, obj);
        });
        var resolve = this.deferred.resolve;
        resolve(obj);
        assert.ran(this.count + 1);
      }
    },

    "reject": {
      "deferred and promise receive same results": function(){
        var obj = {};
        this.deferred.promise.then(null, function(result){
          assert.same(result, obj);
        });
        this.deferred.then(null, function(result){
          assert.same(result, obj);
        });
        this.deferred.reject(obj);
        assert.ran(this.count + 2);
      },

      "returns promise": function(){
        var obj = {};
        var returnedPromise = this.deferred.reject(obj);
        assert.isInstance(returnedPromise, Promise, "promise.Promise");
        assert.same(returnedPromise, this.deferred.promise);
        returnedPromise.then(null, function(result){
          assert.same(result, obj);
        });
        assert.ran(this.count + 3);
      },

      "and isRejected() returns true": function(){
        refute(this.deferred.isRejected());
        this.deferred.reject();
        assert(this.deferred.isRejected());
      },

      "and isFulfilled() returns true": function(){
        refute(this.deferred.isFulfilled());
        this.deferred.reject();
        assert(this.deferred.isFulfilled());
      },

      "is ignored after having been fulfilled": function(){
        var deferred = this.deferred;
        this.deferred.reject();
        refute.exception(function(){
          deferred.reject();
        });
      },

      "throws error after having been fulfilled and strict": function(){
        var deferred = this.deferred;
        this.deferred.reject();
        assert.exception(function(){
          deferred.reject({}, true);
        });
      },

      "results are cached": function(){
        var obj = {};
        this.deferred.reject(obj);
        this.deferred.then(null, function(result){
          assert.same(result, obj);
        });
        assert.ran(this.count + 1);
      },

      "is already bound to the deferred": function(){
        var obj = {};
        this.deferred.then(null, function(result){
          assert.same(result, obj);
        });
        var reject = this.deferred.reject;
        reject(obj);
        assert.ran(this.count + 1);
      }
    },

    "progress": {
      "deferred and promise receive same results": function(){
        var obj = {};
        this.deferred.promise.then(null, null, function(result){
          assert.same(result, obj);
        });
        this.deferred.then(null, null, function(result){
          assert.same(result, obj);
        });
        this.deferred.progress(obj);
        assert.ran(this.count + 2);
      },

      "returns promise": function(){
        var obj = {};
        var returnedPromise = this.deferred.progress(obj);
        assert.isInstance(returnedPromise, Promise, "promise.Promise");
        assert.same(returnedPromise, this.deferred.promise);
      },

      "and isResolved() returns false": function(){
        refute(this.deferred.isResolved());
        this.deferred.progress();
        refute(this.deferred.isResolved());
      },

      "and isRejected() returns false": function(){
        refute(this.deferred.isRejected());
        this.deferred.progress();
        refute(this.deferred.isRejected());
      },

      "and isFulfilled() returns false": function(){
        refute(this.deferred.isFulfilled());
        this.deferred.progress();
        refute(this.deferred.isFulfilled());
      },

      "is ignored after having been fulfilled": function(){
        var deferred = this.deferred;
        this.deferred.resolve();
        refute.exception(function(){
          deferred.progress();
        });
      },

      "throws error after having been fulfilled and strict": function(){
        var deferred = this.deferred;
        this.deferred.resolve();
        assert.exception(function(){
          deferred.progress({}, true);
        });
      },

      "results are not cached": function(){
        var obj1 = {}, obj2 = {};
        this.deferred.progress(obj1);
        this.deferred.then(null, null, function(result){
          assert.same(result, obj2);
        });
        this.deferred.progress(obj2);
        assert.ran(this.count + 1);
      },

      "with chaining": function(){
        var obj = {};
        var inner = defer();
        this.deferred.then(function(){ return inner; }).then(null, null, function(result){
          assert.same(result, obj);
        });
        this.deferred.resolve();
        inner.progress(obj);
        assert.ran(this.count + 1);
      },

      "is already bound to the deferred": function(){
        var obj = {};
        this.deferred.then(null, null, function(result){
          assert.same(result, obj);
        });
        var progress = this.deferred.progress;
        progress(obj);
        assert.ran(this.count + 1);
      }
    },

    "cancel": {
      setUp: function(){
        var self = this;
        this.canceler = function(reason){};
        this.deferred = defer(function(reason){ return self.canceler(reason); });
      },

      "invokes a canceler": function(){
        this.canceler = function(){ assert(true); };
        this.deferred.cancel();
        assert.ran(this.count + 1);
      },

      "and isCanceled() returns true": function(){
        refute(this.deferred.isCanceled());
        this.deferred.cancel();
        assert(this.deferred.isCanceled());
      },

      "and isResolved() returns false": function(){
        refute(this.deferred.isResolved());
        this.deferred.cancel();
        refute(this.deferred.isResolved());
      },

      "and isRejected() returns true": function(){
        refute(this.deferred.isRejected());
        this.deferred.cancel();
        assert(this.deferred.isRejected());
      },

      "and isFulfilled() returns true": function(){
        refute(this.deferred.isFulfilled());
        this.deferred.cancel();
        assert(this.deferred.isFulfilled());
      },

      "is ignored after having been fulfilled": function(){
        this.canceler = function(){ assert.fail("Canceler shouldn't be invoked, cancel should be ignored"); };
        this.deferred.resolve();
        this.deferred.cancel();
        assert.ran(this.count);
      },

      "throws error after having been fulfilled and strict": function(){
        this.deferred.resolve();
        var deferred = this.deferred;
        assert.exception(function(){
          deferred.cancel(null, true);
        });
      },

      "without reason results in CancelError": function(){
        var reason = this.deferred.cancel();
        assert.isInstance(reason, errors.CancelError, "promise.CancelError");
        this.deferred.then(null, function(result){
          assert.same(result, reason);
        });
        assert.ran(this.count + 2);
      },

      "passing reason to canceler": function(){
        var obj = {};
        this.canceler = function(reason){ assert.same(reason, obj); };
        this.deferred.cancel(obj);
        assert.ran(this.count + 1);
      },

      "with reason returned from canceler": function(){
        var obj = {};
        this.canceler = function(){ return obj; };
        var reason = this.deferred.cancel();
        assert.same(reason, obj);
        this.deferred.then(null, function(reason){
          assert.same(reason, obj);
        });
        assert.ran(this.count + 2);
      },

      "with undefined reason returned from canceler results in CancelError": function(){
        this.canceler = function(){ return undefined; };
        var reason = this.deferred.cancel();
        assert.isInstance(reason, errors.CancelError, "promise.CancelError");
        this.deferred.then(null, function(result){
          assert.same(result, reason);
        });
        assert.ran(this.count + 2);
      },

      "with canceler resolving deferred": function(){
        var deferred = this.deferred;
        var obj = {};
        this.canceler = function(){ deferred.resolve(obj); };
        var result = this.deferred.cancel();
        assert.same(result, obj);
        this.deferred.then(function(result){
          assert.same(result, obj);
        });
        assert.ran(this.count + 2);
      },

      "with canceler rejecting deferred": function(){
        var deferred = this.deferred;
        var obj = {};
        this.canceler = function(){ deferred.reject(obj); };
        var result = this.deferred.cancel();
        assert.same(result, obj);
        this.deferred.then(null, function(result){
          assert.same(result, obj);
        });
        assert.ran(this.count + 2);
      },

      "a promise chain": function(){
        var obj = {};
        this.canceler = function(reason){
          assert.same(reason, obj);
        };
        this.deferred.then().then().then().cancel(obj);
        assert.ran(this.count + 1);
      },

      "a returned promise": function(){
        var obj = {};
        var inner = defer(function(reason){ assert.same(reason, obj); });
        var chain = this.deferred.then(function(){
          return inner;
        });
        this.deferred.resolve();
        chain.cancel(obj, true);
        assert.ran(this.count + 1);
      },

      "is already bound to the deferred": function(){
        this.deferred.then(null, function(result){
          assert.isInstance(result, errors.CancelError, "promise.CancelError");
        });
        var cancel = this.deferred.cancel;
        cancel();
        assert.ran(this.count + 1);
      }
    },

    "then": {
      "chained": function(){
        function square(n){ return n * n; }

        this.deferred.then(square).then(square).then(function(n){
          assert.same(n, 16);
        });
        this.deferred.resolve(2);
        this.deferred.then(function(n){
          assert.same(n, 2);
        });
        assert.ran(this.count + 2);
      },

      "chained asynchronously": function(){
        function asyncSquare(n){
          var inner = defer();
          setTimeout(function(){ inner.resolve(n * n); }, 0);
          return inner.promise;
        }

        var result = this.deferred.then(asyncSquare).then(asyncSquare).then(function(n){
          assert.same(n, 16);
        });
        this.deferred.resolve(2);
        this.deferred.then(function(n){
          assert.same(n, 2);
        });

        var self = this;
        return result.then(function(){
          assert.ran(self.count + 2);
        });
      },

      "is already bound to the deferred": function(){
        var obj = {};
        var then = this.deferred.then;
        then(function(result){
          assert.same(result, obj);
        });
        this.deferred.resolve(obj);
        assert.ran(this.count + 1);
      }
    },

    "resolverCallback": {
      "resolves": function(){
        var obj = {};
        this.deferred.then(function(result){
          assert.same(result, obj);
        });
        this.deferred.resolverCallback(function(){ return obj; })();
        assert.ran(this.count + 1);
      },

      "catches exceptions and rejects": function(){
        var obj = {};
        this.deferred.then(null, function(result){
          assert.same(result, obj);
        });
        this.deferred.resolverCallback(function(){ throw obj; })();
        assert.ran(this.count + 1);
      },

      "is ignored if already fulfilled": function(){
        this.deferred.resolve();
        refute.exception(this.deferred.resolverCallback(function(){ return true; }));
      },

      "can resolve before returning": function(){
        var obj1 = {}, obj2 = {};
        this.deferred.then(function(result){
          assert.same(result, obj1);
        });
        var deferred = this.deferred;
        this.deferred.resolverCallback(function(){ deferred.resolve(obj1); return obj2; })();
        assert.ran(this.count + 1);
      }
    }
  });
});
