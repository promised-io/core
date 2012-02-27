if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "compose",
  "events",
  "./timers"
], function(Compose, events, timers){
  return Compose(function(){
    this._emitter = new events.EventEmitter;
    this.exports = {
      on: this.on.bind(this),
      once: this.on.bind(this)
    };
  }, {
    _emit: function(args){
      this._emitter.emit.apply(this._emitter, args);
    },

    emit: function(){
      this._emit(arguments);
    },

    emitAsync: function(){
      timers.immediate(this._emit.bind(this, arguments));
    },

    on: function(name, listener){
      this._emitter.on(name, listener);
      return {
        remove: function(){
          this._emitter.removeListener(name, listener);
        }.bind(this)
      };
    },

    once: function(name, listener){
      this._emitter.once(name, listener);
      return {
        remove: function(){
          this._emitter.removeListener(name, listener);
        }.bind(this)
      };
    }
  });
});
