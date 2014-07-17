function INTag(inbox, id, namespaceId) {
  if (inbox instanceof INNamespace) {
    namespaceId = inbox;
    inbox = namespaceId.inbox();
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

INTag.prototype.threads = function(optionalThreadsOrFilters, filters) {
  var namespace = this.namespace();
  var updateThreads = null;

  if (!namespace) return this.promise(function(resolve, reject) {
    reject(new Error('Cannot invoke `threads()` on INTag: not attached to a namespace.'));
  });

  if (optionalThreadsOrFilters && typeof optionalThreadsOrFilters === 'object') {
    if (isArray(optionalThreadsOrFilters)) {
      updateThreads = optionalThreadsOrFilters;
    } else {
      filters = optionalThreadsOrFilters;
    }
  }
  if (!filters || typeof filters !== 'object') {
    filters = {};
  }
  filters.tag = this.id;
  return namespace.threads(updateThreads, filters);
};

defineResourceMapping(INTag, {
  'tagName': 'name',
  'object': 'const:tag'
});
