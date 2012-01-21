if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(function(require, exports){
  exports.isArray = function(arr){
    return Array.isArray(arr);
  };

  exports.forEach = function(arr, callback, thisObject){
    return arr.forEach(callback, thisObject);
  };

  exports.map = function(arr, callback, thisObject){
    return arr.map(callback, thisObject);
  };

  exports.some = function(arr, callback, thisObject){
    return arr.some(callback, thisObject);
  };

  exports.forIn = function(obj, callback, thisObject){
    Object.keys(obj).forEach(function(key){
      callback.call(thisObject, obj[key], key);
    });
  };

  exports.freezeObject = function(obj){
    Object.freeze && Object.freeze(obj);
  };
});
