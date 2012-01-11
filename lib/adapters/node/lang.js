if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(function(require, exports){
  exports.isArray = function(arr){
    return Array.isArray(arr);
  };

  exports.forEach = function(arr, cb, scope){
    return arr.forEach(cb, scope);
  };

  exports.map = function(arr, cb, scope){
    return arr.map(cb, scope);
  };

  exports.some = function(arr, cb, scope){
    return arr.some(cb, scope);
  };

  exports.forIn = function(obj, cb, scope){
    Object.keys(obj).forEach(function(key){
      cb.call(scope, obj[key], key);
    });
  };

  exports.freezeObject = function(obj){
    Object.freeze && Object.freeze(obj);
  };
});
