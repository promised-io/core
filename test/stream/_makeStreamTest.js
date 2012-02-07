if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "buster",
  "./_testSource",
  "./_sharedTests",
  "../../stream",
  "../../stream/Stream",
  "../../promise/defer",
  "../../promise/when",
  "../../promise/isPromise",
  "../../promise/delay",
  "../../promise/all",
  "../../lib/adapters!lang",
  "../../lib/adapters!timers"
], function(buster, Source, Shared, errors, Stream, defer, when, isPromise, delay, all, lang, timers){
  "use strict";

  return function(name, klass, repeatable, init){
    var instance, produce, finish, consumed, values;
    var shared = new Shared;

    buster.testCase(name, {
      setUp: function(){
        consumed = 0;
        values = [{}, {}, {}];

        var source = new Source(function(){
          consumed++;
          shared.update(instance, produce, finish, consumed, values);
        });
        var result = init(values, source);
        instance = result.instance;
        if(result.usesSource){
          // If the source is returned, it's used
          var index = 0;
          produce = function(){
            if(index < values.length){
              source.produce(values[index++]);
            }
          };
          finish = function(){
            while(index < values.length){
              produce();
            }
            source.finish();
          }
        }else{
          // Else we assume the returned producer has bufferred all values
          produce = finish = lang.noop;
          consumed = values.length;
        }

        shared.update(instance, produce, finish, consumed, values);
      },

      "consume": {
        "as expected": function(){
          var lastIndex = -1;

          var promise = instance.consume(function(value, index, stream){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            assert.same(stream, instance);
            lastIndex++;
          }).then(assert);

          finish();
          refute(promise.isFulfilled());
          return promise.then(function(){
            assert.same(lastIndex, values.length - 1);
          });
        },

        "backpressure is respected": function(){
          var lastIndex = -1;

          finish();

          var backpressure = false;
          return instance.consume(function(value, index, stream){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            assert.same(stream, instance);
            lastIndex++;

            refute(backpressure);
            backpressure = true;
            return delay().then(function(){
              backpressure = false;
            });
          }).then(assert).then(function(){
            assert.same(lastIndex, values.length - 1);
          });
        },

        "and stop": function(){
          var lastIndex = -1;

          finish();

          var stopped = false;
          return instance.consume(function(value, index, stream){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            assert.same(stream, instance);
            lastIndex++;

            refute(stopped);
            if(index === 1){
              stopped = true;
              throw new errors.StopConsumption;
            }
          }).then(refute).then(function(){
            assert.same(lastIndex, 1);
          });
        },

        "and fail if callback throws error": function(){
          var lastIndex = -1;

          finish();

          var failed = false;
          var error = new Error;
          return instance.consume(function(value, index, stream){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            assert.same(stream, instance);
            lastIndex++;

            refute(failed);
            if(index === 1){
              failed = true;
              throw error;
            }
          }).fail(function(result){
            assert.same(result, error);
            assert.same(lastIndex, 1);
          });
        },

        "and stop if canceled": function(){
          var lastIndex = -1;

          finish();

          var canceled = false;
          var promise = instance.consume(function(value, index, stream){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            assert.same(stream, instance);
            lastIndex++;

            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          return promise.fail(function(){
            assert(canceled);
            assert.same(lastIndex, 1);
          });
        },

        "with a thisObject": function(){
          var lastIndex = -1;

          var object = {};
          var promise = instance.consume(function(value, index, stream){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            assert.same(stream, instance);
            assert.same(this, object);
            lastIndex++;
          }, object).then(assert);

          finish();
          refute(promise.isFulfilled());
          return promise.then(function(){
            assert.same(lastIndex, values.length - 1);
          });
        }
      },

      "toArray": shared.tests.toArray,
      "length": shared.tests.length,
      "get": shared.tests.get,
      "first": {
        "returns value or promise": function(){
          var result = instance.first();
          assert(isPromise(result) || typeof result === "object");
          finish();
          return result;
        },

        "returns correct value": function(){
          var promise = when(instance.first(), function(value){
            assert.same(value, values[0]);
          });
          finish();
          return promise;
        },

        "returns a rejected promise if there are no values": function(){
          values.splice(0, values.length);
          var promise = when(instance.first(), null, function(error){
            assert.same(error.name, "RangeError");
          });
          finish();
          return promise;
        }
      },
      "last": shared.tests.last,

      "concat": {
        "returns new stream": function(){
          var concatenated = instance.concat([]);
          assert(concatenated instanceof Stream);
          refute(concatenated.isRepeatable());
        },

        "with array": function(){
          var array = [{}, {}, {}];
          var concatenated = instance.concat(array);
          var lastIndex = -1;
          var promise = concatenated.consume(function(value, index, stream){
            if(index < values.length){
              assert.same(value, values[index]);
            }else{
              assert.same(value, array[index - values.length]);
            }
            assert.same(index - lastIndex, 1);
            assert.same(stream, concatenated);
            lastIndex = index;
          }).then(assert);
          refute(promise.isFulfilled());
          finish();
          return promise;
        },

        "with producer": function(){
          var array = [{}, {}, {}];
          var source = new Source(lang.noop);
          var concatenated = instance.concat(source);
          var lastIndex = -1;
          var promise = concatenated.consume(function(value, index, stream){
            if(index < values.length){
              assert.same(value, values[index]);
            }else{
              assert.same(value, array[index - values.length]);
            }
            assert.same(index - lastIndex, 1);
            assert.same(stream, concatenated);
            lastIndex = index;
          }).then(assert);
          refute(promise.isFulfilled());
          finish();
          timers.immediate(function(){ source.produce(array[0]); });
          timers.immediate(function(){ source.produce(array[1]); });
          timers.immediate(function(){ source.produce(array[2]); });
          timers.immediate(function(){ source.finish(); });
          return promise;
        },

        "with stream": function(){
          var repeatable = instance.toRepeatableStream();
          var concatenated = repeatable.concat(repeatable);
          var lastIndex = -1;
          var promise = concatenated.consume(function(value, index, stream){
            if(index < values.length){
              assert.same(value, values[index]);
            }else{
              assert.same(value, values[index - values.length]);
            }
            assert.same(index - lastIndex, 1);
            assert.same(stream, concatenated);
            lastIndex = index;
          }).then(assert);
          refute(promise.isFulfilled());
          finish();
          return promise;
        }
      },

      "filter": {
        "returns new stream": function(){
          var filtered = instance.filter();
          refute.same(filtered, instance);
          assert.same(filtered.isRepeatable(), instance.isRepeatable());
          assert(filtered instanceof Stream);
        },

        "does filter": function(){
          var lastIndex = -1;
          var filtered = instance.filter(function(value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
            return index === 1;
          });
          var promise = filtered.consume(function(value, index){
            assert.same(index, 0);
            assert.same(value, values[1]);
          }).then(assert);
          finish();
          return promise;
        },

        "is lazy": function(done){
          produce();
          var filtered = instance.filter(function(value, index){
            return index === 1;
          });
          timers.immediate(function(){
            assert.same(consumed, 0);
            filtered.consume(lang.noop).then(assert).then(function(){
              done();
            });
            finish();
          });
        },

        "with a thisObject": function(){
          var object = {};
          var filtered = instance.filter(function(value, index){
            assert.same(this, object);
            return index === 1;
          }, object);
          finish();
          return filtered.consume(lang.noop).then(assert);
        },

        "filterFunc can't be stopped": function(){
          var filtered = instance.filter(function(value, index){
            throw new errors.StopConsumption;
          });
          finish();
          return filtered.consume(lang.noop).then(null, function(error){
            assert.same(error.name, "TypeError");
          });
        },

        "filterFunc errors are forwarded": function(){
          var object = {};
          var filtered = instance.filter(function(value, index){
            throw object;
          });
          finish();
          return filtered.consume(lang.noop).then(null, function(error){
            assert.same(error, object);
          });
        },

        "backpressure is respected": function(){
          finish();
          var lastIndex = -1;
          var backpressure = false;
          var filtered = instance.filter(function(){
            refute(backpressure);
            return true;
          });
          return filtered.consume(function(value, index){
            lastIndex = index;
            refute(backpressure);
            backpressure = true;
            return delay().then(function(){
              backpressure = false;
            });
          }).then(assert).then(function(){
            assert.same(lastIndex, values.length - 1);
          });
        },

        "and stop": function(){
          finish();
          var lastIndex = -1;
          var stopped = false;
          var filtered = instance.filter(function(){
            refute(stopped);
            return true;
          });
          return filtered.consume(function(value, index){
            lastIndex = index;
            refute(stopped);
            if(index === 1){
              stopped = true;
              throw new errors.StopConsumption;
            }
          }).then(refute).then(function(){
            assert.same(lastIndex, 1);
          });
        },

        "and fail if callback throws error": function(){
          finish();
          var lastIndex = -1;
          var failed = false;
          var error = new Error;
          var filtered = instance.filter(function(){
            refute(failed);
            return true;
          });
          return filtered.consume(function(value, index){
            lastIndex = index;
            refute(failed);
            if(index === 1){
              failed = true;
              throw error;
            }
          }).fail(function(result){
            assert.same(result, error);
            assert.same(lastIndex, 1);
          });
        },

        "and stop if canceled": function(){
          finish();
          var lastIndex = -1;
          var canceled = false;
          var filtered = instance.filter(function(){
            refute(canceled);
            return true;
          });
          var promise = filtered.consume(function(value, index, stream){
            lastIndex = index;
            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          return promise.fail(function(){
            assert(canceled);
            assert.same(lastIndex, 1);
          });
        }
      },

      "map": {
        "returns new stream": function(){
          var mapped = instance.map();
          refute.same(mapped, instance);
          assert.same(mapped.isRepeatable(), instance.isRepeatable());
          assert(mapped instanceof Stream);
        },

        "does map": function(){
          var lastIndex = -1;
          var mapped = instance.map(function(value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
            return { wrapped: value };
          });
          var lastMappedIndex = -1;
          var promise = mapped.consume(function(value, index){
            assert.same(value.wrapped, values[index]);
            assert.same(index - lastMappedIndex, 1);
            lastMappedIndex = index;
          }).then(assert);
          finish();
          return promise;
        },

        "is lazy": function(done){
          produce();
          var mapped = instance.map(lang.noop);
          timers.immediate(function(){
            assert.same(consumed, 0);
            mapped.consume(lang.noop).then(assert).then(function(){
              done();
            });
            finish();
          });
        },

        "with a thisObject": function(){
          var object = {};
          var mapped = instance.map(function(){
            assert.same(this, object);
          }, object);
          finish();
          return mapped.consume(lang.noop).then(assert);
        },

        "mapFunc can't be stopped": function(){
          var mapped = instance.map(function(){
            throw new errors.StopConsumption;
          });
          finish();
          return mapped.consume(lang.noop).then(null, function(error){
            assert.same(error.name, "TypeError");
          });
        },

        "mapFunc errors are forwarded": function(){
          var object = {};
          var mapped = instance.map(function(){
            throw object;
          });
          finish();
          return mapped.consume(lang.noop).then(null, function(error){
            assert.same(error, object);
          });
        },

        "backpressure is respected": function(){
          finish();
          var lastIndex = -1;
          var backpressure = false;
          var mapped = instance.map(function(){
            refute(backpressure);
            return true;
          });
          return mapped.consume(function(value, index){
            lastIndex = index;
            refute(backpressure);
            backpressure = true;
            return delay().then(function(){
              backpressure = false;
            });
          }).then(assert).then(function(){
            assert.same(lastIndex, values.length - 1);
          });
        },

        "and stop": function(){
          finish();
          var lastIndex = -1;
          var stopped = false;
          var mapped = instance.map(function(){
            refute(stopped);
            return true;
          });
          return mapped.consume(function(value, index){
            lastIndex = index;
            refute(stopped);
            if(index === 1){
              stopped = true;
              throw new errors.StopConsumption;
            }
          }).then(refute).then(function(){
            assert.same(lastIndex, 1);
          });
        },

        "and fail if callback throws error": function(){
          finish();
          var lastIndex = -1;
          var failed = false;
          var error = new Error;
          var mapped = instance.map(function(){
            refute(failed);
            return true;
          });
          return mapped.consume(function(value, index){
            lastIndex = index;
            refute(failed);
            if(index === 1){
              failed = true;
              throw error;
            }
          }).fail(function(result){
            assert.same(result, error);
            assert.same(lastIndex, 1);
          });
        },

        "and stop if canceled": function(){
          finish();
          var lastIndex = -1;
          var canceled = false;
          var mapped = instance.map(function(){
            refute(canceled);
            return true;
          });
          var promise = mapped.consume(function(value, index, stream){
            lastIndex = index;
            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          return promise.fail(function(){
            assert(canceled);
            assert.same(lastIndex, 1);
          });
        }
      },

      "forEach": {
        "returns promise": function(){
          var promise = instance.forEach(lang.noop);
          assert(isPromise(promise));
        },

        "does iterate": function(){
          var lastIndex = -1;
          var promise = instance.forEach(function(value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
          }).then(assert);
          finish();
          refute(promise.isFulfilled());
          return promise;
        },

        "with a thisObject": function(){
          var object = {};
          var promise = instance.forEach(function(){
            assert.same(this, object);
          }, object).then(assert);
          finish();
          return promise;
        },

        "can't throw StopConsumption": function(){
          var promise = instance.forEach(function(){
            throw new errors.StopConsumption;
          }).fail(function(error){
            assert(error.name, "TypeError");
          });
          finish();
          return promise;
        },

        "fails if callback throws an error": function(){
          var object = new Error;
          var promise = instance.forEach(function(){
            throw object;
          }).fail(function(error){
            assert.same(error, object);
          });
          finish();
          return promise;
        },

        "can be canceled": function(){
          var canceled = false;
          var promise = instance.forEach(function(value, index){
            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          finish();
          return promise.fail(function(){
            assert(canceled);
          });
        }
      },

      "some": {
        "returns promise": function(){
          var promise = instance.some(lang.noop);
          assert(isPromise(promise));
        },

        "does iterate": function(){
          var lastIndex = -1;
          var promise = instance.some(function(value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
          }).then(assert);
          finish();
          refute(promise.isFulfilled());
          return promise;
        },

        "stops when expected": function(){
          var lastIndex = -1;
          var stopped = false;
          var promise = instance.some(function(value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
            refute(stopped);
            if(index === 1){
              return stopped = true;
            }
          }).then(refute).then(function(){
            assert(stopped);
            assert.same(lastIndex, 1);
          });
          finish();
          return promise;
        },

        "with a thisObject": function(){
          var object = {};
          var promise = instance.some(function(){
            assert.same(this, object);
          }, object).then(assert);
          finish();
          return promise;
        },

        "can't throw StopConsumption": function(){
          var promise = instance.some(function(){
            throw new errors.StopConsumption;
          }).fail(function(error){
            assert(error.name, "TypeError");
          });
          finish();
          return promise;
        },

        "fails if callback throws an error": function(){
          var object = new Error;
          var promise = instance.some(function(){
            throw object;
          }).fail(function(error){
            assert.same(error, object);
          });
          finish();
          return promise;
        },

        "can be canceled": function(){
          var canceled = false;
          var promise = instance.some(function(value, index){
            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          finish();
          return promise.fail(function(){
            assert(canceled);
          });
        }
      },

      "every": {
        "returns promise": function(){
          var promise = instance.every(lang.noop);
          assert(isPromise(promise));
        },

        "does iterate": function(){
          var lastIndex = -1;
          var promise = instance.every(function(value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
            return true;
          }).then(assert);
          finish();
          refute(promise.isFulfilled());
          return promise;
        },

        "stops when expected": function(){
          var lastIndex = -1;
          var stopped = false;
          var promise = instance.every(function(value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
            refute(stopped);
            if(index === 1){
              stopped = true;
              return false;
            }
            return true;
          }).then(refute).then(function(){
            assert(stopped);
            assert.same(lastIndex, 1);
          });
          finish();
          return promise;
        },

        "with a thisObject": function(){
          var object = {};
          var promise = instance.every(function(){
            assert.same(this, object);
            return true;
          }, object).then(assert);
          finish();
          return promise;
        },

        "can't throw StopConsumption": function(){
          var promise = instance.every(function(){
            throw new errors.StopConsumption;
          }).fail(function(error){
            assert(error.name, "TypeError");
          });
          finish();
          return promise;
        },

        "fails if callback throws an error": function(){
          var object = new Error;
          var promise = instance.every(function(){
            throw object;
          }).fail(function(error){
            assert.same(error, object);
          });
          finish();
          return promise;
        },

        "can be canceled": function(){
          var canceled = false;
          var promise = instance.every(function(value, index){
            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          finish();
          return promise.fail(function(){
            assert(canceled);
          });
        }
      },

      "reduce": {
        "returns promise": function(){
          var promise = instance.reduce(lang.noop);
          assert(isPromise(promise));
        },

        "does reduce": function(){
          var lastIndex = -1;
          var initial = {};
          var promise = instance.reduce(function(reduce, value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
            value.prev = reduce;
            return value;
          }, initial).then(function(result){
            assert.same(lastIndex, 2);
            assert.same(result, values[2]);
            assert.same(result.prev, values[1]);
            assert.same(result.prev.prev, values[0]);
            assert.same(result.prev.prev.prev, initial);
          });
          finish();
          refute(promise.isFulfilled());
          return promise;
        },

        "does reduce, without initial value": function(){
          var lastIndex = 0;
          var promise = instance.reduce(function(reduce, value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, 1);
            assert.same(stream, instance);
            lastIndex = index;
            value.prev = reduce;
            return value;
          }).then(function(result){
            assert.same(lastIndex, 2);
            assert.same(result, values[2]);
            assert.same(result.prev, values[1]);
            assert.same(result.prev.prev, values[0]);
          });
          finish();
          return promise;
        },

        "can't throw StopConsumption": function(){
          var promise = instance.reduce(function(){
            throw new errors.StopConsumption;
          }).fail(function(error){
            assert(error.name, "TypeError");
          });
          finish();
          return promise;
        },

        "fails if callback throws an error": function(){
          var object = new Error;
          var promise = instance.reduce(function(){
            throw object;
          }).fail(function(error){
            assert.same(error, object);
          });
          finish();
          return promise;
        },

        "can be canceled": function(){
          var canceled = false;
          var promise = instance.reduce(function(prev, value, index){
            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          finish();
          return promise.fail(function(){
            assert(canceled);
          });
        }
      },

      "reduceRight": {
        "returns promise": function(){
          var promise = instance.reduceRight(lang.noop);
          assert(isPromise(promise));
        },

        "does reduceRight": function(){
          var lastIndex = 3;
          var initial = {};
          var promise = instance.reduceRight(function(reduceRight, value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, -1);
            assert.same(stream, instance);
            lastIndex = index;
            value.next = reduceRight;
            return value;
          }, initial).then(function(result){
            assert.same(lastIndex, 0);
            assert.same(result, values[0]);
            assert.same(result.next, values[1]);
            assert.same(result.next.next, values[2]);
            assert.same(result.next.next.next, initial);
          });
          finish();
          refute(promise.isFulfilled());
          return promise;
        },

        "does reduceRight, without initial value": function(){
          var lastIndex = 2;
          var promise = instance.reduceRight(function(reduceRight, value, index, stream){
            assert.same(value, values[index]);
            assert.same(index - lastIndex, -1);
            assert.same(stream, instance);
            lastIndex = index;
            value.next = reduceRight;
            return value;
          }).then(function(result){
            assert.same(lastIndex, 0);
            assert.same(result, values[0]);
            assert.same(result.next, values[1]);
            assert.same(result.next.next, values[2]);
          });
          finish();
          return promise;
        },

        "can't throw StopConsumption": function(){
          var promise = instance.reduceRight(function(){
            throw new errors.StopConsumption;
          }).fail(function(error){
            assert(error.name, "TypeError");
          });
          finish();
          return promise;
        },

        "fails if callback throws an error": function(){
          var object = new Error;
          var promise = instance.reduceRight(function(){
            throw object;
          }).fail(function(error){
            assert.same(error, object);
          });
          finish();
          return promise;
        },

        "can be canceled": function(){
          var canceled = false;
          var promise = instance.reduceRight(function(prev, value, index){
            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          finish();
          return promise.fail(function(){
            assert(canceled);
          });
        }
      },

      "join": {
        setUp: function(){
          values.splice(0, 3, "foo", "bar", "baz");
        },

        "returns string or promise": function(){
          var result = instance.join("-");
          assert(isPromise(result) || typeof result === "string");
        },

        "joins correctly": function(){
          finish();
          return when(instance.join("-"), function(str){
            assert.same(str, "foo-bar-baz");
          });
        }
      },

      "toSortedArray": {
        setUp: function(){
          values.splice(0, 3, 9, 4, 5);
          this.sortFunc = function(a, b){ return a - b; };
        },

        "returns array or promise": function(){
          var result = instance.toSortedArray(lang.noop);
          assert(isPromise(result) || lang.isArray(result));
        },

        "sorts correctly": function(){
          finish();
          return when(instance.toSortedArray(this.sortFunc), function(sorted){
            assert.same(sorted[0], 4);
            assert.same(sorted[1], 5);
            assert.same(sorted[2], 9);
          });
        },

        "returns rejected promise if sorter throws error": function(){
          finish();
          var object = {};
          return instance.toSortedArray(function(){ throw object; }).fail(function(error){
            assert.same(error, object);
          });
        }
      },

      "toReversedArray": {
        "returns array or promise": function(){
          var result = instance.toReversedArray(lang.noop);
          assert(isPromise(result) || lang.isArray(result));
        },

        "reverses correctly": function(){
          finish();
          return when(instance.toReversedArray(), function(reverted){
            assert.same(reverted[0], values[2]);
            assert.same(reverted[1], values[1]);
            assert.same(reverted[2], values[0]);
          });
        }
      },

      "indexOf": shared.tests.indexOf,
      "lastIndexOf": shared.tests.lastIndexOf,

      "parseJSON": {
        setUp: function(){
          values.splice(0, 3, '{"foo', '":"bar"', '}');
        },

        "returns promise": function(){
          finish();
          var promise = instance.parseJSON();
          assert(isPromise(promise));
          refute(promise.isFulfilled());
          return promise;
        },

        "parses": function(){
          finish();
          return instance.parseJSON().then(function(json){
            assert.same(json.foo, "bar");
          });
        },

        "returns a rejected promise in case of parse errors": function(){
          values[2] = "!";
          finish();
          return instance.parseJSON().fail(function(error){
            assert.same(error.name, "SyntaxError");
          });
        }
      },

      "isRepeatable": {
        "returns expected value": function(){
          assert.same(instance.isRepeatable(), repeatable);
        }
      },

      "toRepeatableStream": {
        "returns same stream": !repeatable ? undefined : function(){
          assert.same(instance, instance.toRepeatableStream());
        },

        "returns a new, repeatable stream": repeatable ? undefined : function(){
          var result = instance.toRepeatableStream();
          refute.same(result, instance);
          assert(result instanceof Stream);
          assert(result.isRepeatable());
        }
      },

      "repeatable streams won't get exhausted": !repeatable ? undefined : function(){
        // Let's just run everything back-to-back!
        finish();
        return all([
          instance.consume(lang.noop),
          instance.toArray(),
          instance.length(),
          instance.get(0),
          instance.first(),
          instance.last(),
          instance.concat(instance).toArray(),
          instance.filter(lang.noop).toArray(),
          instance.map(lang.noop).toArray(),
          instance.forEach(lang.noop),
          instance.some(lang.noop),
          instance.every(lang.noop),
          instance.reduce(lang.noop),
          instance.reduceRight(lang.noop),
          instance.join(""),
          instance.toSortedArray(),
          instance.toReversedArray(),
          instance.indexOf(),
          instance.lastIndexOf(),
          instance.parseJSON().fail(lang.noop)
        ]).then(assert);
      },

      "non-repeatable streams get exhausted": repeatable ? undefined : function(){
        var identity = function(identity){ return identity; };
        finish();
        var promise = instance.consume(lang.noop);
        assert.exception(function(){ instance.consume(lang.noop); }, "ExhaustionError");
        assert.exception(function(){ instance.toArray(); }, "ExhaustionError");
        assert.exception(function(){ instance.length(); }, "ExhaustionError");
        assert.exception(function(){ instance.get(0); }, "ExhaustionError");
        assert.exception(function(){ instance.first(); }, "ExhaustionError");
        assert.exception(function(){ instance.last(); }, "ExhaustionError");
        assert.exception(function(){ instance.concat(instance); }, "ExhaustionError");
        assert.exception(function(){ instance.filter(lang.noop); }, "ExhaustionError");
        assert.exception(function(){ instance.map(lang.noop); }, "ExhaustionError");
        assert.exception(function(){ instance.forEach(lang.noop); }, "ExhaustionError");
        assert.exception(function(){ instance.some(lang.noop); }, "ExhaustionError");
        assert.exception(function(){ instance.every(lang.noop); }, "ExhaustionError");
        assert.exception(function(){ instance.reduce(lang.noop); }, "ExhaustionError");
        assert.exception(function(){ instance.reduceRight(lang.noop); }, "ExhaustionError");
        assert.exception(function(){ instance.join(""); }, "ExhaustionError");
        assert.exception(function(){ instance.toSortedArray(); }, "ExhaustionError");
        assert.exception(function(){ instance.toReversedArray(); }, "ExhaustionError");
        assert.exception(function(){ instance.indexOf(); }, "ExhaustionError");
        assert.exception(function(){ instance.lastIndexOf(); }, "ExhaustionError");
        assert.exception(function(){ instance.parseJSON(); }, "ExhaustionError");
        return promise;
      }
    });
  };
});
