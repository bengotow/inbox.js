function INCache(inbox, name) {
  defineProperty(this, '_', INVISIBLE, null, null, {
    inbox: inbox,
    cacheName: name || 'inbox.js'
  });
}

INCache.prototype.get = function(id, callback) {
  var name = this.cacheType || this.constructor.name || 'Cache';
  throw new Error(formatString('cannot invoke %@#get(): %@#get() is not implemented.',
    name, name));
};

INCache.prototype.getByType = function(type, callback) {
  var name = this.cacheType || this.constructor.name || 'Cache';
  throw new Error(formatString('cannot invoke %@#getByType(): %@#getByType() is not implemented.',
    name, name));
};

INCache.prototype.persist = function(id, object, callback) {
  var name = this.cacheType || this.constructor.name || 'Cache';
  throw new Error(formatString('cannot invoke %@#persist(): %@#persist() is not implemented.',
    name, name));
};

var caches = {};

defineProperty(INCache, 'register', 0, null, null, function(name, constructor) {
  if (typeof constructor !== 'function') {
    throw new TypeError('Cannot invoke `INCache#register()`: constructor is not a function.');
  }

  if (!(constructor instanceof INCache)) {
    inherits(constructor, INCache);
  }

  if (!hasProperty(constructor.prototype, 'cacheType')) {
    defineProperty(constructor.prototype, 'cacheType', INVISIBLE, null, null, name);
  } else {
    try {
      defineProperty(constructor.prototype, 'cacheType', INVISIBLE, null, null,
        '' + constructor.prototype.cacheType);
    } catch (e) {}
  }
  name = ('' + name).toLowerCase();
  caches[name] = constructor;
});

defineProperty(INCache, 'unregister', 0, null, null, function(name) {
  name = ('' + name).toLowercase();
  if (hasProperty(caches, name)) {
    delete caches[name];
  }
});

defineProperty(INCache, 'isRegistered', 0, null, null, function(cacheOrName) {
  if (typeof cacheOrName === 'function' && cacheOrName.cacheType &&
      hasProperty(cacheOrName, cacheOrName.cacheType.toLowerCase())) {
    return true;
  } else if (hasProperty(caches, ('' + cacheOrName).toLowerCase())) {
    return true;
  }
  return false;
});

function persistModel(obj) {
  if (obj instanceof INModelObject) {
    var inbox = obj.inbox();
    if (inbox) {
      inbox._.cache.persist(obj.id, obj.raw(), noop);
    }
  }
}
