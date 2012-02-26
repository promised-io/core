if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./test-case",
  "./test-case/assert",
  "./test-case/refute",
  "../promise/defer",
  "../promise/tracer"
], function(testCase, assert, refute, defer, tracer){
  return testCase("promise/tracer", {
    beforeEach: function(){
      this.handles = [];
      this.deferred = defer();
    },

    afterEach: function(){
      while(this.handles.length){
        this.handles.pop().remove();
      }
    },

    "trace": {
      "resolved": function(){
        var obj = {};
        this.handles.push(tracer.on("resolved", function(value){
          assert.same(value, obj);
        }));
        this.deferred.promise.trace();
        this.deferred.resolve(obj);
      },

      "rejected": function(){
        var obj = {};
        this.handles.push(tracer.on("rejected", function(error){
          assert.same(error, obj);
        }));
        this.deferred.promise.trace();
        this.deferred.reject(obj);
      },

      "progress": function(){
        var obj = {};
        this.handles.push(tracer.on("progress", function(update){
          assert.same(update, obj);
        }));
        this.deferred.promise.trace();
        this.deferred.progress(obj);
      },

      "passing extra arguments": function(){
        var obj = {};
        this.handles.push(tracer.on("resolved", function(value, arg1, arg2){
          assert.same(value, obj);
          assert.same(arg1, "test");
          assert.same(arg2, obj);
        }));
        this.deferred.promise.trace("test", obj);
        this.deferred.resolve(obj);
      }
    },

    "traceRejected": {
      "rejected": function(){
        var obj = {};
        this.handles.push(tracer.on("rejected", function(error){
          assert.same(error, obj);
        }));
        this.deferred.promise.traceRejected();
        this.deferred.reject(obj);
      },

      "passing extra arguments": function(){
        var obj = {};
        this.handles.push(tracer.on("rejected", function(error, arg1, arg2){
          assert.same(error, obj);
          assert.same(arg1, "test");
          assert.same(arg2, obj);
        }));
        this.deferred.promise.traceRejected("test", obj);
        this.deferred.reject(obj);
      }
    }
  });
});
