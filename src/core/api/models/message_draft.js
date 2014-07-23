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
  INMessage.call(this, inbox, id, namespaceId);
  if (data) this.update(data);
}

inherits(INDraft, INMessage);

INDraft.prototype.addRecipients = function(participants) {
  var to = this.to || (this.to = []);
  var i;
  var ii = arguments.length;
  var item;
  for (i=0; i<ii; ++i) {
    item = arguments[i];
    if (isArray(item)) {
      mergeArray(to, item, 'email');
    }
  }
  return this;
};

INDraft.prototype.uploadAttachment = function(fileNameOrFile, blobForFileName) {
  var namespace = this.namespace();
	var self = this;
  return this.promise(function(resolve, reject) {
    uploadFile(self, fileNameOrFile, blobForFileName, function(err, response) {
      if (err) {
        if (typeof err == 'string') {
          err = new Error('Cannot invoke `uploadAttachment()` on INDraft: ' + err);
        }
        return reject(err);
      }
			self.attachmentIDs.push(response.id);
      return resolve(response);
    });
  });
};

INDraft.prototype.removeAttachment = function(file) {
	if (!file) {
		throw new TypeError(
			'Cannot invoke `removeAttachment()` on INDraft: file must be a file ID or object');
	}
	var id = typeof file === 'string' ? file : file.id;
	var i;
	var ii = this.attachmentIDs.length;

	for (i=0; i<ii; ++i) {
		if (this.attachmentIDs[i] === id) {
			this.attachmentIDs.splice(i, 1);
			break;
		}
	}
	return this;
};

INDraft.prototype.markAsRead = null;

INDraft.prototype.save = function() {
	var pattern = this.isUnsynced() ? '%@/drafts' : '%@/drafts/%@';
	var url = urlFormat(pattern, this.namespaceUrl(), this.id);
	var inbox = this.inbox();
	var self = this;
	var rawJson = this.toJSON();
	return this.promise(function(resolve, reject) {
		apiRequest(inbox, 'post', url, rawJson, function(err, response) {
			if (err) return reject(err);
			// Should delete the old cached version, if any
			deleteModel(self);

			self.update(response);
			persistModel(self);
			resolve(self);
		});
	});
};

INDraft.prototype.send = function() {
	var data;
	var inbox = this.inbox();
	var url = urlFormat('%@/send', this.namespaceUrl());

	if (this.isUnsynced()) {
    // Just send a message
    data = this.raw();
    delete data.id;
    delete data.object;
    data = toJSON(data);
	} else {
		// Send using the saved ID
		data = toJSON({
			"draft_id": this.id
		});
	}

	return this.promise(function(resolve, reject) {
		apiRequest(inbox, 'post', url, data, function(err, response) {
			// TODO: update a 'state' flag indicating that the value has been saved
			if (err) return reject(err);
			resolve(response);
		});
	});
};

INDraft.prototype.dispose = function() {
	var self = this;
	return this.promise(function(resolve, reject) {
		deleteModel(self);
		if (self.isUnsynced()) {
			// Cached copy is already deleted --- just resolve.
			resolve(self);
		} else {
			apiRequest(self.inbox(), 'delete', urlFormat('%@/drafts/%@', self.namespaceUrl(), self.id),
				function(err, response) {
					if (err) return reject(err);
					resolve(self);
				});
		}
	});
};

defineResourceMapping(INDraft, {
	'thread': 'reply_to_thread',
  'object': 'const:draft'
}, INMessage);
