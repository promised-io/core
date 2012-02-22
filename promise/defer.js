if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["./Deferred"], function(Deferred){
  "use strict";

  /**
  * promise.defer([canceler]) -> promise.Deferred
  * - canceler (Function): Function to be invoked when the deferred is canceled. The canceler receives the reason the deferred was canceled as its argument. The deferred is rejected with its return value, if any.
  *
  * Creates a new [[promise.Deferred deferred]].
  **/
  return function defer(canceler){ return new Deferred(canceler); };
});
