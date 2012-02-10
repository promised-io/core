if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "../test-case/assert",
  "../../stream",
  "../../promise/defer",
  "../../promise/when",
  "../../promise/isPromise",
  "../../promise/delay",
  "../../lib/adapters!lang",
  "../../lib/adapters!timers"
], function(assert, errors, defer, when, isPromise, delay, lang, timers){
  "use strict";

  return function(){
    var instance, produce, finish, consumed, values;

    return {
      update: function(_instance, _produce, _finish, _consumed, _values){
        instance = _instance;
        produce = _produce;
        finish = _finish;
        consumed = _consumed;
        values = _values;
      },

      tests: {
        "toArray": {
          "returns promise or array": function(){
            var result = instance.toArray();
            assert(isPromise(result) || lang.isArray(result));
            finish();
            return result;
          },

          "returns values": function(){
            var promise = when(instance.toArray(), function(array){
              assert.same(array.length, values.length);
              for(var i = 0; i < array.length; i++){
                assert.same(array[i], values[i]);
              }
            });
            finish();
            return promise;
          }
        },

        "length": {
          "returns promise or number": function(){
            var result = instance.length();
            assert(isPromise(result) || typeof result === "number");
            finish();
            return result;
          },

          "returns length": function(){
            var promise = when(instance.length(), function(length){
              assert.same(length, values.length);
            });
            finish();
            return promise;
          },

          "if there are no values": function(){
            values.splice(0, values.length);
            var promise = when(instance.length(), function(length){
              assert.same(length, 0);
            });
            finish();
            return promise;
          }
        },

        "get": {
          "returns value or promise": function(){
            var result = instance.get(1);
            assert(isPromise(result) || typeof result === "object");
            finish();
            return result;
          },

          "returns correct value": function(){
            var promise = when(instance.get(1), function(value){
              assert.same(value, values[1]);
            });
            finish();
            return promise;
          },

          "returns a rejected promise if there is no value at the index": function(){
            var promise = when(instance.get(values.length + 1), null, function(error){
              assert.same(error.name, "RangeError");
            });
            finish();
            return promise;
          }
        },

        "last": {
          "returns value or promise": function(){
            var result = instance.last();
            assert(isPromise(result) || typeof result === "object");
            finish();
            return result;
          },

          "returns correct value": function(){
            var promise = when(instance.last(), function(value){
              assert.same(value, values[2]);
            });
            finish();
            return promise;
          },

          "returns a rejected promise if there are no values": function(){
            values.splice(0, values.length);
            var promise = when(instance.last(), function(value){
              assert.fail("Not expecting value");
            }, function(error){
              assert.same(error.name, "RangeError");
            });
            finish();
            return promise;
          }
        },

        "indexOf": {
          "returns number or promise": function(){
            var result = instance.indexOf(values[1]);
            assert(isPromise(result) || typeof result === "number");
            finish();
            return result;
          },

          "returns correct index": function(){
            var promise = when(instance.indexOf(values[1]), function(index){
              assert.same(index, 1);
            });
            finish();
            return promise;
          },

          "returns correct index, with positive fromIndex": function(){
            var promise = when(instance.indexOf(values[2], 1), function(index){
              assert.same(index, 2);
            });
            finish();
            return promise;
          },

          "returns correct index, with negative fromIndex": function(){
            var promise = when(instance.indexOf(values[1], -2), function(index){
              assert.same(index, 1);
            });
            finish();
            return promise;
          },

          "returns -1 if not found": function(){
            var promise = when(instance.indexOf({}), function(index){
              assert.same(index, -1);
            });
            finish();
            return promise;
          }
        },

        "lastIndexOf": {
          "returns number or promise": function(){
            var result = instance.lastIndexOf(values[1]);
            assert(isPromise(result) || typeof result === "number");
            finish();
            return result;
          },

          "returns correct index": function(){
            var promise = when(instance.lastIndexOf(values[1]), function(index){
              assert.same(index, 1);
            });
            finish();
            return promise;
          },

          "returns correct index, with positive fromIndex": function(){
            var promise = when(instance.lastIndexOf(values[0], 1), function(index){
              assert.same(index, 0);
            });
            finish();
            return promise;
          },

          "returns correct index, with negative fromIndex": function(){
            var promise = when(instance.lastIndexOf(values[0], -1), function(index){
              assert.same(index, 0);
            });
            finish();
            return promise;
          },

          "returns -1 if not found": function(){
            var promise = when(instance.lastIndexOf({}), function(index){
              assert.same(index, -1);
            });
            finish();
            return promise;
          }
        }
      }
    };
  };
});
