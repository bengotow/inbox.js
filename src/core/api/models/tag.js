function INTag(inbox, id, namespaceId) {
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

inherits(INTag, INModelObject);

INTag.prototype.resourcePath = function() {
  return urlFormat('%@/tags', this.namespaceId());
};

var localizedTagNames = {
  'archive': 'Archive',
  'inbox': 'Inbox',
  'unread': 'Unread',
  'sent': 'Sent',
  'starred': 'Starred'
};

INTag.prototype.name = function() {
  if (hasProperty(localizedTagNames, this.tagName)) {
    return localizedTagNames[this.tagName];
  }
  capitalizeString(this.tagName);
};

defineResourceMapping(INTag, {
  'tagName': 'name',
  'object': 'const:tag'
});
