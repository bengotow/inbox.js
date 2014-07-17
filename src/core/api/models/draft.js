function INDraft(inbox, id, namespaceId) {
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

inherits(INDraft, INMessage);

INTag.prototype.resourcePath = function() {
  return urlFormat('%@/tags', this.namespaceId());
};

defineResourceMapping(INDraft, {
  'tagName': 'name',
  'object': 'const:tag'
});
