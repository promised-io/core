if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "compose",
  "../stream"
], function(Compose, errors){
  /**
   * stream.ExhaustiveDecorator(method) -> Compose.Decorator
   * - method (Function)
   *
   * [[Compose]] decorator to enforce producer & stream exhaustion
   **/
  return function Exhaustive(method){
    return new Compose.Decorator(function(key){
      this[key] = function(){
        if(this._exhausted){
          throw new errors.ExhaustionError;
        }

        try{
          return method.apply(this, arguments);
        }finally{
          if(typeof this.isRepeatable === "function"){
            this._exhausted = !this.isRepeatable();
          }else{
            this._exhausted = !this.isRepeatable;
          }
        }
      };
    });
  };
});
