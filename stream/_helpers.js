if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "exports",
  "./_errors",
  "../promise/asap",
  "../lib/adapters!lang"
], function(exports, errors, asap, lang){
  "use strict";

  exports.get = function(producer, index){
    var result;
    return producer.consume(function(value, valueIndex){
      if(valueIndex === index){
        result = value;
        throw new errors.StopConsumption;
      }
    }).then(function(done){
      if(done){
        throw new RangeError("No value at index");
      }else{
        return result;
      }
    });
  };

  exports.indexOf = function(producer, searchElement, fromIndex){
    if(fromIndex < 0){
      return asap(producer.toArray(), function(array){
        return lang.indexOf(array, searchElement, fromIndex);
      });
    }

    var result = -1;
    return producer.consume(function(value, index){
      if(value === searchElement && index >= fromIndex){
        result = index;
        throw new errors.StopConsumption;
      }
    }).then(function(){
      return result;
    });
  };

  exports.lastIndexOf = function(producer, searchElement, fromIndex){
    return asap(producer.toArray(), function(array){
      return lang.lastIndexOf(array, searchElement, fromIndex);
    });
  };
});
