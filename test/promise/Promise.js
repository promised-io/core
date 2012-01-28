if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "../../promise/defer"
], function(buster, defer){
  buster.testCase("promise/Promise", {
    setUp: function(){
      this.deferred = defer();
    },

    "fail(…) is equivalent to then(null, …)": function(){
      var obj = {};
      var thenResult;
      this.deferred.then(null, function(result){
        thenResult = result;
      });
      this.deferred.promise.fail(function(result){
        assert.same(result, obj);
        assert.same(result, thenResult);
      });
      this.deferred.reject(obj);
    },

    "both() will be invoked for resolution and rejection": function(){
      var obj = {};
      var deferred1 = defer();
      var thenResult;
      deferred1.promise.then(function(result){
        thenResult = result;
      });
      deferred1.promise.both(function(result){
        assert.same(result, obj);
        assert.same(result, thenResult);
      });
      deferred1.resolve(obj);

      var deferred2 = defer();
      var thenResult2;
      deferred2.promise.then(null, function(result){
        thenResult2 = result;
      });
      deferred2.promise.both(function(result){
        assert.same(result, obj);
        assert.same(result, thenResult2);
      });
      deferred2.reject(obj);
    },

    "get()": {
      "with result": function(){
        this.deferred.promise.get("foo").then(function(result){
          assert.same(result, "bar");
        });
        this.deferred.resolve({ foo: "bar" });
      },

      "with undefined result": function(){
        this.deferred.promise.get("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
      },

      "with null result": function(){
        this.deferred.promise.get("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve(null);
      }
    },

    "invoke()": {
      "with result": function(){
        var obj = { foo: function(){ return "bar"; }};
        this.deferred.promise.invoke("foo").then(function(result){
          assert.same(result, "bar");
        });
        this.deferred.resolve(obj);
      },

      "with result, returning promise": function(){
        var obj = { foo: function(){
          return defer().resolve("bar");
        }};
        this.deferred.promise.invoke("foo").then(function(result){
          assert.same(result, "bar");
        });
        this.deferred.resolve(obj);
      },

      "with result, throwing error": function(){
        var obj = { foo: function(){
          throw "fail";
        }};
        this.deferred.promise.invoke("foo").then(null, function(result){
          assert.same(result, "fail");
        });
        this.deferred.resolve(obj);
      },

      "with undefined result": function(){
        this.deferred.promise.invoke("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
      },

      "with null result": function(){
        this.deferred.promise.invoke("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve(null);
      },

      "passing arguments": function(){
        var obj = {};
        this.deferred.promise.invoke("foo", [obj]);
        this.deferred.resolve({
          foo: function(arg){
            assert.same(arg, obj);
          }
        });
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
      },

      "with undefined result": function(){
        this.deferred.promise.put("foo", "bar").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
      },

      "with null result": function(){
        this.deferred.promise.put("foo", "bar").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve(null);
      }
    },

    "change()": function(){
      var obj1 = {}, obj2 = {};
      this.deferred.promise.change(obj2).then(function(result){
        assert.same(result, obj2);
      });
      this.deferred.resolve(obj1);
    },

    "inflect()": {
      "resolved promise": function(){
        var obj = {};
        this.deferred.promise.inflect(function(error, result){
          assert.same(error, null);
          assert.same(result, obj);
        });
        this.deferred.resolve(obj);
      },

      "rejected promise": function(){
        var obj = {};
        this.deferred.promise.inflect(function(error){
          assert.same(arguments.length, 1);
          assert.same(error, obj);
        });
        this.deferred.reject(obj);
      }
    },

    "del()": {
      "with result": function(){
        var obj = { foo: "bar" };
        this.deferred.promise.del("foo").then(function(result){
          assert(result);
          refute.defined(obj.foo);
        });
        this.deferred.resolve(obj);
      },

      "with undefined result": function(){
        this.deferred.promise.del("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
      },

      "with null result": function(){
        this.deferred.promise.del("foo").then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve(null);
      }
    },

    "call()": {
      "normally": function(){
        this.deferred.promise.call();
        this.deferred.resolve(function(){
          assert(true);
        });
      },

      "with thisObject": function(){
        var obj = {};
        this.deferred.promise.call(obj);
        this.deferred.resolve(function(){
          assert.same(this, obj);
        });
      },

      "with arguments": function(){
        var obj1 = {}, obj2 = {};
        this.deferred.promise.call(null, obj1, obj2);
        this.deferred.resolve(function(arg1, arg2){
          assert.same(arg1, obj1);
          assert.same(arg2, obj2);
        });
      },

      "non-callable": function(){
        var obj1 = {}, obj2 = {};
        this.deferred.promise.call().then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
      }
    },

    "apply()": {
      "normally": function(){
        this.deferred.promise.apply();
        this.deferred.resolve(function(){
          assert(true);
        });
      },

      "with thisObject": function(){
        var obj = {};
        this.deferred.promise.apply(obj);
        this.deferred.resolve(function(){
          assert.same(this, obj);
        });
      },

      "with arguments": function(){
        var obj1 = {}, obj2 = {};
        this.deferred.promise.apply(null, [obj1, obj2]);
        this.deferred.resolve(function(arg1, arg2){
          assert.same(arg1, obj1);
          assert.same(arg2, obj2);
        });
      },

      "non-callable": function(){
        var obj1 = {}, obj2 = {};
        this.deferred.promise.apply().then(null, function(result){
          assert.isInstance(result, TypeError, "TypeError");
        });
        this.deferred.resolve();
      }
    }
  });
});
