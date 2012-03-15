if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* request
*
* Module for making promise-based HTTP requests.
*
* A wrapper for [[request/request]] is exported, i.e. you can require `request`
* and use it as a function.
**/
define([
  "./request/_errors",
  "./request/request"
], function(errors, request){
  "use strict";

  var exports = function(kwargs){
    return request(kwargs);
  };
  exports.SocketTimeoutError = errors.SocketTimeoutError;

  return exports;
});
