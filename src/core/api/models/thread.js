function INThread(inbox, id, namespaceId) {
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

inherits(INThread, INModelObject);

INThread.prototype.resourcePath = function() {
  if (this.isUnsynced()) {
    return urlFormat('%@/threads', this.namespaceUrl());
  }
  return urlFormat('%@/threads/%@', this.namespaceUrl(), this.id);
};


INThread.prototype.reply = function() {
  var draft = new INDraft(this.namespace(), null);
  draft.thread = this.id;
  return draft;
};


INThread.prototype.messages = function(optionalMessagesOrFilters, filters) {
  var self = this;
  var updateMessages = null;

  if (optionalMessagesOrFilters && typeof optionalMessagesOrFilters === 'object') {
    if (isArray(optionalMessagesOrFilters)) {
      updateMessages = optionalMessagesOrFilters;
    } else {
      filters = optionalMessagesOrFilters;
    }
  }

  if (!filters || typeof filters !== 'object') {
    filters = {};
  }

  filters.thread = this.id;

  return this.promise(function(resolve, reject) {
    var url = urlFormat('%@/messages%@', self.namespaceUrl(), applyFilters(filters));
    apiRequest(self.inbox(), 'get', url, function(err, response) {
      if (err) return reject(err);
      if (updateMessages) {
        return resolve(mergeArray(updateMessages, response, 'id', function(data) {
          persistModel(data = new INMessage(self.inbox(), data));
          return data;
        }));
      }
      return resolve(map(response, function(data) {
        persistModel(data = new INMessage(self.inbox(), data));
        return data;
      }));
    });
  });
};


defineResourceMapping(INThread, {
  'subject': 'subject',
  'participants': 'array:participants',
  'lastMessageDate': 'date:last_message_timestamp',
  'messageIDs': 'array:messages',
  'draftIDs': 'array:drafts',
  'tagData': 'array:tags',
  'object': 'const:thread',
  'snippet': 'snippet'
});
