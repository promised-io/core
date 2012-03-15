if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "exports",
  "querystring"
], function(exports, querystring){
  "use strict";

  var slice = [].slice;
  var bind = Function.prototype.bind;

  var undefinedThis = exports.undefinedThis = (function(){
    return this;
  })();

  exports.noop = function(){};

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

  exports.indexOf = function(arr, searchElement, fromIndex){
    return arr.indexOf(searchElement, fromIndex);
  };

  exports.lastIndexOf = function(arr, searchElement, fromIndex){
    return arr.lastIndexOf(searchElement, fromIndex);
  };

  exports.freezeObject = function(obj){
    Object.freeze && Object.freeze(obj);
  };

  exports.bind = function(func, thisObject){
    return bind.apply(func, slice.call(arguments, 1));
  };

  exports.curry = function(func){
    var args = slice.call(arguments);
    args[0] = undefinedThis;
    return bind.apply(func, args);
  };

  exports.parseJSON = function(str){
    return JSON.parse(str);
  };

  exports.parseForm = function(str){
    return querystring.parse(str);
  };
});
