function INMessage(inbox, id, namespaceId) {
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

inherits(INMessage, INModelObject);

INMessage.prototype.resourcePath = function() {
  if (!this.isUnsynced()) {
    return urlFormat('%@/messages/%@', this.namespaceUrl(), this.id);
  }
  return urlFormat('%@/messages', this.namespaceUrl());
};

INMessage.prototype.thread = function() {
  if (!this.threadID) {
    return null;
  }

  return new INThread(this.inbox(), this.threadID, this.namespaceId());
};

INMessage.prototype.reply = function() {
  var draft = this.thread().reply();
  draft.addRecipients(this.from, this.to);
  return draft;
};


INMessage.prototype.attachments = function() {
  var self = this;
  var filters = {};
  return this.promise(function(resolve, reject) {
    var url = urlFormat('%@/files%@', self.namespaceUrl(), applyFilters(filters));
    apiRequest(self.inbox(), 'get', url, function(err, response) {
      if (err) return reject(err);
      return resolve(map(response, function(data) {
        persistModel(data = new INFile(self.inbox(), data));
        return data;
      }));
    });
  });
}


INMessage.prototype.attachment = function(indexOrId) {
  var index;
  if (typeof indexOrId === 'number') {
    index = indexOrId >>> 0;
  } else if (typeof indexOrId === 'string') {
    var i;
    var ii = this.attachments.length;
    for (i=0; i<ii; ++i) {
      if (indexOrId === this.attachments[i].id) {
        index = i;
        break;
      }
    }
  } else {
    throw new TypeError(
      'Cannot invoke `attachment()` on INMessage: expected attachment index or attachment ID');
  }

  if (typeof index === 'undefined') {
    return null;
  }

  var attachment = this.attachments[index];

  if (typeof attachment === 'undefined') {
    return null;
  }

  return attachment;
};

INMessage.prototype.markAsRead = function() {
  var self = this;
  if (this.isUnsynced()) {
    return this.promise(function(resolve) {
      self.unread = false;
      resolve(self);
    });
  }
  return apiRequestPromise(this.inbox(), 'put', this.resourcePath(), {
    unread: false
  }, function(value) {
    self.update(value);
    return self;
  });
};

defineResourceMapping(INMessage, {
  'subject': 'subject',
  'body': 'body',
  'threadID': 'thread',
  'date': 'date:date',
  'from': 'array:from',
  'to': 'array:to',
  'cc': 'array:cc',
  'bcc': 'array:bcc',
  'unread': 'bool:unread',
  'attachments': 'array:files',
  'object': 'const:message'
});
