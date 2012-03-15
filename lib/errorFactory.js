if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["compose"], function(Compose){
  "use strict";

  return function(name, defaultMessage, Base){
    var ctor = Compose(Base || Error, function(message){
      Error.captureStackTrace(this, ctor);
      this.message = message || defaultMessage;
      this.name = name;
    });
    return ctor;
  };
});
