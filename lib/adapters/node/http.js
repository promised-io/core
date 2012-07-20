if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "exports",
  "http",
  "https",
  "url",
  "querystring",
  "../../../request/_errors",
  "../../../promise/defer",
  "../../../promise/call",
  "promised-io/node-stream/Stream",
  "./lang"
], function(exports, http, https, url, querystring, errors, defer, call, Stream, lang){
  "use strict";

  var HANDLERS = {
    "http:": http,
    "https:": https
  };
  var EXPECT_CONTINUE = /^100-continue(;|$)/;

  exports.normalizeOptions = function(kwargs){
    if(typeof kwargs === "string"){
      kwargs = { href: kwargs };
    }else if(!kwargs){
      kwargs = {};
    }
    var options = {};

    options.method = "method" in kwargs ? kwargs.method.toUpperCase() : "GET";
    options.headers = "headers" in kwargs ? exports.normalizeHeaders(kwargs.headers) : {};

    if("href" in kwargs){
      var parsed = url.parse(kwargs.href);
      options.protocol = parsed.protocol;
      if("auth" in parsed){ options.auth = parsed.auth; }
      options.hostname = parsed.hostname;
      if("port" in parsed){ options.port = parsed.port; }
      options.pathname = parsed.pathname;
      if(parsed.query){ options.query = parsed.query; }
    }else{
      if("protocol" in kwargs){ options.protocol = kwargs.protocol; }
      if("host" in kwargs){
        options.host = kwargs.host;
      }else{
        if("auth" in kwargs){ options.auth = kwargs.auth; }
        if("hostname" in kwargs){ options.hostname = kwargs.hostname; }
        if("port" in kwargs){ options.port = kwargs.port; }
      }
      options.pathname = "pathname" in kwargs ? kwargs.pathname : "/";
      if("query" in kwargs){ options.query = kwargs.query; }
    }

    if("form" in kwargs){
      options.form = kwargs.form;
      if(!options.headers["content-type"]){
        options.headers["content-type"] = "application/x-www-form-urlencoded; charset=utf-8";
      }
    }else if("json" in kwargs){
      options.json = kwargs.json;
      if(!options.headers["content-type"]){
        options.headers["content-type"] = "application/json; charset=utf-8";
      }
    }else if("body" in kwargs){
      options.body = kwargs.body;
    }

    if("timeout" in kwargs){ options.timeout = kwargs.timeout; }

    if("socketPath" in kwargs){ options.socketPath = kwargs.socketPath; }
    if("agent" in kwargs){ options.agent = kwargs.agent; }
    if("socketOptions" in kwargs){ options.socketOptions = kwargs.socketOptions; }

    if("key" in kwargs){ options.key = kwargs; }
    if("passphrase" in kwargs){ options.passphrase = kwargs.passphrase; }
    if("cert" in kwargs){ options.cert = kwargs.cert; }
    if("ca" in kwargs){ options.ca = kwargs.ca; }
    options.rejectUnauthorized = kwargs.rejectUnauthorized === false ? false : true;

    if(options.protocol === "http"){
      options.protocol = "http:";
    }else if(options.protocol === "https"){
      options.protocol = "https:";
    }

    if(!("port" in options) && !("host" in options)){
      if(options.protocol === "http:"){
        options.port = 80;
      }else if(options.protocol === "https:"){
        options.port = 443;
      }
    }

    return options;
  };

  exports.formatHref = function(options){
    var formatArgs = {
      protocol: options.protocol,
      host: options.host,
      hostname: options.hostname,
      pathname: options.pathname,
      search: options.query
    };
    if(options.port && options.protocol === "http:" && options.port !== 80 || options.protocol === "https:" && options.port !== 443 || options.protocol !== "http:" && options.protocol !== "https:"){
      formatArgs.port = options.port;
    }
    return url.format(formatArgs);
  };

  exports.normalizeHeaders = function(headers){
    return Object.keys(headers).reduce(function(normalized, name){
      normalized[name.toLowerCase()] = headers[name];
      return normalized;
    }, {});
  };

  exports.request = function(options){
    var deferred, req, sent;
    var body = formatBody(options);

    options.path = options.pathname;
    if(options.query){
      options.path += "?" + options.query;
    }
    if(!options.headers.hasOwnProperty("content-length")){
      if(Array.isArray(body) && body.length <= 1){
        options.headers["content-length"] = body.length ? body[0].length : 0;
      }
    }
    req = HANDLERS[options.protocol].request(options);
    deferred = defer(function(reason){
      return abortRequest(deferred, req, reason, true);
    });

    if(options.socketOptions){
      if("timeout" in options.socketOptions){
        req.setTimeout(options.socketOptions.timeout);
      }
      if("noDelay" in options.socketOptions){
        req.setNoDelay(options.socketOptions.noDelay);
      }
      if("keepAlive" in options.socketOptions){
        var initialDelay = options.socketOptions.keepAlive;
        req.setKeepAlive(initialDelay >= 0, initialDelay || 0);
      }
    }

    if(options.timeout){
      deferred.timeout(options.timeout);
    }

    req.on("socket", function(){
      deferred.progress("socket");
    });
    req.on("response", function(res){
      processResponse(deferred, res);
    });
    req.on("error", function(error){
      deferred.reject(error);
      sent && sent.cancel && sent.cancel(error);
    });
    req.on("timeout", function(){
      var error = new errors.SocketTimeoutError;
      deferred.reject(error);
      sent && sent.cancel && sent.cancel(error);
    });

    if("form" in options || "json" in options || "body" in options){
      if(EXPECT_CONTINUE.test(options.headers.expect)){
        sent = defer();
        req.once("continue", function(){
          if(!sent.isFulfilled()){
            sent = sendBody(deferred, req, body);
          }
        });
      }else{
        sendBody(deferred, req, body);
      }
    }else{
      req.end();
    }

    return deferred.promise;
  };

  function abortRequest(deferred, req, reason, isCanceling){
    if(!deferred.isFulfilled()){
      req.abort();
      if(!isCanceling){
        deferred.reject(reason);
        return undefined;
      }else{
        return reason;
      }
    }
  }

  function processResponse(deferred, res){
    deferred.resolve({
      status: res.statusCode,
      headers: res.headers,
      body: new Stream(res)
    });
  }

  function formatBody(options){
    var body = [];
    if("form" in options){
      return [querystring.stringify(options.form)];
    }else if("json" in options){
      return [JSON.stringify(options.json)];
    }else if("body" in options){
      return options.body;
    }else{
      return [];
    }
  }

  function sendBody(deferred, req, body){
    var promise;
    if(typeof body.pipe === "function"){
      promise = call(body.pipe, body, req);
    }else if(typeof body.forEach === "function"){
      promise = call(body.forEach, body, function(chunk){ req.write(chunk); });
    }else if(typeof body.join === "function"){
      promise = call(body.join, body, "").then(req.write.bind(req));
    }
    return promise.then(function(){ req.end(); }, function(error){ abortRequest(deferred, req, error, false); });
  }
});
