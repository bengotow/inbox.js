var IE8_METHODS = /^(get|post|head|put|delete|options)$/i;

function XHRForMethod(method) {
  if (document.documentMode <= 8 && (method.match(IE8_METHODS) || !window.XMLHttpRequest)) {
    return new window.ActiveXObject("Microsoft.XMLHTTP");
  } else if (window.XMLHttpRequest) {
    return new window.XMLHttpRequest();
  }
  return null;
}

function XHRMaybeJSON(xhr) {
  try {
    xhr.responseType = 'json';
  } catch(e) {
    // Safari 7 does not support the 'json' responseType, but supports the
    // responseType property, which will throw if passed an unsupported
    // DOMString value.
  }
}

function XHRData(xhr, response) {
  return {
    status: xhr.status,
    statusText: xhr.statusText,
    data: response,
    headers: ParseResponseHeaders(xhr)
  };
}

function RejectXHR(cb, xhr, type) {
  return function() {
    if (!cb.cb) return;
    var callback = cb.cb;
    cb.cb = null;
    var response = null;
    if (type === 'json') {
      response = parseJSON('response' in xhr ? xhr.response : xhr.responseText);
    }
    callback(XHRData(xhr, response), null);
  };
}

function ParseResponseHeaders(xhr) {
  var headerStr = xhr.getAllResponseHeaders();
  var headers = {};
  if (!headerStr) {
    return headers;
  }
  var headerPairs = headerStr.split('\u000d\u000a');
  for (var i = 0; i < headerPairs.length; i++) {
    var headerPair = headerPairs[i];
    // Can't use split() here because it does the wrong thing
    // if the header value has the string ": " in it.
    var index = headerPair.indexOf('\u003a\u0020');
    if (index > 0) {
      var key = headerPair.substring(0, index);
      var val = headerPair.substring(index + 2);
      headers[key] = val;
    }
  }
  return headers;
}

function apiRequest(inbox, method, url, data, callback) {
  if (typeof data === 'function') {
    callback = data;
    data = null;
  } else if (typeof data !== 'string' && typeof data !== 'object') {
    data = null;
  }

  if (typeof callback !== 'function') {
    callback = noop;
  }

  var cb = {cb: callback};
  var xhr = XHRForMethod(method);

  xhr.withCredentials = inbox.withCredentials();    
  var failed = RejectXHR(cb, xhr, 'json');
  AddListeners(xhr, {
    'load': function(event) {
      if (!cb.cb) return;
      var response = parseJSON('response' in xhr ? xhr.response : xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, response);
      } else {
        callback(XHRData(xhr, response), null);
      }
    },
    // TODO: retry count depending on status?
    'error': failed,

    'abort': failed
    // TODO: timeout/progress events are useful.
  });

  XHRMaybeJSON(xhr);

  xhr.open(method, url);

  inbox.forEachRequestHeader(xhr.setRequestHeader, xhr);

  xhr.send(data);
}


function apiRequestPromise(inbox, method, url, data, callback) {
  if (typeof data === 'function') {
    callback = data;
    data = null;
  } else if (typeof data !== 'string') {
    data = null;
  }
  if (typeof callback !== 'function') {
    callback = valueFn;
  }

  return inbox.promise(function(resolve, reject) {
    apiRequest(inbox, method, url, data, function(err, value) {
      if (err) return reject(err);
      return resolve(callback(value));
    });
  });
}
