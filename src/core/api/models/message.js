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
  this.super(inbox, id, namespaceId);
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

INMessage.prototype.attachments = function() {
  var array = new Array(this.attachmentIDs.length);
  forEach(this.attachmentIDs, function(id, i) {
    array[i] = new INFile(this.inbox(), id, this.namespaceId());
  }, this);
  return array;
};

INMessage.prototype.attachment = function(indexOrId) {
  var index;
  if (typeof indexOrId === 'number') {
    index = indexOrId >>> 0;
  } else if (typeof indexOrId === 'string') {
    var i;
    var ii = this.attachmentIDs.length;
    for (i=0; i<ii; ++i) {
      if (indexOrId === this.attachmentIDs[i]) {
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

  var element = this.attachmentIDs[index];

  if (typeof element === 'undefined') {
    return null;
  }

  return new INFile(this.inbox(), element, this.namespaceId());
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
  'unread': 'bool:unread',
  'attachmentIDs': 'array:files',
  'object': 'const:message'
});
