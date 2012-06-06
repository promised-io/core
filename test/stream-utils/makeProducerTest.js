if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "../test-case",
  "../test-case/assert",
  "../test-case/refute",
  "./TestSource",
  "./Shared",
  "../../stream/_errors",
  "../../promise/defer",
  "../../promise/when",
  "../../promise/isPromise",
  "../../promise/delay",
  "../../lib/adapters!lang",
  "../../lib/adapters!timers"
], function(testCase, assert, refute, Source, Shared, errors, defer, when, isPromise, delay, lang, timers){
  "use strict";

  return function(name, klass, init){
    var instance, produce, produceError, finish, consumed, values;
    var shared = new Shared;

    return testCase(name, {
      beforeEach: function(){
        consumed = 0;
        values = [{}, {}, {}];

        var source = new Source(function(){
          consumed++;
          shared.update(instance, produce, produceError, finish, consumed, values);
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
          produceError = function(){
            source.produce(new Error("Produced error"));
          };
          finish = function(){
            while(index < values.length){
              produce();
            }
            source.finish();
          };
        }else{
          // Else we assume the returned producer has bufferred all values
          produce = produceError = finish = lang.noop;
          consumed = values.length;
        }

        shared.update(instance, produce, produceError, finish, consumed, values);
      },

      "consume": {
        "straight from source": function(){
          var lastIndex = -1;

          var promise = instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            lastIndex++;
          }).then(assert);

          finish();

          refute(promise.isFulfilled());
          return promise.then(function(){
            assert.same(lastIndex, values.length - 1);
          });
        },

        "async production": function(){
          var lastIndex = -1;
          timers.immediate(produce);

          return instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            lastIndex++;
            if(index < values.length - 1){
              timers.immediate(produce);
            }else{
              timers.immediate(finish);
            }
          }).then(assert).then(function(){
            assert.same(lastIndex, values.length - 1);
          });
        },

        "handle source errors": function(){
          var promise = instance.consume(lang.noop);

          produceError();

          refute(promise.isFulfilled());
          return promise.then(function(ok){
            // Producers that have already consumed all values can't receive
            // source errors, e.g. ArrayProducer.
            assert.same(consumed, values.length);
            assert(ok);
          }, function(error){
            assert(error.message === "Produced error");
          });
        },

        "with backpressure, consuming after production finished": function(){
          var lastIndex = -1;

          finish();

          var backpressure = false;
          return instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
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

        "with backpressure, consuming before production finished": function(){
          var lastIndex = -1;
          var backpressure = false;
          var promise = instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            lastIndex++;

            refute(backpressure);
            backpressure = true;
            return delay().then(function(){
              backpressure = false;
            });
          }).then(assert).then(function(){
            assert.same(lastIndex, values.length - 1);
          });

          finish();
          return promise;
        },

        "with backpressure, from which we continue asynchronously": function(){
          var lastIndex = -1;

          finish();

          var backpressure = false;
          var sync = false;
          return instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            lastIndex++;

            refute(backpressure);
            refute(sync);
            backpressure = true;
            var deferred = defer();
            delay().then(function(){
              backpressure = false;
              sync = true;
              deferred.resolve();
              sync = false;
            });
            return deferred.promise;
          }).then(assert).then(function(){
            assert.same(lastIndex, values.length - 1);
          });
        },

        "and stop": function(){
          var lastIndex = -1;

          finish();

          var stopped = false;
          return instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
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

        "and stop via backpressure": function(){
          var lastIndex = -1;

          finish();

          var stopped = false;
          return instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            lastIndex++;

            refute(stopped);
            if(index === 1){
              stopped = true;
              return defer().rejectLater(new errors.StopConsumption);
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
          return instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
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

        "and fail on error via backpressure": function(){
          var lastIndex = -1;

          finish();

          var failed = false;
          var error = new Error;
          return instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
            lastIndex++;

            refute(failed);
            if(index === 1){
              failed = true;
              return defer().rejectLater(error);
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
          var promise = instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            assert.same(value, values[index]);
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
        }
      },

      "repeated consumption":
        !klass.prototype.isRepeatable
        ? {
          "throws exhaustion error": function(){
            instance.consume(lang.noop);
            assert.exception(function(){
              instance.consume(function(){});
            }, "ExhaustionError");
          }
        }
        : {
          "straight from source": function(){
            var lastIndexA = -1, lastIndexB = -1;

            var promiseA = instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;
            }).then(assert);

            var promiseB = instance.consume(function(value, index){
              assert.same(index - lastIndexB, 1);
              assert.same(value, values[index]);
              lastIndexB++;
            }).then(assert);

            finish();

            refute(promiseA.isFulfilled());
            refute(promiseB.isFulfilled());

            return promiseA.then(function(){ return promiseB; }).then(function(){
              assert.same(lastIndexA, values.length - 1);
              assert.same(lastIndexB, values.length - 1);
            });
          },

          "after first finished": function(){
            var lastIndexA = -1, lastIndexB = -1;

            var promiseA = instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;
            }).then(assert);

            finish();

            refute(promiseA.isFulfilled());
            return promiseA.then(function(){
              assert.same(lastIndexA, values.length - 1);

              return instance.consume(function(value, index){
                assert.same(index - lastIndexB, 1);
                assert.same(value, values[index]);
                lastIndexB++;
              }).then(assert).then(function(){
                assert.same(lastIndexB, values.length - 1);
              });
            });
          },

          "handle source errors": function(){
              var promiseA = instance.consume(lang.noop);

              produceError();

              refute(promiseA.isFulfilled());
              return promiseA.both(function(){
                return instance.consume(lang.noop).then(function(ok){
                  // Producers that have already consumed all values can't receive
                  // source errors, e.g. ArrayProducer.
                  assert.same(consumed, values.length);
                  assert(ok);
                }, function(error){
                  assert(error.message === "Produced error");
                });
              });
            },

          "with async production": function(){
            var lastIndexA = -1, lastIndexB = -1;
            timers.immediate(produce);

            var promiseA = instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;
              if(index < values.length - 1){
                timers.immediate(produce);
              }else{
                timers.immediate(finish);
              }
            }).then(assert);

            var promiseB = instance.consume(function(value, index){
              assert.same(index - lastIndexB, 1);
              assert.same(value, values[index]);
              lastIndexB++;
            }).then(assert);

            refute(promiseA.isFulfilled());
            refute(promiseB.isFulfilled());
            return promiseA.then(function(){ return promiseB; }).then(function(){
              assert.same(lastIndexA, values.length - 1);
              assert.same(lastIndexB, values.length - 1);
            });
          },

          "with staggered consumption": function(done){
            var lastIndexA = -1, lastIndexB = -1, lastIndexC = -1;

            instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;
            }).then(assert);
            produce();

            timers.immediate(function(){
              instance.consume(function(value, index){
                assert.same(index - lastIndexB, 1);
                assert.same(value, values[index]);
                lastIndexB++;
              }).then(assert);
              produce();

              timers.immediate(function(){
                instance.consume(function(value, index){
                  assert.same(index - lastIndexC, 1);
                  assert.same(value, values[index]);
                  lastIndexC++;
                }).then(assert);
                finish();

                timers.immediate(function(){
                  assert.same(lastIndexA, values.length - 1);
                  assert.same(lastIndexB, values.length - 1);
                  assert.same(lastIndexC, values.length - 1);
                  done();
                });
              });
            });
          },

          "with backpressure from one, consuming after production finished": function(){
            var lastIndexA = -1, lastIndexB = -1;

            finish();

            instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;
            }).then(assert);

            var backpressure = false;
            return instance.consume(function(value, index){
              assert.same(index - lastIndexB, 1);
              assert.same(value, values[index]);
              lastIndexB++;

              refute(backpressure);
              backpressure = true;
              return delay().then(function(){
                assert.same(lastIndexA, values.length - 1);
                backpressure = false;
              });
            }).then(assert).then(function(){
              assert.same(lastIndexB, values.length - 1);
            });
          },
          "with backpressure from one, consuming before production finished": function(){
            var lastIndexA = -1, lastIndexB = -1;

            instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;
            }).then(assert);

            var backpressure = false;
            var promise = instance.consume(function(value, index){
              assert.same(index - lastIndexB, 1);
              assert.same(value, values[index]);
              lastIndexB++;

              refute(backpressure);
              backpressure = true;
              return delay().then(function(){
                assert.same(lastIndexA, values.length - 1);
                backpressure = false;
              });
            }).then(assert).then(function(){
              assert.same(lastIndexB, values.length - 1);
            });

            finish();
            return promise;
          },

          "with backpressure after first consuming all": function(){
            var promise = instance.consume(lang.noop).then(assert).then(function(){
              var backpressure = false;
              var lastIndex = -1;
              return instance.consume(function(value, index){
                assert.same(index - lastIndex, 1);
                assert.same(value, values[index]);
                lastIndex++;

                refute(backpressure);
                backpressure = true;
                return delay().then(function(){
                  backpressure = false;
                });
              }).then(assert).then(function(){
                assert.same(lastIndex, values.length - 1);
              });
            });
            finish();
            return promise;
          },

          "with one stopping": function(){
            var lastIndexA = -1, lastIndexB = -1;

            finish();

            var stopped = false;
            instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;

              refute(stopped);
              if(index === 1){
                stopped = true;
                throw new errors.StopConsumption;
              }
            }).then(refute);

            return instance.consume(function(value, index){
              assert.same(index - lastIndexB, 1);
              assert.same(value, values[index]);
              lastIndexB++;

              if(stopped){
                assert.same(lastIndexA, 1);
              }
            }).then(assert).then(function(){
              assert(stopped);
              assert.same(lastIndexB, values.length - 1);
            });
          },

          "with one failing": function(){
            var lastIndexA = -1, lastIndexB = -1;

            finish();

            var failed = false;
            instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;

              refute(failed);
              if(index === 1){
                failed = true;
                throw new Error;
              }
            });

            return instance.consume(function(value, index){
              assert.same(index - lastIndexB, 1);
              assert.same(value, values[index]);
              lastIndexB++;

              if(failed){
                assert.same(lastIndexA, 1);
              }
            }).then(assert).then(function(){
              assert(failed);
              assert.same(lastIndexB, values.length - 1);
            });
          },

          "with one canceled": function(){
            var lastIndexA = -1, lastIndexB = -1;

            finish();

            var canceled = false;
            var promise = instance.consume(function(value, index){
              assert.same(index - lastIndexA, 1);
              assert.same(value, values[index]);
              lastIndexA++;

              refute(canceled);
              if(index === 1){
                canceled = true;
                promise.cancel();
              }
            });

            return instance.consume(function(value, index){
              assert.same(index - lastIndexB, 1);
              assert.same(value, values[index]);
              lastIndexB++;

              if(canceled){
                assert.same(lastIndexA, 1);
              }
            }).then(assert).then(function(){
              assert(canceled);
              assert.same(lastIndexB, values.length - 1);
            });
          }
      },

      // bufferAll() makes no sense for a non-repeatable producer
      "bufferAll": !klass.prototype.isRepeatable || !klass.prototype.bufferAll ? testCase.Skip : {
        "returns promise": function(){
          assert(isPromise(instance.bufferAll()));
        },

        "does indeed buffer all": function(){
          var bufferPromise = instance.bufferAll();

          var promise = instance.consume(function(){
            // After the first value has been produced we provide backpressure
            // to wait until all values have been buffered.
            return bufferPromise.then(function(){
              assert.same(consumed, values.length);
            });
          });

          finish();
          return promise;
        },

        "needs to be restarted after cancelation": function(){
          var startConsumption = consumed;
          finish();
          instance.bufferAll().cancel();
          assert.same(consumed, startConsumption);
          return instance.bufferAll().then(function(){
            assert.same(consumed, values.length);
          });
        }
      },

      "toArray": !klass.prototype.toArray ? testCase.Skip : shared.tests.toArray,
      "length": !klass.prototype.length ? testCase.Skip : shared.tests.length,
      "get": !klass.prototype.get ? testCase.Skip : shared.tests.get,
      "last": !klass.prototype.last ? testCase.Skip : shared.tests.last,
      "indexOf": !klass.prototype.indexOf ? testCase.Skip : shared.tests.indexOf,
      "lastIndexOf": !klass.prototype.lastIndexOf ? testCase.Skip : shared.tests.lastIndexOf
    });
  };
});
