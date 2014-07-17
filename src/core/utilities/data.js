function valueFn(obj) {
  return obj;
}

function noop() {}

function merge(dest, src) {
  var key;
  var a;
  var b;
  for (key in src) {
    if (key !== '_' && src.hasOwnProperty(key)) {
      b = src[key];
      if (dest.hasOwnProperty(key)) {
        a = dest[key];
        if (typeof a === 'object' && typeof b === 'object') {
          var start = a ? (isArray(a) ? [] : {}) : null;
          dest[key] = merge(merge(start, a), b);
          continue;
        }
        dest[key] = b;
      } else {
        dest[key] = b;
      }
    }
  }
  return dest;
}

// Combine oldArray and newArray, by removing items from oldArray (identified by 'id') which are not
// in the newArray --- The arrays are expected to be arrays of Objects.
function mergeArray(oldArray, newArray, id, newCallback) {
  var objects = {};
  var seen = {};
  var numOld = 0;
  var numSeen = 0;
  var numNew = 0;
  var toRemove;
  var callback = typeof newCallback === 'function' && newCallback;
  var i, ii, obj, oldObj;
  var oldLength = oldArray.length;
  for (i=0, ii=oldLength; i<ii; ++i) {
    obj = oldArray[i];
    if (typeof obj === 'object' && id in obj) {
      ++numOld;
      objects[obj[id]] = obj;
    }
  }
  for (i=0, ii=newArray.length; i<ii; ++i) {
    obj = newArray[i];
    if (typeof obj === 'object' && id in obj) {
      ++numNew;
      if ((oldObj = objects[obj[id]])) {
        ++numSeen;
        merge(oldObj, obj);
        seen[obj[id]] = true;
      } else {
        if (callback) obj = callback(obj);
        objects[obj[id]] = obj;
        oldArray.push(obj);
        seen[obj[id]] = true;
      }
    }
  }
  if (numSeen < numOld) {
    // Go through and remove unseen indexes.
    for (i=oldLength; i--;) {
      obj = oldArray[i];
      if (typeof obj === 'object' && id in obj && !seen[obj[id]]) {
        oldArray.splice(i, 1);
      }
    }
  }
  return oldArray;
}

function fromArray(obj) {
  if (Array.from) return Array.from(obj);
  if (!obj || !obj.length || typeof obj.length !== 'number' || obj.length !== obj.length) return [];
  var i;
  var ii = obj.length;
  var a = new Array(ii);
  var v;
  for (i=0; i<ii; ++i) {
    v = obj[i];
    a[i] = v;
  }
  return a;
}

function forEach(collection, fn, thisArg) {
  var i, ii, key;
  if (typeof thisArg !== 'object' && typeof thisArg !== 'function') {
    thisArg = null;
  }
  if (isArray(collection)) {
    if (collection.forEach) {
      collection.forEach(fn, thisArg);
    } else {
      for (i=0, ii = collection.length; i<ii; ++i) {
        fn.call(thisArg, collection[i], i, collection);
      }
    }
  } else if (Object.getOwnPropertyNames) {
    var keys = Object.getOwnPropertyNames(collection);
    for (i=0, ii = keys.length; i<ii; ++i) {
      key = keys[i];
      fn.call(thisArg, collection[key], key, collection);
    }
  } else {
    for (key in collection) {
      if (hasOwnProperty(collection, key)) {
        fn.call(thisArg, collection[key], key, collection);
      }
    }
  }
}

function map(collection, fn, thisArg) {
  var i, ii, key, result;
  if (!collection) return;
  if (typeof collection.map === 'function') return collection.map(fn, thisArg);
  if (!isArray(collection)) return;

  if (typeof thisArg !== 'object' && typeof thisArg !== 'function') {
    thisArg = null;
  }

  result = new Array(collection.length);
  for (i=0, ii = collection.length; i<ii; ++i) {
    result[i] = fn.call(thisArg, collection[i], i, collection);
  }
  return result;
}
