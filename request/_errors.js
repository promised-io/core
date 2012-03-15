if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "exports",
  "../lib/errorFactory"
], function(exports, errorFactory){
  /**
  * class request.SocketTimeoutError
  *
  * The underlying request socket has timed out.
  **/
  exports.SocketTimeoutError = errorFactory("SocketTimeoutError", "Socket timed out.");
});