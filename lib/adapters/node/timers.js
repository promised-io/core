if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(function(require, exports){
  exports.immediate = function(cb){
    process.nextTick(cb);
  };

  exports.set = function(cb, ms){
    return setTimeout(cb, ms);
  };

  exports.clear = function(timer){
    clearTimeout(timer);
  };
});
