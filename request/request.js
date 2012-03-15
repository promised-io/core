if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "../stream/Stream",
  "../lib/adapters!lang",
  "../lib/adapters!http"
], function(Stream, lang, http){
  "use strict";

  /**
  * request.request(kwargs) -> promise.Promise
  * - kwargs (Object | String): keyword arguments for making an HTTP request, or an href string
  *
  * Performs the HTTP request. If successfull the promise is resolved with an
  * object that has a `status` code, `headers` and a `body`
  * [[stream.Stream Stream]].
  *
  * Arguments:
  *
  * - `method`, HTTP method, will be uppercased. Defaults to `GET`.
  * - `headers`, Object with HTTP headers. Header names will be lowercased.
  * - `href`, if passed will be parsed and used to provide `protocol`, `auth`, `hostname`, `port`, `pathname`, and `query`. These cannot be overriden.
  * - `protocol`, accepts `http`, `http:`, `https` or `https:`.
  * - `host`, if passed will override `hostname` and `port`.
  * - `auth`, basic authentication in the form of `username:password`.
  * - `hostname`
  * - `port`
  * - `pathname`
  * - `query`
  * - `form`, a form-based request body, must be an Object. The `content-type` is automatically set to `application/x-www-form-urlencoded; charset=utf-8`, unless it was already set. Can't be used with a `GET`, `HEAD` or `DELETE` request.
  * - `json`, a JSON-based request body. Ignored if `form` is passed. The `content-type` is automatically set to `application/json; charset=utf-8`, unless it was already set. Can't be used with a `GET`, `HEAD` or `DELETE` request.
  * - `body`, the request body. Ignored if `form` or `json` is passed. Needs to have a `pipe()`, `forEach()` or `join()` method. Can't be used with a `GET`, `HEAD` or `DELETE` request.
  * - `timeout`, amount of time the request is allowed to take, in milliseconds. The promise is rejected with a [[promise.TimeoutError]] if the timeout is reached.
  *
  * Node.JS-specific arguments:
  *
  * - `socketPath`
  * - `agent`
  * - `socketOptions.timeout`, timeout on the underlying socket. If reached the promise is rejected with a [[request.SocketTimeoutError]] error.
  * - `socketOptions.noDelay`
  * - `socketOptions.keepAlive`, if >= 0 keep-alive is enabled on the socket, with the integer being the initial delay. Otherwise keep-alive is disabled.
  * - `key`
  * - `passphrase`
  * - `cert`
  * - `ca`
  * - `rejectUnauthorized`, rejects the request if the SSL certificate was not authorized. Enabled by default, pass `false` to disable.
  *
  * The Node.JS implementation will return a [[node-stream.Stream]] for the response body. It therefore depends on [[node-stream]].
  *
  * `protocol`, `host` or `hostname` and `pathname` are required arguments.
  **/
  return function(kwargs){
    var options = http.normalizeOptions(kwargs || {});

    if(options.protocol !== "http:" && options.protocol !== "https:"){
      throw new TypeError("Invalid protocol, expected 'http:' or 'https:'");
    }
    if(!options.host && !options.hostname){
      throw new TypeError("Missing host or hostname");
    }
    if(!options.host && !options.port){
      throw new TypeError("Missing host or port");
    }
    if(!options.pathname){
      throw new TypeError("Missing pathname");
    }
    if("form" in options || "json" in options || "body" in options){
      if(options.method === "GET" || options.method === "HEAD" || options.method === "DELETE"){
        throw new TypeError("Unexpected body for '" + options.method + "' method");
      }
      if("form" in options && (!options.form || typeof options.form !== "object" || lang.isArray(options.form))){
        throw new TypeError("Illegal body, expected Object form");
      }
      if("json" in options && typeof options.json === "undefined"){
        throw new TypeError("Illegal body, json can't be undefined");
      }
      if("body" in options && (!options.body || typeof options.body.pipe !== "function" || typeof options.body.forEach !== "function" || typeof options.body.join !== "function")){
        throw new TypeError("Illegal body, expected pipe, forEach or join method");
      }
    }

    return http.request(options);
  };
});
