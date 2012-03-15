if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* class stream.Stream
*
* Promised-based API for consuming streaming data.
**/
define([
  "compose",
  "./_errors",
  "./ExhaustiveDecorator",
  "./_helpers",
  "./Producer",
  "./RepeatProducer",
  "./ArrayProducer",
  "../promise/defer",
  "../promise/when",
  "../promise/later",
  "../promise/asap",
  "../promise/seq",
  "../lib/adapters!lang"
], function(Compose, errors, Exhaustive, helpers, Producer, RepeatProducer, ArrayProducer, defer, when, later, asap, seq, lang){
  "use strict";

  /**
  * new stream.Stream(source)
  * - source (stream.Producer | Array): The source producer, does not have to be a [[stream.Producer]] as long as it implements the same API.
  *
  * Construct a stream that consumes values from the source producer.
  * If `source` is an array a [[stream.ArrayProducer]] is created and used.
  **/
  var Stream = Compose(function(source){
    if(lang.isArray(source)){
      this._producer = new ArrayProducer(source);
    }else{
      this._producer = source;
    }
  }, {
    _exhausted: false,

    /**
    * stream.Stream#isRepeatable() -> Boolean
    *
    * Tests whether the underlying producer is repeatable.
    **/
    isRepeatable: function(){
      return this._producer.isRepeatable === true;
    },

    /**
    * stream.Stream#toRepeatableStream() -> stream.Stream
    *
    * If the stream is not repeatable, creates and returns a new repeatable
    * stream using a [[stream.RepeatProducer]] for the original stream source.
    *
    * If the stream already was repeatable returns the same stream instance.
    **/
    toRepeatableStream: Exhaustive(function(){
      if(this.isRepeatable()){
        return this;
      }
      return new this.constructor(new RepeatProducer(this._producer));
    }),

    /**
    * stream.Stream#consume(callback[, thisObject]) -> promise.Promise
    * - callback (Function): function(value, index, stream){ … }
    * - thisObject (?)
    *
    * Consume the stream. The callback follows producer semantics so can
    * provide backpressure or throw `stream.StopConsumption`.
    **/
    consume: Exhaustive(function(callback, thisObject){
      var stream = this;
      return this._producer.consume(function(value, index){
        return callback.call(thisObject, value, index, stream);
      });
    }),

    /**
    * stream.Stream#destroy()
    *
    * Destroy the underlying producer and exhausts the stream, even if the
    * stream is repeatable. Side-effects are undefined.
    **/
    destroy: function(){
      if(this._exhausted){
        throw new errors.ExhaustionError;
      }
      this._exhausted = true;
      if(typeof this._producer.destroy === "function"){
        this._producer.destroy();
      }
    },

    /**
    * stream.Stream#toArray() -> Array | promise.Promise
    *
    * Returns a regular array for the stream.
    **/
    toArray: Exhaustive(function(){
      if(typeof this._producer.toArray === "function"){
        return this._producer.toArray();
      }

      var array = [];
      return this._producer.consume(function(value, index){
        array[index] = value;
      }).change(array);
    }),

    /**
    * stream.Stream#length() -> Number | promise.Promise
    *
    * Returns the number of items in the stream.
    **/
    length: Exhaustive(function(){
      if(typeof this._producer.length === "function"){
        return this._producer.length();
      }

      var lastIndex = -1;
      return this._producer.consume(function(value, index){
        lastIndex = index;
      }).then(function(){
        return lastIndex + 1;
      });
    }),

    /**
    * stream.Stream#get(index) -> value | promise.Promise
    * - index (Number)
    *
    * Get a value at a particular index in the stream. Only returns
    * a promise if the value has not yet been produced. Throws a `RangeError`
    * if no value exists at the given index.
    **/
    get: Exhaustive(function(index){
      if(typeof this._producer.get === "function"){
        return this._producer.get(index);
      }

      return helpers.get(this, index);
    }),

    /**
    * stream.Stream#first() -> value | promise.Promise
    *
    * Returns the first item in the stream.
    **/
    first: function(){
      return this.get(0);
    },

    /**
    * stream.Stream#last() -> value | promise.Promise
    *
    * Returns the last item in the stream.
    **/
    last: Exhaustive(function(){
      if(typeof this._producer.last === "function"){
        return this._producer.last();
      }

      var notFound = {};
      var last = notFound;
      return this._producer.consume(function(value){
        last = value;
      }).then(function(){
        if(last !== notFound){
          return last;
        }else{
          throw new RangeError("No values produced");
        }
      });
    }),

    /**
    * stream.Stream#concat(args) -> stream.Stream
    *
    * Concatenate arrays, [[stream.Producer producers]] and
    * [[stream.Stream streams]] with the current stream, returning a new
    * stream.
    **/
    concat: Exhaustive(function(){
      var producers = [this._producer];
      for(var i = 0; i < arguments.length; i++){
        var value = arguments[i];
        if(lang.isArray(value)){
          producers.push(new ArrayProducer(value));
        }else if(value instanceof Producer || value instanceof Stream){
          producers.push(value);
        }else{
          throw new TypeError("Value expected to be Array, stream.Producer or stream.Stream");
        }
      }

      // FIXME: Depending on the types of producers we can create an optimized
      // producer, e.g. if all arguments are arrays we can simply concat rather
      // than creating several array producers.
      var combinedProducer = Compose.create(Producer, {
        _exhausted: false,
        isRepeatable: false,

        consume: Exhaustive(function(callback){
          var index = 0;
          return seq(lang.map(producers, function(producer){
            return function(finishedPrevious){
              if(!finishedPrevious){
                return false;
              }

              return producer.consume(function(value){
                return callback(value, index++);
              });
            };
          }), true);
        })
      });
      return new this.constructor(combinedProducer);
    }),

    /**
    * stream.Stream#filter(filterFunc, thisObject) -> stream.Stream
    * - filterFunc (Function): function(value, index, stream){ … }
    * - thisObject (?)
    *
    * Create a new, filtered stream.
    *
    * Follows array semantics, so `filterFunc()` cannot provide backpressure
    * or throw [[stream.StopConsumption]].
    **/
    filter: Exhaustive(function(filterFunc, thisObject){
      var consumeStream = lang.bind(this._producer.consume, this._producer);
      var stream = this;
      var isRepeatable = this.isRepeatable();

      var filteredProducer = Compose.create(Producer, {
        _exhausted: false,
        isRepeatable: isRepeatable,

        consume: Exhaustive(function(callback){
          var index = 0;
          return consumeStream(function(value, valueIndex){
            try{
              var passed = filterFunc.call(thisObject, value, valueIndex, stream);
            }catch(error){
              if(error instanceof errors.StopConsumption){
                throw new TypeError("filterFunc must not throw stream.StopConsumption errors");
              }
              throw error;
            }
            if(passed){
              return callback(value, index++);
            }
          });
        })
      });
      return new this.constructor(filteredProducer);
    }),

    /**
    * stream.Stream#map(mapFunc, thisObject) -> stream.Stream
    * - mapFunc (Function): function(value, index, stream){ … }
    * - thisObject (?)
    *
    * Create a new, mapped stream.
    *
    * Follows array semantics, so `mapFunc()` cannot provide backpressure
    * or throw [[stream.StopConsumption]].
    **/
    map: Exhaustive(function(mapFunc, thisObject){
      var consumeStream = lang.bind(this._producer.consume, this._producer);
      var stream = this;
      var isRepeatable = this.isRepeatable();

      var mappedProducer = Compose.create(Producer, {
        _exhausted: false,
        isRepeatable: isRepeatable,

        consume: Exhaustive(function(callback){
          var index = 0;
          return consumeStream(function(value, valueIndex){
            try{
              value = mapFunc.call(thisObject, value, valueIndex, stream);
            }catch(error){
              if(error instanceof errors.StopConsumption){
                throw new TypeError("mapFunc must not throw stream.StopConsumption errors");
              }
              throw error;
            }
            return callback(value, index++);
          });
        })
      });
      return new this.constructor(mappedProducer);
    }),

    /**
    * stream.Stream#forEach(callback, thisObject) -> promise.Promise
    * - callback (Function): function(value, index, stream){ … }
    * - thisObject (?)
    *
    * Iterate over the stream.
    *
    * Follows array semantics, so `callback()` cannot provide backpressure
    * or throw [[stream.StopConsumption]].
    **/
    forEach: function(callback, thisObject){
      return this.consume(function(value, index, stream){
        try{
          callback.call(thisObject, value, index, stream);
        }catch(error){
          if(error instanceof errors.StopConsumption){
            throw new TypeError("Callbacks must not throw stream.StopConsumption errors");
          }
          throw error;
        }
      });
    },

    /**
    * stream.Stream#some(callback, thisObject) -> promise.Promise
    * - callback (Function): function(value, index, stream){ … }
    * - thisObject (?)
    *
    * Iterate over the stream until `callback()` returns a truthy value.
    *
    * Follows array semantics, so `callback()` cannot provide backpressure
    * or throw [[stream.StopConsumption]].
    **/
    some: function(callback, thisObject){
      return this.consume(function(value, index, stream){
        try{
          var stop = callback.call(thisObject, value, index, stream);
        }catch(error){
          if(error instanceof errors.StopConsumption){
            throw new TypeError("Callbacks must not throw stream.StopConsumption errors");
          }
          throw error;
        }finally{
          if(stop){
            throw new errors.StopConsumption;
          }
        }
      });
    },

    /**
    * stream.Stream#every(callback, thisObject) -> promise.Promise
    * - callback (Function): function(value, index, stream){ … }
    * - thisObject (?)
    *
    * Iterate over the stream until `callback()` returns a falsy value.
    *
    * Follows array semantics, so `callback()` cannot provide backpressure
    * or throw [[stream.StopConsumption]].
    **/
    every: function(callback, thisObject){
      return this.consume(function(value, index, stream){
        try{
          var stop = !callback.call(thisObject, value, index, stream);
        }catch(error){
          if(error instanceof errors.StopConsumption){
            throw new TypeError("Callbacks must not throw stream.StopConsumption errors");
          }
          throw error;
        }finally{
          if(stop){
            throw new errors.StopConsumption;
          }
        }
      });
    },

    /**
    * stream.Stream#reduce(callback, initialValue) -> promise.Promise
    * - callback (Function): function(value, index, stream){ … }
    * - initialValue (?)
    *
    * Reduce the stream.
    *
    * Follows array semantics, so `callback()` cannot provide backpressure
    * or throw [[stream.StopConsumption]].
    **/
    reduce: function(callback, initialValue){
      var previousValue;
      var hasInitialValue = arguments.length > 1;
      if(hasInitialValue){
        previousValue = initialValue;
      }

      return this.forEach(function(value, index, stream){
        if(index === 0 && !hasInitialValue){
          previousValue = value;
        }else{
          previousValue = callback(previousValue, value, index, stream);
        }
      }).then(function(){
        return previousValue;
      });
    },

    /**
    * stream.Stream#reduceRight(callback, initialValue) -> promise.Promise
    * - callback (Function): function(value, index, stream){ … }
    * - initialValue (?)
    *
    * Right-reduce the stream.
    *
    * Follows array semantics, so `callback()` cannot provide backpressure
    * or throw [[stream.StopConsumption]].
    **/
    reduceRight: function(callback, initialValue){
      var previousValue;
      var hasInitialValue = arguments.length > 1;
      if(hasInitialValue){
        previousValue = initialValue;
      }

      var stream = this;
      var promise = later(this.toReversedArray(), function(array){
        var lastIndex = array.length - 1;
        lang.some(array, function(value, index){
          if(index === 0 && !hasInitialValue){
            previousValue = value;
          }else{
            try{
              previousValue = callback(previousValue, value, lastIndex - index, stream);
            }catch(error){
              if(error instanceof errors.StopConsumption){
                throw new TypeError("Callbacks must not throw stream.StopConsumption errors");
              }
              throw error;
            }
          }
          return promise.isCanceled();
        });
        return previousValue;
      });
      return promise;
    },

    /**
    * stream.Stream#join(separator) -> String | promise.Promise
    * - separator (String)
    *
    * Join each item of the stream into a string.
    **/
    join: function(separator){
      return asap(this.toArray(), function(array){
        return array.join(separator);
      });
    },

    /**
    * stream.Stream#toSortedArray(compareFunction) -> Array | promise.Promise
    * - compareFunction (Function)
    *
    * Sort the items of the stream into an array.
    **/
    toSortedArray: function(compareFunction){
      return asap(this.toArray(), function(array){
        try{
          return array.sort(compareFunction);
        }catch(error){
          return defer().reject(error);
        }
      });
    },

    /**
    * stream.Stream#toReversedArray() -> Array | promise.Promise
    *
    * Revert the items of the stream into an array.
    **/
    toReversedArray: function(){
      return asap(this.toArray(), function(array){
        return array.reverse();
      });
    },

    /**
    * stream.Stream#indexOf(searchElement[, fromIndex]) -> Number | promise.Promise
    * - searchElement (?)
    * - fromIndex (Number)
    *
    * Try to find the `searchElement` in the stream.
    **/
    indexOf: Exhaustive(function(searchElement, fromIndex){
      fromIndex = Number(fromIndex) || 0;

      if(typeof this._producer.indexOf === "function"){
        return this._producer.indexOf(searchElement, fromIndex);
      }

      return helpers.indexOf(this, searchElement, fromIndex);
    }),

    /**
    * stream.Stream#lastIndexOf(searchElement[, fromIndex]) -> Number | promise.Promise
    * - searchElement (?)
    * - fromIndex (Number)
    *
    * Try to find the `searchElement` in the stream.
    **/
    lastIndexOf: Exhaustive(function(searchElement, fromIndex){
      fromIndex = Number(fromIndex);
      if(fromIndex !== 0 && !fromIndex){
        fromIndex = Infinity;
      }

      if(typeof this._producer.lastIndexOf === "function"){
        return this._producer.lastIndexOf(searchElement, fromIndex);
      }

      return helpers.lastIndexOf(this, searchElement, fromIndex);
    }),

    /**
    * stream.Stream#parseJSON() -> promise.Promise
    *
    * Joins the stream into a string and then applies `JSON.parse`. Always
    * returns a promise so parse errors can be handled more gracefully.
    **/
    parseJSON: function(){
      return later(this.join(""), lang.parseJSON);
    },

    /**
    * stream.Stream#parseForm() -> promise.Promise
    *
    * Joins the stream into a string and then parses it as if it were
    * form-urlencoded. Always returns a promise so parse errors can be handled
    * more gracefully.
    **/
    parseForm: function(){
      return later(this.join(""), lang.parseForm);
    }
  });

  return Stream;
});
