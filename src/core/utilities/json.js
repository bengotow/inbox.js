var toJSON = (function() {
  if (window.JSON && typeof window.JSON.stringify === 'function') {
    return function(maybeJSON, replacer, indent) {
      if (typeof maybeJSON !== 'string' && typeof maybeJSON !== 'function') {
        return JSON.stringify(maybeJSON, replacer, indent);
      } else {
        return maybeJSON;
      }
    };
  } else {
    return function(maybeJSON) {
      throw new TypeError("Cannot perform 'toJSON' on " + maybeJSON + ": JSON.stringify not " +
                          "available.");
    };
  }
})();

var parseJSON = (function() {
  if (window.JSON && typeof window.JSON.parse === 'function') {
    return function(json, reviver) {
      if (typeof json === 'string') {
        if (typeof reviver !== 'function') reviver = null;
        return JSON.parse(json, reviver);
      }
      return json;
    };
  } else {
    return function(json) {
      throw new TypeError("Cannot perform 'parseJSON' on " + json + ": JSON.parse not " +
                          "available.");
    };
  }
})();
