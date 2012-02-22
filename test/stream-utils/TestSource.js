if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "compose",
  "../../stream/_errors",
  "../../stream/Producer",
  "../../promise/defer",
  "../../promise/when",
  "../../promise/isPromise",
  "../../lib/adapters!lang",
  "../../lib/adapters!timers"
], function(Compose, errors, Producer, defer, when, isPromise, lang, timers){
  "use strict";

  return Compose(Producer, function(onConsumption){
    this._onConsumption = onConsumption;
    this._buffer = [];
    this._index = 0;
  }, {
    produce: function(value){
      if(this._finished){
        throw new Error("Already finished");
      }

      this._buffer.push(value);
      this._update();
    },

    finish: function(){
      if(this._finished){
        throw new Error("Already finished");
      }

      this._finished = true;
      this._update();
    },

    consume: function(callback){
      this.consume = function(){ throw new errors.ExhaustionError; };

      this._deferred = defer(lang.bind(this._abort, this));
      this._callback = callback;
      this._paused = true;
      timers.immediate(lang.bind(this._resume, this));
      // if(this._buffer.length > this._index){
      //   this._send();
      // }else if(this._finished){
      //   this._deferred.resolveLater(true);
      // }
      return this._deferred.promise;
    },

    _send: function(){
      var index = this._index;
      var value = this._buffer[this._index++];

      try{
        var backpressure = this._callback.call(lang.undefinedThis, value, index);
        this._onConsumption(null, backpressure);
        if(isPromise(backpressure)){
          this._paused = true;
          when(backpressure).change(true).inflect(lang.bind(function(error, ok){
            if(this._aborted){
              return;
            }

            if(ok){
              timers.immediate(lang.bind(this._resume, this));
            }else if(error instanceof errors.StopConsumption){
              this._deferred.resolve(false);
            }else{
              this._deferred.reject(error);
            }
          }, this));
        }else{
          this._update();
        }
      }catch(error){
        this._onConsumption(error);
        if(error instanceof errors.StopConsumption){
          this._deferred.resolve(false);
        }else{
          this._deferred.reject(error);
        }
      }
    },

    _update: function(){
      if(!this._callback || this._aborted || this._paused){
        return;
      }

      if(this._buffer.length > this._index){
        this._send();
      }else if(this._finished){
        this._deferred.resolve(true);
      }
    },

    _abort: function(){
      this._aborted = true;
    },

    _resume: function(){
      this._paused = false;
      this._update();
    }
  });
});
