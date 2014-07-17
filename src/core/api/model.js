function INModelObject(inbox, id, namespaceId) {
  this.id = id || '-selfdefined';
  if (namespaceId) {
    this.namespaceId = namespaceId;
  }
  defineProperty(this, '_', INVISIBLE, null, null, {
    inbox: inbox
  });
};


INModelObject.prototype.baseUrl = function() {
  return this._.inbox.baseUrl();
};


INModelObject.prototype.namespaceUrl = function() {
  return urlFormat('%@/n/%@', this._.inbox.baseUrl(), this.namespaceId);
};


INModelObject.prototype.resourcePath = function() {
  return this.baseUrl();
};


INModelObject.prototype.isUnsynced = function() {
  return endsWith(this.id, '-selfdefined');
};


INModelObject.prototype.reload = function() {
  var self = this;
  return apiRequestPromise(this.inbox(), 'get', this.resourcePath(), function(data) {
    self.update(data);
    persistModel(self);
    return self;
  });
};


INModelObject.prototype.update = function(data) {
  var mapping = this.resourceMapping;
  forEach(mapping, function copyMappedProperties(mappingInfo, propertyName) {
    var cast = mappingInfo.to;
    var merge = mappingInfo.merge;
    var jsonKey = mappingInfo.jsonKey;
    var cnst = mappingInfo.cnst;
    var currentValue;
    var isObject;

    if (hasProperty(data, jsonKey)) {
      if (cnst) {
        this[propertyName] = cnst;
      } else {
        currentValue = data[jsonKey];
        if (typeof currentValue !== 'undefined') {
          cast = cast(currentValue);
          isObject = cast && typeof cast === 'object';
          if (!this[propertyName] || !isObject || !merge) {
            this[propertyName] = cast;
          } else {
            merge(this[propertyName], cast);
          }
        }
      }
    } else if (cnst) {
      this[propertyName] = cnst;
    }
  }, this);
};


INModelObject.prototype.raw = function() {
  var mapping = this.resourceMapping;
  var out = {};
  forEach(mapping, function copyMappedProperties(mappingInfo, propertyName) {
    var cast = mappingInfo.from;
    var jsonKey = mappingInfo.jsonKey;
    var cnst = mappingInfo.cnst;
    var isObject;
    var currentValue;

    if (hasProperty(this, propertyName)) {
      if (cnst) {
        out[jsonKey] = cnst;
      } else {
        currentValue = this[propertyName];
        cast = cast(currentValue);
        isObject = cast && typeof cast === 'object';
        if (typeof currentValue !== 'undefined') {
          if (!isObject || !cast) {
            out[jsonKey] = cast;
          } else {
            out[jsonKey] = merge(isArray(cast) ? [] : {}, cast);
          }
        }
      }
    } else if (cnst) {
      out[jsonKey] = cnst;
    }
  }, this);
  return out;
};

INModelObject.prototype.toJSON = function() {
  return toJSON(this.raw());
};

var casters = {
  array: {
    to: function castToArray(val) {
      if (isArray(val)) return val;
      else return fromArray(val);
    },
    from: function castFromArray(val) {
      return val;
    }
  },
  date: {
    to: function castToDate(val) {
      var v;
      switch (typeof val) {
      case 'number': return new Date(val >>> 0);
      case 'string': return new Date(val);
      case 'object':
        if (val === null) return null;
        if (val instanceof Date) return val;
        if ((typeof val.toDate === 'function') && (v = val.toDate()) instanceof Date) return v;
        /* falls through */
      default:
        return undefined;
      }
    },
    from: function castFromDate(val) {
      var v;
      switch (typeof val) {
      case 'number': return val >>> 0;
      case 'string': return new Date(val).getTime();
      case 'object':
        if (val === null) return null;
        if (typeof val.valueOf === 'function' && typeof (v = val.valueOf()) === 'number') return v;
        if (val instanceof Date) return val.getTime();
        /* falls through */
      default:
        return;
      }
    }
  },

  int: function castToInt(val) {
    return (val) >>> 0;
  },

  string: function castToString(val) {
    if (val === null) return null;
    return '' + val;
  },

  bool: function castToBool(val) {
    return !!val;
  }
};


function defineResourceMapping(resourceClass, mapping, base) {
  var jsonProperties = {};

  function resourceMapping() {
    var x;
    for (x in this) {
      this[x] = this[x];
    }
  };

  if (!base && base !== null) {
    base = INModelObject;
  }

  if (base) {
    inherits(resourceMapping, base.resourceMapping.constructor);
  }

  forEach(mapping, function(mapping, propertyName) {
    if (typeof mapping === 'string') {
      var split = mapping.indexOf(':');
      var type = 'string';
      var jsonKey = mapping;
      var cnst = false;
      if (split >= 0) {
        type = mapping.substring(0, split);
        jsonKey = mapping.substring(split + 1);
        if (type === 'const') {
          cnst = jsonKey;
          if ((split = jsonKey.indexOf(':')) >= 0) {
            cnst = jsonKey.substring(split + 1);
            jsonKey = jsonKey.substring(0, split);
          }
        }
        if (!hasProperty(casters, type)) {
          type = 'string';
          jsonKey = mapping;
        }
      }

      var caster = casters[type];
      var from;
      var to;
      var merge = null;

      if (typeof caster === 'function') {
        from = to = caster;        
      } else if (typeof caster === 'object') {
        from = caster.from;
        to = caster.to;
        merge = caster.merge || null;
      }

      jsonProperties[jsonKey] = propertyName;
      resourceMapping.prototype[propertyName] = {
        jsonKey: jsonKey,
        to: to,
        from: from,
        merge: merge,
        type: type,
        cnst: cnst
      };
    }
  });

  defineProperty(resourceMapping.prototype, 'jsonKeys', INVISIBLE, null, null, jsonProperties);
  resourceMapping = new resourceMapping();
  defineProperty(resourceClass, 'resourceMapping', INVISIBLE, null, null, resourceMapping);
  defineProperty(resourceClass.prototype, 'resourceMapping', INVISIBLE, null, null,
    resourceMapping);
}


defineResourceMapping(INModelObject, {
  'id': 'id',
  'namespaceID': 'namespace',
  'createdAt': 'date:created_at',
  'updatedAt': 'date:updated_at'
}, null);


defineProperty(INModelObject.prototype, 'inbox', INVISIBLE, null, null, function(resolver) {
  return this._.inbox;
});


defineProperty(INModelObject.prototype, 'promise', INVISIBLE, null, null, function(resolver) {
  return this.inbox().promise(resolver);
});
