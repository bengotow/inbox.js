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
  INModelObject.call(this, inbox, id, namespaceId);
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
  var data = this.raw();
  delete data.id;
  var draft = new INDraft(this.namespace(), data);
  draft.to = data.participants;
  draft.thread = this.id;
  return draft;
};


function getter(klass, endpoint, optionalMessagesOrFilters, filters) {
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
    var url = urlFormat('%@/%@%@', self.namespaceUrl(), endpoint, applyFilters(filters));
    apiRequest(self.inbox(), 'get', url, function(err, response) {
      if (err) return reject(err);
      if (updateMessages) {
        return resolve(mergeArray(updateMessages, response, 'id', function(data) {
          persistModel(data = new klass(self.inbox(), data));
          return data;
        }));
      }
      return resolve(map(response, function(data) {
        persistModel(data = new klass(self.inbox(), data));
        return data;
      }));
    });
  });
};

INThread.prototype.updateTags = function(addTags, removeTags) {
  var self = this;
  var url = urlFormat('%@/threads/%@', this.namespaceUrl(), this.id);

  return this.promise(function(resolve, reject) {
    // modify the tags, then reload ourselves, then call the promises' success method
    apiRequestPromise(self.inbox(), 'put', url, JSON.stringify({
        "add_tags" : addTags, "remove_tags" : removeTags 
      }), function(value) {
        self.reload().then(function(){
          return resolve(self);
        }, reject);
    }, reject);
  });
}

INThread.prototype.addTags = function(tags) {
  return this.updateTags(tags, []);
};

INThread.prototype.removeTags = function(tags) {
  return this.updateTags([], tags);
};

INThread.prototype.hasTag = function(tag) {
  for(i = 0; i < this.tagData.length; i++)
    if ((this.tagData[i].tagName == tag) || (this.tagData[i].name == tag))
      return true;
  return false;
};

INThread.prototype.messages = function(optionalMessagesOrFilters, filters) {
  return getter.call(this, INMessage, 'messages', optionalMessagesOrFilters, filters);
};

INThread.prototype.drafts = function(optionalMessagesOrFilters, filters) {
  return getter.call(this, INDraft, 'drafts', optionalMessagesOrFilters, filters);
};

defineResourceMapping(INThread, {
  'subject': 'subject',
  'subjectDate': 'date:subject_date',
  'participants': 'array:participants',
  'lastMessageDate': 'date:last_message_timestamp',
  'messageIDs': 'array:messages',
  'draftIDs': 'array:drafts',
  'tagData': 'array:tags',
  'object': 'const:thread',
  'snippet': 'snippet'
});
