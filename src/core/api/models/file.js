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
  this.super(inbox, id, namespaceId);
  if (data) this.update(data);
}

inherits(INFile, INModelObject);

INFile.prototype.resourcePath = function() {
  if (this.isUnsynced()) {
    return urlFormat('%@/files', this.namespaceUrl());
  }
  return urlFormat('%@/files/%@', this.namespaceUrl(), this.id);
};


INFile.prototype.downloadUrl = function() {
  if (!this.isUnsynced()) {
    return urlFormat('%@/files/%@/download', this.namespaceId(), this.id);
  }
  return null;
};


defineResourceMapping(INFile, {
  'filename': 'filename',
  'mimetype': 'mimetype',
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

    callback(null, makeFile(response));

    function makeFile(item) {
      item = new INFile(namespace, item);
      persistModel(item);
      return item;
    }
  });
}
