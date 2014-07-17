function INNamespace(inbox, id) {
  var data = null;
  if (id && typeof id === 'object') {
    data = id;
    id = data.id;
  }
  this.super(inbox, id, id);
  if (data) this.update(data);
}

inherits(INNamespace, INModelObject);

INNamespace.prototype.resourcePath = function() {
  if (this.isUnsynced()) {
    return urlFormat('%@/n/', this.baseUrl());
  }
  return urlFormat('%@/n/%@', this.baseUrl(), this.id);
};

defineResourceMapping(INNamespace, {
  'emailAddress': 'email_address',
  'account': 'account',
  'provider': 'provider',
  'status': 'status',
  'scope': 'scope',
  'lastSync': 'last_sync',
  'object': 'const:namespace'
});

INNamespace.prototype.thread = function(threadId) {
  var self = this;
  var inbox = this.inbox();
  var cache = inbox._.cache;
  if (!arguments.length) {
    throw new TypeError(
      "Unable to perform 'thread()' on INNamespace: missing option `threadId`.");
  } else if (typeof threadId !== 'string') {
    throw new TypeError(
      "Unable to perform 'thread()' on INNamespace: threadId must be a string.");
  }
  return this.promise(function(resolve, reject) {
    cache.get(threadId, function(err, obj) {
      if (err) return reject(err);
      if (obj) return threadReady(null, obj);
      apiRequest(inbox, 'get', urlFormat('%@/threads/%@', self.namespaceUrl(), threadId),
        threadReady);

      function threadReady(err, data) {
        if (err) return reject(err);
        cache.persist(threadId, data, noop);
        resolve(new INThread(self, data));
      }
    });
  });
};

INNamespace.prototype.threads = function(optionalThreadsOrFilters, filters) {
  var self = this;
  var inbox = this.inbox();
  var cache = inbox._.cache;
  var updateThreads = null;

  if (optionalThreadsOrFilters && typeof optionalThreadsOrFilters === 'object') {
    if (isArray(optionalThreadsOrFilters)) {
      updateThreads = optionalThreadsOrFilters;
    } else if (!filters) {
      filters = optionalThreadsOrFilters;
    }
  }
  if (filters && typeof filters !== 'object') {
    filters = null;
  }

  return this.promise(function(resolve, reject) {
    if (filters) {
      return apiRequest(inbox, 'get', urlFormat('%@/threads%@',
        self.resourcePath(), applyFilters(filters)), threadsReady);
    }

    cache.getByType('namespace', function(err, set) {
      if (err) return reject(err);
      if (set && set.length) return threadsReady(null, set);
      apiRequest(inbox, 'get', urlFormat('%@/threads',
        self.resourcePath()), threadsReady);
    });

    function threadsReady(err, set) {
      if (err) return reject(err);

      if (updateThreads) {
        return resolve(mergeArray(updateThreads, set, 'id', function(data) {
          cache.persist(data.id, data, noop);
          return new INThread(self, data);
        }));
      }

      resolve(map(set, function(item) {
        cache.persist(item.id, item, noop);
        return new INThread(self, item);
      }));
    }
  });  
};

INNamespace.prototype.uploadFile = function(fileNameOrFile, blobForFileName) {
	var self = this;
	return this.promise(function(resolve, reject) {
		uploadFiles(self, fileNameOrFile, blobForFileName, function(err, response) {
			if (err) {
				if (typeof err == 'string') {
					err = new Error('Cannot invoke `uploadFile()` on INNamespace: ' + err);
				}
				return reject(err);
			}
			return resolve(response);
		});
	});
};
