if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["./_base", "require"], function(base, require){
  "use strict";

  // FIXME: Proper hostenv detection
  base.adapter = "node";
  // Override load plugin to use synchronous require in Node
  base.load = function(id, parentRequire, loaded){
    loaded(require(id));
  };
  return base;
});
