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
