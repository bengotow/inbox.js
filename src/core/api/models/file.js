function INFile(inbox, id, namespaceId) {
  var namespace;
  if (inbox instanceof INNamespace) {
    namespace = inbox;
    inbox = namespace.inbox();
    namespaceId = namespace.id;
  }
  var data = null;
  if (id && typeof id === 'object') {
    data = id;
    id = data.id;
    namespaceId = data.namespace || data.namespaceId;
  }
  INModelObject.call(this, inbox, id, namespaceId);
  if (data) this.update(data);
}

inherits(INFile, INModelObject);

INFile.prototype.resourcePath = function() {
  if (this.isUnsynced()) {
    return urlFormat('%@/files', this.namespaceUrl());
  }
  return urlFormat('%@/files/%@', this.namespaceUrl(), this.id);
};


INFile.prototype.download = function() {
  var inbox = this.namespace().inbox();
  var url = urlFormat('%@/files/%@/download', this.namespaceUrl(), this.id);

  var filename = this.filename || this.id;
  var content_type = this.contentType || "text/plain;charset=utf-8";
  return this.promise(function(resolve, reject) {
    apiRequestData(inbox, 'get', url, function(err, response) {
      if (err) reject(err);
      else {
        var blob = new Blob([response], {type: content_type});
        resolve({
          // Sadly, the File constructor isn't very useful yet --- but File is specifically designed
          // to bundle this metadata with a Blob. Hopefully in 2015 it would be suitable to
          // update this API to just return a new File instead.
          filename: filename,
          blob: blob
        });
      }
    });
  });
};


defineResourceMapping(INFile, {
  'filename': 'filename',
  'contentType': 'content_type',
  'size': 'int:size',
  'messageID': 'message',
  'isEmbedded': 'bool:is_embedded',
  'object': 'const:file'
});


function uploadFile(namespace, fileOrFileName, fileDataOrCallback, callback) {
  if (typeof callback !== 'function') {
    callback = fileDataOrCallback;
    fileDataOrCallback = null;
  }

  var inbox = namespace.inbox();
  var url = urlFormat('%@/files/', namespace.namespaceUrl());
  var data = new window.FormData();
  if (isFile(fileOrFileName)) {
    data.append('file', fileOrFileName);
  } else if (typeof fileOrFileName === 'string' && isBlob(fileDataOrCallback)) {
    data.append('file', fileDataOrCallback, fileOrFileName);
  } else {
    return callback('not a file', null);
  }

  apiRequest(inbox, 'post', url, data, function(err, response) {
    if (err) return callback(err, null);

    var i = 0;
    for(i = 0; i < response.length; i++)
    {
      callback(null, makeFile(response[i]));
    }

    function makeFile(item) {
      item = new INFile(namespace, item);
      //TODO: enable this when it works. -cg3
      //persistModel(item);
      return item;
    }
  });
}
