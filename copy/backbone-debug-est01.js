//     Backbone.js 1.1.2
//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org
(function(root, factory) {
  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === "function" && define.amd) {
    define([ "underscore", "jquery", "exports" ], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });
  } else if (typeof exports !== "undefined") {
    var _ = require("underscore");
    factory(root, exports, _, root.jQuery);
  } else {
    root.Backbone = factory(root, {}, root._, root.jQuery || root.Zepto || root.ender || root.$);
  }
})(this, function(root, Backbone, _, $) {
  // Initial Setup
  // -------------
  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;
  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;
  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = "1.1.2";
  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;
  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };
  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = true;
  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = true;
  // Backbone.Events
  // ---------------
  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {
    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, "on", name, [ callback, context ]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({
        callback: callback,
        context: context,
        ctx: context || this
      });
      return this;
    },
    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, "once", name, [ callback, context ]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },
    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, "off", name, [ callback, context ])) return this;
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [ name ] : Est.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if (callback && callback !== ev.callback && callback !== ev.callback._callback || context && context !== ev.context) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }
      return this;
    },
    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, "trigger", name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },
    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === "object") callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || Est.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }
  };
  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;
  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;
    // Handle event maps.
    if (typeof name === "object") {
      for (var key in name) {
        obj[action].apply(obj, [ key, name[key] ].concat(rest));
      }
      return false;
    }
    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [ names[i] ].concat(rest));
      }
      return false;
    }
    return true;
  };
  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0:
        while (++i < l) (ev = events[i]).callback.call(ev.ctx);
        return;

      case 1:
        while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1);
        return;

      case 2:
        while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2);
        return;

      case 3:
        while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
        return;

      default:
        while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
        return;
    }
  };
  var listenMethods = {
    listenTo: "on",
    listenToOnce: "once"
  };
  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  Est.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = Est.nextUid("l"));
      listeningTo[id] = obj;
      if (!callback && typeof name === "object") callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });
  // Aliases for backwards compatibility.
  Events.bind = Events.on;
  Events.unbind = Events.off;
  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  Est.extend(Backbone, Events);
  // Backbone.Model
  // --------------
  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.
  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = Est.nextUid("c");
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, "defaults"));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };
  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {
    // A hash of attributes whose current and previous value differ.
    changed: null,
    // The value returned during the last failed validation.
    validationError: null,
    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: "id",
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return Est.cloneDeep(this.attributes);
    },
    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },
    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },
    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },
    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },
    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;
      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === "object") {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }
      options || (options = {});
      // Run validation.
      if (!this._validate(attrs, options)) return false;
      // Extract attributes and options.
      unset = options.unset;
      silent = options.silent;
      changes = [];
      changing = this._changing;
      this._changing = true;
      if (!changing) {
        this._previousAttributes = Est.cloneDeep(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;
      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];
      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }
      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger("change:" + changes[i], this, current[changes[i]], options);
        }
      }
      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger("change", this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },
    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {
        unset: true
      }));
    },
    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {
        unset: true
      }));
    },
    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !Est.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },
    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a views need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? Est.cloneDeep(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], val = diff[attr])) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },
    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },
    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return Est.cloneDeep(this._previousAttributes);
    },
    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? Est.cloneDeep(options) : {};
      options.cache = false;
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger("sync", model, resp, options);
      };
      wrapError(this, options);
      return this.sync("read", this, options);
    },
    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;
      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === "object") {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }
      options = _.extend({
        validate: true
      }, options);
      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }
      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }
      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (Est.typeOf(serverAttrs) === 'object' && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger("sync", model, resp, options);
      };
      wrapError(this, options);
      method = this.isNew() ? "create" : options.patch ? "patch" : "update";
      if (method === "patch") options.attrs = attrs;
      xhr = this.sync(method, this, options);
      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;
      return xhr;
    },
    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? Est.cloneDeep(options) : {};
      var model = this;
      var success = options.success;
      var destroy = function() {
        model.trigger("destroy", model, model.collection, options);
      };
      options.success = function(resp) {
        if (resp && !resp.success){
          options.error && options.error.call(this, resp);
          return;
        }
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger("sync", model, resp, options);
      };
      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);
      var xhr = this.sync("delete", this, options);
      if (!options.wait) destroy();
      return xhr;
    },
    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, "urlRoot") || _.result(this.collection, "url") || urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, "$1/") + encodeURIComponent(this.id);
    },
    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },
    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },
    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },
    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, {
        validate: true
      }));
    },
    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger("invalid", this, error, _.extend(options, {
        validationError: error
      }));
      return false;
    }
  });
  // Underscore methods that we want to implement on the Model.
  var modelMethods = [ "keys", "values",  "invert", "pick"];
  // Mix in each Underscore method as a proxy to `Model#attributes`.
  Est.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });
  // Backbone.Collection
  // -------------------
  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.
  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({
      silent: true
    }, options));
  };
  // Default options for `Collection#set`.
  var setOptions = {
    add: true,
    remove: true,
    merge: true
  };
  var addOptions = {
    add: true,
    remove: false
  };
  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {
    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model) {
        return model.toJSON(options);
      });
    },
    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },
    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({
        merge: false
      }, options, addOptions));
    },
    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !(Est.typeOf(models) === 'array');
      models = singular ? [ models ] : Est.cloneDeep(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger("remove", model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },
    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !(Est.typeOf(models) === 'array');
      models = singular ? models ? [ models ] : [] : Est.cloneDeep(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && at == null && options.sort !== false;
      var sortAttr = Est.typeOf(this.comparator) === 'string' ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;
      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i] || {};
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute || "id"];
        }
        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }
        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
        modelMap[model.id] = true;
      }
      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }
      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || order && order.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }
      // Silently sort the collection if appropriate.
      if (sort) this.sort({
        silent: true
      });
      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger("add", model, this, options);
        }
        if (sort || order && order.length) this.trigger("sort", this, options);
      }
      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },
    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({
        silent: true
      }, options));
      if (!options.silent) this.trigger("reset", this, options);
      return models;
    },
    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({
        at: this.length
      }, options));
    },
    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },
    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({
        at: 0
      }, options));
    },
    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },
    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },
    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
    },
    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },
    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (Est.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? "find" : "filter"](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },
    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },
    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error("Cannot sort a set without a comparator");
      options || (options = {});
      // Run sort based on type of `comparator`.
      if (Est.typeOf(this.comparator) === 'string' || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(Est.proxy(this.comparator, this));
      }
      if (!options.silent) this.trigger("sort", this, options);
      return this;
    },
    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, "get", attr);
    },
    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? Est.cloneDeep(options) : {};
      options.cache = false;
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        if (success) success(collection, resp, options);
        var method = options.reset ? "reset" : "set";
        collection[method](resp, options);
        collection.trigger("sync", collection, resp, options);
      };
      wrapError(this, options);
      return this.sync("read", this, options);
    },
    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? Est.cloneDeep(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },
    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },
    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },
    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId = {};
    },
    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) return attrs;
      options = options ? Est.cloneDeep(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger("invalid", this, model.validationError, options);
      return false;
    },
    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
      if (!model.collection) model.collection = this;
      model.on("all", this._onModelEvent, this);
    },
    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off("all", this._onModelEvent, this);
    },
    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === "add" || event === "remove") && collection !== this) return;
      if (event === "destroy") this.remove(model, options);
      if (model && event === "change:" + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }
  });
  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = [ "forEach", "each", "map", "collect",  "find", "detect", "filter",  "all",
  "some", "any", "invoke", "rest", "tail", "drop", "indexOf",  "isEmpty", "chain"];
  // Mix in each Underscore method as a proxy to `Collection#models`.
  Est.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });
  // Underscore methods that take a property name as an argument.
  var attributeMethods = [ "sortBy"];
  // Use attributes instead of properties.
  Est.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = Est.typeOf(value) === 'function' ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });
  // Backbone.View
  // -------------
  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the views to
  // react to specific changes in the state of your models.
  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = Est.nextUid("view");
    options || (options = {});
    _.extend(this, Est.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };
  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;
  // List of views options to be merged as properties.
  var viewOptions = [ "model", "collection", "el", "id", "attributes", "className", "tagName", "events" ];
  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {
    // The default `tagName` of a View's element is `"div"`.
    tagName: "div",
    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current views. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    // **render** is the core function that your views should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },
    // Remove this views by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },
    // Change the views's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },
    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the views, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, "events")))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!(Est.typeOf(method) === 'function')) method = this[events[key]];
        if (!method) continue;
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = Est.proxy(method, this);
        eventName += ".delegateEvents" + this.cid;
        if (selector === "") {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },
    // Clears all callbacks previously bound to the views with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off(".delegateEvents" + this.cid);
      return this;
    },
    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, "attributes"));
        if (this.id) attrs.id = _.result(this, "id");
        if (this.className) attrs["class"] = _.result(this, "className");
        var $el = Backbone.$("<" + _.result(this, "tagName") + ">").attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, "el"), false);
      }
    }
  });
  // Backbone.sync
  // -------------
  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];
    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });
    // Default JSON-request options.
    var params = {
      type: type,
      dataType: "json"
    };
    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, "url") || urlError();
    }
    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === "create" || method === "update" || method === "patch")) {
      params.contentType = "application/json";
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }
    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = "application/x-www-form-urlencoded";
      params.data = params.data ? {
        model: params.data
      } : {};
    }
    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === "PUT" || type === "DELETE" || type === "PATCH")) {
      params.type = "POST";
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader("X-HTTP-Method-Override", type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }
    // Don't process data on a non-GET request.
    if (params.type !== "GET" && !options.emulateJSON) {
      params.processData = false;
    }
    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === "PATCH" && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }
    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger("request", model, xhr, options);
    return xhr;
  };
  var noXhrPatch = typeof window !== "undefined" && !!window.ActiveXObject && !(window.XMLHttpRequest && new XMLHttpRequest().dispatchEvent);
  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    create: "POST",
    update: "PUT",
    patch: "PATCH",
    "delete": "DELETE",
    read: "GET"
  };
  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    var result = null;
    var response = null;
    var options = {};

    if (arguments[0].cacheData || arguments[0].session){
      options.data = arguments[0].data;
      options.url = arguments[0].url;
      options.cache = arguments[0].cacheData;
      options.session = arguments[0].session;
      result = app.getCache(options);
      if (!result){
        function beforeTest(result) {
          app.addCache(options, result);
              return new Est.setArguments(arguments); // 如果return false; 则不执行doTest方法
        };
        arguments[0].success = Est.inject(arguments[0].success, beforeTest, function(){});
      } else{
        arguments[0].success.call(this,result);
        return {done: function(callback){
          callback.call(this, result);
        }}
      }
    }

    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };
  // Backbone.Router
  // ---------------
  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };
  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam = /(\(\?)?:\w+/g;
  var splatParam = /\*\w+/g;
  var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!(Est.typeOf(route) === 'regexp')) route = this._routeToRegExp(route);
      if (Est.typeOf(name) === 'function') {
        callback = name;
        name = "";
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        router.execute(callback, args);
        router.trigger.apply(router, [ "route:" + name ].concat(args));
        router.trigger("route", name, args);
        Backbone.history.trigger("route", router, name, args);
      });
      return this;
    },
    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args) {
      if (callback) callback.apply(this, args);
    },
    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },
    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, "routes");
      var route, routes = Est.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },
    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, "\\$&").replace(optionalParam, "(?:$1)?").replace(namedParam, function(match, optional) {
        return optional ? match : "([^/?]+)";
      }).replace(splatParam, "([^?]*?)");
      return new RegExp("^" + route + "(?:\\?([\\s\\S]*))?$");
    },
    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return Est.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }
  });
  // Backbone.History
  // ----------------
  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, "checkUrl");
    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== "undefined") {
      this.location = window.location;
      this.history = window.history;
    }
  };
  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;
  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;
  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;
  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;
  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;
  // Has the history handling already been started?
  History.started = false;
  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {
    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,
    // Are we at the app root?
    atRoot: function() {
      return this.location.pathname.replace(/[^\/]$/, "$&/") === this.root;
    },
    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : "";
    },
    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, "");
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, "");
    },
    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;
      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options = _.extend({
        root: "/"
      }, this.options, options);
      this.root = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState = !!this.options.pushState;
      this._hasPushState = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment = this.getFragment();
      var docMode = document.documentMode;
      var oldIE = isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7);
      // Normalize root to always include a leading and trailing slash.
      this.root = ("/" + this.root + "/").replace(rootStripper, "/");
      if (oldIE && this._wantsHashChange) {
        var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
        this.iframe = frame.hide().appendTo("body")[0].contentWindow;
        this.navigate(fragment);
      }
      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on("popstate", this.checkUrl);
      } else if (this._wantsHashChange && "onhashchange" in window && !oldIE) {
        Backbone.$(window).on("hashchange", this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }
      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {
        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + "#" + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;
        } else if (this._hasPushState && this.atRoot() && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, "");
          this.history.replaceState({}, document.title, this.root + this.fragment);
        }
      }
      if (!this.options.silent) return this.loadUrl();
    },
    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off("popstate", this.checkUrl).off("hashchange", this.checkUrl);
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },
    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({
        route: route,
        callback: callback
      });
    },
    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },
    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },
    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {
        trigger: !!options
      };
      var url = this.root + (fragment = this.getFragment(fragment || ""));
      // Strip the hash for matching.
      fragment = fragment.replace(pathStripper, "");
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      // Don't include a trailing slash on the root.
      if (fragment === "" && url !== "/") url = url.slice(0, -1);
      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? "replaceState" : "pushState"]({}, document.title, url);
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && fragment !== this.getFragment(this.getHash(this.iframe))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if (!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },
    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, "");
        location.replace(href + "#" + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = "#" + fragment;
      }
    }
  });
  // Create the default Backbone.history.
  Backbone.history = new History();
  // Helpers
  // -------
  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;
    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, "constructor")) {
      child = protoProps.constructor;
    } else {
      child = function() {
        return parent.apply(this, arguments);
      };
    }
    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);
    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function() {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();
    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);
    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;
    return child;
  };
  // Set up inheritance for the model, collection, router, views and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;
  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };
  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger("error", model, resp, options);
    };
  };


  /*ModelBinder **************************************************************/
  if(!Backbone){
    throw 'Please include Backbone.js before Backbone.ModelBinder.js';
  }

  Backbone.ModelBinder = function(){
    _.bindAll.apply(_, [this].concat(Est.functions(this)));
  };

  // Static setter for class level options
  Backbone.ModelBinder.SetOptions = function(options){
    Backbone.ModelBinder.options = options;
  };

  // Current version of the library.
  Backbone.ModelBinder.VERSION = '1.0.6';
  Backbone.ModelBinder.Constants = {};
  Backbone.ModelBinder.Constants.ModelToView = 'ModelToView';
  Backbone.ModelBinder.Constants.ViewToModel = 'ViewToModel';

  _.extend(Backbone.ModelBinder.prototype, {

    bind:function (model, rootEl, attributeBindings, options) {
      this.unbind();

      this._model = model;
      this._rootEl = rootEl;
      this._setOptions(options);

      if (!this._model) this._throwException('model must be specified');
      if (!this._rootEl) this._throwException('rootEl must be specified');

      if(attributeBindings){
        // Create a deep clone of the attribute bindings
        this._attributeBindings = $.extend(true, {}, attributeBindings);

        this._initializeAttributeBindings();
        this._initializeElBindings();
      }
      else {
        this._initializeDefaultBindings();
      }

      this._bindModelToView();
      this._bindViewToModel();
    },

    bindCustomTriggers: function (model, rootEl, triggers, attributeBindings, modelSetOptions) {
      this._triggers = triggers;
      this.bind(model, rootEl, attributeBindings, modelSetOptions);
    },

    unbind:function () {
      this._unbindModelToView();
      this._unbindViewToModel();

      if(this._attributeBindings){
        delete this._attributeBindings;
        this._attributeBindings = undefined;
      }
    },

    _setOptions: function(options){
      this._options = _.extend({
        boundAttribute: 'name'
      }, Backbone.ModelBinder.options, options);

      // initialize default options
      if(!this._options['modelSetOptions']){
        this._options['modelSetOptions'] = {};
      }
      this._options['modelSetOptions'].changeSource = 'ModelBinder';

      if(!this._options['changeTriggers']){
        this._options['changeTriggers'] = {'': 'change', '[contenteditable]': 'blur'};
      }

      if(!this._options['initialCopyDirection']){
        this._options['initialCopyDirection'] = Backbone.ModelBinder.Constants.ModelToView;
      }
    },

    // Converts the input bindings, which might just be empty or strings, to binding objects
    _initializeAttributeBindings:function () {
      var attributeBindingKey, inputBinding, attributeBinding, elementBindingCount, elementBinding;

      for (attributeBindingKey in this._attributeBindings) {
        inputBinding = this._attributeBindings[attributeBindingKey];

        if (Est.typeOf(inputBinding) === 'string') {
          attributeBinding = {elementBindings: [{selector: inputBinding}]};
        }
        else if (Est.typeOf(inputBinding) === 'array') {
          attributeBinding = {elementBindings: inputBinding};
        }
        else if(Est.typeOf(inputBinding) === 'object'){
          attributeBinding = {elementBindings: [inputBinding]};
        }
        else {
          this._throwException('Unsupported type passed to Model Binder ' + attributeBinding);
        }

        // Add a linkage from the element binding back to the attribute binding
        for(elementBindingCount = 0; elementBindingCount < attributeBinding.elementBindings.length; elementBindingCount++){
          elementBinding = attributeBinding.elementBindings[elementBindingCount];
          elementBinding.attributeBinding = attributeBinding;
        }

        attributeBinding.attributeName = attributeBindingKey;
        this._attributeBindings[attributeBindingKey] = attributeBinding;
      }
    },

    // If the bindings are not specified, the default binding is performed on the specified attribute, name by default
    _initializeDefaultBindings: function(){
      var elCount, elsWithAttribute, matchedEl, name, attributeBinding;

      this._attributeBindings = {};
      elsWithAttribute = $('[' + this._options['boundAttribute'] + ']', this._rootEl);

      for(elCount = 0; elCount < elsWithAttribute.length; elCount++){
        matchedEl = elsWithAttribute[elCount];
        name = $(matchedEl).attr(this._options['boundAttribute']);

        // For elements like radio buttons we only want a single attribute binding with possibly multiple element bindings
        if(!this._attributeBindings[name]){
          attributeBinding =  {attributeName: name};
          attributeBinding.elementBindings = [{attributeBinding: attributeBinding, boundEls: [matchedEl]}];
          this._attributeBindings[name] = attributeBinding;
        }
        else{
          this._attributeBindings[name].elementBindings.push({attributeBinding: this._attributeBindings[name], boundEls: [matchedEl]});
        }
      }
    },

    _initializeElBindings:function () {
      var bindingKey, attributeBinding, bindingCount, elementBinding, foundEls, elCount, el;
      for (bindingKey in this._attributeBindings) {
        attributeBinding = this._attributeBindings[bindingKey];

        for (bindingCount = 0; bindingCount < attributeBinding.elementBindings.length; bindingCount++) {
          elementBinding = attributeBinding.elementBindings[bindingCount];
          if (elementBinding.selector === '') {
            foundEls = $(this._rootEl);
          }
          else {
            foundEls = $(elementBinding.selector, this._rootEl);
          }

          if (foundEls.length === 0) {
            this._throwException('Bad binding found. No elements returned for binding selector ' + elementBinding.selector);
          }
          else {
            elementBinding.boundEls = [];
            for (elCount = 0; elCount < foundEls.length; elCount++) {
              el = foundEls[elCount];
              elementBinding.boundEls.push(el);
            }
          }
        }
      }
    },

    _bindModelToView: function () {
      this._model.on('change', this._onModelChange, this);

      if(this._options['initialCopyDirection'] === Backbone.ModelBinder.Constants.ModelToView){
        this.copyModelAttributesToView();
      }
    },

    // attributesToCopy is an optional parameter - if empty, all attributes
    // that are bound will be copied.  Otherwise, only attributeBindings specified
    // in the attributesToCopy are copied.
    copyModelAttributesToView: function(attributesToCopy){
      var attributeName, attributeBinding;

      for (attributeName in this._attributeBindings) {
        if(attributesToCopy === undefined || _.indexOf(attributesToCopy, attributeName) !== -1){
          attributeBinding = this._attributeBindings[attributeName];
          this._copyModelToView(attributeBinding);
        }
      }
    },

    copyViewValuesToModel: function(){
      var bindingKey, attributeBinding, bindingCount, elementBinding, elCount, el;
      for (bindingKey in this._attributeBindings) {
        attributeBinding = this._attributeBindings[bindingKey];

        for (bindingCount = 0; bindingCount < attributeBinding.elementBindings.length; bindingCount++) {
          elementBinding = attributeBinding.elementBindings[bindingCount];

          if(this._isBindingUserEditable(elementBinding)){
            if(this._isBindingRadioGroup(elementBinding)){
              el = this._getRadioButtonGroupCheckedEl(elementBinding);
              if(el){
                this._copyViewToModel(elementBinding, el);
              }
            }
            else {
              for(elCount = 0; elCount < elementBinding.boundEls.length; elCount++){
                el = $(elementBinding.boundEls[elCount]);
                if(this._isElUserEditable(el)){
                  this._copyViewToModel(elementBinding, el);
                }
              }
            }
          }
        }
      }
    },

    _unbindModelToView: function(){
      if(this._model){
        this._model.off('change', this._onModelChange);
        this._model = undefined;
      }
    },

    _bindViewToModel: function () {
      Est.each(this._options['changeTriggers'], function (event, selector) {
        $(this._rootEl).delegate(selector, event, this._onElChanged);
      }, this);

      if(this._options['initialCopyDirection'] === Backbone.ModelBinder.Constants.ViewToModel){
        this.copyViewValuesToModel();
      }
    },

    _unbindViewToModel: function () {
      if(this._options && this._options['changeTriggers']){
        Est.each(this._options['changeTriggers'], function (event, selector) {
          $(this._rootEl).undelegate(selector, event, this._onElChanged);
        }, this);
      }
    },

    _onElChanged:function (event) {
      var el, elBindings, elBindingCount, elBinding;

      el = $(event.target)[0];
      elBindings = this._getElBindings(el);

      for(elBindingCount = 0; elBindingCount < elBindings.length; elBindingCount++){
        elBinding = elBindings[elBindingCount];
        if (this._isBindingUserEditable(elBinding)) {
          this._copyViewToModel(elBinding, el);
        }
      }
    },

    _isBindingUserEditable: function(elBinding){
      return elBinding.elAttribute === undefined ||
        elBinding.elAttribute === 'text' ||
        elBinding.elAttribute === 'html';
    },

    _isElUserEditable: function(el){
      var isContentEditable = el.attr('contenteditable');
      return isContentEditable || el.is('input') || el.is('select') || el.is('textarea');
    },

    _isBindingRadioGroup: function(elBinding){
      var elCount, el;
      var isAllRadioButtons = elBinding.boundEls.length > 0;
      for(elCount = 0; elCount < elBinding.boundEls.length; elCount++){
        el = $(elBinding.boundEls[elCount]);
        if(el.attr('type') !== 'radio'){
          isAllRadioButtons = false;
          break;
        }
      }

      return isAllRadioButtons;
    },

    _getRadioButtonGroupCheckedEl: function(elBinding){
      var elCount, el;
      for(elCount = 0; elCount < elBinding.boundEls.length; elCount++){
        el = $(elBinding.boundEls[elCount]);
        if(el.attr('type') === 'radio' && el.attr('checked')){
          return el;
        }
      }

      return undefined;
    },

    _getElBindings:function (findEl) {
      var attributeName, attributeBinding, elementBindingCount, elementBinding, boundElCount, boundEl;
      var elBindings = [];

      for (attributeName in this._attributeBindings) {
        attributeBinding = this._attributeBindings[attributeName];

        for (elementBindingCount = 0; elementBindingCount < attributeBinding.elementBindings.length; elementBindingCount++) {
          elementBinding = attributeBinding.elementBindings[elementBindingCount];

          for (boundElCount = 0; boundElCount < elementBinding.boundEls.length; boundElCount++) {
            boundEl = elementBinding.boundEls[boundElCount];

            if (boundEl === findEl) {
              elBindings.push(elementBinding);
            }
          }
        }
      }

      return elBindings;
    },

    _onModelChange:function () {
      var changedAttribute, attributeBinding;

      for (changedAttribute in this._model.changedAttributes()) {
        attributeBinding = this._attributeBindings[changedAttribute];

        if (attributeBinding) {
          this._copyModelToView(attributeBinding);
        }
      }
    },

    _copyModelToView:function (attributeBinding) {
      var elementBindingCount, elementBinding, boundElCount, boundEl, value, convertedValue;

      value = this._model.get(attributeBinding.attributeName);

      for (elementBindingCount = 0; elementBindingCount < attributeBinding.elementBindings.length; elementBindingCount++) {
        elementBinding = attributeBinding.elementBindings[elementBindingCount];

        for (boundElCount = 0; boundElCount < elementBinding.boundEls.length; boundElCount++) {
          boundEl = elementBinding.boundEls[boundElCount];

          if(!boundEl._isSetting){
            convertedValue = this._getConvertedValue(Backbone.ModelBinder.Constants.ModelToView, elementBinding, value);
            this._setEl($(boundEl), elementBinding, convertedValue);
          }
        }
      }
    },

    _setEl: function (el, elementBinding, convertedValue) {
      if (elementBinding.elAttribute) {
        this._setElAttribute(el, elementBinding, convertedValue);
      }
      else {
        this._setElValue(el, convertedValue);
      }
    },

    _setElAttribute:function (el, elementBinding, convertedValue) {
      switch (elementBinding.elAttribute) {
        case 'html':
          el.html(convertedValue);
          break;
        case 'text':
          el.text(convertedValue);
          break;
        case 'enabled':
          el.prop('disabled', !convertedValue);
          break;
        case 'displayed':
          el[convertedValue ? 'show' : 'hide']();
          break;
        case 'hidden':
          el[convertedValue ? 'hide' : 'show']();
          break;
        case 'css':
          el.css(elementBinding.cssAttribute, convertedValue);
          break;
        case 'class':
          var previousValue = this._model.previous(elementBinding.attributeBinding.attributeName);
          var currentValue = this._model.get(elementBinding.attributeBinding.attributeName);
          // is current value is now defined then remove the class the may have been set for the undefined value
          if(!(Est.typeOf(previousValue) === 'undefined') || !(Est.typeOf(currentValue) === 'undefined')){
            previousValue = this._getConvertedValue(Backbone.ModelBinder.Constants.ModelToView, elementBinding, previousValue);
            el.removeClass(previousValue);
          }

          if(convertedValue){
            el.addClass(convertedValue);
          }
          break;
        default:
          el.attr(elementBinding.elAttribute, convertedValue);
      }
    },

    _setElValue:function (el, convertedValue) {
      if(el.attr('type')){
        switch (el.attr('type')) {
          case 'radio':
            el.prop('checked', el.val() === convertedValue);
            break;
          case 'checkbox':
            el.prop('checked', !!convertedValue);
            break;
          case 'file':
            break;
          default:
            el.val(convertedValue);
        }
      }
      else if(el.is('input') || el.is('select') || el.is('textarea')){
        el.val(convertedValue || (convertedValue === 0 ? '0' : ''));
      }
      else {
        el.text(convertedValue || (convertedValue === 0 ? '0' : ''));
      }
    },

    _copyViewToModel: function (elementBinding, el) {
      var result, value, convertedValue;

      if (!el._isSetting) {

        el._isSetting = true;
        result = this._setModel(elementBinding, $(el));
        el._isSetting = false;

        if(result && elementBinding.converter){
          value = this._model.get(elementBinding.attributeBinding.attributeName);
          convertedValue = this._getConvertedValue(Backbone.ModelBinder.Constants.ModelToView, elementBinding, value);
          this._setEl($(el), elementBinding, convertedValue);
        }
      }
    },

    _getElValue: function(elementBinding, el){
      switch (el.attr('type')) {
        case 'checkbox':
          return el.prop('checked') ? true : false;
        default:
          if(el.attr('contenteditable') !== undefined){
            return el.html();
          }
          else {
            return el.val();
          }
      }
    },

    _setModel: function (elementBinding, el) {
      var data = {};
      var elVal = this._getElValue(elementBinding, el);
      elVal = this._getConvertedValue(Backbone.ModelBinder.Constants.ViewToModel, elementBinding, elVal);
      data[elementBinding.attributeBinding.attributeName] = elVal;
      return this._model.set(data,  this._options['modelSetOptions']);
    },

    _getConvertedValue: function (direction, elementBinding, value) {

      if (elementBinding.converter) {
        value = elementBinding.converter(direction, value, elementBinding.attributeBinding.attributeName, this._model, elementBinding.boundEls);
      }
      else if(this._options['converter']){
        value = this._options['converter'](direction, value, elementBinding.attributeBinding.attributeName, this._model, elementBinding.boundEls);
      }

      return value;
    },

    _throwException: function(message){
      if(this._options.suppressThrows){
        if(typeof(console) !== 'undefined' && console.error){
          console.error(message);
        }
      }
      else {
        throw message;
      }
    }
  });

  Backbone.ModelBinder.CollectionConverter = function(collection){
    this._collection = collection;

    if(!this._collection){
      throw 'Collection must be defined';
    }
    _.bindAll(this, 'convert');
  };

  _.extend(Backbone.ModelBinder.CollectionConverter.prototype, {
    convert: function(direction, value){
      if (direction === Backbone.ModelBinder.Constants.ModelToView) {
        return value ? value.id : undefined;
      }
      else {
        return this._collection.get(value);
      }
    }
  });

  // A static helper function to create a default set of bindings that you can customize before calling the bind() function
  // rootEl - where to find all of the bound elements
  // attributeType - probably 'name' or 'id' in most cases
  // converter(optional) - the default converter you want applied to all your bindings
  // elAttribute(optional) - the default elAttribute you want applied to all your bindings
  Backbone.ModelBinder.createDefaultBindings = function(rootEl, attributeType, converter, elAttribute){
    var foundEls, elCount, foundEl, attributeName;
    var bindings = {};

    foundEls = $('[' + attributeType + ']', rootEl);

    for(elCount = 0; elCount < foundEls.length; elCount++){
      foundEl = foundEls[elCount];
      attributeName = $(foundEl).attr(attributeType);

      if(!bindings[attributeName]){
        var attributeBinding =  {selector: '[' + attributeType + '="' + attributeName + '"]'};
        bindings[attributeName] = attributeBinding;

        if(converter){
          bindings[attributeName].converter = converter;
        }

        if(elAttribute){
          bindings[attributeName].elAttribute = elAttribute;
        }
      }
    }

    return bindings;
  };

  // Helps you to combine 2 sets of bindings
  Backbone.ModelBinder.combineBindings = function(destination, source){
    Est.each(source, function(value, key){
      var elementBinding = {selector: value.selector};

      if(value.converter){
        elementBinding.converter = value.converter;
      }

      if(value.elAttribute){
        elementBinding.elAttribute = value.elAttribute;
      }

      if(!destination[key]){
        destination[key] = elementBinding;
      }
      else {
        destination[key] = [destination[key], elementBinding];
      }
    });

    return destination;
  };

  /*ModelBinder-end************************************************************/
  return Backbone;
});