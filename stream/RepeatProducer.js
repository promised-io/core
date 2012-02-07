if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
 * class stream.RepeatProducer < stream.Producer
 *
 * A producer that can be consumed multiple times as it buffers its produced
 * values.
 **/
define([
  "compose",
  "./Producer",
  "../stream",
  "./_helpers",
  "../promise/defer",
  "../promise/when",
  "../promise/isPromise",
  "../lib/adapters!lang",
  "../lib/adapters!timers"
], function(Compose, Producer, errors, helpers, defer, when, isPromise, lang, timers){
  "use strict";

  // Private abstraction for consumers that can be paused & finished
  // separately from the producer.
  var Consumer = Compose(function(callback, resumeCallback){
    this._callback = callback;
    this._resumeCallback = lang.curry(resumeCallback, this);

    var deferred = defer();
    this.promise = deferred.promise;
    this.resolve = deferred.resolve;
    this.reject = deferred.reject;

    // Whenever the deferred is fulfilled, finish the consumer.
    deferred.promise.both(lang.bind(this.finish, this));
  }, {
    paused: false,
    finished: false,
    resumeAt: 0,

    isActive: function(){
      return !this.paused && !this.finished;
    },

    isWaiting: function(){
      return this.paused && !this.finished;
    },

    finish: function(){
      this.finished = true;
      this.paused = false;
    },

    pause: function(resumeAt, backpressure){
      this.paused = true;
      this.resumeAt = resumeAt;
      when(backpressure).change(true).inflect(lang.bind(this._handleRelief, this));
    },

    _handleRelief: function(error, ok){
      if(this.finished){
        return;
      }

      if(ok){
        timers.immediate(this._resumeCallback);
      }else if(error instanceof errors.StopConsumption){
        this.resolve(false);
      }else{
        this.reject(error);
      }
    },

    resume: function(){
      this.paused = false;
    },

    notify: function(value, index){
      try{
        var backpressure = this._callback.call(lang.undefinedThis, value, index);
        if(isPromise(backpressure)){
          this.pause(index + 1, backpressure);
        }
      }catch(error){
        if(error instanceof errors.StopConsumption){
          this.resolve(false);
        }else{
          this.reject(error);
        }
      }
    }
  });

  /**
   * new stream.RepeatProducer(source)
   * - source (stream.Producer): The source producer, does not have to be a [[stream.Producer]] as long as it implements the same API
   *
   * Construct a repeat producer out of another producer.
   **/
  return Producer.extend(function(source){
    this._source = source;
    this._values = [];
    this._activeConsumers = [];
    this._resumeCallback = lang.bind(this._resumeFromCache, this);
  }, {
    _consuming: false,
    _finished: false,

    isRepeatable: true,

    consume: function(callback){
      var consumer = new Consumer(callback, this._resumeCallback);
      timers.immediate(lang.bind(this._startConsumer, this, consumer));
      return consumer.promise;
    },

    /**
     * stream.RepeatProducer#bufferAll() -> promise.Promise
     *
     * Ensure the producer buffers all values to be repeated by subsequent
     * `consume()` calls.
     **/
    bufferAll: function(){
      if(this._bufferAll && !this._bufferAll.isRejected()){
        return this._bufferAll;
      }

      if(this._finished){
        return this._bufferAll = defer().resolve(true);
      }

      return this._bufferAll = this.consume(lang.noop);
    },

    /**
     * stream.RepeatProducer#toArray() -> Array | promise.Promise
     *
     * Return a regular `Array` for the produced values.
     **/
    toArray: function(){
      if(this._finished){
        return this._values.slice();
      }

      return this.bufferAll().then(lang.bind(this.toArray, this));
    },

    /**
     * stream.RepeatProducer#length() -> Number | promise.Promise
     *
     * Determine the number of values that can be produced.
     **/
    length: function(){
      if(this._finished){
        return this._values.length;
      }

      return this.bufferAll().then(lang.bind(this.length, this));
    },

    /**
     * stream.RepeatProducer#get(index) -> value | promise.Promise
     * - index (Number)
     *
     * Optimized function to get a value at a particular index. Only returns
     * a promise if the value has not yet been produced. Returns a promise that
     * is rejected with a `RangeError` if no value exists at the given index.
     **/
    get: function(index){
      if(index < this._values.length){
        return this._values[index];
      }else if(this._finished){
        return defer().reject(new RangeError("No value at index"));
      }

      return helpers.get(this, index);
    },

    /**
     * stream.RepeatProducer#last() -> value | promise.Promise
     *
     * Returns the last value produced. Only returns a promise if production
     * hasn't finished. Returns a promise that is rejected with a `RangeError`
     * if no values were produced.
     **/
    last: function(){
      if(this._finished){
        if(this._values.length){
          return this._values[this._values.length - 1];
        }else{
          return defer().reject(new RangeError("No values produced"));
        }
      }

      return this.bufferAll().then(lang.bind(this.last, this));
    },

    /**
     * stream.RepeatProducer#indexOf(searchElement[, fromIndex]) -> Number | promise.Promise
     * - searchElement (?)
     * - fromIndex (Number)
     *
     * Try to find the `searchElement` in the produced values.
     **/
    indexOf: function(searchElement, fromIndex){
      fromIndex = Number(fromIndex) || 0;

      if(this._finished){
        return lang.indexOf(this._values, searchElement, fromIndex);
      }

      return helpers.indexOf(this, searchElement, fromIndex);
    },

    /**
     * stream.RepeatProducer#lastIndexOf(searchElement[, fromIndex]) -> Number | promise.Promise
     * - searchElement (?)
     * - fromIndex (Number)
     *
     * Try to find the `searchElement` in the produced values.
     **/
    lastIndexOf: function(searchElement, fromIndex){
      fromIndex = Number(fromIndex);
      if(fromIndex !== 0 && !fromIndex){
        fromIndex = Infinity;
      }

      if(this._finished){
        return lang.lastIndexOf(this._values, searchElement, fromIndex);
      }

      return helpers.lastIndexOf(this, searchElement, fromIndex);
    },

    _startConsumer: function(consumer){
      if(this._consuming || this._finished){
        this._resumeFromCache(consumer);
      }else{
        this._consumeFromSource(consumer);
      }
    },

    _consumeFromSource: function(consumer){
      this._consuming = true;
      this._activeConsumers.push(consumer);

      var finished = this._source.consume(lang.bind(this._notify, this));
      when(finished).change(true).inflect(lang.bind(this._finish, this));
    },

    _resumeFromCache: function(consumer){
      consumer.resume();

      var cacheSize = this._values.length;
      var index = consumer.resumeAt;
      for(; index < cacheSize && consumer.isActive(); index++){
        consumer.notify(this._values[index], index);
      }

      if(!consumer.isWaiting()){
        if(this._finished){
          consumer.resolve(true);
        }else{
          this._activeConsumers.push(consumer);
          if(this._backpressure){
            this._backpressure.resolve();
            this._backpressure = null;
          }
        }
      }
    },

    _notify: function(value, index){
      // We shouldn't assume backpressure is respected by the source, so
      // initialize to our current backpressure state.
      var backpressure = this._backpressure;

      // Cache the value so we can repeat it in the future.
      this._values[index] = value;

      // Notify all consumers and keep the list of active consumers up to date.
      // Note that we keep the same array and we can keep going even if new
      // consumers are added during the iteration.
      var consumer;
      var consumerIndex = 0;
      while((consumer = this._activeConsumers[consumerIndex])){
        if(consumer.isActive()){
          consumer.notify(value, index);
          backpressure = backpressure && consumer.isWaiting();
        }
        // Notification can change the active state of the consumer, hence
        // the double check.
        if(consumer.isActive()){
          consumerIndex++;
        }else{
          this._activeConsumers.splice(consumerIndex, 1);
        }
      }

      if(backpressure){
        return (this._backpressure = this._backpressure || defer()).promise;
      }
    },

    _finish: function(error, ok){
      this._finished = true;

      lang.forEach(this._activeConsumers, function(consumer){
        if(consumer.isActive()){
          if(ok){
            consumer.resolve(true);
          }else{
            consumer.reject(error);
          }
        }
      });
      this._activeConsumers = [];
    }
  });
});
