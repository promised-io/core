if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(function(require, exports){
  exports.adapter = "base";

  exports.normalize = function(id){
    return "./" + exports.adapter + "/" + id;
  };

  var adapters = {};
  exports.load = function(id, parentRequire, loaded){
    if(adapters[id]){
      loaded(adapters[id]);
    }else{
      require([id], function(module){
        loaded(adapters[id] = module);
      });
    }
  };
});
