var isArray = (function() {
  if (typeof Array.isArray === 'function') {
    return Array.isArray;
  }
  return function(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  };
})();

function isFile(obj) {
  return obj && Object.prototype.toString.call(obj) === '[object File]';
}

var BLOB_REGEXP = /^\[object (Blob|File)\]$/;

function isBlob(obj) {
  return obj && BLOB_REGEXP.test(Object.prototype.toString.call(obj));
}
