if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["compose"], function(Compose){
  return function(name, defaultMessage){
    return Compose(Error, function(message){
      Error.captureStackTrace(this, arguments.callee);
      this.message = message || defaultMessage;
      this.name = name;
    });
  };
});
