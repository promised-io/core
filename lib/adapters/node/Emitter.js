if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "compose",
  "events"
], function(Compose, events){
  return Compose(function(){
    this._emitter = new events.EventEmitter;
    this.exports = {
      on: this.on.bind(this),
      once: this.on.bind(this)
    };
  }, {
    emit: function(){
      this._emitter.emit.apply(this._emitter, arguments);
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
