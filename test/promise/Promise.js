if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer"
], function(buster, defer){
  buster.testCase("promise/Promise", {
    setUp: function(){
      this.deferred = defer();
      this.count = buster.assertions.count;
    },

    "fail(…) is equivalent to then(null, …)": function(){
      var obj = {};
      this.deferred.then(null, function(result){
        assert.same(result, obj);
      });
      this.deferred.promise.fail(function(result){
        assert.same(result, obj);
      });
      this.deferred.reject(obj);
      assert.ran(this.count + 2);
    },

    "both() will be invoked for resolution and rejection": function(){
      var obj = {};
      var deferred1 = defer();
      deferred1.promise.then(function(result){
        assert.same(result, obj);
      });
      deferred1.promise.both(function(result){
        assert.same(result, obj);
      });
      deferred1.resolve(obj);

      var deferred2 = defer();
      deferred2.promise.then(null, function(result){
        assert.same(result, obj);
      });
      deferred2.promise.both(function(result){
        assert.same(result, obj);
      });
      deferred2.reject(obj);

      assert.ran(this.count + 4);
    },

    "get()": {
      "with result": function(){
        this.deferred.promise.get("foo").then(function(result){
          assert.same(result, "bar");
        });
        this.deferred.resolve({ foo: "bar" });
        assert.ran(this.count + 1);
      },

      "with undefined result": function(){
        this.deferred.promise.get("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
        assert.ran(this.count + 1);
      },

      "with null result": function(){
        this.deferred.promise.get("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve(null);
        assert.ran(this.count + 1);
      }
    },

    "put()": {
      "with result": function(){
        var obj = {};
        this.deferred.promise.put("foo", "bar").then(function(result){
          assert.same(result, "bar");
          assert.same(obj.foo, "bar");
        });
        this.deferred.resolve(obj);
        assert.ran(this.count + 2);
      },

      "with undefined result": function(){
        this.deferred.promise.put("foo", "bar").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
        assert.ran(this.count + 1);
      },

      "with null result": function(){
        this.deferred.promise.put("foo", "bar").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve(null);
        assert.ran(this.count + 1);
      }
    },

    "call()": {
      "with result": function(){
        var obj = { foo: function(){ return "bar"; }};
        this.deferred.promise.call("foo").then(function(result){
          assert.same(result, "bar");
        });
        this.deferred.resolve(obj);
        assert.ran(this.count + 1);
      },

      "with result, returning promise": function(){
        var obj = { foo: function(){
          return defer().resolve("bar");
        }};
        this.deferred.promise.call("foo").then(function(result){
          assert.same(result, "bar");
        });
        this.deferred.resolve(obj);
        assert.ran(this.count + 1);
      },

      "with result, throwing error": function(){
        var obj = { foo: function(){
          throw "fail";
        }};
        this.deferred.promise.call("foo").then(null, function(result){
          assert.same(result, "fail");
        });
        this.deferred.resolve(obj);
        assert.ran(this.count + 1);
      },

      "with undefined result": function(){
        this.deferred.promise.call("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
        assert.ran(this.count + 1);
      },

      "with null result": function(){
        this.deferred.promise.call("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve(null);
        assert.ran(this.count + 1);
      }
    }
  });
});
