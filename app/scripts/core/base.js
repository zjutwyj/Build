/**
 * Sea.js 3.0.0 | seajs.org/LICENSE.md
 */
(function(global, undefined) {

// Avoid conflicting when `sea.js` is loaded multiple times
if (global.seajs) {
  return
}

var seajs = global.seajs = {
  // The current version of Sea.js being used
  version: "3.0.0"
}

var data = seajs.data = {}


/**
 * util-lang.js - The minimal language enhancement
 */

function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) == "[object " + type + "]"
  }
}

var isObject = isType("Object")
var isString = isType("String")
var isArray = Array.isArray || isType("Array")
var isFunction = isType("Function")

var _cid = 0
function cid() {
  return _cid++
}


/**
 * util-events.js - The minimal events support
 */

var events = data.events = {}

// Bind event
seajs.on = function(name, callback) {
  var list = events[name] || (events[name] = [])
  list.push(callback)
  return seajs
}

// Remove event. If `callback` is undefined, remove all callbacks for the
// event. If `event` and `callback` are both undefined, remove all callbacks
// for all events
seajs.off = function(name, callback) {
  // Remove *all* events
  if (!(name || callback)) {
    events = data.events = {}
    return seajs
  }

  var list = events[name]
  if (list) {
    if (callback) {
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i] === callback) {
          list.splice(i, 1)
        }
      }
    }
    else {
      delete events[name]
    }
  }

  return seajs
}

// Emit event, firing all bound callbacks. Callbacks receive the same
// arguments as `emit` does, apart from the event name
var emit = seajs.emit = function(name, data) {
  var list = events[name]

  if (list) {
    // Copy callback lists to prevent modification
    list = list.slice()

    // Execute event callbacks, use index because it's the faster.
    for(var i = 0, len = list.length; i < len; i++) {
      list[i](data)
    }
  }

  return seajs
}

/**
 * util-path.js - The utilities for operating path such as id, uri
 */

var DIRNAME_RE = /[^?#]*\//

var DOT_RE = /\/\.\//g
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
var MULTI_SLASH_RE = /([^:/])\/+\//g

// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
function dirname(path) {
  return path.match(DIRNAME_RE)[0]
}

// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
function realpath(path) {
  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, "/")

  /*
    @author wh1100717
    a//b/c ==> a/b/c
    a///b/////c ==> a/b/c
    DOUBLE_DOT_RE matches a/b/c//../d path correctly only if replace // with / first
  */
  path = path.replace(MULTI_SLASH_RE, "$1/")

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/")
  }

  return path
}

// Normalize an id
// normalize("path/to/a") ==> "path/to/a.js"
// NOTICE: substring is faster than negative slice and RegExp
function normalize(path) {
  var last = path.length - 1
  var lastC = path.charCodeAt(last)

  // If the uri ends with `#`, just return it without '#'
  if (lastC === 35 /* "#" */) {
    return path.substring(0, last)
  }

  return (path.substring(last - 2) === ".js" ||
      path.indexOf("?") > 0 ||
      lastC === 47 /* "/" */) ? path : path + ".js"
}


var PATHS_RE = /^([^/:]+)(\/.+)$/
var VARS_RE = /{([^{]+)}/g

function parseAlias(id) {
  var alias = data.alias
  return alias && isString(alias[id]) ? alias[id] : id
}

function parsePaths(id) {
  var paths = data.paths
  var m

  if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
    id = paths[m[1]] + m[2]
  }

  return id
}

function parseVars(id) {
  var vars = data.vars

  if (vars && id.indexOf("{") > -1) {
    id = id.replace(VARS_RE, function(m, key) {
      return isString(vars[key]) ? vars[key] : m
    })
  }

  return id
}

function parseMap(uri) {
  var map = data.map
  var ret = uri

  if (map) {
    for (var i = 0, len = map.length; i < len; i++) {
      var rule = map[i]

      ret = isFunction(rule) ?
          (rule(uri) || uri) :
          uri.replace(rule[0], rule[1])

      // Only apply the first matched rule
      if (ret !== uri) break
    }
  }

  return ret
}


var ABSOLUTE_RE = /^\/\/.|:\//
var ROOT_DIR_RE = /^.*?\/\/.*?\//

function addBase(id, refUri) {
  var ret
  var first = id.charCodeAt(0)

  // Absolute
  if (ABSOLUTE_RE.test(id)) {
    ret = id
  }
  // Relative
  else if (first === 46 /* "." */) {
    ret = (refUri ? dirname(refUri) : data.cwd) + id
  }
  // Root
  else if (first === 47 /* "/" */) {
    var m = data.cwd.match(ROOT_DIR_RE)
    ret = m ? m[0] + id.substring(1) : id
  }
  // Top-level
  else {
    ret = data.base + id
  }

  // Add default protocol when uri begins with "//"
  if (ret.indexOf("//") === 0) {
    ret = location.protocol + ret
  }

  return realpath(ret)
}

function id2Uri(id, refUri) {
  if (!id) return ""

  id = parseAlias(id)
  id = parsePaths(id)
  id = parseAlias(id)
  id = parseVars(id)
  id = parseAlias(id)
  id = normalize(id)
  id = parseAlias(id)

  var uri = addBase(id, refUri)
  uri = parseAlias(uri)
  uri = parseMap(uri)

  return uri
}

// For Developers
seajs.resolve = id2Uri;

// Check environment
var isWebWorker = typeof window === 'undefined' && typeof importScripts !== 'undefined' && isFunction(importScripts);

// Ignore about:xxx and blob:xxx
var IGNORE_LOCATION_RE = /^(about|blob):/;
var loaderDir;
// Sea.js's full path
var loaderPath;
// Location is read-only from web worker, should be ok though
var cwd = (!location.href || IGNORE_LOCATION_RE.test(location.href)) ? '' : dirname(location.href);

if (isWebWorker) {
  // Web worker doesn't create DOM object when loading scripts
  // Get sea.js's path by stack trace.
  var stack;
  try {
    var up = new Error();
    throw up;
  } catch (e) {
    // IE won't set Error.stack until thrown
    stack = e.stack.split('\n');
  }
  // First line is 'Error'
  stack.shift();

  var m;
  // Try match `url:row:col` from stack trace line. Known formats:
  // Chrome:  '    at http://localhost:8000/script/sea-worker-debug.js:294:25'
  // FireFox: '@http://localhost:8000/script/sea-worker-debug.js:1082:1'
  // IE11:    '   at Anonymous function (http://localhost:8000/script/sea-worker-debug.js:295:5)'
  // Don't care about older browsers since web worker is an HTML5 feature
  var TRACE_RE = /.*?((?:http|https|file)(?::\/{2}[\w]+)(?:[\/|\.]?)(?:[^\s"]*)).*?/i
  // Try match `url` (Note: in IE there will be a tailing ')')
  var URL_RE = /(.*?):\d+:\d+\)?$/;
  // Find url of from stack trace.
  // Cannot simply read the first one because sometimes we will get:
  // Error
  //  at Error (native) <- Here's your problem
  //  at http://localhost:8000/_site/dist/sea.js:2:4334 <- What we want
  //  at http://localhost:8000/_site/dist/sea.js:2:8386
  //  at http://localhost:8000/_site/tests/specs/web-worker/worker.js:3:1
  while (stack.length > 0) {
    var top = stack.shift();
    m = TRACE_RE.exec(top);
    if (m != null) {
      break;
    }
  }
  var url;
  if (m != null) {
    // Remove line number and column number
    // No need to check, can't be wrong at this point
    var url = URL_RE.exec(m[1])[1];
  }
  // Set
  loaderPath = url
  // Set loaderDir
  loaderDir = dirname(url || cwd);
  // This happens with inline worker.
  // When entrance script's location.href is a blob url,
  // cwd will not be available.
  // Fall back to loaderDir.
  if (cwd === '') {
    cwd = loaderDir;
  }
}
else {
  var doc = document
  var scripts = doc.scripts

  // Recommend to add `seajsnode` id for the `sea.js` script element
  var loaderScript = doc.getElementById("seajsnode") ||
    scripts[scripts.length - 1]

  function getScriptAbsoluteSrc(node) {
    return node.hasAttribute ? // non-IE6/7
      node.src :
      // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
      node.getAttribute("src", 4)
  }
  loaderPath = getScriptAbsoluteSrc(loaderScript)
  // When `sea.js` is inline, set loaderDir to current working directory
  loaderDir = dirname(loaderPath || cwd)
}

/**
 * util-request.js - The utilities for requesting script and style files
 * ref: tests/research/load-js-css/test.html
 */
if (isWebWorker) {
  function requestFromWebWorker(url, callback, charset) {
    // Load with importScripts
    var error;
    try {
      importScripts(url);
    } catch (e) {
      error = e;
    }
    callback(error);
  }
  // For Developers
  seajs.request = requestFromWebWorker;
}
else {
  var doc = document
  var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement
  var baseElement = head.getElementsByTagName("base")[0]

  var currentlyAddingScript

  function request(url, callback, charset) {
    var node = doc.createElement("script")

    if (charset) {
      var cs = isFunction(charset) ? charset(url) : charset
      if (cs) {
        node.charset = cs
      }
    }

    addOnload(node, callback, url)

    node.async = true
    node.src = url

    // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
    // the end of the insert execution, so use `currentlyAddingScript` to
    // hold current node, for deriving url in `define` call
    currentlyAddingScript = node

    // ref: #185 & http://dev.jquery.com/ticket/2709
    baseElement ?
        head.insertBefore(node, baseElement) :
        head.appendChild(node)

    currentlyAddingScript = null
  }

  function addOnload(node, callback, url) {
    var supportOnload = "onload" in node

    if (supportOnload) {
      node.onload = onload
      node.onerror = function() {
        emit("error", { uri: url, node: node })
        onload(true)
      }
    }
    else {
      node.onreadystatechange = function() {
        if (/loaded|complete/.test(node.readyState)) {
          onload()
        }
      }
    }

    function onload(error) {
      // Ensure only run once and handle memory leak in IE
      node.onload = node.onerror = node.onreadystatechange = null

      // Remove the script to reduce memory leak
      if (!data.debug) {
        head.removeChild(node)
      }

      // Dereference the node
      node = null

      callback(error)
    }
  }

  // For Developers
  seajs.request = request

}
var interactiveScript

function getCurrentScript() {
  if (currentlyAddingScript) {
    return currentlyAddingScript
  }

  // For IE6-9 browsers, the script onload event may not fire right
  // after the script is evaluated. Kris Zyp found that it
  // could query the script nodes and the one that is in "interactive"
  // mode indicates the current script
  // ref: http://goo.gl/JHfFW
  if (interactiveScript && interactiveScript.readyState === "interactive") {
    return interactiveScript
  }

  var scripts = head.getElementsByTagName("script")

  for (var i = scripts.length - 1; i >= 0; i--) {
    var script = scripts[i]
    if (script.readyState === "interactive") {
      interactiveScript = script
      return interactiveScript
    }
  }
}

/**
 * util-deps.js - The parser for dependencies
 * ref: tests/research/parse-dependencies/test.html
 * ref: https://github.com/seajs/searequire
 */

function parseDependencies(s) {
  if(s.indexOf('require') == -1) {
    return []
  }
  var index = 0, peek, length = s.length, isReg = 1, modName = 0, parentheseState = 0, parentheseStack = [], res = []
  while(index < length) {
    readch()
    if(isBlank()) {
    }
    else if(isQuote()) {
      dealQuote()
      isReg = 1
    }
    else if(peek == '/') {
      readch()
      if(peek == '/') {
        index = s.indexOf('\n', index)
        if(index == -1) {
          index = s.length
        }
      }
      else if(peek == '*') {
        index = s.indexOf('*/', index)
        if(index == -1) {
          index = length
        }
        else {
          index += 2
        }
      }
      else if(isReg) {
        dealReg()
        isReg = 0
      }
      else {
        index--
        isReg = 1
      }
    }
    else if(isWord()) {
      dealWord()
    }
    else if(isNumber()) {
      dealNumber()
    }
    else if(peek == '(') {
      parentheseStack.push(parentheseState)
      isReg = 1
    }
    else if(peek == ')') {
      isReg = parentheseStack.pop()
    }
    else {
      isReg = peek != ']'
      modName = 0
    }
  }
  return res
  function readch() {
    peek = s.charAt(index++)
  }
  function isBlank() {
    return /\s/.test(peek)
  }
  function isQuote() {
    return peek == '"' || peek == "'"
  }
  function dealQuote() {
    var start = index
    var c = peek
    var end = s.indexOf(c, start)
    if(end == -1) {
      index = length
    }
    else if(s.charAt(end - 1) != '\\') {
      index = end + 1
    }
    else {
      while(index < length) {
        readch()
        if(peek == '\\') {
          index++
        }
        else if(peek == c) {
          break
        }
      }
    }
    if(modName) {
      res.push(s.slice(start, index - 1))
      modName = 0
    }
  }
  function dealReg() {
    index--
    while(index < length) {
      readch()
      if(peek == '\\') {
        index++
      }
      else if(peek == '/') {
        break
      }
      else if(peek == '[') {
        while(index < length) {
          readch()
          if(peek == '\\') {
            index++
          }
          else if(peek == ']') {
            break
          }
        }
      }
    }
  }
  function isWord() {
    return /[a-z_$]/i.test(peek)
  }
  function dealWord() {
    var s2 = s.slice(index - 1)
    var r = /^[\w$]+/.exec(s2)[0]
    parentheseState = {
      'if': 1,
      'for': 1,
      'while': 1,
      'with': 1
    }[r]
    isReg = {
      'break': 1,
      'case': 1,
      'continue': 1,
      'debugger': 1,
      'delete': 1,
      'do': 1,
      'else': 1,
      'false': 1,
      'if': 1,
      'in': 1,
      'instanceof': 1,
      'return': 1,
      'typeof': 1,
      'void': 1
    }[r]
    modName = /^require\s*\(\s*(['"]).+?\1\s*\)/.test(s2)
    if(modName) {
      r = /^require\s*\(\s*['"]/.exec(s2)[0]
      index += r.length - 2
    }
    else {
      index += /^[\w$]+(?:\s*\.\s*[\w$]+)*/.exec(s2)[0].length - 1
    }
  }
  function isNumber() {
    return /\d/.test(peek)
      || peek == '.' && /\d/.test(s.charAt(index))
  }
  function dealNumber() {
    var s2 = s.slice(index - 1)
    var r
    if(peek == '.') {
      r = /^\.\d+(?:E[+-]?\d*)?\s*/i.exec(s2)[0]
    }
    else if(/^0x[\da-f]*/i.test(s2)) {
      r = /^0x[\da-f]*\s*/i.exec(s2)[0]
    }
    else {
      r = /^\d+\.?\d*(?:E[+-]?\d*)?\s*/i.exec(s2)[0]
    }
    index += r.length - 1
    isReg = 0
  }
}
/**
 * module.js - The core of module loader
 */

var cachedMods = seajs.cache = {}
var anonymousMeta

var fetchingList = {}
var fetchedList = {}
var callbackList = {}

var STATUS = Module.STATUS = {
  // 1 - The `module.uri` is being fetched
  FETCHING: 1,
  // 2 - The meta data has been saved to cachedMods
  SAVED: 2,
  // 3 - The `module.dependencies` are being loaded
  LOADING: 3,
  // 4 - The module are ready to execute
  LOADED: 4,
  // 5 - The module is being executed
  EXECUTING: 5,
  // 6 - The `module.exports` is available
  EXECUTED: 6,
  // 7 - 404
  ERROR: 7
}


function Module(uri, deps) {
  this.uri = uri
  this.dependencies = deps || []
  this.deps = {} // Ref the dependence modules
  this.status = 0

  this._entry = []
}

// Resolve module.dependencies
Module.prototype.resolve = function() {
  var mod = this
  var ids = mod.dependencies
  var uris = []

  for (var i = 0, len = ids.length; i < len; i++) {
    uris[i] = Module.resolve(ids[i], mod.uri)
  }
  return uris
}

Module.prototype.pass = function() {
  var mod = this

  var len = mod.dependencies.length

  for (var i = 0; i < mod._entry.length; i++) {
    var entry = mod._entry[i]
    var count = 0
    for (var j = 0; j < len; j++) {
      var m = mod.deps[mod.dependencies[j]]
      // If the module is unload and unused in the entry, pass entry to it
      if (m.status < STATUS.LOADED && !entry.history.hasOwnProperty(m.uri)) {
        entry.history[m.uri] = true
        count++
        m._entry.push(entry)
        if(m.status === STATUS.LOADING) {
          m.pass()
        }
      }
    }
    // If has passed the entry to it's dependencies, modify the entry's count and del it in the module
    if (count > 0) {
      entry.remain += count - 1
      mod._entry.shift()
      i--
    }
  }
}

// Load module.dependencies and fire onload when all done
Module.prototype.load = function() {
  var mod = this

  // If the module is being loaded, just wait it onload call
  if (mod.status >= STATUS.LOADING) {
    return
  }

  mod.status = STATUS.LOADING

  // Emit `load` event for plugins such as combo plugin
  var uris = mod.resolve()
  emit("load", uris)

  for (var i = 0, len = uris.length; i < len; i++) {
    mod.deps[mod.dependencies[i]] = Module.get(uris[i])
  }

  // Pass entry to it's dependencies
  mod.pass()

  // If module has entries not be passed, call onload
  if (mod._entry.length) {
    mod.onload()
    return
  }

  // Begin parallel loading
  var requestCache = {}
  var m

  for (i = 0; i < len; i++) {
    m = cachedMods[uris[i]]

    if (m.status < STATUS.FETCHING) {
      m.fetch(requestCache)
    }
    else if (m.status === STATUS.SAVED) {
      m.load()
    }
  }

  // Send all requests at last to avoid cache bug in IE6-9. Issues#808
  for (var requestUri in requestCache) {
    if (requestCache.hasOwnProperty(requestUri)) {
      requestCache[requestUri]()
    }
  }
}

// Call this method when module is loaded
Module.prototype.onload = function() {
  var mod = this
  mod.status = STATUS.LOADED

  // When sometimes cached in IE, exec will occur before onload, make sure len is an number
  for (var i = 0, len = (mod._entry || []).length; i < len; i++) {
    var entry = mod._entry[i]
    if (--entry.remain === 0) {
      entry.callback()
    }
  }

  delete mod._entry
}

// Call this method when module is 404
Module.prototype.error = function() {
  var mod = this
  mod.onload()
  mod.status = STATUS.ERROR
}

// Execute a module
Module.prototype.exec = function () {
  var mod = this

  // When module is executed, DO NOT execute it again. When module
  // is being executed, just return `module.exports` too, for avoiding
  // circularly calling
  if (mod.status >= STATUS.EXECUTING) {
    return mod.exports
  }

  mod.status = STATUS.EXECUTING

  if (mod._entry && !mod._entry.length) {
    delete mod._entry
  }

  //non-cmd module has no property factory and exports
  if (!mod.hasOwnProperty('factory')) {
    mod.non = true
    return
  }

  // Create require
  var uri = mod.uri

  function require(id) {
    var m = mod.deps[id] || Module.get(require.resolve(id))
    if (m.status == STATUS.ERROR) {
      throw new Error('module was broken: ' + m.uri);
    }
    return m.exec()
  }

  require.resolve = function(id) {
    return Module.resolve(id, uri)
  }

  require.async = function(ids, callback) {
    Module.use(ids, callback, uri + "_async_" + cid())
    return require
  }

  // Exec factory
  var factory = mod.factory

  var exports = isFunction(factory) ?
    factory(require, mod.exports = {}, mod) :
    factory

  if (exports === undefined) {
    exports = mod.exports
  }

  // Reduce memory leak
  delete mod.factory

  mod.exports = exports
  mod.status = STATUS.EXECUTED

  // Emit `exec` event
  emit("exec", mod)

  return mod.exports
}

// Fetch a module
Module.prototype.fetch = function(requestCache) {
  var mod = this
  var uri = mod.uri

  mod.status = STATUS.FETCHING

  // Emit `fetch` event for plugins such as combo plugin
  var emitData = { uri: uri }
  emit("fetch", emitData)
  var requestUri = emitData.requestUri || uri

  // Empty uri or a non-CMD module
  if (!requestUri || fetchedList.hasOwnProperty(requestUri)) {
    mod.load()
    return
  }

  if (fetchingList.hasOwnProperty(requestUri)) {
    callbackList[requestUri].push(mod)
    return
  }

  fetchingList[requestUri] = true
  callbackList[requestUri] = [mod]

  // Emit `request` event for plugins such as text plugin
  emit("request", emitData = {
    uri: uri,
    requestUri: requestUri,
    onRequest: onRequest,
    charset: isFunction(data.charset) ? data.charset(requestUri) || 'utf-8' : data.charset
  })

  if (!emitData.requested) {
    requestCache ?
      requestCache[emitData.requestUri] = sendRequest :
      sendRequest()
  }

  function sendRequest() {
    seajs.request(emitData.requestUri, emitData.onRequest, emitData.charset)
  }

  function onRequest(error) {
    delete fetchingList[requestUri]
    fetchedList[requestUri] = true

    // Save meta data of anonymous module
    if (anonymousMeta) {
      Module.save(uri, anonymousMeta)
      anonymousMeta = null
    }

    // Call callbacks
    var m, mods = callbackList[requestUri]
    delete callbackList[requestUri]
    while ((m = mods.shift())) {
      // When 404 occurs, the params error will be true
      if(error === true) {
        m.error()
      }
      else {
        m.load()
      }
    }
  }
}

// Resolve id to uri
Module.resolve = function(id, refUri) {
  // Emit `resolve` event for plugins such as text plugin
  var emitData = { id: id, refUri: refUri }
  emit("resolve", emitData)

  return emitData.uri || seajs.resolve(emitData.id, refUri)
}

// Define a module
Module.define = function (id, deps, factory) {
  var argsLen = arguments.length

  // define(factory)
  if (argsLen === 1) {
    factory = id
    id = undefined
  }
  else if (argsLen === 2) {
    factory = deps

    // define(deps, factory)
    if (isArray(id)) {
      deps = id
      id = undefined
    }
    // define(id, factory)
    else {
      deps = undefined
    }
  }

  // Parse dependencies according to the module factory code
  if (!isArray(deps) && isFunction(factory)) {
    deps = typeof parseDependencies === "undefined" ? [] : parseDependencies(factory.toString())
  }

  var meta = {
    id: id,
    uri: Module.resolve(id),
    deps: deps,
    factory: factory
  }

  // Try to derive uri in IE6-9 for anonymous modules
  if (!isWebWorker && !meta.uri && doc.attachEvent && typeof getCurrentScript !== "undefined") {
    var script = getCurrentScript()

    if (script) {
      meta.uri = script.src
    }

    // NOTE: If the id-deriving methods above is failed, then falls back
    // to use onload event to get the uri
  }

  // Emit `define` event, used in nocache plugin, seajs node version etc
  emit("define", meta)

  meta.uri ? Module.save(meta.uri, meta) :
    // Save information for "saving" work in the script onload event
    anonymousMeta = meta
}

// Save meta data to cachedMods
Module.save = function(uri, meta) {
  var mod = Module.get(uri)

  // Do NOT override already saved modules
  if (mod.status < STATUS.SAVED) {
    mod.id = meta.id || uri
    mod.dependencies = meta.deps || []
    mod.factory = meta.factory
    mod.status = STATUS.SAVED

    emit("save", mod)
  }
}

// Get an existed module or create a new one
Module.get = function(uri, deps) {
  return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps))
}

// Use function is equal to load a anonymous module
Module.use = function (ids, callback, uri) {
  var mod = Module.get(uri, isArray(ids) ? ids : [ids])

  mod._entry.push(mod)
  mod.history = {}
  mod.remain = 1

  mod.callback = function() {
    var exports = []
    var uris = mod.resolve()

    for (var i = 0, len = uris.length; i < len; i++) {
      exports[i] = cachedMods[uris[i]].exec()
    }

    if (callback) {
      callback.apply(global, exports)
    }

    delete mod.callback
    delete mod.history
    delete mod.remain
    delete mod._entry
  }

  mod.load()
}


// Public API

seajs.use = function(ids, callback) {
  Module.use(ids, callback, data.cwd + "_use_" + cid())
  return seajs
}

Module.define.cmd = {}
global.define = Module.define


// For Developers

seajs.Module = Module
data.fetchedList = fetchedList
data.cid = cid

seajs.require = function(id) {
  var mod = Module.get(Module.resolve(id))
  if (mod.status < STATUS.EXECUTING) {
    mod.onload()
    mod.exec()
  }
  return mod.exports
}

/**
 * config.js - The configuration for the loader
 */

// The root path to use for id2uri parsing
data.base = loaderDir

// The loader directory
data.dir = loaderDir

// The loader's full path
data.loader = loaderPath

// The current working directory
data.cwd = cwd

// The charset for requesting files
data.charset = "utf-8"

// data.alias - An object containing shorthands of module id
// data.paths - An object containing path shorthands in module id
// data.vars - The {xxx} variables in module id
// data.map - An array containing rules to map module uri
// data.debug - Debug mode. The default value is false

seajs.config = function(configData) {

  for (var key in configData) {
    var curr = configData[key]
    var prev = data[key]

    // Merge object config such as alias, vars
    if (prev && isObject(prev)) {
      for (var k in curr) {
        prev[k] = curr[k]
      }
    }
    else {
      // Concat array config such as map
      if (isArray(prev)) {
        curr = prev.concat(curr)
      }
      // Make sure that `data.base` is an absolute path
      else if (key === "base") {
        // Make sure end with "/"
        if (curr.slice(-1) !== "/") {
          curr += "/"
        }
        curr = addBase(curr)
      }

      // Set config
      data[key] = curr
    }
  }

  emit("config", configData)
  return seajs
}

})(this);

(function(){
    /**
     * The Sea.js plugin for loading text resources such as template, json etc
     */

    var global = window
    var plugins = {}
    var uriCache = {}

    function register(o) {
        plugins[o.name] = o
    }

// normal text
    register({
        name: "text",

        ext: [".tpl", ".html"],

        exec: function(uri, content) {
            globalEval('define("' + uri + '#", [], "' + jsEscape(content) + '")')
        }
    })

// json
    register({
        name: "json",

        ext: [".json"],

        exec: function(uri, content) {
            globalEval('define("' + uri + '#", [], ' + content + ')')
        }
    })

// for handlebars template
    register({
        name: "handlebars",

        ext: [".handlebars"],

        exec: function(uri, content) {
            var code = [
                    'define("' + uri + '#", ["handlebars"], function(require, exports, module) {',
                    '  var source = "' + jsEscape(content) + '"',
                '  var Handlebars = require("handlebars")["default"]',
                '  module.exports = function(data, options) {',
                '    options || (options = {})',
                '    options.helpers || (options.helpers = {})',
                '    for (var key in Handlebars.helpers) {',
                '      options.helpers[key] = options.helpers[key] || Handlebars.helpers[key]',
                '    }',
                '    return Handlebars.compile(source)(data, options)',
                '  }',
                '})'
            ].join('\n')

            globalEval(code)
        }
    })


    seajs.on("resolve", function(data) {
        var id = data.id
        if (!id) return ""

        var pluginName
        var m

        // text!path/to/some.xx
        if ((m = id.match(/^(\w+)!(.+)$/)) && isPlugin(m[1])) {
            pluginName = m[1]
            id = m[2]
        }
        // http://path/to/a.tpl
        // http://path/to/c.json?v2
        else if ((m = id.match(/[^?]+(\.\w+)(?:\?|#|$)/))) {
            pluginName = getPluginName(m[1])
        }

        if (pluginName && id.indexOf("#") === -1) {
            id += "#"
        }

        var uri = seajs.resolve(id, data.refUri)

        if (pluginName) {
            uriCache[uri] = pluginName
        }

        data.uri = uri
    })

    seajs.on("request", function(data) {
        var name = uriCache[data.uri]

        if (name) {
            xhr(data.requestUri, function(content) {
                plugins[name].exec(data.uri, content)
                data.onRequest()
            })

            data.requested = true
        }
    })


// Helpers

    function isPlugin(name) {
        return name && plugins.hasOwnProperty(name)
    }

    function getPluginName(ext) {
        for (var k in plugins) {
            if (isPlugin(k)) {
                var exts = "," + plugins[k].ext.join(",") + ","
                if (exts.indexOf("," + ext + ",") > -1) {
                    return k
                }
            }
        }
    }

    function xhr(url, callback) {
        var r = global.XMLHttpRequest ?
            new global.XMLHttpRequest() :
            new global.ActiveXObject("Microsoft.XMLHTTP")

        r.open("GET", url, true)

        r.onreadystatechange = function() {
            if (r.readyState === 4) {
                // Support local file
                if (r.status > 399 && r.status < 600) {
                    throw new Error("Could not load: " + url + ", status = " + r.status)
                }
                else {
                    callback(r.responseText)
                }
            }
        }

        return r.send(null)
    }

    function globalEval(content) {
        if (content && /\S/.test(content)) {
            (global.execScript || function(content) {
                (global.eval || eval).call(global, content)
            })(content)
        }
    }

    function jsEscape(content) {
        return content.replace(/(["\\])/g, "\\$1")
            .replace(/[\f]/g, "\\f")
            .replace(/[\b]/g, "\\b")
            .replace(/[\n]/g, "\\n")
            .replace(/[\t]/g, "\\t")
            .replace(/[\r]/g, "\\r")
            .replace(/[\u2028]/g, "\\u2028")
            .replace(/[\u2029]/g, "\\u2029")
    }

    function pure(uri) {
        // Remove timestamp etc
        return uri.replace(/\?.*$/, "")
    }

    define("seajs/seajs-text/1.1.1/seajs-text-debug", [], {});
})();
/*! jQuery v1.10.2 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license*/
(function(e,t){var n,r,i=typeof t,o=e.location,a=e.document,s=a.documentElement,l=e.jQuery,u=e.$,c={},p=[],f="1.10.2",d=p.concat,h=p.push,g=p.slice,m=p.indexOf,y=c.toString,v=c.hasOwnProperty,b=f.trim,x=function(e,t){return new x.fn.init(e,t,r)},w=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=/\S+/g,C=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,N=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,k=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,E=/^[\],:{}\s]*$/,S=/(?:^|:|,)(?:\s*\[)+/g,A=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,j=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,D=/^-ms-/,L=/-([\da-z])/gi,H=function(e,t){return t.toUpperCase()},q=function(e){(a.addEventListener||"load"===e.type||"complete"===a.readyState)&&(_(),x.ready())},_=function(){a.addEventListener?(a.removeEventListener("DOMContentLoaded",q,!1),e.removeEventListener("load",q,!1)):(a.detachEvent("onreadystatechange",q),e.detachEvent("onload",q))};x.fn=x.prototype={jquery:f,constructor:x,init:function(e,n,r){var i,o;if(!e)return this;if("string"==typeof e){if(i="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:N.exec(e),!i||!i[1]&&n)return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e);if(i[1]){if(n=n instanceof x?n[0]:n,x.merge(this,x.parseHTML(i[1],n&&n.nodeType?n.ownerDocument||n:a,!0)),k.test(i[1])&&x.isPlainObject(n))for(i in n)x.isFunction(this[i])?this[i](n[i]):this.attr(i,n[i]);return this}if(o=a.getElementById(i[2]),o&&o.parentNode){if(o.id!==i[2])return r.find(e);this.length=1,this[0]=o}return this.context=a,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):x.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),x.makeArray(e,this))},selector:"",length:0,toArray:function(){return g.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=x.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return x.each(this,e,t)},ready:function(e){return x.ready.promise().done(e),this},slice:function(){return this.pushStack(g.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(x.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:h,sort:[].sort,splice:[].splice},x.fn.init.prototype=x.fn,x.extend=x.fn.extend=function(){var e,n,r,i,o,a,s=arguments[0]||{},l=1,u=arguments.length,c=!1;for("boolean"==typeof s&&(c=s,s=arguments[1]||{},l=2),"object"==typeof s||x.isFunction(s)||(s={}),u===l&&(s=this,--l);u>l;l++)if(null!=(o=arguments[l]))for(i in o)e=s[i],r=o[i],s!==r&&(c&&r&&(x.isPlainObject(r)||(n=x.isArray(r)))?(n?(n=!1,a=e&&x.isArray(e)?e:[]):a=e&&x.isPlainObject(e)?e:{},s[i]=x.extend(c,a,r)):r!==t&&(s[i]=r));return s},x.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),noConflict:function(t){return e.$===x&&(e.$=u),t&&e.jQuery===x&&(e.jQuery=l),x},isReady:!1,readyWait:1,holdReady:function(e){e?x.readyWait++:x.ready(!0)},ready:function(e){if(e===!0?!--x.readyWait:!x.isReady){if(!a.body)return setTimeout(x.ready);x.isReady=!0,e!==!0&&--x.readyWait>0||(n.resolveWith(a,[x]),x.fn.trigger&&x(a).trigger("ready").off("ready"))}},isFunction:function(e){return"function"===x.type(e)},isArray:Array.isArray||function(e){return"array"===x.type(e)},isWindow:function(e){return null!=e&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?c[y.call(e)]||"object":typeof e},isPlainObject:function(e){var n;if(!e||"object"!==x.type(e)||e.nodeType||x.isWindow(e))return!1;try{if(e.constructor&&!v.call(e,"constructor")&&!v.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(r){return!1}if(x.support.ownLast)for(n in e)return v.call(e,n);for(n in e);return n===t||v.call(e,n)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||a;var r=k.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=x.buildFragment([e],t,i),i&&x(i).remove(),x.merge([],r.childNodes))},parseJSON:function(n){return e.JSON&&e.JSON.parse?e.JSON.parse(n):null===n?n:"string"==typeof n&&(n=x.trim(n),n&&E.test(n.replace(A,"@").replace(j,"]").replace(S,"")))?Function("return "+n)():(x.error("Invalid JSON: "+n),t)},parseXML:function(n){var r,i;if(!n||"string"!=typeof n)return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(o){r=t}return r&&r.documentElement&&!r.getElementsByTagName("parsererror").length||x.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&x.trim(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(D,"ms-").replace(L,H)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,a=M(e);if(n){if(a){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(a){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:b&&!b.call("\ufeff\u00a0")?function(e){return null==e?"":b.call(e)}:function(e){return null==e?"":(e+"").replace(C,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(M(Object(e))?x.merge(n,"string"==typeof e?[e]:e):h.call(n,e)),n},inArray:function(e,t,n){var r;if(t){if(m)return m.call(t,e,n);for(r=t.length,n=n?0>n?Math.max(0,r+n):n:0;r>n;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,o=0;if("number"==typeof r)for(;r>o;o++)e[i++]=n[o];else while(n[o]!==t)e[i++]=n[o++];return e.length=i,e},grep:function(e,t,n){var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,a=M(e),s=[];if(a)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(s[s.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(s[s.length]=r);return d.apply([],s)},guid:1,proxy:function(e,n){var r,i,o;return"string"==typeof n&&(o=e[n],n=e,e=o),x.isFunction(e)?(r=g.call(arguments,2),i=function(){return e.apply(n||this,r.concat(g.call(arguments)))},i.guid=e.guid=e.guid||x.guid++,i):t},access:function(e,n,r,i,o,a,s){var l=0,u=e.length,c=null==r;if("object"===x.type(r)){o=!0;for(l in r)x.access(e,n,l,r[l],!0,a,s)}else if(i!==t&&(o=!0,x.isFunction(i)||(s=!0),c&&(s?(n.call(e,i),n=null):(c=n,n=function(e,t,n){return c.call(x(e),n)})),n))for(;u>l;l++)n(e[l],r,s?i:i.call(e[l],l,n(e[l],r)));return o?e:c?n.call(e):u?n(e[0],r):a},now:function(){return(new Date).getTime()},swap:function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=a[o];return i}}),x.ready.promise=function(t){if(!n)if(n=x.Deferred(),"complete"===a.readyState)setTimeout(x.ready);else if(a.addEventListener)a.addEventListener("DOMContentLoaded",q,!1),e.addEventListener("load",q,!1);else{a.attachEvent("onreadystatechange",q),e.attachEvent("onload",q);var r=!1;try{r=null==e.frameElement&&a.documentElement}catch(i){}r&&r.doScroll&&function o(){if(!x.isReady){try{r.doScroll("left")}catch(e){return setTimeout(o,50)}_(),x.ready()}}()}return n.promise(t)},x.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){c["[object "+t+"]"]=t.toLowerCase()});function M(e){var t=e.length,n=x.type(e);return x.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}r=x(a),function(e,t){var n,r,i,o,a,s,l,u,c,p,f,d,h,g,m,y,v,b="sizzle"+-new Date,w=e.document,T=0,C=0,N=st(),k=st(),E=st(),S=!1,A=function(e,t){return e===t?(S=!0,0):0},j=typeof t,D=1<<31,L={}.hasOwnProperty,H=[],q=H.pop,_=H.push,M=H.push,O=H.slice,F=H.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},B="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",P="[\\x20\\t\\r\\n\\f]",R="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",W=R.replace("w","w#"),$="\\["+P+"*("+R+")"+P+"*(?:([*^$|!~]?=)"+P+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+W+")|)|)"+P+"*\\]",I=":("+R+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+$.replace(3,8)+")*)|.*)\\)|)",z=RegExp("^"+P+"+|((?:^|[^\\\\])(?:\\\\.)*)"+P+"+$","g"),X=RegExp("^"+P+"*,"+P+"*"),U=RegExp("^"+P+"*([>+~]|"+P+")"+P+"*"),V=RegExp(P+"*[+~]"),Y=RegExp("="+P+"*([^\\]'\"]*)"+P+"*\\]","g"),J=RegExp(I),G=RegExp("^"+W+"$"),Q={ID:RegExp("^#("+R+")"),CLASS:RegExp("^\\.("+R+")"),TAG:RegExp("^("+R.replace("w","w*")+")"),ATTR:RegExp("^"+$),PSEUDO:RegExp("^"+I),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+P+"*(even|odd|(([+-]|)(\\d*)n|)"+P+"*(?:([+-]|)"+P+"*(\\d+)|))"+P+"*\\)|)","i"),bool:RegExp("^(?:"+B+")$","i"),needsContext:RegExp("^"+P+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+P+"*((?:-\\d)?\\d*)"+P+"*\\)|)(?=[^-]|$)","i")},K=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,et=/^(?:input|select|textarea|button)$/i,tt=/^h\d$/i,nt=/'|\\/g,rt=RegExp("\\\\([\\da-f]{1,6}"+P+"?|("+P+")|.)","ig"),it=function(e,t,n){var r="0x"+t-65536;return r!==r||n?t:0>r?String.fromCharCode(r+65536):String.fromCharCode(55296|r>>10,56320|1023&r)};try{M.apply(H=O.call(w.childNodes),w.childNodes),H[w.childNodes.length].nodeType}catch(ot){M={apply:H.length?function(e,t){_.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function at(e,t,n,i){var o,a,s,l,u,c,d,m,y,x;if((t?t.ownerDocument||t:w)!==f&&p(t),t=t||f,n=n||[],!e||"string"!=typeof e)return n;if(1!==(l=t.nodeType)&&9!==l)return[];if(h&&!i){if(o=Z.exec(e))if(s=o[1]){if(9===l){if(a=t.getElementById(s),!a||!a.parentNode)return n;if(a.id===s)return n.push(a),n}else if(t.ownerDocument&&(a=t.ownerDocument.getElementById(s))&&v(t,a)&&a.id===s)return n.push(a),n}else{if(o[2])return M.apply(n,t.getElementsByTagName(e)),n;if((s=o[3])&&r.getElementsByClassName&&t.getElementsByClassName)return M.apply(n,t.getElementsByClassName(s)),n}if(r.qsa&&(!g||!g.test(e))){if(m=d=b,y=t,x=9===l&&e,1===l&&"object"!==t.nodeName.toLowerCase()){c=mt(e),(d=t.getAttribute("id"))?m=d.replace(nt,"\\$&"):t.setAttribute("id",m),m="[id='"+m+"'] ",u=c.length;while(u--)c[u]=m+yt(c[u]);y=V.test(e)&&t.parentNode||t,x=c.join(",")}if(x)try{return M.apply(n,y.querySelectorAll(x)),n}catch(T){}finally{d||t.removeAttribute("id")}}}return kt(e.replace(z,"$1"),t,n,i)}function st(){var e=[];function t(n,r){return e.push(n+=" ")>o.cacheLength&&delete t[e.shift()],t[n]=r}return t}function lt(e){return e[b]=!0,e}function ut(e){var t=f.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function ct(e,t){var n=e.split("|"),r=e.length;while(r--)o.attrHandle[n[r]]=t}function pt(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&(~t.sourceIndex||D)-(~e.sourceIndex||D);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function ft(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function dt(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function ht(e){return lt(function(t){return t=+t,lt(function(n,r){var i,o=e([],n.length,t),a=o.length;while(a--)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}s=at.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},r=at.support={},p=at.setDocument=function(e){var n=e?e.ownerDocument||e:w,i=n.defaultView;return n!==f&&9===n.nodeType&&n.documentElement?(f=n,d=n.documentElement,h=!s(n),i&&i.attachEvent&&i!==i.top&&i.attachEvent("onbeforeunload",function(){p()}),r.attributes=ut(function(e){return e.className="i",!e.getAttribute("className")}),r.getElementsByTagName=ut(function(e){return e.appendChild(n.createComment("")),!e.getElementsByTagName("*").length}),r.getElementsByClassName=ut(function(e){return e.innerHTML="<div class='a'></div><div class='a i'></div>",e.firstChild.className="i",2===e.getElementsByClassName("i").length}),r.getById=ut(function(e){return d.appendChild(e).id=b,!n.getElementsByName||!n.getElementsByName(b).length}),r.getById?(o.find.ID=function(e,t){if(typeof t.getElementById!==j&&h){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},o.filter.ID=function(e){var t=e.replace(rt,it);return function(e){return e.getAttribute("id")===t}}):(delete o.find.ID,o.filter.ID=function(e){var t=e.replace(rt,it);return function(e){var n=typeof e.getAttributeNode!==j&&e.getAttributeNode("id");return n&&n.value===t}}),o.find.TAG=r.getElementsByTagName?function(e,n){return typeof n.getElementsByTagName!==j?n.getElementsByTagName(e):t}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},o.find.CLASS=r.getElementsByClassName&&function(e,n){return typeof n.getElementsByClassName!==j&&h?n.getElementsByClassName(e):t},m=[],g=[],(r.qsa=K.test(n.querySelectorAll))&&(ut(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||g.push("\\["+P+"*(?:value|"+B+")"),e.querySelectorAll(":checked").length||g.push(":checked")}),ut(function(e){var t=n.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("t",""),e.querySelectorAll("[t^='']").length&&g.push("[*^$]="+P+"*(?:''|\"\")"),e.querySelectorAll(":enabled").length||g.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),g.push(",.*:")})),(r.matchesSelector=K.test(y=d.webkitMatchesSelector||d.mozMatchesSelector||d.oMatchesSelector||d.msMatchesSelector))&&ut(function(e){r.disconnectedMatch=y.call(e,"div"),y.call(e,"[s!='']:x"),m.push("!=",I)}),g=g.length&&RegExp(g.join("|")),m=m.length&&RegExp(m.join("|")),v=K.test(d.contains)||d.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},A=d.compareDocumentPosition?function(e,t){if(e===t)return S=!0,0;var i=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t);return i?1&i||!r.sortDetached&&t.compareDocumentPosition(e)===i?e===n||v(w,e)?-1:t===n||v(w,t)?1:c?F.call(c,e)-F.call(c,t):0:4&i?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var r,i=0,o=e.parentNode,a=t.parentNode,s=[e],l=[t];if(e===t)return S=!0,0;if(!o||!a)return e===n?-1:t===n?1:o?-1:a?1:c?F.call(c,e)-F.call(c,t):0;if(o===a)return pt(e,t);r=e;while(r=r.parentNode)s.unshift(r);r=t;while(r=r.parentNode)l.unshift(r);while(s[i]===l[i])i++;return i?pt(s[i],l[i]):s[i]===w?-1:l[i]===w?1:0},n):f},at.matches=function(e,t){return at(e,null,null,t)},at.matchesSelector=function(e,t){if((e.ownerDocument||e)!==f&&p(e),t=t.replace(Y,"='$1']"),!(!r.matchesSelector||!h||m&&m.test(t)||g&&g.test(t)))try{var n=y.call(e,t);if(n||r.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(i){}return at(t,f,null,[e]).length>0},at.contains=function(e,t){return(e.ownerDocument||e)!==f&&p(e),v(e,t)},at.attr=function(e,n){(e.ownerDocument||e)!==f&&p(e);var i=o.attrHandle[n.toLowerCase()],a=i&&L.call(o.attrHandle,n.toLowerCase())?i(e,n,!h):t;return a===t?r.attributes||!h?e.getAttribute(n):(a=e.getAttributeNode(n))&&a.specified?a.value:null:a},at.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},at.uniqueSort=function(e){var t,n=[],i=0,o=0;if(S=!r.detectDuplicates,c=!r.sortStable&&e.slice(0),e.sort(A),S){while(t=e[o++])t===e[o]&&(i=n.push(o));while(i--)e.splice(n[i],1)}return e},a=at.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=a(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=a(t);return n},o=at.selectors={cacheLength:50,createPseudo:lt,match:Q,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(rt,it),e[3]=(e[4]||e[5]||"").replace(rt,it),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||at.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&at.error(e[0]),e},PSEUDO:function(e){var n,r=!e[5]&&e[2];return Q.CHILD.test(e[0])?null:(e[3]&&e[4]!==t?e[2]=e[4]:r&&J.test(r)&&(n=mt(r,!0))&&(n=r.indexOf(")",r.length-n)-r.length)&&(e[0]=e[0].slice(0,n),e[2]=r.slice(0,n)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(rt,it).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=N[e+" "];return t||(t=RegExp("(^|"+P+")"+e+"("+P+"|$)"))&&N(e,function(e){return t.test("string"==typeof e.className&&e.className||typeof e.getAttribute!==j&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=at.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,l){var u,c,p,f,d,h,g=o!==a?"nextSibling":"previousSibling",m=t.parentNode,y=s&&t.nodeName.toLowerCase(),v=!l&&!s;if(m){if(o){while(g){p=t;while(p=p[g])if(s?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;h=g="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?m.firstChild:m.lastChild],a&&v){c=m[b]||(m[b]={}),u=c[e]||[],d=u[0]===T&&u[1],f=u[0]===T&&u[2],p=d&&m.childNodes[d];while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[T,d,f];break}}else if(v&&(u=(t[b]||(t[b]={}))[e])&&u[0]===T)f=u[1];else while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if((s?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(v&&((p[b]||(p[b]={}))[e]=[T,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=o.pseudos[e]||o.setFilters[e.toLowerCase()]||at.error("unsupported pseudo: "+e);return r[b]?r(t):r.length>1?(n=[e,e,"",t],o.setFilters.hasOwnProperty(e.toLowerCase())?lt(function(e,n){var i,o=r(e,t),a=o.length;while(a--)i=F.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:lt(function(e){var t=[],n=[],r=l(e.replace(z,"$1"));return r[b]?lt(function(e,t,n,i){var o,a=r(e,null,i,[]),s=e.length;while(s--)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:lt(function(e){return function(t){return at(e,t).length>0}}),contains:lt(function(e){return function(t){return(t.textContent||t.innerText||a(t)).indexOf(e)>-1}}),lang:lt(function(e){return G.test(e||"")||at.error("unsupported lang: "+e),e=e.replace(rt,it).toLowerCase(),function(t){var n;do if(n=h?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===d},focus:function(e){return e===f.activeElement&&(!f.hasFocus||f.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!o.pseudos.empty(e)},header:function(e){return tt.test(e.nodeName)},input:function(e){return et.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:ht(function(){return[0]}),last:ht(function(e,t){return[t-1]}),eq:ht(function(e,t,n){return[0>n?n+t:n]}),even:ht(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:ht(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:ht(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:ht(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}},o.pseudos.nth=o.pseudos.eq;for(n in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})o.pseudos[n]=ft(n);for(n in{submit:!0,reset:!0})o.pseudos[n]=dt(n);function gt(){}gt.prototype=o.filters=o.pseudos,o.setFilters=new gt;function mt(e,t){var n,r,i,a,s,l,u,c=k[e+" "];if(c)return t?0:c.slice(0);s=e,l=[],u=o.preFilter;while(s){(!n||(r=X.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),l.push(i=[])),n=!1,(r=U.exec(s))&&(n=r.shift(),i.push({value:n,type:r[0].replace(z," ")}),s=s.slice(n.length));for(a in o.filter)!(r=Q[a].exec(s))||u[a]&&!(r=u[a](r))||(n=r.shift(),i.push({value:n,type:a,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?at.error(e):k(e,l).slice(0)}function yt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function vt(e,t,n){var r=t.dir,o=n&&"parentNode"===r,a=C++;return t.first?function(t,n,i){while(t=t[r])if(1===t.nodeType||o)return e(t,n,i)}:function(t,n,s){var l,u,c,p=T+" "+a;if(s){while(t=t[r])if((1===t.nodeType||o)&&e(t,n,s))return!0}else while(t=t[r])if(1===t.nodeType||o)if(c=t[b]||(t[b]={}),(u=c[r])&&u[0]===p){if((l=u[1])===!0||l===i)return l===!0}else if(u=c[r]=[p],u[1]=e(t,n,s)||i,u[1]===!0)return!0}}function bt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function xt(e,t,n,r,i){var o,a=[],s=0,l=e.length,u=null!=t;for(;l>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),u&&t.push(s));return a}function wt(e,t,n,r,i,o){return r&&!r[b]&&(r=wt(r)),i&&!i[b]&&(i=wt(i,o)),lt(function(o,a,s,l){var u,c,p,f=[],d=[],h=a.length,g=o||Nt(t||"*",s.nodeType?[s]:s,[]),m=!e||!o&&t?g:xt(g,f,e,s,l),y=n?i||(o?e:h||r)?[]:a:m;if(n&&n(m,y,s,l),r){u=xt(y,d),r(u,[],s,l),c=u.length;while(c--)(p=u[c])&&(y[d[c]]=!(m[d[c]]=p))}if(o){if(i||e){if(i){u=[],c=y.length;while(c--)(p=y[c])&&u.push(m[c]=p);i(null,y=[],u,l)}c=y.length;while(c--)(p=y[c])&&(u=i?F.call(o,p):f[c])>-1&&(o[u]=!(a[u]=p))}}else y=xt(y===a?y.splice(h,y.length):y),i?i(null,a,y,l):M.apply(a,y)})}function Tt(e){var t,n,r,i=e.length,a=o.relative[e[0].type],s=a||o.relative[" "],l=a?1:0,c=vt(function(e){return e===t},s,!0),p=vt(function(e){return F.call(t,e)>-1},s,!0),f=[function(e,n,r){return!a&&(r||n!==u)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;i>l;l++)if(n=o.relative[e[l].type])f=[vt(bt(f),n)];else{if(n=o.filter[e[l].type].apply(null,e[l].matches),n[b]){for(r=++l;i>r;r++)if(o.relative[e[r].type])break;return wt(l>1&&bt(f),l>1&&yt(e.slice(0,l-1).concat({value:" "===e[l-2].type?"*":""})).replace(z,"$1"),n,r>l&&Tt(e.slice(l,r)),i>r&&Tt(e=e.slice(r)),i>r&&yt(e))}f.push(n)}return bt(f)}function Ct(e,t){var n=0,r=t.length>0,a=e.length>0,s=function(s,l,c,p,d){var h,g,m,y=[],v=0,b="0",x=s&&[],w=null!=d,C=u,N=s||a&&o.find.TAG("*",d&&l.parentNode||l),k=T+=null==C?1:Math.random()||.1;for(w&&(u=l!==f&&l,i=n);null!=(h=N[b]);b++){if(a&&h){g=0;while(m=e[g++])if(m(h,l,c)){p.push(h);break}w&&(T=k,i=++n)}r&&((h=!m&&h)&&v--,s&&x.push(h))}if(v+=b,r&&b!==v){g=0;while(m=t[g++])m(x,y,l,c);if(s){if(v>0)while(b--)x[b]||y[b]||(y[b]=q.call(p));y=xt(y)}M.apply(p,y),w&&!s&&y.length>0&&v+t.length>1&&at.uniqueSort(p)}return w&&(T=k,u=C),x};return r?lt(s):s}l=at.compile=function(e,t){var n,r=[],i=[],o=E[e+" "];if(!o){t||(t=mt(e)),n=t.length;while(n--)o=Tt(t[n]),o[b]?r.push(o):i.push(o);o=E(e,Ct(i,r))}return o};function Nt(e,t,n){var r=0,i=t.length;for(;i>r;r++)at(e,t[r],n);return n}function kt(e,t,n,i){var a,s,u,c,p,f=mt(e);if(!i&&1===f.length){if(s=f[0]=f[0].slice(0),s.length>2&&"ID"===(u=s[0]).type&&r.getById&&9===t.nodeType&&h&&o.relative[s[1].type]){if(t=(o.find.ID(u.matches[0].replace(rt,it),t)||[])[0],!t)return n;e=e.slice(s.shift().value.length)}a=Q.needsContext.test(e)?0:s.length;while(a--){if(u=s[a],o.relative[c=u.type])break;if((p=o.find[c])&&(i=p(u.matches[0].replace(rt,it),V.test(s[0].type)&&t.parentNode||t))){if(s.splice(a,1),e=i.length&&yt(s),!e)return M.apply(n,i),n;break}}}return l(e,f)(i,t,!h,n,V.test(e)),n}r.sortStable=b.split("").sort(A).join("")===b,r.detectDuplicates=S,p(),r.sortDetached=ut(function(e){return 1&e.compareDocumentPosition(f.createElement("div"))}),ut(function(e){return e.innerHTML="<a href='#'></a>","#"===e.firstChild.getAttribute("href")})||ct("type|href|height|width",function(e,n,r){return r?t:e.getAttribute(n,"type"===n.toLowerCase()?1:2)}),r.attributes&&ut(function(e){return e.innerHTML="<input/>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")})||ct("value",function(e,n,r){return r||"input"!==e.nodeName.toLowerCase()?t:e.defaultValue}),ut(function(e){return null==e.getAttribute("disabled")})||ct(B,function(e,n,r){var i;return r?t:(i=e.getAttributeNode(n))&&i.specified?i.value:e[n]===!0?n.toLowerCase():null}),x.find=at,x.expr=at.selectors,x.expr[":"]=x.expr.pseudos,x.unique=at.uniqueSort,x.text=at.getText,x.isXMLDoc=at.isXML,x.contains=at.contains}(e);var O={};function F(e){var t=O[e]={};return x.each(e.match(T)||[],function(e,n){t[n]=!0}),t}x.Callbacks=function(e){e="string"==typeof e?O[e]||F(e):x.extend({},e);var n,r,i,o,a,s,l=[],u=!e.once&&[],c=function(t){for(r=e.memory&&t,i=!0,a=s||0,s=0,o=l.length,n=!0;l&&o>a;a++)if(l[a].apply(t[0],t[1])===!1&&e.stopOnFalse){r=!1;break}n=!1,l&&(u?u.length&&c(u.shift()):r?l=[]:p.disable())},p={add:function(){if(l){var t=l.length;(function i(t){x.each(t,function(t,n){var r=x.type(n);"function"===r?e.unique&&p.has(n)||l.push(n):n&&n.length&&"string"!==r&&i(n)})})(arguments),n?o=l.length:r&&(s=t,c(r))}return this},remove:function(){return l&&x.each(arguments,function(e,t){var r;while((r=x.inArray(t,l,r))>-1)l.splice(r,1),n&&(o>=r&&o--,a>=r&&a--)}),this},has:function(e){return e?x.inArray(e,l)>-1:!(!l||!l.length)},empty:function(){return l=[],o=0,this},disable:function(){return l=u=r=t,this},disabled:function(){return!l},lock:function(){return u=t,r||p.disable(),this},locked:function(){return!u},fireWith:function(e,t){return!l||i&&!u||(t=t||[],t=[e,t.slice?t.slice():t],n?u.push(t):c(t)),this},fire:function(){return p.fireWith(this,arguments),this},fired:function(){return!!i}};return p},x.extend({Deferred:function(e){var t=[["resolve","done",x.Callbacks("once memory"),"resolved"],["reject","fail",x.Callbacks("once memory"),"rejected"],["notify","progress",x.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return x.Deferred(function(n){x.each(t,function(t,o){var a=o[0],s=x.isFunction(e[t])&&e[t];i[o[1]](function(){var e=s&&s.apply(this,arguments);e&&x.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[a+"With"](this===r?n.promise():this,s?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?x.extend(e,r):r}},i={};return r.pipe=r.then,x.each(t,function(e,o){var a=o[2],s=o[3];r[o[1]]=a.add,s&&a.add(function(){n=s},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=a.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=g.call(arguments),r=n.length,i=1!==r||e&&x.isFunction(e.promise)?r:0,o=1===i?e:x.Deferred(),a=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?g.call(arguments):r,n===s?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},s,l,u;if(r>1)for(s=Array(r),l=Array(r),u=Array(r);r>t;t++)n[t]&&x.isFunction(n[t].promise)?n[t].promise().done(a(t,u,n)).fail(o.reject).progress(a(t,l,s)):--i;return i||o.resolveWith(u,n),o.promise()}}),x.support=function(t){var n,r,o,s,l,u,c,p,f,d=a.createElement("div");if(d.setAttribute("className","t"),d.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=d.getElementsByTagName("*")||[],r=d.getElementsByTagName("a")[0],!r||!r.style||!n.length)return t;s=a.createElement("select"),u=s.appendChild(a.createElement("option")),o=d.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t.getSetAttribute="t"!==d.className,t.leadingWhitespace=3===d.firstChild.nodeType,t.tbody=!d.getElementsByTagName("tbody").length,t.htmlSerialize=!!d.getElementsByTagName("link").length,t.style=/top/.test(r.getAttribute("style")),t.hrefNormalized="/a"===r.getAttribute("href"),t.opacity=/^0.5/.test(r.style.opacity),t.cssFloat=!!r.style.cssFloat,t.checkOn=!!o.value,t.optSelected=u.selected,t.enctype=!!a.createElement("form").enctype,t.html5Clone="<:nav></:nav>"!==a.createElement("nav").cloneNode(!0).outerHTML,t.inlineBlockNeedsLayout=!1,t.shrinkWrapBlocks=!1,t.pixelPosition=!1,t.deleteExpando=!0,t.noCloneEvent=!0,t.reliableMarginRight=!0,t.boxSizingReliable=!0,o.checked=!0,t.noCloneChecked=o.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!u.disabled;try{delete d.test}catch(h){t.deleteExpando=!1}o=a.createElement("input"),o.setAttribute("value",""),t.input=""===o.getAttribute("value"),o.value="t",o.setAttribute("type","radio"),t.radioValue="t"===o.value,o.setAttribute("checked","t"),o.setAttribute("name","t"),l=a.createDocumentFragment(),l.appendChild(o),t.appendChecked=o.checked,t.checkClone=l.cloneNode(!0).cloneNode(!0).lastChild.checked,d.attachEvent&&(d.attachEvent("onclick",function(){t.noCloneEvent=!1}),d.cloneNode(!0).click());for(f in{submit:!0,change:!0,focusin:!0})d.setAttribute(c="on"+f,"t"),t[f+"Bubbles"]=c in e||d.attributes[c].expando===!1;d.style.backgroundClip="content-box",d.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===d.style.backgroundClip;for(f in x(t))break;return t.ownLast="0"!==f,x(function(){var n,r,o,s="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",l=a.getElementsByTagName("body")[0];l&&(n=a.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",l.appendChild(n).appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",o=d.getElementsByTagName("td"),o[0].style.cssText="padding:0;margin:0;border:0;display:none",p=0===o[0].offsetHeight,o[0].style.display="",o[1].style.display="none",t.reliableHiddenOffsets=p&&0===o[0].offsetHeight,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",x.swap(l,null!=l.style.zoom?{zoom:1}:{},function(){t.boxSizing=4===d.offsetWidth}),e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(d,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(d,null)||{width:"4px"}).width,r=d.appendChild(a.createElement("div")),r.style.cssText=d.style.cssText=s,r.style.marginRight=r.style.width="0",d.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),typeof d.style.zoom!==i&&(d.innerHTML="",d.style.cssText=s+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=3===d.offsetWidth,d.style.display="block",d.innerHTML="<div></div>",d.firstChild.style.width="5px",t.shrinkWrapBlocks=3!==d.offsetWidth,t.inlineBlockNeedsLayout&&(l.style.zoom=1)),l.removeChild(n),n=d=o=r=null)}),n=s=l=u=r=o=null,t
}({});var B=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,P=/([A-Z])/g;function R(e,n,r,i){if(x.acceptData(e)){var o,a,s=x.expando,l=e.nodeType,u=l?x.cache:e,c=l?e[s]:e[s]&&s;if(c&&u[c]&&(i||u[c].data)||r!==t||"string"!=typeof n)return c||(c=l?e[s]=p.pop()||x.guid++:s),u[c]||(u[c]=l?{}:{toJSON:x.noop}),("object"==typeof n||"function"==typeof n)&&(i?u[c]=x.extend(u[c],n):u[c].data=x.extend(u[c].data,n)),a=u[c],i||(a.data||(a.data={}),a=a.data),r!==t&&(a[x.camelCase(n)]=r),"string"==typeof n?(o=a[n],null==o&&(o=a[x.camelCase(n)])):o=a,o}}function W(e,t,n){if(x.acceptData(e)){var r,i,o=e.nodeType,a=o?x.cache:e,s=o?e[x.expando]:x.expando;if(a[s]){if(t&&(r=n?a[s]:a[s].data)){x.isArray(t)?t=t.concat(x.map(t,x.camelCase)):t in r?t=[t]:(t=x.camelCase(t),t=t in r?[t]:t.split(" ")),i=t.length;while(i--)delete r[t[i]];if(n?!I(r):!x.isEmptyObject(r))return}(n||(delete a[s].data,I(a[s])))&&(o?x.cleanData([e],!0):x.support.deleteExpando||a!=a.window?delete a[s]:a[s]=null)}}}x.extend({cache:{},noData:{applet:!0,embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(e){return e=e.nodeType?x.cache[e[x.expando]]:e[x.expando],!!e&&!I(e)},data:function(e,t,n){return R(e,t,n)},removeData:function(e,t){return W(e,t)},_data:function(e,t,n){return R(e,t,n,!0)},_removeData:function(e,t){return W(e,t,!0)},acceptData:function(e){if(e.nodeType&&1!==e.nodeType&&9!==e.nodeType)return!1;var t=e.nodeName&&x.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),x.fn.extend({data:function(e,n){var r,i,o=null,a=0,s=this[0];if(e===t){if(this.length&&(o=x.data(s),1===s.nodeType&&!x._data(s,"parsedAttrs"))){for(r=s.attributes;r.length>a;a++)i=r[a].name,0===i.indexOf("data-")&&(i=x.camelCase(i.slice(5)),$(s,i,o[i]));x._data(s,"parsedAttrs",!0)}return o}return"object"==typeof e?this.each(function(){x.data(this,e)}):arguments.length>1?this.each(function(){x.data(this,e,n)}):s?$(s,e,x.data(s,e)):null},removeData:function(e){return this.each(function(){x.removeData(this,e)})}});function $(e,n,r){if(r===t&&1===e.nodeType){var i="data-"+n.replace(P,"-$1").toLowerCase();if(r=e.getAttribute(i),"string"==typeof r){try{r="true"===r?!0:"false"===r?!1:"null"===r?null:+r+""===r?+r:B.test(r)?x.parseJSON(r):r}catch(o){}x.data(e,n,r)}else r=t}return r}function I(e){var t;for(t in e)if(("data"!==t||!x.isEmptyObject(e[t]))&&"toJSON"!==t)return!1;return!0}x.extend({queue:function(e,n,r){var i;return e?(n=(n||"fx")+"queue",i=x._data(e,n),r&&(!i||x.isArray(r)?i=x._data(e,n,x.makeArray(r)):i.push(r)),i||[]):t},dequeue:function(e,t){t=t||"fx";var n=x.queue(e,t),r=n.length,i=n.shift(),o=x._queueHooks(e,t),a=function(){x.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,a,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return x._data(e,n)||x._data(e,n,{empty:x.Callbacks("once memory").add(function(){x._removeData(e,t+"queue"),x._removeData(e,n)})})}}),x.fn.extend({queue:function(e,n){var r=2;return"string"!=typeof e&&(n=e,e="fx",r--),r>arguments.length?x.queue(this[0],e):n===t?this:this.each(function(){var t=x.queue(this,e,n);x._queueHooks(this,e),"fx"===e&&"inprogress"!==t[0]&&x.dequeue(this,e)})},dequeue:function(e){return this.each(function(){x.dequeue(this,e)})},delay:function(e,t){return e=x.fx?x.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,o=x.Deferred(),a=this,s=this.length,l=function(){--i||o.resolveWith(a,[a])};"string"!=typeof e&&(n=e,e=t),e=e||"fx";while(s--)r=x._data(a[s],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(l));return l(),o.promise(n)}});var z,X,U=/[\t\r\n\f]/g,V=/\r/g,Y=/^(?:input|select|textarea|button|object)$/i,J=/^(?:a|area)$/i,G=/^(?:checked|selected)$/i,Q=x.support.getSetAttribute,K=x.support.input;x.fn.extend({attr:function(e,t){return x.access(this,x.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){x.removeAttr(this,e)})},prop:function(e,t){return x.access(this,x.prop,e,t,arguments.length>1)},removeProp:function(e){return e=x.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,a=0,s=this.length,l="string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).addClass(e.call(this,t,this.className))});if(l)for(t=(e||"").match(T)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(U," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=x.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,a=0,s=this.length,l=0===arguments.length||"string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).removeClass(e.call(this,t,this.className))});if(l)for(t=(e||"").match(T)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(U," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?x.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e;return"boolean"==typeof t&&"string"===n?t?this.addClass(e):this.removeClass(e):x.isFunction(e)?this.each(function(n){x(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var t,r=0,o=x(this),a=e.match(T)||[];while(t=a[r++])o.hasClass(t)?o.removeClass(t):o.addClass(t)}else(n===i||"boolean"===n)&&(this.className&&x._data(this,"__className__",this.className),this.className=this.className||e===!1?"":x._data(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(U," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,o=this[0];{if(arguments.length)return i=x.isFunction(e),this.each(function(n){var o;1===this.nodeType&&(o=i?e.call(this,n,x(this).val()):e,null==o?o="":"number"==typeof o?o+="":x.isArray(o)&&(o=x.map(o,function(e){return null==e?"":e+""})),r=x.valHooks[this.type]||x.valHooks[this.nodeName.toLowerCase()],r&&"set"in r&&r.set(this,o,"value")!==t||(this.value=o))});if(o)return r=x.valHooks[o.type]||x.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(n=r.get(o,"value"))!==t?n:(n=o.value,"string"==typeof n?n.replace(V,""):null==n?"":n)}}}),x.extend({valHooks:{option:{get:function(e){var t=x.find.attr(e,"value");return null!=t?t:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,a=o?null:[],s=o?i+1:r.length,l=0>i?s:o?i:0;for(;s>l;l++)if(n=r[l],!(!n.selected&&l!==i||(x.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&x.nodeName(n.parentNode,"optgroup"))){if(t=x(n).val(),o)return t;a.push(t)}return a},set:function(e,t){var n,r,i=e.options,o=x.makeArray(t),a=i.length;while(a--)r=i[a],(r.selected=x.inArray(x(r).val(),o)>=0)&&(n=!0);return n||(e.selectedIndex=-1),o}}},attr:function(e,n,r){var o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return typeof e.getAttribute===i?x.prop(e,n,r):(1===s&&x.isXMLDoc(e)||(n=n.toLowerCase(),o=x.attrHooks[n]||(x.expr.match.bool.test(n)?X:z)),r===t?o&&"get"in o&&null!==(a=o.get(e,n))?a:(a=x.find.attr(e,n),null==a?t:a):null!==r?o&&"set"in o&&(a=o.set(e,r,n))!==t?a:(e.setAttribute(n,r+""),r):(x.removeAttr(e,n),t))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(T);if(o&&1===e.nodeType)while(n=o[i++])r=x.propFix[n]||n,x.expr.match.bool.test(n)?K&&Q||!G.test(n)?e[r]=!1:e[x.camelCase("default-"+n)]=e[r]=!1:x.attr(e,n,""),e.removeAttribute(Q?n:r)},attrHooks:{type:{set:function(e,t){if(!x.support.radioValue&&"radio"===t&&x.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{"for":"htmlFor","class":"className"},prop:function(e,n,r){var i,o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return a=1!==s||!x.isXMLDoc(e),a&&(n=x.propFix[n]||n,o=x.propHooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&null!==(i=o.get(e,n))?i:e[n]},propHooks:{tabIndex:{get:function(e){var t=x.find.attr(e,"tabindex");return t?parseInt(t,10):Y.test(e.nodeName)||J.test(e.nodeName)&&e.href?0:-1}}}}),X={set:function(e,t,n){return t===!1?x.removeAttr(e,n):K&&Q||!G.test(n)?e.setAttribute(!Q&&x.propFix[n]||n,n):e[x.camelCase("default-"+n)]=e[n]=!0,n}},x.each(x.expr.match.bool.source.match(/\w+/g),function(e,n){var r=x.expr.attrHandle[n]||x.find.attr;x.expr.attrHandle[n]=K&&Q||!G.test(n)?function(e,n,i){var o=x.expr.attrHandle[n],a=i?t:(x.expr.attrHandle[n]=t)!=r(e,n,i)?n.toLowerCase():null;return x.expr.attrHandle[n]=o,a}:function(e,n,r){return r?t:e[x.camelCase("default-"+n)]?n.toLowerCase():null}}),K&&Q||(x.attrHooks.value={set:function(e,n,r){return x.nodeName(e,"input")?(e.defaultValue=n,t):z&&z.set(e,n,r)}}),Q||(z={set:function(e,n,r){var i=e.getAttributeNode(r);return i||e.setAttributeNode(i=e.ownerDocument.createAttribute(r)),i.value=n+="","value"===r||n===e.getAttribute(r)?n:t}},x.expr.attrHandle.id=x.expr.attrHandle.name=x.expr.attrHandle.coords=function(e,n,r){var i;return r?t:(i=e.getAttributeNode(n))&&""!==i.value?i.value:null},x.valHooks.button={get:function(e,n){var r=e.getAttributeNode(n);return r&&r.specified?r.value:t},set:z.set},x.attrHooks.contenteditable={set:function(e,t,n){z.set(e,""===t?!1:t,n)}},x.each(["width","height"],function(e,n){x.attrHooks[n]={set:function(e,r){return""===r?(e.setAttribute(n,"auto"),r):t}}})),x.support.hrefNormalized||x.each(["href","src"],function(e,t){x.propHooks[t]={get:function(e){return e.getAttribute(t,4)}}}),x.support.style||(x.attrHooks.style={get:function(e){return e.style.cssText||t},set:function(e,t){return e.style.cssText=t+""}}),x.support.optSelected||(x.propHooks.selected={get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}}),x.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){x.propFix[this.toLowerCase()]=this}),x.support.enctype||(x.propFix.enctype="encoding"),x.each(["radio","checkbox"],function(){x.valHooks[this]={set:function(e,n){return x.isArray(n)?e.checked=x.inArray(x(e).val(),n)>=0:t}},x.support.checkOn||(x.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var Z=/^(?:input|select|textarea)$/i,et=/^key/,tt=/^(?:mouse|contextmenu)|click/,nt=/^(?:focusinfocus|focusoutblur)$/,rt=/^([^.]*)(?:\.(.+)|)$/;function it(){return!0}function ot(){return!1}function at(){try{return a.activeElement}catch(e){}}x.event={global:{},add:function(e,n,r,o,a){var s,l,u,c,p,f,d,h,g,m,y,v=x._data(e);if(v){r.handler&&(c=r,r=c.handler,a=c.selector),r.guid||(r.guid=x.guid++),(l=v.events)||(l=v.events={}),(f=v.handle)||(f=v.handle=function(e){return typeof x===i||e&&x.event.triggered===e.type?t:x.event.dispatch.apply(f.elem,arguments)},f.elem=e),n=(n||"").match(T)||[""],u=n.length;while(u--)s=rt.exec(n[u])||[],g=y=s[1],m=(s[2]||"").split(".").sort(),g&&(p=x.event.special[g]||{},g=(a?p.delegateType:p.bindType)||g,p=x.event.special[g]||{},d=x.extend({type:g,origType:y,data:o,handler:r,guid:r.guid,selector:a,needsContext:a&&x.expr.match.needsContext.test(a),namespace:m.join(".")},c),(h=l[g])||(h=l[g]=[],h.delegateCount=0,p.setup&&p.setup.call(e,o,m,f)!==!1||(e.addEventListener?e.addEventListener(g,f,!1):e.attachEvent&&e.attachEvent("on"+g,f))),p.add&&(p.add.call(e,d),d.handler.guid||(d.handler.guid=r.guid)),a?h.splice(h.delegateCount++,0,d):h.push(d),x.event.global[g]=!0);e=null}},remove:function(e,t,n,r,i){var o,a,s,l,u,c,p,f,d,h,g,m=x.hasData(e)&&x._data(e);if(m&&(c=m.events)){t=(t||"").match(T)||[""],u=t.length;while(u--)if(s=rt.exec(t[u])||[],d=g=s[1],h=(s[2]||"").split(".").sort(),d){p=x.event.special[d]||{},d=(r?p.delegateType:p.bindType)||d,f=c[d]||[],s=s[2]&&RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),l=o=f.length;while(o--)a=f[o],!i&&g!==a.origType||n&&n.guid!==a.guid||s&&!s.test(a.namespace)||r&&r!==a.selector&&("**"!==r||!a.selector)||(f.splice(o,1),a.selector&&f.delegateCount--,p.remove&&p.remove.call(e,a));l&&!f.length&&(p.teardown&&p.teardown.call(e,h,m.handle)!==!1||x.removeEvent(e,d,m.handle),delete c[d])}else for(d in c)x.event.remove(e,d+t[u],n,r,!0);x.isEmptyObject(c)&&(delete m.handle,x._removeData(e,"events"))}},trigger:function(n,r,i,o){var s,l,u,c,p,f,d,h=[i||a],g=v.call(n,"type")?n.type:n,m=v.call(n,"namespace")?n.namespace.split("."):[];if(u=f=i=i||a,3!==i.nodeType&&8!==i.nodeType&&!nt.test(g+x.event.triggered)&&(g.indexOf(".")>=0&&(m=g.split("."),g=m.shift(),m.sort()),l=0>g.indexOf(":")&&"on"+g,n=n[x.expando]?n:new x.Event(g,"object"==typeof n&&n),n.isTrigger=o?2:3,n.namespace=m.join("."),n.namespace_re=n.namespace?RegExp("(^|\\.)"+m.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,n.result=t,n.target||(n.target=i),r=null==r?[n]:x.makeArray(r,[n]),p=x.event.special[g]||{},o||!p.trigger||p.trigger.apply(i,r)!==!1)){if(!o&&!p.noBubble&&!x.isWindow(i)){for(c=p.delegateType||g,nt.test(c+g)||(u=u.parentNode);u;u=u.parentNode)h.push(u),f=u;f===(i.ownerDocument||a)&&h.push(f.defaultView||f.parentWindow||e)}d=0;while((u=h[d++])&&!n.isPropagationStopped())n.type=d>1?c:p.bindType||g,s=(x._data(u,"events")||{})[n.type]&&x._data(u,"handle"),s&&s.apply(u,r),s=l&&u[l],s&&x.acceptData(u)&&s.apply&&s.apply(u,r)===!1&&n.preventDefault();if(n.type=g,!o&&!n.isDefaultPrevented()&&(!p._default||p._default.apply(h.pop(),r)===!1)&&x.acceptData(i)&&l&&i[g]&&!x.isWindow(i)){f=i[l],f&&(i[l]=null),x.event.triggered=g;try{i[g]()}catch(y){}x.event.triggered=t,f&&(i[l]=f)}return n.result}},dispatch:function(e){e=x.event.fix(e);var n,r,i,o,a,s=[],l=g.call(arguments),u=(x._data(this,"events")||{})[e.type]||[],c=x.event.special[e.type]||{};if(l[0]=e,e.delegateTarget=this,!c.preDispatch||c.preDispatch.call(this,e)!==!1){s=x.event.handlers.call(this,e,u),n=0;while((o=s[n++])&&!e.isPropagationStopped()){e.currentTarget=o.elem,a=0;while((i=o.handlers[a++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(i.namespace))&&(e.handleObj=i,e.data=i.data,r=((x.event.special[i.origType]||{}).handle||i.handler).apply(o.elem,l),r!==t&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,e),e.result}},handlers:function(e,n){var r,i,o,a,s=[],l=n.delegateCount,u=e.target;if(l&&u.nodeType&&(!e.button||"click"!==e.type))for(;u!=this;u=u.parentNode||this)if(1===u.nodeType&&(u.disabled!==!0||"click"!==e.type)){for(o=[],a=0;l>a;a++)i=n[a],r=i.selector+" ",o[r]===t&&(o[r]=i.needsContext?x(r,this).index(u)>=0:x.find(r,this,null,[u]).length),o[r]&&o.push(i);o.length&&s.push({elem:u,handlers:o})}return n.length>l&&s.push({elem:this,handlers:n.slice(l)}),s},fix:function(e){if(e[x.expando])return e;var t,n,r,i=e.type,o=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=tt.test(i)?this.mouseHooks:et.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new x.Event(o),t=r.length;while(t--)n=r[t],e[n]=o[n];return e.target||(e.target=o.srcElement||a),3===e.target.nodeType&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,o):e},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp views which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,i,o,s=n.button,l=n.fromElement;return null==e.pageX&&null!=n.clientX&&(i=e.target.ownerDocument||a,o=i.documentElement,r=i.body,e.pageX=n.clientX+(o&&o.scrollLeft||r&&r.scrollLeft||0)-(o&&o.clientLeft||r&&r.clientLeft||0),e.pageY=n.clientY+(o&&o.scrollTop||r&&r.scrollTop||0)-(o&&o.clientTop||r&&r.clientTop||0)),!e.relatedTarget&&l&&(e.relatedTarget=l===e.target?n.toElement:l),e.which||s===t||(e.which=1&s?1:2&s?3:4&s?2:0),e}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==at()&&this.focus)try{return this.focus(),!1}catch(e){}},delegateType:"focusin"},blur:{trigger:function(){return this===at()&&this.blur?(this.blur(),!1):t},delegateType:"focusout"},click:{trigger:function(){return x.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):t},_default:function(e){return x.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){e.result!==t&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=x.extend(new x.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?x.event.trigger(i,null,t):x.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},x.removeEvent=a.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]===i&&(e[r]=null),e.detachEvent(r,n))},x.Event=function(e,n){return this instanceof x.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?it:ot):this.type=e,n&&x.extend(this,n),this.timeStamp=e&&e.timeStamp||x.now(),this[x.expando]=!0,t):new x.Event(e,n)},x.Event.prototype={isDefaultPrevented:ot,isPropagationStopped:ot,isImmediatePropagationStopped:ot,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=it,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=it,e&&(e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=it,this.stopPropagation()}},x.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){x.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!x.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),x.support.submitBubbles||(x.event.special.submit={setup:function(){return x.nodeName(this,"form")?!1:(x.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=x.nodeName(n,"input")||x.nodeName(n,"button")?n.form:t;r&&!x._data(r,"submitBubbles")&&(x.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),x._data(r,"submitBubbles",!0))}),t)},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&x.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){return x.nodeName(this,"form")?!1:(x.event.remove(this,"._submit"),t)}}),x.support.changeBubbles||(x.event.special.change={setup:function(){return Z.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(x.event.add(this,"propertychange._change",function(e){"checked"===e.originalEvent.propertyName&&(this._just_changed=!0)}),x.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),x.event.simulate("change",this,e,!0)})),!1):(x.event.add(this,"beforeactivate._change",function(e){var t=e.target;Z.test(t.nodeName)&&!x._data(t,"changeBubbles")&&(x.event.add(t,"change._change",function(e){!this.parentNode||e.isSimulated||e.isTrigger||x.event.simulate("change",this.parentNode,e,!0)}),x._data(t,"changeBubbles",!0))}),t)},handle:function(e){var n=e.target;return this!==n||e.isSimulated||e.isTrigger||"radio"!==n.type&&"checkbox"!==n.type?e.handleObj.handler.apply(this,arguments):t},teardown:function(){return x.event.remove(this,"._change"),!Z.test(this.nodeName)}}),x.support.focusinBubbles||x.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){x.event.simulate(t,e.target,x.event.fix(e),!0)};x.event.special[t]={setup:function(){0===n++&&a.addEventListener(e,r,!0)},teardown:function(){0===--n&&a.removeEventListener(e,r,!0)}}}),x.fn.extend({on:function(e,n,r,i,o){var a,s;if("object"==typeof e){"string"!=typeof n&&(r=r||n,n=t);for(a in e)this.on(a,n,r,e[a],o);return this}if(null==r&&null==i?(i=n,r=n=t):null==i&&("string"==typeof n?(i=r,r=t):(i=r,r=n,n=t)),i===!1)i=ot;else if(!i)return this;return 1===o&&(s=i,i=function(e){return x().off(e),s.apply(this,arguments)},i.guid=s.guid||(s.guid=x.guid++)),this.each(function(){x.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,o;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,x(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if("object"==typeof e){for(o in e)this.off(o,n,e[o]);return this}return(n===!1||"function"==typeof n)&&(r=n,n=t),r===!1&&(r=ot),this.each(function(){x.event.remove(this,e,r,n)})},trigger:function(e,t){return this.each(function(){x.event.trigger(e,t,this)})},triggerHandler:function(e,n){var r=this[0];return r?x.event.trigger(e,n,r,!0):t}});var st=/^.[^:#\[\.,]*$/,lt=/^(?:parents|prev(?:Until|All))/,ut=x.expr.match.needsContext,ct={children:!0,contents:!0,next:!0,prev:!0};x.fn.extend({find:function(e){var t,n=[],r=this,i=r.length;if("string"!=typeof e)return this.pushStack(x(e).filter(function(){for(t=0;i>t;t++)if(x.contains(r[t],this))return!0}));for(t=0;i>t;t++)x.find(e,r[t],n);return n=this.pushStack(i>1?x.unique(n):n),n.selector=this.selector?this.selector+" "+e:e,n},has:function(e){var t,n=x(e,this),r=n.length;return this.filter(function(){for(t=0;r>t;t++)if(x.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e||[],!0))},filter:function(e){return this.pushStack(ft(this,e||[],!1))},is:function(e){return!!ft(this,"string"==typeof e&&ut.test(e)?x(e):e||[],!1).length},closest:function(e,t){var n,r=0,i=this.length,o=[],a=ut.test(e)||"string"!=typeof e?x(e,t||this.context):0;for(;i>r;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(11>n.nodeType&&(a?a.index(n)>-1:1===n.nodeType&&x.find.matchesSelector(n,e))){n=o.push(n);break}return this.pushStack(o.length>1?x.unique(o):o)},index:function(e){return e?"string"==typeof e?x.inArray(this[0],x(e)):x.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?x(e,t):x.makeArray(e&&e.nodeType?[e]:e),r=x.merge(this.get(),n);return this.pushStack(x.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}});function pt(e,t){do e=e[t];while(e&&1!==e.nodeType);return e}x.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return x.dir(e,"parentNode")},parentsUntil:function(e,t,n){return x.dir(e,"parentNode",n)},next:function(e){return pt(e,"nextSibling")},prev:function(e){return pt(e,"previousSibling")},nextAll:function(e){return x.dir(e,"nextSibling")},prevAll:function(e){return x.dir(e,"previousSibling")},nextUntil:function(e,t,n){return x.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return x.dir(e,"previousSibling",n)},siblings:function(e){return x.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return x.sibling(e.firstChild)},contents:function(e){return x.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:x.merge([],e.childNodes)}},function(e,t){x.fn[e]=function(n,r){var i=x.map(this,t,n);return"Until"!==e.slice(-5)&&(r=n),r&&"string"==typeof r&&(i=x.filter(r,i)),this.length>1&&(ct[e]||(i=x.unique(i)),lt.test(e)&&(i=i.reverse())),this.pushStack(i)}}),x.extend({filter:function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?x.find.matchesSelector(r,e)?[r]:[]:x.find.matches(e,x.grep(t,function(e){return 1===e.nodeType}))},dir:function(e,n,r){var i=[],o=e[n];while(o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!x(o).is(r)))1===o.nodeType&&i.push(o),o=o[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function ft(e,t,n){if(x.isFunction(t))return x.grep(e,function(e,r){return!!t.call(e,r,e)!==n});if(t.nodeType)return x.grep(e,function(e){return e===t!==n});if("string"==typeof t){if(st.test(t))return x.filter(t,e,n);t=x.filter(t,e)}return x.grep(e,function(e){return x.inArray(e,t)>=0!==n})}function dt(e){var t=ht.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}var ht="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gt=/ jQuery\d+="(?:null|\d+)"/g,mt=RegExp("<(?:"+ht+")[\\s/>]","i"),yt=/^\s+/,vt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bt=/<([\w:]+)/,xt=/<tbody/i,wt=/<|&#?\w+;/,Tt=/<(?:script|style|link)/i,Ct=/^(?:checkbox|radio)$/i,Nt=/checked\s*(?:[^=]|=\s*.checked.)/i,kt=/^$|\/(?:java|ecma)script/i,Et=/^true\/(.*)/,St=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,At={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:x.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},jt=dt(a),Dt=jt.appendChild(a.createElement("div"));At.optgroup=At.option,At.tbody=At.tfoot=At.colgroup=At.caption=At.thead,At.th=At.td,x.fn.extend({text:function(e){return x.access(this,function(e){return e===t?x.text(this):this.empty().append((this[0]&&this[0].ownerDocument||a).createTextNode(e))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Lt(this,e);t.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Lt(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=e?x.filter(e,this):this,i=0;for(;null!=(n=r[i]);i++)t||1!==n.nodeType||x.cleanData(Ft(n)),n.parentNode&&(t&&x.contains(n.ownerDocument,n)&&_t(Ft(n,"script")),n.parentNode.removeChild(n));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++){1===e.nodeType&&x.cleanData(Ft(e,!1));while(e.firstChild)e.removeChild(e.firstChild);e.options&&x.nodeName(e,"select")&&(e.options.length=0)}return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return x.clone(this,e,t)})},html:function(e){return x.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return 1===n.nodeType?n.innerHTML.replace(gt,""):t;if(!("string"!=typeof e||Tt.test(e)||!x.support.htmlSerialize&&mt.test(e)||!x.support.leadingWhitespace&&yt.test(e)||At[(bt.exec(e)||["",""])[1].toLowerCase()])){e=e.replace(vt,"<$1></$2>");try{for(;i>r;r++)n=this[r]||{},1===n.nodeType&&(x.cleanData(Ft(n,!1)),n.innerHTML=e);n=0}catch(o){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var e=x.map(this,function(e){return[e.nextSibling,e.parentNode]}),t=0;return this.domManip(arguments,function(n){var r=e[t++],i=e[t++];i&&(r&&r.parentNode!==i&&(r=this.nextSibling),x(this).remove(),i.insertBefore(n,r))},!0),t?this:this.remove()},detach:function(e){return this.remove(e,!0)},domManip:function(e,t,n){e=d.apply([],e);var r,i,o,a,s,l,u=0,c=this.length,p=this,f=c-1,h=e[0],g=x.isFunction(h);if(g||!(1>=c||"string"!=typeof h||x.support.checkClone)&&Nt.test(h))return this.each(function(r){var i=p.eq(r);g&&(e[0]=h.call(this,r,i.html())),i.domManip(e,t,n)});if(c&&(l=x.buildFragment(e,this[0].ownerDocument,!1,!n&&this),r=l.firstChild,1===l.childNodes.length&&(l=r),r)){for(a=x.map(Ft(l,"script"),Ht),o=a.length;c>u;u++)i=l,u!==f&&(i=x.clone(i,!0,!0),o&&x.merge(a,Ft(i,"script"))),t.call(this[u],i,u);if(o)for(s=a[a.length-1].ownerDocument,x.map(a,qt),u=0;o>u;u++)i=a[u],kt.test(i.type||"")&&!x._data(i,"globalEval")&&x.contains(s,i)&&(i.src?x._evalUrl(i.src):x.globalEval((i.text||i.textContent||i.innerHTML||"").replace(St,"")));l=r=null}return this}});function Lt(e,t){return x.nodeName(e,"table")&&x.nodeName(1===t.nodeType?t:t.firstChild,"tr")?e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e}function Ht(e){return e.type=(null!==x.find.attr(e,"type"))+"/"+e.type,e}function qt(e){var t=Et.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function _t(e,t){var n,r=0;for(;null!=(n=e[r]);r++)x._data(n,"globalEval",!t||x._data(t[r],"globalEval"))}function Mt(e,t){if(1===t.nodeType&&x.hasData(e)){var n,r,i,o=x._data(e),a=x._data(t,o),s=o.events;if(s){delete a.handle,a.events={};for(n in s)for(r=0,i=s[n].length;i>r;r++)x.event.add(t,n,s[n][r])}a.data&&(a.data=x.extend({},a.data))}}function Ot(e,t){var n,r,i;if(1===t.nodeType){if(n=t.nodeName.toLowerCase(),!x.support.noCloneEvent&&t[x.expando]){i=x._data(t);for(r in i.events)x.removeEvent(t,r,i.handle);t.removeAttribute(x.expando)}"script"===n&&t.text!==e.text?(Ht(t).text=e.text,qt(t)):"object"===n?(t.parentNode&&(t.outerHTML=e.outerHTML),x.support.html5Clone&&e.innerHTML&&!x.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):"input"===n&&Ct.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):"option"===n?t.defaultSelected=t.selected=e.defaultSelected:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}}x.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){x.fn[e]=function(e){var n,r=0,i=[],o=x(e),a=o.length-1;for(;a>=r;r++)n=r===a?this:this.clone(!0),x(o[r])[t](n),h.apply(i,n.get());return this.pushStack(i)}});function Ft(e,n){var r,o,a=0,s=typeof e.getElementsByTagName!==i?e.getElementsByTagName(n||"*"):typeof e.querySelectorAll!==i?e.querySelectorAll(n||"*"):t;if(!s)for(s=[],r=e.childNodes||e;null!=(o=r[a]);a++)!n||x.nodeName(o,n)?s.push(o):x.merge(s,Ft(o,n));return n===t||n&&x.nodeName(e,n)?x.merge([e],s):s}function Bt(e){Ct.test(e.type)&&(e.defaultChecked=e.checked)}x.extend({clone:function(e,t,n){var r,i,o,a,s,l=x.contains(e.ownerDocument,e);if(x.support.html5Clone||x.isXMLDoc(e)||!mt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(Dt.innerHTML=e.outerHTML,Dt.removeChild(o=Dt.firstChild)),!(x.support.noCloneEvent&&x.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||x.isXMLDoc(e)))for(r=Ft(o),s=Ft(e),a=0;null!=(i=s[a]);++a)r[a]&&Ot(i,r[a]);if(t)if(n)for(s=s||Ft(e),r=r||Ft(o),a=0;null!=(i=s[a]);a++)Mt(i,r[a]);else Mt(e,o);return r=Ft(o,"script"),r.length>0&&_t(r,!l&&Ft(e,"script")),r=s=i=null,o},buildFragment:function(e,t,n,r){var i,o,a,s,l,u,c,p=e.length,f=dt(t),d=[],h=0;for(;p>h;h++)if(o=e[h],o||0===o)if("object"===x.type(o))x.merge(d,o.nodeType?[o]:o);else if(wt.test(o)){s=s||f.appendChild(t.createElement("div")),l=(bt.exec(o)||["",""])[1].toLowerCase(),c=At[l]||At._default,s.innerHTML=c[1]+o.replace(vt,"<$1></$2>")+c[2],i=c[0];while(i--)s=s.lastChild;if(!x.support.leadingWhitespace&&yt.test(o)&&d.push(t.createTextNode(yt.exec(o)[0])),!x.support.tbody){o="table"!==l||xt.test(o)?"<table>"!==c[1]||xt.test(o)?0:s:s.firstChild,i=o&&o.childNodes.length;while(i--)x.nodeName(u=o.childNodes[i],"tbody")&&!u.childNodes.length&&o.removeChild(u)}x.merge(d,s.childNodes),s.textContent="";while(s.firstChild)s.removeChild(s.firstChild);s=f.lastChild}else d.push(t.createTextNode(o));s&&f.removeChild(s),x.support.appendChecked||x.grep(Ft(d,"input"),Bt),h=0;while(o=d[h++])if((!r||-1===x.inArray(o,r))&&(a=x.contains(o.ownerDocument,o),s=Ft(f.appendChild(o),"script"),a&&_t(s),n)){i=0;while(o=s[i++])kt.test(o.type||"")&&n.push(o)}return s=null,f},cleanData:function(e,t){var n,r,o,a,s=0,l=x.expando,u=x.cache,c=x.support.deleteExpando,f=x.event.special;for(;null!=(n=e[s]);s++)if((t||x.acceptData(n))&&(o=n[l],a=o&&u[o])){if(a.events)for(r in a.events)f[r]?x.event.remove(n,r):x.removeEvent(n,r,a.handle);
u[o]&&(delete u[o],c?delete n[l]:typeof n.removeAttribute!==i?n.removeAttribute(l):n[l]=null,p.push(o))}},_evalUrl:function(e){return x.ajax({url:e,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})}}),x.fn.extend({wrapAll:function(e){if(x.isFunction(e))return this.each(function(t){x(this).wrapAll(e.call(this,t))});if(this[0]){var t=x(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&1===e.firstChild.nodeType)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return x.isFunction(e)?this.each(function(t){x(this).wrapInner(e.call(this,t))}):this.each(function(){var t=x(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=x.isFunction(e);return this.each(function(n){x(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){x.nodeName(this,"body")||x(this).replaceWith(this.childNodes)}).end()}});var Pt,Rt,Wt,$t=/alpha\([^)]*\)/i,It=/opacity\s*=\s*([^)]*)/,zt=/^(top|right|bottom|left)$/,Xt=/^(none|table(?!-c[ea]).+)/,Ut=/^margin/,Vt=RegExp("^("+w+")(.*)$","i"),Yt=RegExp("^("+w+")(?!px)[a-z%]+$","i"),Jt=RegExp("^([+-])=("+w+")","i"),Gt={BODY:"block"},Qt={position:"absolute",visibility:"hidden",display:"block"},Kt={letterSpacing:0,fontWeight:400},Zt=["Top","Right","Bottom","Left"],en=["Webkit","O","Moz","ms"];function tn(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=en.length;while(i--)if(t=en[i]+n,t in e)return t;return r}function nn(e,t){return e=t||e,"none"===x.css(e,"display")||!x.contains(e.ownerDocument,e)}function rn(e,t){var n,r,i,o=[],a=0,s=e.length;for(;s>a;a++)r=e[a],r.style&&(o[a]=x._data(r,"olddisplay"),n=r.style.display,t?(o[a]||"none"!==n||(r.style.display=""),""===r.style.display&&nn(r)&&(o[a]=x._data(r,"olddisplay",ln(r.nodeName)))):o[a]||(i=nn(r),(n&&"none"!==n||!i)&&x._data(r,"olddisplay",i?n:x.css(r,"display"))));for(a=0;s>a;a++)r=e[a],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[a]||"":"none"));return e}x.fn.extend({css:function(e,n){return x.access(this,function(e,n,r){var i,o,a={},s=0;if(x.isArray(n)){for(o=Rt(e),i=n.length;i>s;s++)a[n[s]]=x.css(e,n[s],!1,o);return a}return r!==t?x.style(e,n,r):x.css(e,n)},e,n,arguments.length>1)},show:function(){return rn(this,!0)},hide:function(){return rn(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){nn(this)?x(this).show():x(this).hide()})}}),x.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Wt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":x.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var o,a,s,l=x.camelCase(n),u=e.style;if(n=x.cssProps[l]||(x.cssProps[l]=tn(u,l)),s=x.cssHooks[n]||x.cssHooks[l],r===t)return s&&"get"in s&&(o=s.get(e,!1,i))!==t?o:u[n];if(a=typeof r,"string"===a&&(o=Jt.exec(r))&&(r=(o[1]+1)*o[2]+parseFloat(x.css(e,n)),a="number"),!(null==r||"number"===a&&isNaN(r)||("number"!==a||x.cssNumber[l]||(r+="px"),x.support.clearCloneStyle||""!==r||0!==n.indexOf("background")||(u[n]="inherit"),s&&"set"in s&&(r=s.set(e,r,i))===t)))try{u[n]=r}catch(c){}}},css:function(e,n,r,i){var o,a,s,l=x.camelCase(n);return n=x.cssProps[l]||(x.cssProps[l]=tn(e.style,l)),s=x.cssHooks[n]||x.cssHooks[l],s&&"get"in s&&(a=s.get(e,!0,r)),a===t&&(a=Wt(e,n,i)),"normal"===a&&n in Kt&&(a=Kt[n]),""===r||r?(o=parseFloat(a),r===!0||x.isNumeric(o)?o||0:a):a}}),e.getComputedStyle?(Rt=function(t){return e.getComputedStyle(t,null)},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),l=s?s.getPropertyValue(n)||s[n]:t,u=e.style;return s&&(""!==l||x.contains(e.ownerDocument,e)||(l=x.style(e,n)),Yt.test(l)&&Ut.test(n)&&(i=u.width,o=u.minWidth,a=u.maxWidth,u.minWidth=u.maxWidth=u.width=l,l=s.width,u.width=i,u.minWidth=o,u.maxWidth=a)),l}):a.documentElement.currentStyle&&(Rt=function(e){return e.currentStyle},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),l=s?s[n]:t,u=e.style;return null==l&&u&&u[n]&&(l=u[n]),Yt.test(l)&&!zt.test(n)&&(i=u.left,o=e.runtimeStyle,a=o&&o.left,a&&(o.left=e.currentStyle.left),u.left="fontSize"===n?"1em":l,l=u.pixelLeft+"px",u.left=i,a&&(o.left=a)),""===l?"auto":l});function on(e,t,n){var r=Vt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function an(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,a=0;for(;4>o;o+=2)"margin"===n&&(a+=x.css(e,n+Zt[o],!0,i)),r?("content"===n&&(a-=x.css(e,"padding"+Zt[o],!0,i)),"margin"!==n&&(a-=x.css(e,"border"+Zt[o]+"Width",!0,i))):(a+=x.css(e,"padding"+Zt[o],!0,i),"padding"!==n&&(a+=x.css(e,"border"+Zt[o]+"Width",!0,i)));return a}function sn(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Rt(e),a=x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=Wt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Yt.test(i))return i;r=a&&(x.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+an(e,t,n||(a?"border":"content"),r,o)+"px"}function ln(e){var t=a,n=Gt[e];return n||(n=un(e,t),"none"!==n&&n||(Pt=(Pt||x("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(Pt[0].contentWindow||Pt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=un(e,t),Pt.detach()),Gt[e]=n),n}function un(e,t){var n=x(t.createElement(e)).appendTo(t.body),r=x.css(n[0],"display");return n.remove(),r}x.each(["height","width"],function(e,n){x.cssHooks[n]={get:function(e,r,i){return r?0===e.offsetWidth&&Xt.test(x.css(e,"display"))?x.swap(e,Qt,function(){return sn(e,n,i)}):sn(e,n,i):t},set:function(e,t,r){var i=r&&Rt(e);return on(e,t,r?an(e,n,r,x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,i),i):0)}}}),x.support.opacity||(x.cssHooks.opacity={get:function(e,t){return It.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=x.isNumeric(t)?"alpha(opacity="+100*t+")":"",o=r&&r.filter||n.filter||"";n.zoom=1,(t>=1||""===t)&&""===x.trim(o.replace($t,""))&&n.removeAttribute&&(n.removeAttribute("filter"),""===t||r&&!r.filter)||(n.filter=$t.test(o)?o.replace($t,i):o+" "+i)}}),x(function(){x.support.reliableMarginRight||(x.cssHooks.marginRight={get:function(e,n){return n?x.swap(e,{display:"inline-block"},Wt,[e,"marginRight"]):t}}),!x.support.pixelPosition&&x.fn.position&&x.each(["top","left"],function(e,n){x.cssHooks[n]={get:function(e,r){return r?(r=Wt(e,n),Yt.test(r)?x(e).position()[n]+"px":r):t}}})}),x.expr&&x.expr.filters&&(x.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight||!x.support.reliableHiddenOffsets&&"none"===(e.style&&e.style.display||x.css(e,"display"))},x.expr.filters.visible=function(e){return!x.expr.filters.hidden(e)}),x.each({margin:"",padding:"",border:"Width"},function(e,t){x.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+Zt[r]+t]=o[r]||o[r-2]||o[0];return i}},Ut.test(e)||(x.cssHooks[e+t].set=on)});var cn=/%20/g,pn=/\[\]$/,fn=/\r?\n/g,dn=/^(?:submit|button|image|reset|file)$/i,hn=/^(?:input|select|textarea|keygen)/i;x.fn.extend({serialize:function(){return x.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=x.prop(this,"elements");return e?x.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!x(this).is(":disabled")&&hn.test(this.nodeName)&&!dn.test(e)&&(this.checked||!Ct.test(e))}).map(function(e,t){var n=x(this).val();return null==n?null:x.isArray(n)?x.map(n,function(e){return{name:t.name,value:e.replace(fn,"\r\n")}}):{name:t.name,value:n.replace(fn,"\r\n")}}).get()}}),x.param=function(e,n){var r,i=[],o=function(e,t){t=x.isFunction(t)?t():null==t?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(n===t&&(n=x.ajaxSettings&&x.ajaxSettings.traditional),x.isArray(e)||e.jquery&&!x.isPlainObject(e))x.each(e,function(){o(this.name,this.value)});else for(r in e)gn(r,e[r],n,o);return i.join("&").replace(cn,"+")};function gn(e,t,n,r){var i;if(x.isArray(t))x.each(t,function(t,i){n||pn.test(e)?r(e,i):gn(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==x.type(t))r(e,t);else for(i in t)gn(e+"["+i+"]",t[i],n,r)}x.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){x.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),x.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}});var mn,yn,vn=x.now(),bn=/\?/,xn=/#.*$/,wn=/([?&])_=[^&]*/,Tn=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Cn=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Nn=/^(?:GET|HEAD)$/,kn=/^\/\//,En=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Sn=x.fn.load,An={},jn={},Dn="*/".concat("*");try{yn=o.href}catch(Ln){yn=a.createElement("a"),yn.href="",yn=yn.href}mn=En.exec(yn.toLowerCase())||[];function Hn(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(T)||[];if(x.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function qn(e,n,r,i){var o={},a=e===jn;function s(l){var u;return o[l]=!0,x.each(e[l]||[],function(e,l){var c=l(n,r,i);return"string"!=typeof c||a||o[c]?a?!(u=c):t:(n.dataTypes.unshift(c),s(c),!1)}),u}return s(n.dataTypes[0])||!o["*"]&&s("*")}function _n(e,n){var r,i,o=x.ajaxSettings.flatOptions||{};for(i in n)n[i]!==t&&((o[i]?e:r||(r={}))[i]=n[i]);return r&&x.extend(!0,e,r),e}x.fn.load=function(e,n,r){if("string"!=typeof e&&Sn)return Sn.apply(this,arguments);var i,o,a,s=this,l=e.indexOf(" ");return l>=0&&(i=e.slice(l,e.length),e=e.slice(0,l)),x.isFunction(n)?(r=n,n=t):n&&"object"==typeof n&&(a="POST"),s.length>0&&x.ajax({url:e,type:a,dataType:"html",data:n}).done(function(e){o=arguments,s.html(i?x("<div>").append(x.parseHTML(e)).find(i):e)}).complete(r&&function(e,t){s.each(r,o||[e.responseText,t,e])}),this},x.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){x.fn[t]=function(e){return this.on(t,e)}}),x.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:yn,type:"GET",isLocal:Cn.test(mn[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":x.parseJSON,"text xml":x.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?_n(_n(e,x.ajaxSettings),t):_n(x.ajaxSettings,e)},ajaxPrefilter:Hn(An),ajaxTransport:Hn(jn),ajax:function(e,n){"object"==typeof e&&(n=e,e=t),n=n||{};var r,i,o,a,s,l,u,c,p=x.ajaxSetup({},n),f=p.context||p,d=p.context&&(f.nodeType||f.jquery)?x(f):x.event,h=x.Deferred(),g=x.Callbacks("once memory"),m=p.statusCode||{},y={},v={},b=0,w="canceled",C={readyState:0,getResponseHeader:function(e){var t;if(2===b){if(!c){c={};while(t=Tn.exec(a))c[t[1].toLowerCase()]=t[2]}t=c[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===b?a:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return b||(e=v[n]=v[n]||e,y[e]=t),this},overrideMimeType:function(e){return b||(p.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>b)for(t in e)m[t]=[m[t],e[t]];else C.always(e[C.status]);return this},abort:function(e){var t=e||w;return u&&u.abort(t),k(0,t),this}};if(h.promise(C).complete=g.add,C.success=C.done,C.error=C.fail,p.url=((e||p.url||yn)+"").replace(xn,"").replace(kn,mn[1]+"//"),p.type=n.method||n.type||p.method||p.type,p.dataTypes=x.trim(p.dataType||"*").toLowerCase().match(T)||[""],null==p.crossDomain&&(r=En.exec(p.url.toLowerCase()),p.crossDomain=!(!r||r[1]===mn[1]&&r[2]===mn[2]&&(r[3]||("http:"===r[1]?"80":"443"))===(mn[3]||("http:"===mn[1]?"80":"443")))),p.data&&p.processData&&"string"!=typeof p.data&&(p.data=x.param(p.data,p.traditional)),qn(An,p,n,C),2===b)return C;l=p.global,l&&0===x.active++&&x.event.trigger("ajaxStart"),p.type=p.type.toUpperCase(),p.hasContent=!Nn.test(p.type),o=p.url,p.hasContent||(p.data&&(o=p.url+=(bn.test(o)?"&":"?")+p.data,delete p.data),p.cache===!1&&(p.url=wn.test(o)?o.replace(wn,"$1_="+vn++):o+(bn.test(o)?"&":"?")+"_="+vn++)),p.ifModified&&(x.lastModified[o]&&C.setRequestHeader("If-Modified-Since",x.lastModified[o]),x.etag[o]&&C.setRequestHeader("If-None-Match",x.etag[o])),(p.data&&p.hasContent&&p.contentType!==!1||n.contentType)&&C.setRequestHeader("Content-Type",p.contentType),C.setRequestHeader("Accept",p.dataTypes[0]&&p.accepts[p.dataTypes[0]]?p.accepts[p.dataTypes[0]]+("*"!==p.dataTypes[0]?", "+Dn+"; q=0.01":""):p.accepts["*"]);for(i in p.headers)C.setRequestHeader(i,p.headers[i]);if(p.beforeSend&&(p.beforeSend.call(f,C,p)===!1||2===b))return C.abort();w="abort";for(i in{success:1,error:1,complete:1})C[i](p[i]);if(u=qn(jn,p,n,C)){C.readyState=1,l&&d.trigger("ajaxSend",[C,p]),p.async&&p.timeout>0&&(s=setTimeout(function(){C.abort("timeout")},p.timeout));try{b=1,u.send(y,k)}catch(N){if(!(2>b))throw N;k(-1,N)}}else k(-1,"No Transport");function k(e,n,r,i){var c,y,v,w,T,N=n;2!==b&&(b=2,s&&clearTimeout(s),u=t,a=i||"",C.readyState=e>0?4:0,c=e>=200&&300>e||304===e,r&&(w=Mn(p,C,r)),w=On(p,w,C,c),c?(p.ifModified&&(T=C.getResponseHeader("Last-Modified"),T&&(x.lastModified[o]=T),T=C.getResponseHeader("etag"),T&&(x.etag[o]=T)),204===e||"HEAD"===p.type?N="nocontent":304===e?N="notmodified":(N=w.state,y=w.data,v=w.error,c=!v)):(v=N,(e||!N)&&(N="error",0>e&&(e=0))),C.status=e,C.statusText=(n||N)+"",c?h.resolveWith(f,[y,N,C]):h.rejectWith(f,[C,N,v]),C.statusCode(m),m=t,l&&d.trigger(c?"ajaxSuccess":"ajaxError",[C,p,c?y:v]),g.fireWith(f,[C,N]),l&&(d.trigger("ajaxComplete",[C,p]),--x.active||x.event.trigger("ajaxStop")))}return C},getJSON:function(e,t,n){return x.get(e,t,n,"json")},getScript:function(e,n){return x.get(e,t,n,"script")}}),x.each(["get","post"],function(e,n){x[n]=function(e,r,i,o){return x.isFunction(r)&&(o=o||i,i=r,r=t),x.ajax({url:e,type:n,dataType:o,data:r,success:i})}});function Mn(e,n,r){var i,o,a,s,l=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),o===t&&(o=e.mimeType||n.getResponseHeader("Content-Type"));if(o)for(s in l)if(l[s]&&l[s].test(o)){u.unshift(s);break}if(u[0]in r)a=u[0];else{for(s in r){if(!u[0]||e.converters[s+" "+u[0]]){a=s;break}i||(i=s)}a=a||i}return a?(a!==u[0]&&u.unshift(a),r[a]):t}function On(e,t,n,r){var i,o,a,s,l,u={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)u[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!l&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),l=o,o=c.shift())if("*"===o)o=l;else if("*"!==l&&l!==o){if(a=u[l+" "+o]||u["* "+o],!a)for(i in u)if(s=i.split(" "),s[1]===o&&(a=u[l+" "+s[0]]||u["* "+s[0]])){a===!0?a=u[i]:u[i]!==!0&&(o=s[0],c.unshift(s[1]));break}if(a!==!0)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(p){return{state:"parsererror",error:a?p:"No conversion from "+l+" to "+o}}}return{state:"success",data:t}}x.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return x.globalEval(e),e}}}),x.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),x.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=a.head||x("head")[0]||a.documentElement;return{send:function(t,i){n=a.createElement("script"),n.async=!0,e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,t){(t||!n.readyState||/loaded|complete/.test(n.readyState))&&(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),n=null,t||i(200,"success"))},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(t,!0)}}}});var Fn=[],Bn=/(=)\?(?=&|$)|\?\?/;x.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Fn.pop()||x.expando+"_"+vn++;return this[e]=!0,e}}),x.ajaxPrefilter("json jsonp",function(n,r,i){var o,a,s,l=n.jsonp!==!1&&(Bn.test(n.url)?"url":"string"==typeof n.data&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Bn.test(n.data)&&"data");return l||"jsonp"===n.dataTypes[0]?(o=n.jsonpCallback=x.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,l?n[l]=n[l].replace(Bn,"$1"+o):n.jsonp!==!1&&(n.url+=(bn.test(n.url)?"&":"?")+n.jsonp+"="+o),n.converters["script json"]=function(){return s||x.error(o+" was not called"),s[0]},n.dataTypes[0]="json",a=e[o],e[o]=function(){s=arguments},i.always(function(){e[o]=a,n[o]&&(n.jsonpCallback=r.jsonpCallback,Fn.push(o)),s&&x.isFunction(a)&&a(s[0]),s=a=t}),"script"):t});var Pn,Rn,Wn=0,$n=e.ActiveXObject&&function(){var e;for(e in Pn)Pn[e](t,!0)};function In(){try{return new e.XMLHttpRequest}catch(t){}}function zn(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}x.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&In()||zn()}:In,Rn=x.ajaxSettings.xhr(),x.support.cors=!!Rn&&"withCredentials"in Rn,Rn=x.support.ajax=!!Rn,Rn&&x.ajaxTransport(function(n){if(!n.crossDomain||x.support.cors){var r;return{send:function(i,o){var a,s,l=n.xhr();if(n.username?l.open(n.type,n.url,n.async,n.username,n.password):l.open(n.type,n.url,n.async),n.xhrFields)for(s in n.xhrFields)l[s]=n.xhrFields[s];n.mimeType&&l.overrideMimeType&&l.overrideMimeType(n.mimeType),n.crossDomain||i["X-Requested-With"]||(i["X-Requested-With"]="XMLHttpRequest");try{for(s in i)l.setRequestHeader(s,i[s])}catch(u){}l.send(n.hasContent&&n.data||null),r=function(e,i){var s,u,c,p;try{if(r&&(i||4===l.readyState))if(r=t,a&&(l.onreadystatechange=x.noop,$n&&delete Pn[a]),i)4!==l.readyState&&l.abort();else{p={},s=l.status,u=l.getAllResponseHeaders(),"string"==typeof l.responseText&&(p.text=l.responseText);try{c=l.statusText}catch(f){c=""}s||!n.isLocal||n.crossDomain?1223===s&&(s=204):s=p.text?200:404}}catch(d){i||o(-1,d)}p&&o(s,c,p,u)},n.async?4===l.readyState?setTimeout(r):(a=++Wn,$n&&(Pn||(Pn={},x(e).unload($n)),Pn[a]=r),l.onreadystatechange=r):r()},abort:function(){r&&r(t,!0)}}}});var Xn,Un,Vn=/^(?:toggle|show|hide)$/,Yn=RegExp("^(?:([+-])=|)("+w+")([a-z%]*)$","i"),Jn=/queueHooks$/,Gn=[nr],Qn={"*":[function(e,t){var n=this.createTween(e,t),r=n.cur(),i=Yn.exec(t),o=i&&i[3]||(x.cssNumber[e]?"":"px"),a=(x.cssNumber[e]||"px"!==o&&+r)&&Yn.exec(x.css(n.elem,e)),s=1,l=20;if(a&&a[3]!==o){o=o||a[3],i=i||[],a=+r||1;do s=s||".5",a/=s,x.style(n.elem,e,a+o);while(s!==(s=n.cur()/r)&&1!==s&&--l)}return i&&(a=n.start=+a||+r||0,n.unit=o,n.end=i[1]?a+(i[1]+1)*i[2]:+i[2]),n}]};function Kn(){return setTimeout(function(){Xn=t}),Xn=x.now()}function Zn(e,t,n){var r,i=(Qn[t]||[]).concat(Qn["*"]),o=0,a=i.length;for(;a>o;o++)if(r=i[o].call(n,t,e))return r}function er(e,t,n){var r,i,o=0,a=Gn.length,s=x.Deferred().always(function(){delete l.elem}),l=function(){if(i)return!1;var t=Xn||Kn(),n=Math.max(0,u.startTime+u.duration-t),r=n/u.duration||0,o=1-r,a=0,l=u.tweens.length;for(;l>a;a++)u.tweens[a].run(o);return s.notifyWith(e,[u,o,n]),1>o&&l?n:(s.resolveWith(e,[u]),!1)},u=s.promise({elem:e,props:x.extend({},t),opts:x.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:Xn||Kn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=x.Tween(e,u.opts,t,n,u.opts.specialEasing[t]||u.opts.easing);return u.tweens.push(r),r},stop:function(t){var n=0,r=t?u.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)u.tweens[n].run(1);return t?s.resolveWith(e,[u,t]):s.rejectWith(e,[u,t]),this}}),c=u.props;for(tr(c,u.opts.specialEasing);a>o;o++)if(r=Gn[o].call(u,e,c,u.opts))return r;return x.map(c,Zn,u),x.isFunction(u.opts.start)&&u.opts.start.call(e,u),x.fx.timer(x.extend(l,{elem:e,anim:u,queue:u.opts.queue})),u.progress(u.opts.progress).done(u.opts.done,u.opts.complete).fail(u.opts.fail).always(u.opts.always)}function tr(e,t){var n,r,i,o,a;for(n in e)if(r=x.camelCase(n),i=t[r],o=e[n],x.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),a=x.cssHooks[r],a&&"expand"in a){o=a.expand(o),delete e[r];for(n in o)n in e||(e[n]=o[n],t[n]=i)}else t[r]=i}x.Animation=x.extend(er,{tweener:function(e,t){x.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Qn[n]=Qn[n]||[],Qn[n].unshift(t)},prefilter:function(e,t){t?Gn.unshift(e):Gn.push(e)}});function nr(e,t,n){var r,i,o,a,s,l,u=this,c={},p=e.style,f=e.nodeType&&nn(e),d=x._data(e,"fxshow");n.queue||(s=x._queueHooks(e,"fx"),null==s.unqueued&&(s.unqueued=0,l=s.empty.fire,s.empty.fire=function(){s.unqueued||l()}),s.unqueued++,u.always(function(){u.always(function(){s.unqueued--,x.queue(e,"fx").length||s.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[p.overflow,p.overflowX,p.overflowY],"inline"===x.css(e,"display")&&"none"===x.css(e,"float")&&(x.support.inlineBlockNeedsLayout&&"inline"!==ln(e.nodeName)?p.zoom=1:p.display="inline-block")),n.overflow&&(p.overflow="hidden",x.support.shrinkWrapBlocks||u.always(function(){p.overflow=n.overflow[0],p.overflowX=n.overflow[1],p.overflowY=n.overflow[2]}));for(r in t)if(i=t[r],Vn.exec(i)){if(delete t[r],o=o||"toggle"===i,i===(f?"hide":"show"))continue;c[r]=d&&d[r]||x.style(e,r)}if(!x.isEmptyObject(c)){d?"hidden"in d&&(f=d.hidden):d=x._data(e,"fxshow",{}),o&&(d.hidden=!f),f?x(e).show():u.done(function(){x(e).hide()}),u.done(function(){var t;x._removeData(e,"fxshow");for(t in c)x.style(e,t,c[t])});for(r in c)a=Zn(f?d[r]:0,r,u),r in d||(d[r]=a.start,f&&(a.end=a.start,a.start="width"===r||"height"===r?1:0))}}function rr(e,t,n,r,i){return new rr.prototype.init(e,t,n,r,i)}x.Tween=rr,rr.prototype={constructor:rr,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(x.cssNumber[n]?"":"px")},cur:function(){var e=rr.propHooks[this.prop];return e&&e.get?e.get(this):rr.propHooks._default.get(this)},run:function(e){var t,n=rr.propHooks[this.prop];return this.pos=t=this.options.duration?x.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):rr.propHooks._default.set(this),this}},rr.prototype.init.prototype=rr.prototype,rr.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=x.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){x.fx.step[e.prop]?x.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[x.cssProps[e.prop]]||x.cssHooks[e.prop])?x.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},rr.propHooks.scrollTop=rr.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},x.each(["toggle","show","hide"],function(e,t){var n=x.fn[t];x.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(ir(t,!0),e,r,i)}}),x.fn.extend({fadeTo:function(e,t,n,r){return this.filter(nn).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=x.isEmptyObject(e),o=x.speed(t,n,r),a=function(){var t=er(this,x.extend({},e),o);(i||x._data(this,"finish"))&&t.stop(!0)};return a.finish=a,i||o.queue===!1?this.each(a):this.queue(o.queue,a)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return"string"!=typeof e&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=null!=e&&e+"queueHooks",o=x.timers,a=x._data(this);if(n)a[n]&&a[n].stop&&i(a[n]);else for(n in a)a[n]&&a[n].stop&&Jn.test(n)&&i(a[n]);for(n=o.length;n--;)o[n].elem!==this||null!=e&&o[n].queue!==e||(o[n].anim.stop(r),t=!1,o.splice(n,1));(t||!r)&&x.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=x._data(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=x.timers,a=r?r.length:0;for(n.finish=!0,x.queue(this,e,[]),i&&i.stop&&i.stop.call(this,!0),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;a>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function ir(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=Zt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}x.each({slideDown:ir("show"),slideUp:ir("hide"),slideToggle:ir("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){x.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),x.speed=function(e,t,n){var r=e&&"object"==typeof e?x.extend({},e):{complete:n||!n&&t||x.isFunction(e)&&e,duration:e,easing:n&&t||t&&!x.isFunction(t)&&t};return r.duration=x.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in x.fx.speeds?x.fx.speeds[r.duration]:x.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){x.isFunction(r.old)&&r.old.call(this),r.queue&&x.dequeue(this,r.queue)},r},x.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},x.timers=[],x.fx=rr.prototype.init,x.fx.tick=function(){var e,n=x.timers,r=0;for(Xn=x.now();n.length>r;r++)e=n[r],e()||n[r]!==e||n.splice(r--,1);n.length||x.fx.stop(),Xn=t},x.fx.timer=function(e){e()&&x.timers.push(e)&&x.fx.start()},x.fx.interval=13,x.fx.start=function(){Un||(Un=setInterval(x.fx.tick,x.fx.interval))},x.fx.stop=function(){clearInterval(Un),Un=null},x.fx.speeds={slow:600,fast:200,_default:400},x.fx.step={},x.expr&&x.expr.filters&&(x.expr.filters.animated=function(e){return x.grep(x.timers,function(t){return e===t.elem}).length}),x.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){x.offset.setOffset(this,e,t)});var n,r,o={top:0,left:0},a=this[0],s=a&&a.ownerDocument;if(s)return n=s.documentElement,x.contains(n,a)?(typeof a.getBoundingClientRect!==i&&(o=a.getBoundingClientRect()),r=or(s),{top:o.top+(r.pageYOffset||n.scrollTop)-(n.clientTop||0),left:o.left+(r.pageXOffset||n.scrollLeft)-(n.clientLeft||0)}):o},x.offset={setOffset:function(e,t,n){var r=x.css(e,"position");"static"===r&&(e.style.position="relative");var i=x(e),o=i.offset(),a=x.css(e,"top"),s=x.css(e,"left"),l=("absolute"===r||"fixed"===r)&&x.inArray("auto",[a,s])>-1,u={},c={},p,f;l?(c=i.position(),p=c.top,f=c.left):(p=parseFloat(a)||0,f=parseFloat(s)||0),x.isFunction(t)&&(t=t.call(e,n,o)),null!=t.top&&(u.top=t.top-o.top+p),null!=t.left&&(u.left=t.left-o.left+f),"using"in t?t.using.call(e,u):i.css(u)}},x.fn.extend({position:function(){if(this[0]){var e,t,n={top:0,left:0},r=this[0];return"fixed"===x.css(r,"position")?t=r.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),x.nodeName(e[0],"html")||(n=e.offset()),n.top+=x.css(e[0],"borderTopWidth",!0),n.left+=x.css(e[0],"borderLeftWidth",!0)),{top:t.top-n.top-x.css(r,"marginTop",!0),left:t.left-n.left-x.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||s;while(e&&!x.nodeName(e,"html")&&"static"===x.css(e,"position"))e=e.offsetParent;return e||s})}}),x.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);x.fn[e]=function(i){return x.access(this,function(e,i,o){var a=or(e);return o===t?a?n in a?a[n]:a.document.documentElement[i]:e[i]:(a?a.scrollTo(r?x(a).scrollLeft():o,r?o:x(a).scrollTop()):e[i]=o,t)},e,i,arguments.length,null)}});function or(e){return x.isWindow(e)?e:9===e.nodeType?e.defaultView||e.parentWindow:!1}x.each({Height:"height",Width:"width"},function(e,n){x.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){x.fn[i]=function(i,o){var a=arguments.length&&(r||"boolean"!=typeof i),s=r||(i===!0||o===!0?"margin":"border");return x.access(this,function(n,r,i){var o;return x.isWindow(n)?n.document.documentElement["client"+e]:9===n.nodeType?(o=n.documentElement,Math.max(n.body["scroll"+e],o["scroll"+e],n.body["offset"+e],o["offset"+e],o["client"+e])):i===t?x.css(n,r,s):x.style(n,r,i,s)},n,a?i:t,a,null)}})}),x.fn.size=function(){return this.length},x.fn.andSelf=x.fn.addBack,"object"==typeof module&&module&&"object"==typeof module.exports?module.exports=x:(e.jQuery=e.$=x,"function"==typeof define&&define(function(){return x}))})(window);

/*!
 * jQuery Migrate - v1.2.1 - 2013-05-08
 * https://github.com/jquery/jquery-migrate
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors; Licensed MIT
 */
(function( jQuery, window, undefined ) {
// See http://bugs.jquery.com/ticket/13335
// "use strict";


    var warnedAbout = {};

// List of warnings already given; public read only
    jQuery.migrateWarnings = [];

// Set to true to prevent console output; migrateWarnings still maintained
// jQuery.migrateMute = false;

// Show a message on the console so devs know we're active
    if ( !jQuery.migrateMute && window.console && window.console.log ) {
        //window.console.log("JQMIGRATE: Logging is active");
    }

// Set to false to disable traces that appear with warnings
    if ( jQuery.migrateTrace === undefined ) {
        jQuery.migrateTrace = true;
    }

// Forget any warnings we've already given; public
    jQuery.migrateReset = function() {
        warnedAbout = {};
        jQuery.migrateWarnings.length = 0;
    };

    function migrateWarn( msg) {
        var console = window.console;
        if ( !warnedAbout[ msg ] ) {
            warnedAbout[ msg ] = true;
            jQuery.migrateWarnings.push( msg );
            if ( console && console.warn && !jQuery.migrateMute ) {
                //console.warn( "JQMIGRATE: " + msg );
                if ( jQuery.migrateTrace && console.trace ) {
                    //console.trace();
                }
            }
        }
    }

    function migrateWarnProp( obj, prop, value, msg ) {
        if ( Object.defineProperty ) {
            // On ES5 browsers (non-oldIE), warn if the code tries to get prop;
            // allow property to be overwritten in case some other plugin wants it
            try {
                Object.defineProperty( obj, prop, {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                        migrateWarn( msg );
                        return value;
                    },
                    set: function( newValue ) {
                        migrateWarn( msg );
                        value = newValue;
                    }
                });
                return;
            } catch( err ) {
                // IE8 is a dope about Object.defineProperty, can't warn there
            }
        }

        // Non-ES5 (or broken) browser; just set the property
        jQuery._definePropertyBroken = true;
        obj[ prop ] = value;
    }

    if ( document.compatMode === "BackCompat" ) {
        // jQuery has never supported or tested Quirks Mode
        migrateWarn( "jQuery is not compatible with Quirks Mode" );
    }


    var attrFn = jQuery( "<input/>", { size: 1 } ).attr("size") && jQuery.attrFn,
        oldAttr = jQuery.attr,
        valueAttrGet = jQuery.attrHooks.value && jQuery.attrHooks.value.get ||
            function() { return null; },
        valueAttrSet = jQuery.attrHooks.value && jQuery.attrHooks.value.set ||
            function() { return undefined; },
        rnoType = /^(?:input|button)$/i,
        rnoAttrNodeType = /^[238]$/,
        rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
        ruseDefault = /^(?:checked|selected)$/i;

// jQuery.attrFn
    migrateWarnProp( jQuery, "attrFn", attrFn || {}, "jQuery.attrFn is deprecated" );

    jQuery.attr = function( elem, name, value, pass ) {
        var lowerName = name.toLowerCase(),
            nType = elem && elem.nodeType;

        if ( pass ) {
            // Since pass is used internally, we only warn for new jQuery
            // versions where there isn't a pass arg in the formal params
            if ( oldAttr.length < 4 ) {
                migrateWarn("jQuery.fn.attr( props, pass ) is deprecated");
            }
            if ( elem && !rnoAttrNodeType.test( nType ) &&
                (attrFn ? name in attrFn : jQuery.isFunction(jQuery.fn[name])) ) {
                return jQuery( elem )[ name ]( value );
            }
        }

        // Warn if user tries to set `type`, since it breaks on IE 6/7/8; by checking
        // for disconnected elements we don't warn on $( "<button>", { type: "button" } ).
        if ( name === "type" && value !== undefined && rnoType.test( elem.nodeName ) && elem.parentNode ) {
            migrateWarn("Can't change the 'type' of an input or button in IE 6/7/8");
        }

        // Restore boolHook for boolean property/attribute synchronization
        if ( !jQuery.attrHooks[ lowerName ] && rboolean.test( lowerName ) ) {
            jQuery.attrHooks[ lowerName ] = {
                get: function( elem, name ) {
                    // Align boolean attributes with corresponding properties
                    // Fall back to attribute presence where some booleans are not supported
                    var attrNode,
                        property = jQuery.prop( elem, name );
                    return property === true || typeof property !== "boolean" &&
                        ( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?

                        name.toLowerCase() :
                        undefined;
                },
                set: function( elem, value, name ) {
                    var propName;
                    if ( value === false ) {
                        // Remove boolean attributes when set to false
                        jQuery.removeAttr( elem, name );
                    } else {
                        // value is true since we know at this point it's type boolean and not false
                        // Set boolean attributes to the same name and set the DOM property
                        propName = jQuery.propFix[ name ] || name;
                        if ( propName in elem ) {
                            // Only set the IDL specifically if it already exists on the element
                            elem[ propName ] = true;
                        }

                        elem.setAttribute( name, name.toLowerCase() );
                    }
                    return name;
                }
            };

            // Warn only for attributes that can remain distinct from their properties post-1.9
            if ( ruseDefault.test( lowerName ) ) {
                migrateWarn( "jQuery.fn.attr('" + lowerName + "') may use property instead of attribute" );
            }
        }

        return oldAttr.call( jQuery, elem, name, value );
    };

// attrHooks: value
    jQuery.attrHooks.value = {
        get: function( elem, name ) {
            var nodeName = ( elem.nodeName || "" ).toLowerCase();
            if ( nodeName === "button" ) {
                return valueAttrGet.apply( this, arguments );
            }
            if ( nodeName !== "input" && nodeName !== "option" ) {
                migrateWarn("jQuery.fn.attr('value') no longer gets properties");
            }
            return name in elem ?
                elem.value :
                null;
        },
        set: function( elem, value ) {
            var nodeName = ( elem.nodeName || "" ).toLowerCase();
            if ( nodeName === "button" ) {
                return valueAttrSet.apply( this, arguments );
            }
            if ( nodeName !== "input" && nodeName !== "option" ) {
                migrateWarn("jQuery.fn.attr('value', val) no longer sets properties");
            }
            // Does not return so that setAttribute is also used
            elem.value = value;
        }
    };


    var matched, browser,
        oldInit = jQuery.fn.init,
        oldParseJSON = jQuery.parseJSON,
    // Note: XSS check is done below after string is trimmed
        rquickExpr = /^([^<]*)(<[\w\W]+>)([^>]*)$/;

// $(html) "looks like html" rule change
    jQuery.fn.init = function( selector, context, rootjQuery ) {
        var match;

        if ( selector && typeof selector === "string" && !jQuery.isPlainObject( context ) &&
            (match = rquickExpr.exec( jQuery.trim( selector ) )) && match[ 0 ] ) {
            // This is an HTML string according to the "old" rules; is it still?
            if ( selector.charAt( 0 ) !== "<" ) {
                migrateWarn("$(html) HTML strings must start with '<' character");
            }
            if ( match[ 3 ] ) {
                migrateWarn("$(html) HTML text after last tag is ignored");
            }
            // Consistently reject any HTML-like string starting with a hash (#9521)
            // Note that this may break jQuery 1.6.x code that otherwise would work.
            if ( match[ 0 ].charAt( 0 ) === "#" ) {
                migrateWarn("HTML string cannot start with a '#' character");
                jQuery.error("JQMIGRATE: Invalid selector string (XSS)");
            }
            // Now process using loose rules; let pre-1.8 play too
            if ( context && context.context ) {
                // jQuery object as context; parseHTML expects a DOM object
                context = context.context;
            }
            if ( jQuery.parseHTML ) {
                return oldInit.call( this, jQuery.parseHTML( match[ 2 ], context, true ),
                    context, rootjQuery );
            }
        }
        return oldInit.apply( this, arguments );
    };
    jQuery.fn.init.prototype = jQuery.fn;

// Let $.parseJSON(falsy_value) return null
    jQuery.parseJSON = function( json ) {
        if ( !json && json !== null ) {
            migrateWarn("jQuery.parseJSON requires a valid JSON string");
            return null;
        }
        return oldParseJSON.apply( this, arguments );
    };

    jQuery.uaMatch = function( ua ) {
        ua = ua.toLowerCase();

        var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
            /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
            /(msie) ([\w.]+)/.exec( ua ) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
            [];

        return {
            browser: match[ 1 ] || "",
            version: match[ 2 ] || "0"
        };
    };

// Don't clobber any existing jQuery.browser in case it's different
    if ( !jQuery.browser ) {
        matched = jQuery.uaMatch( navigator.userAgent );
        browser = {};

        if ( matched.browser ) {
            browser[ matched.browser ] = true;
            browser.version = matched.version;
        }

        // Chrome is Webkit, but Webkit is also Safari.
        if ( browser.chrome ) {
            browser.webkit = true;
        } else if ( browser.webkit ) {
            browser.safari = true;
        }

        jQuery.browser = browser;
    }

// Warn if the code tries to get jQuery.browser
    //migrateWarnProp( jQuery, "browser", jQuery.browser, "jQuery.browser is deprecated" );

    jQuery.sub = function() {
        function jQuerySub( selector, context ) {
            return new jQuerySub.fn.init( selector, context );
        }
        jQuery.extend( true, jQuerySub, this );
        jQuerySub.superclass = this;
        jQuerySub.fn = jQuerySub.prototype = this();
        jQuerySub.fn.constructor = jQuerySub;
        jQuerySub.sub = this.sub;
        jQuerySub.fn.init = function init( selector, context ) {
            if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
                context = jQuerySub( context );
            }

            return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
        };
        jQuerySub.fn.init.prototype = jQuerySub.fn;
        var rootjQuerySub = jQuerySub(document);
        migrateWarn( "jQuery.sub() is deprecated" );
        return jQuerySub;
    };


// Ensure that $.ajax gets the new parseJSON defined in core.js
    jQuery.ajaxSetup({
        converters: {
            "text json": jQuery.parseJSON
        }
    });


    var oldFnData = jQuery.fn.data;

    jQuery.fn.data = function( name ) {
        var ret, evt,
            elem = this[0];

        // Handles 1.7 which has this behavior and 1.8 which doesn't
        if ( elem && name === "events" && arguments.length === 1 ) {
            ret = jQuery.data( elem, name );
            evt = jQuery._data( elem, name );
            if ( ( ret === undefined || ret === evt ) && evt !== undefined ) {
                migrateWarn("Use of jQuery.fn.data('events') is deprecated");
                return evt;
            }
        }
        return oldFnData.apply( this, arguments );
    };


    var rscriptType = /\/(java|ecma)script/i,
        oldSelf = jQuery.fn.andSelf || jQuery.fn.addBack;

    jQuery.fn.andSelf = function() {
        migrateWarn("jQuery.fn.andSelf() replaced by jQuery.fn.addBack()");
        return oldSelf.apply( this, arguments );
    };

// Since jQuery.clean is used internally on older versions, we only shim if it's missing
    if ( !jQuery.clean ) {
        jQuery.clean = function( elems, context, fragment, scripts ) {
            // Set context per 1.8 logic
            context = context || document;
            context = !context.nodeType && context[0] || context;
            context = context.ownerDocument || context;

            migrateWarn("jQuery.clean() is deprecated");

            var i, elem, handleScript, jsTags,
                ret = [];

            jQuery.merge( ret, jQuery.buildFragment( elems, context ).childNodes );

            // Complex logic lifted directly from jQuery 1.8
            if ( fragment ) {
                // Special handling of each script element
                handleScript = function( elem ) {
                    // Check if we consider it executable
                    if ( !elem.type || rscriptType.test( elem.type ) ) {
                        // Detach the script and store it in the scripts array (if provided) or the fragment
                        // Return truthy to indicate that it has been handled
                        return scripts ?
                            scripts.push( elem.parentNode ? elem.parentNode.removeChild( elem ) : elem ) :
                            fragment.appendChild( elem );
                    }
                };

                for ( i = 0; (elem = ret[i]) != null; i++ ) {
                    // Check if we're done after handling an executable script
                    if ( !( jQuery.nodeName( elem, "script" ) && handleScript( elem ) ) ) {
                        // Append to fragment and handle embedded scripts
                        fragment.appendChild( elem );
                        if ( typeof elem.getElementsByTagName !== "undefined" ) {
                            // handleScript alters the DOM, so use jQuery.merge to ensure snapshot iteration
                            jsTags = jQuery.grep( jQuery.merge( [], elem.getElementsByTagName("script") ), handleScript );

                            // Splice the scripts into ret after their former ancestor and advance our index beyond them
                            ret.splice.apply( ret, [i + 1, 0].concat( jsTags ) );
                            i += jsTags.length;
                        }
                    }
                }
            }

            return ret;
        };
    }

    var eventAdd = jQuery.event.add,
        eventRemove = jQuery.event.remove,
        eventTrigger = jQuery.event.trigger,
        oldToggle = jQuery.fn.toggle,
        oldLive = jQuery.fn.live,
        oldDie = jQuery.fn.die,
        ajaxEvents = "ajaxStart|ajaxStop|ajaxSend|ajaxComplete|ajaxError|ajaxSuccess",
        rajaxEvent = new RegExp( "\\b(?:" + ajaxEvents + ")\\b" ),
        rhoverHack = /(?:^|\s)hover(\.\S+|)\b/,
        hoverHack = function( events ) {
            if ( typeof( events ) !== "string" || jQuery.event.special.hover ) {
                return events;
            }
            if ( rhoverHack.test( events ) ) {
                migrateWarn("'hover' pseudo-event is deprecated, use 'mouseenter mouseleave'");
            }
            return events && events.replace( rhoverHack, "mouseenter$1 mouseleave$1" );
        };

// Event props removed in 1.9, put them back if needed; no practical way to warn them
    if ( jQuery.event.props && jQuery.event.props[ 0 ] !== "attrChange" ) {
        jQuery.event.props.unshift( "attrChange", "attrName", "relatedNode", "srcElement" );
    }

// Undocumented jQuery.event.handle was "deprecated" in jQuery 1.7
    if ( jQuery.event.dispatch ) {
        migrateWarnProp( jQuery.event, "handle", jQuery.event.dispatch, "jQuery.event.handle is undocumented and deprecated" );
    }

// Support for 'hover' pseudo-event and ajax event warnings
    jQuery.event.add = function( elem, types, handler, data, selector ){
        if ( elem !== document && rajaxEvent.test( types ) ) {
            migrateWarn( "AJAX events should be attached to document: " + types );
        }
        eventAdd.call( this, elem, hoverHack( types || "" ), handler, data, selector );
    };
    jQuery.event.remove = function( elem, types, handler, selector, mappedTypes ){
        eventRemove.call( this, elem, hoverHack( types ) || "", handler, selector, mappedTypes );
    };

    jQuery.fn.error = function() {
        var args = Array.prototype.slice.call( arguments, 0);
        migrateWarn("jQuery.fn.error() is deprecated");
        args.splice( 0, 0, "error" );
        if ( arguments.length ) {
            return this.bind.apply( this, args );
        }
        // error event should not bubble to window, although it does pre-1.7
        this.triggerHandler.apply( this, args );
        return this;
    };

    jQuery.fn.toggle = function( fn, fn2 ) {

        // Don't mess with animation or css toggles
        if ( !jQuery.isFunction( fn ) || !jQuery.isFunction( fn2 ) ) {
            return oldToggle.apply( this, arguments );
        }
        migrateWarn("jQuery.fn.toggle(handler, handler...) is deprecated");

        // Save reference to arguments for access in closure
        var args = arguments,
            guid = fn.guid || jQuery.guid++,
            i = 0,
            toggler = function( event ) {
                // Figure out which function to execute
                var lastToggle = ( jQuery._data( this, "lastToggle" + fn.guid ) || 0 ) % i;
                jQuery._data( this, "lastToggle" + fn.guid, lastToggle + 1 );

                // Make sure that clicks stop
                event.preventDefault();

                // and execute the function
                return args[ lastToggle ].apply( this, arguments ) || false;
            };

        // link all the functions, so any of them can unbind this click handler
        toggler.guid = guid;
        while ( i < args.length ) {
            args[ i++ ].guid = guid;
        }

        return this.click( toggler );
    };

    jQuery.fn.live = function( types, data, fn ) {
        migrateWarn("jQuery.fn.live() is deprecated");
        if ( oldLive ) {
            return oldLive.apply( this, arguments );
        }
        jQuery( this.context ).on( types, this.selector, data, fn );
        return this;
    };

    jQuery.fn.die = function( types, fn ) {
        migrateWarn("jQuery.fn.die() is deprecated");
        if ( oldDie ) {
            return oldDie.apply( this, arguments );
        }
        jQuery( this.context ).off( types, this.selector || "**", fn );
        return this;
    };

// Turn global events into document-triggered events
    jQuery.event.trigger = function( event, data, elem, onlyHandlers  ){
        if ( !elem && !rajaxEvent.test( event ) ) {
            migrateWarn( "Global events are undocumented and deprecated" );
        }
        return eventTrigger.call( this,  event, data, elem || document, onlyHandlers  );
    };
    jQuery.each( ajaxEvents.split("|"),
        function( _, name ) {
            jQuery.event.special[ name ] = {
                setup: function() {
                    var elem = this;

                    // The document needs no shimming; must be !== for oldIE
                    if ( elem !== document ) {
                        jQuery.event.add( document, name + "." + jQuery.guid, function() {
                            jQuery.event.trigger( name, null, elem, true );
                        });
                        jQuery._data( this, name, jQuery.guid++ );
                    }
                    return false;
                },
                teardown: function() {
                    if ( this !== document ) {
                        jQuery.event.remove( document, name + "." + jQuery._data( this, name ) );
                    }
                    return false;
                }
            };
        }
    );


})( jQuery, window );

/**
 * jQuery JSON plugin v2.5.1
 * https://github.com/Krinkle/jquery-json
 *
 * @author Brantley Harris, 2009-2011
 * @author Timo Tijhof, 2011-2014
 * @source This plugin is heavily influenced by MochiKit's serializeJSON, which is
 *         copyrighted 2005 by Bob Ippolito.
 * @source Brantley Harris wrote this plugin. It is based somewhat on the JSON.org
 *         website's http://www.json.org/json2.js, which proclaims:
 *         "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
 *         I uphold.
 * @license MIT License <http://opensource.org/licenses/MIT>
 */
(function ($) {
  'use strict';

  var escape = /["\\\x00-\x1f\x7f-\x9f]/g,
    meta = {
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '"': '\\"',
      '\\': '\\\\'
    },
    hasOwn = Object.prototype.hasOwnProperty;

  /**
   * jQuery.toJSON
   * Converts the given argument into a JSON representation.
   *
   * @param o {Mixed} The json-serializable *thing* to be converted
   *
   * If an object has a toJSON prototype, that will be used to get the representation.
   * Non-integer/string keys are skipped in the object, as are keys that point to a
   * function.
   *
   */
  $.toJSON = typeof JSON === 'object' && JSON.stringify ? JSON.stringify : function (o) {
    if (o === null) {
      return 'null';
    }

    var pairs, k, name, val,
      type = $.type(o);

    if (type === 'undefined') {
      return undefined;
    }

    // Also covers instantiated Number and Boolean objects,
    // which are typeof 'object' but thanks to $.type, we
    // catch them here. I don't know whether it is right
    // or wrong that instantiated primitives are not
    // exported to JSON as an {"object":..}.
    // We choose this path because that's what the browsers did.
    if (type === 'number' || type === 'boolean') {
      return String(o);
    }
    if (type === 'string') {
      return $.quoteString(o);
    }
    if (typeof o.toJSON === 'function') {
      return $.toJSON(o.toJSON());
    }
    if (type === 'date') {
      var month = o.getUTCMonth() + 1,
        day = o.getUTCDate(),
        year = o.getUTCFullYear(),
        hours = o.getUTCHours(),
        minutes = o.getUTCMinutes(),
        seconds = o.getUTCSeconds(),
        milli = o.getUTCMilliseconds();

      if (month < 10) {
        month = '0' + month;
      }
      if (day < 10) {
        day = '0' + day;
      }
      if (hours < 10) {
        hours = '0' + hours;
      }
      if (minutes < 10) {
        minutes = '0' + minutes;
      }
      if (seconds < 10) {
        seconds = '0' + seconds;
      }
      if (milli < 100) {
        milli = '0' + milli;
      }
      if (milli < 10) {
        milli = '0' + milli;
      }
      return '"' + year + '-' + month + '-' + day + 'T' +
        hours + ':' + minutes + ':' + seconds +
        '.' + milli + 'Z"';
    }

    pairs = [];

    if ($.isArray(o)) {
      for (k = 0; k < o.length; k++) {
        pairs.push($.toJSON(o[k]) || 'null');
      }
      return '[' + pairs.join(',') + ']';
    }

    // Any other object (plain object, RegExp, ..)
    // Need to do typeof instead of $.type, because we also
    // want to catch non-plain objects.
    if (typeof o === 'object') {
      for (k in o) {
        // Only include own properties,
        // Filter out inherited prototypes
        if (hasOwn.call(o, k)) {
          // Keys must be numerical or string. Skip others
          type = typeof k;
          if (type === 'number') {
            name = '"' + k + '"';
          } else if (type === 'string') {
            name = $.quoteString(k);
          } else {
            continue;
          }
          type = typeof o[k];

          // Invalid values like these return undefined
          // from toJSON, however those object members
          // shouldn't be included in the JSON string at all.
          if (type !== 'function' && type !== 'undefined') {
            val = $.toJSON(o[k]);
            pairs.push(name + ':' + val);
          }
        }
      }
      return '{' + pairs.join(',') + '}';
    }
  };

  /**
   * jQuery.evalJSON
   * Evaluates a given json string.
   *
   * @param str {String}
   */
  $.evalJSON = typeof JSON === 'object' && JSON.parse ? JSON.parse : function (str) {
    /*jshint evil: true */
    return eval('(' + str + ')');
  };

  /**
   * jQuery.secureEvalJSON
   * Evals JSON in a way that is *more* secure.
   *
   * @param str {String}
   */
  $.secureEvalJSON = typeof JSON === 'object' && JSON.parse ? JSON.parse : function (str) {
    var filtered =
      str
        .replace(/\\["\\\/bfnrtu]/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, '');

    if (/^[\],:{}\s]*$/.test(filtered)) {
      /*jshint evil: true */
      return eval('(' + str + ')');
    }
    throw new SyntaxError('Error parsing JSON, source is not valid.');
  };

  /**
   * jQuery.quoteString
   * Returns a string-repr of a string, escaping quotes intelligently.
   * Mostly a support function for toJSON.
   * Examples:
   * >>> jQuery.quoteString('apple')
   * "apple"
   *
   * >>> jQuery.quoteString('"Where are we going?", she asked.')
   * "\"Where are we going?\", she asked."
   */
  $.quoteString = function (str) {
    if (str.match(escape)) {
      return '"' + str.replace(escape, function (a) {
        var c = meta[a];
        if (typeof c === 'string') {
          return c;
        }
        c = a.charCodeAt();
        return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
      }) + '"';
    }
    return '"' + str + '"';
  };

}(jQuery));

/**
 * 工具类库.
 *
 * @description 修改urlParsingNode变量 on 14/7/29
 * @class Est - 工具类库
 * @constructor Est
 */
;
(function () {
  'use strict';
  var root = this;
  /**
   * @description 系统原型方法
   * @method [变量] - slice push toString hasOwnProperty concat
   * @private
   */
  var slice = Array.prototype.slice, push = Array.prototype.push, toString = Object.prototype.toString,
    hasOwnProperty = Object.prototype.hasOwnProperty, concat = Array.prototype.concat;
  /**
   * @description ECMAScript 5 原生方法
   * @method [变量] - nativeIsArray nativeKeys nativeBind
   * @private
   */
  var nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeBind = Object.prototype.bind;
  var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\n\
        \u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
  var uid = ['0', '0', '0'];
  var url = window.location.href;
  var urlParsingNode = null;
  /**
   * @description define
   * @method [变量] - moduleMap
   * @private
   */
  var moduleMap = {};
  var fileMap = {};
  var noop = function () {
  };
  /**
   * @description  定义数组和对象的缓存池
   * @method [变量] - maxPoolSize arrayPool objectPool
   * @private
   */
  var maxPoolSize = 40;
  var arrayPool = [], objectPool = [];
  /**
   * @method [变量] - cache
   * @private
   * 缓存对象 */
  var cache = {};
  /**
   * @method [变量] - routes
   * @private
   * url 路由 */
  var routes = {};
  var el = null, current = null;

  /**
   * @description 创建Est对象
   * @method [对象] - Est
   * @private
   */
  var Est = function (value) {
    return (value && typeof value == 'object' &&
      typeOf(value) !== 'array' && hasOwnProperty.call(value, '_wrapped')) ? value :
      new Wrapper(value);
  };

  /**
   * 调试
   *
   * @method [调试] - debug (打印错误信息)
   * @param str
   * @param options
   * @author wyj 14.12.24
   * @example
   *       debug('test');
   *       debug('test', {
   *         type: 'error' // 打印红色字体
   *       });
   *       debug(function(){
   *         return 'test';
   *       });
   */
  function debug(str, options) {
    var opts, msg;
    if (CONST.DEBUG_CONSOLE) {
      try {
        opts = Est.extend({ type: 'console' }, options);
        msg = Est.typeOf(str) === 'function' ? str() : str;
        if (!Est.isEmpty(msg)) {
          if (opts.type === 'error') {
            console.error(msg);
          } else if (opts.type === 'alert') {
            alert(msg);
          } else {
            console.log(msg);
          }
        }
      } catch (e) {
      }
    }
  }

  window.debug = Est.debug = debug;

  function Wrapper(value, chainAll) {
    this._chain = !!chainAll;
    this._wrapped = value;
  }

  Est.v = '0605041705'; // 机汇网
  //Est.v = '00111114'; // 上门网
  /**
   * @description 用于node.js 导出
   * @method [模块] - exports
   * @private
   */
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Est;
    }
    exports.Est = Est;
  } else {
    root.Est = Est;
  }
  function identity(value) {
    return value;
  }

  Est.identity = identity;
  var matchCallback = function (value, context, argCount) {
    if (value == null) return Est.identity;
    if (Est.isFunction(value)) return createCallback(value, context, argCount);
    if (typeOf(value) === 'object') return matches(value);
    if (typeOf(value) === 'array') return value;
    return property(value);
  };
  var createCallback = function (func, context, argCount) {
    if (!context) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1:
        return function (value) {
          return func.call(context, value);
        };
      case 2:
        return function (value, other) {
          return func.call(context, value, other);
        };
      case 3:
        return function (value, index, collection) {
          return func.call(context, value, index, collection);
        };
      case 4:
        return function (accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
    }
    return function () {
      return func.apply(this, arguments);
    };
  };

  /**
   * @description 遍历数据或对象。如果传递了context参数，则把callback绑定到context对象上。
   * 如果list是数组，callback的参数是：(element, index, list, first, last)。
   * 如果list是个JavaScript对象，callback的参数是 (value, key, list, index, first, last))。返回list以方便链式调用。
   * 如果callback 返回false,则中止遍历
   * @method [数组] - each ( 遍历数据或对象 )
   * @param {Array/Object} obj 遍历对象
   * @param {Function} callback 回调函数
   * @param {Object} context 上下文
   * @return {Object}
   * @example
   *     Est.each([1, 2, 3], function(item, index, list, isFirst, isLast){
   *        alert(item);
   *     });
   *     ==> alerts each number in turn...
   *
   *     Est.each({one: 1, two: 2, three: 3}, function(value, key, object, index, isFirst, isLast){
   *        alert(value);
   *     });
   *     ==> alerts each number value in turn...
   */
  function each(obj, callback, context) {
    var i, length, first = false, last = false;
    if (obj == null) return obj;
    callback = createCallback(callback, context);
    if (obj.length === +obj.length) {
      for (i = 0, length = obj.length; i < length; i++) {
        first = i === 0 ? true : false;
        last = i === length - 1 ? true : false;
        if (callback(obj[i], i, obj, first, last) === false) break;
      }
    } else {
      var ks = keys(obj);
      for (i = 0, length = ks.length; i < length; i++) {
        first = i === 0 ? true : false;
        last = i === ks.length - 1 ? true : false;
        if (callback(obj[ks[i]], ks[i], obj, i, first, last) === false) break;
      }
    }
    return obj;
  }

  Est.each = Est.forEach = each;
  /**
   * @description 复制source对象中的所有属性覆盖到destination对象上，并且返回 destination 对象.
   * 复制是按顺序的, 所以后面的对象属性会把前面的对象属性覆盖掉(如果有重复).
   * @method [对象] - extend ( 继承 )
   * @param {Object} obj destination对象
   * @return {Object} 返回 destination 对象
   * @author wyj on 14/5/22
   * @example
   *      Est.extend({name: 'moe'}, {age: 50});
   *      ==> {name: 'moe', age: 50}
   */
  Est.extend = function (obj) {
    var h = obj.$$hashKey;
    if (typeOf(obj) !== 'object') return obj;
    each(slice.call(arguments, 1), function (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    setHashKey(obj, h);
    return obj;
  };

  if (typeof /./ !== 'function') {
    /**
     * @description 如果object是一个参数对象，返回true
     * @method [对象] - isFunction ( 判断是否是对象 )
     * @param {*} obj 待检测参数
     * @return {boolean}
     * @author wyj on 14/5/22
     * @example
     *      Est.isFunction(alert);
     *      ==> true
     */
    Est.isFunction = function (obj) {
      return typeof obj === 'function';
    };
  }
  /**
   * @description 返回一个对象里所有的方法名, 而且是已经排序的 — 也就是说, 对象里每个方法(属性值是一个函数)的名称.
   * @method [对象] - functions ( 返回一个对象里所有的方法名 )
   * @param {Object} obj 检测对象
   * @return {Array} 返回包含方法数组
   * @author wyj on 14/5/22
   * @example
   *      Est.functions(Est);
   *      ==> ["trim", "remove", "fromCharCode", "cloneDeep", "clone", "nextUid", "hash" ...
   */
  Est.functions = Est.methods = function (obj) {
    var names = [];
    for (var key in obj) {
      if (Est.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };
  /**
   * 解码ASCII码
   * @method [字符串] - fromCharCode ( 解码ASCII码 )
   * @param code
   * @return {string}
   * @author wyj 15.2.9
   * @example
   *       Est.fromCharCode(97);
   *       ==> a
   */
  Est.fromCharCode = function (code) {
    try {
      return String.fromCharCode(code);
    } catch (e) {
    }
  };
  /**
   * @description 返回一个封装的对象. 在封装的对象上调用方法会返回封装的对象本身, 直道 value 方法调用为止.
   * @method [对象] - chain ( 返回一个封装的对象 )
   * @param value
   * @return {*}
   * @author wyj on 14/5/22
   * @example
   *      var stooges = [{name: 'curly', age: 25}, {name: 'moe', age: 21}, {name: 'larry', age: 23}];
   *      var youngest = Est.chain(stooges)
   *          .sortBy(function(stooge){ return stooge.age; })
   *          .map(function(stooge){ return stooge.name + ' is ' + stooge.age; })
   *          .first()
   *          .value();
   *      ==> "moe is 21"
   */
  Est.chain = function (value) {
    value = new Wrapper(value);
    value._chain = true;
    return value;
  };
  /**
   * @description 如果对象 object 中的属性 property 是函数, 则调用它, 否则, 返回它。
   * @method [对象] - result ( 返回结果 )
   * @param obj
   * @return {*}
   * @author wyj on 14/5/22
   * @example
   *      var object = {cheese: 'crumpets', stuff: function(){ return 'nonsense'; }};
   *      Est.result(object, 'cheese');
   *      ==> "crumpets"
   *
   *      Est.result(object, 'stuff');
   *      ==> "nonsense"
   */
  var result = function (obj, context) {
    //var ctx = typeOf(context) !== 'undefined' ? context : Est;
    return this._chain ? new Wrapper(obj, true) : obj;
  };
  // ObjectUtils
  /**
   * @description [1]检测数据类型 [undefined][number][string][function][regexp][array][date][error]
   * @method [对象] - typeOf ( 检测数据类型 )
   * @param {*} target 检测对象
   * @return {*|string}
   * @author wyj on 14/5/24
   * @example
   *      Est.typeOf(Est);
   *      ==> 'object'
   */
  var _type = {"undefined": "undefined", "number": "number", "boolean": "boolean", "string": "string",
    "[object Function]": "function", "[object RegExp]": "regexp", "[object Array]": "array",
    "[object Date]": "date", "[object Error]": "error", "[object File]": "file", "[object Blob]": "blob"};

  function typeOf(target) {
    return _type[typeof target] || _type[toString.call(target)] || (target ? "object" : "null");
  }

  Est.typeOf = typeOf;

  /**
   * @description 根据字段获取值
   * @method [对象] - getValue ( 根据字段获取值 )
   * @param object
   * @param path
   * @return {*}
   * @author wyj 14.12.4
   * @example
   *    var object = {item: {name: join}};
   *    Est.getValue(object, 'item.name');
   *    ==> "join"
   */
  function getValue(object, path) {
    if (Est.isEmpty(object)) return null;
    var array, result;
    if (arguments.length < 2 || typeOf(path) !== 'string') {
      console.error('参数不能少于2个， 且path为字符串');
      return;
    }
    array = path.split('.');
    function get(object, array) {
      if (isEmpty(object)) return null;
      each(array, function (key) {
        if (key in object) {
          if (array.length === 1) {
            // 如果为数组最后一个元素， 则返回值
            result = object[key];
          } else {
            // 否则去除数组第一个， 递归调用get方法
            array.shift();
            get(object[key], array);
            // 同样跳出循环
            return false;
          }
        } else {
          // 没找到直接跳出循环
          return false;
        }
      });
      return result;
    }

    return get(object, array);
    /*var array = [];
     var temp = cloneDeep(object);
     if (typeOf(path) === 'string'){
     array = path.split('.');
     each(array, function(key){
     temp = temp[key];
     });
     } else if (typeOf(path) === 'function'){
     path.call(this, object);
     }
     return temp;*/
  }

  Est.getValue = getValue;

  /**
   * @description 设置对象值
   *
   * @method [对象] - setValue ( 设置对象值 )
   * @param object
   * @param path
   * @param value
   * @return {boolean}
   * @author wyj 14.12.4
   * @example
   *    var object = {};
   *    Est.setValue(object, 'item.name', 'bbb');
   *    ==> {item: {name: 'bbb'}};
   */
  function setValue(object, path, value) {
    if (arguments.length < 3 || typeOf(path) !== 'string') return false;
    var array = path.split('.');
    if (!object) {
      console.log('setValue ==> object can not be null!!');
      object = {};
    }

    function set(object, array, value) {
      each(array, function (key) {
        if (!(key in object)) object[key] = {};
        if (array.length === 1) {
          object[key] = value;
        } else {
          array.shift();
          set(object[key], array, value);
          return false;
        }
      });
    }

    set(object, array, value);
  }

  Est.setValue = setValue;


  /**
   * @description 判断是否为空 (空数组， 空对象， 空字符串， 空方法， 空参数, null, undefined) 不包括数字0和1 【注】苹果手机有问题
   * @method [对象] - isEmpty ( 判断是否为空 )
   * @param {Object} value
   * @return {boolean}
   * @author wyj on 14/6/26
   * @example
   *      Est.isEmpty(value);
   *      ==> false
   */
  function isEmpty(value) {
    var result = true;
    if (typeOf(value) === 'number') return false;
    if (!value) return result;
    var className = toString.call(value),
      length = value.length;
    if ((className == '[object Array]' || className == '[object String]' || className == '[object Arguments]' ) ||
      (className == '[object Object]' && typeof length == 'number' && Est.isFunction(value.splice))) {
      return !length;
    }
    each(value, function () {
      return (result = false);
    });
    return result;
  }

  Est.isEmpty = isEmpty;

  /**
   * @description [2]判断对象是否含有某个键 不是原型对象
   * @method [对象] - hasKey ( 判断对象是否含有某个键 )
   * @param {Object} obj 检测对象
   * @param {Sting} key 检测键
   * @return {boolean|*}
   * @author wyj on 14/5/25
   * @example
   *      var object6 = {name:1,sort:1};
   *      Est.hasKey(object6, 'name')
   *      ==> true
   */
  function hasKey(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  }

  Est.hasKey = hasKey;
    /**
   * @description 计算hash值
   * @method [对象] - hashKey ( 计算hash值 )
   * @param obj
   * @return {string}
   * @author wyj on 14/6/25
   * @example
   *      Est.hashKey(obj);
   *      ==> 'object:001'
   */
  function hashKey(obj) {
    var objType = typeof obj, key;
    if (objType == 'object' && obj !== null) {
      if (typeof (key = obj.$$hashKey) == 'function') {
        key = obj.$$hashKey();
      } else if (key === undefined) {
        key = obj.$$hashKey = nextUid();
      }
    } else {
      key = obj;
    }
    return objType + ':' + key;
  }

  Est.hashKey = hashKey;
  /**
   * 字符串转换成hash值
   * @method [字符串] - hash ( 字符串转换成hash值 )
   * @param str
   * @return {number}
   * @author wyh 15.2.28
   * @example
   *        Est.hash('aaaaa');
   */
  function hash(str) {
    try {
      var hash = 5381,
        i = str.length;
      while (i)
        hash = (hash * 33) ^ str.charCodeAt(--i);
      return hash >>> 0;
    } catch (e) {
      debug('error:595 the arguments of Est.hash must be string ==>' + e);
    }
  }

  Est.hash = hash;
  /**
   * @description 设置hashKey
   * @method [对象] - setHashKey ( 设置hashKey )
   * @param {Object} obj
   * @param {String} h
   */
  function setHashKey(obj, h) {
    if (h) {
      obj.$$hashKey = h;
    }
    else {
      delete obj.$$hashKey;
    }
  }

  Est.setHashKey = setHashKey;

  /**
   * @description [3]过滤对象字段
   * @method [对象] - pick ( 过滤对象字段 )
   * @param {Object} obj 过滤对象
   * @param {Function} callback 回调函数
   * @param context
   * @return {{}}
   * @author wyj on 14/5/26
   * @example
   *      var object3 = {name:'a', sort: '1', sId: '000002'};
   *      Est.pick(object3, ['name','sort'])
   *      ==> {"name":"a","sort":"1"}
   */
  function pick(obj, callback, context) {
    var result = {}, key;
    if (typeOf(callback) === 'function') {
      for (key in obj) {
        var value = obj[key];
        if (callback.call(context, value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      each(keys, function (key) {
        if (key in obj) result[key] = obj[key];
      });
    }
    return result;
  }

  Est.pick = pick;
  /**
   * @description 返回获取对象属性值的方法
   * @method [对象] - property ( 返回获取对象属性值 )
   * @param {Object} key
   * @return {Function}
   */
  function property(key) {
    return function (object) {
      if (Est.typeOf(object) === 'string') return null;
      return Est.getValue(object, key);
    };
  }

  Est.property = property;
  /**
   * @description 翠取对象中key对应的值
   * @method [对象] - pluck ( 翠取对象中key对应的值 )
   * @param obj
   * @param key
   * @return {*}
   * @author wyj on 14/7/5
   * @example
   *      var characters = [ { 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 } ];
   *      var result = Est.pluck(characters, 'name');
   *      ==> [ "barney", "fred" ]
   */
  function pluck(obj, key) {
    return map(obj, property(key), null);
  }

  Est.pluck = pluck;
  /**
   * @description 释放数组， 若数组池个数少于最大值， 则压入数组池以备用
   * @method [数组] - releaseArray ( 释放数组 )
   * @author wyj on 14/7/1
   * @example
   *      Est.releaseArray(array);
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  Est.releaseArray = releaseArray;
  /**
   * @description 释放对象， 若对象池个数少于最大值， 则压入对象池以备用
   * @method [对象] - releaseObject ( 释放对象 )
   * @author wyj on 14/7/1
   * @example
   *      Est.releaseObject(object);
   */
  function releaseObject(object) {
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  Est.releaseObject = releaseObject;
  /**
   * @description 获取数组池
   * @method [数组] - getArray ( 获取数组池 )
   * @return {Array}
   * @author wyj on 14/7/1
   * @example
   *      var array = Est.getArray();
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  Est.getArray = getArray;
  /**
   * @description 获取对象池 主要用于优化性能
   * @method [对象] - getObject ( 获取对象池 )
   * @return {Object}
   * @author wyj on 14/7/1
   * @example
   *      var object = Est.getObject();
   */
  function getObject() {
    return objectPool.pop() || { 'array': null, 'cache': null, 'criteria': null, 'false': false, 'index': 0, 'null': false, 'number': null, 'object': null, 'push': null, 'string': null, 'true': false, 'undefined': false, 'value': null };
  }

  Est.getObject = getObject;

  function baseClone(value, isDeep, callback, stackA, stackB) {
    //var type = getType(value);
    var type = typeOf(value);
    if (callback) {
      var result = callback(value);
      if (typeof result !== 'undefined') return result;
    }
    if (typeof value === 'object' && type !== 'null') {
      switch (type) {
        case 'function':
          return value;
          break;
        case 'date':
          return new Date(+value);
          break;
        case 'string':
          return new String(value);
          break;
        case 'regexp':
          result = RegExp(value.source, /\w*$/.exec(value));
          result.lastIndex = value.lastIndex;
          break;
      }
    } else {
      return value;
    }
    var isArr = type === 'array';
    if (isDeep) {
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());
      var length = stackA.length;
      while (length--) {
        if (stackA[length] === value) {
          return stackB[length];
        }
      }
      result = isArr ? Array(value.length) : {};
    } else {
      result = isArr ? arraySlice(value, 0, value.length) : extend({}, value);
    }
    if (isArr) {
      if (hasOwnProperty.call(value, 'index')) {
        result.index = value.index;
      }
      if (hasOwnProperty.call(value, 'input')) {
        result.input = value.input;
      }
    }
    if (!isDeep) {
      return result;
    }
    stackA.push(value);
    stackB.push(result);
    each(value, function (target, key) {
      result[key] = baseClone(target, isDeep, callback, stackA, stackB);
    });
    if (initedStack) {
      releaseArray(stackA);
      releaseArray(stackB);
    }
    return result;
  }

  /**
   * @description 浅复制
   * @method [对象] - clone ( 浅复制 )
   * @param value
   * @param callback
   * @param context
   * @return {*}
   * @author wyj on 14/7/6
   * @example
   *
   */
  function clone(value, callback, context) {
    callback = typeOf(callback) === 'function' && matchCallback(callback, context, 1);
    return baseClone(value, false, callback);
  }

  Est.clone = clone;
  /**
   * @description 深复制
   * @method [对象] - cloneDeep ( 深复制 )
   * @param value
   * @param callback
   * @param context
   * @return {*}
   * @author wyj on 14/7/6
   * @example
   *
   */
  function cloneDeep(value, callback, context) {
    callback = typeOf(callback) === 'function' && matchCallback(callback, context, 1);
    return baseClone(value, true, callback);
  }

  Est.cloneDeep = cloneDeep;

  /**
   * @description 返回一个设置参数的对象
   * @method [对象] - setArguments ( 返回一个设置参数的对象 )
   * @param args
   * @param {object/string} append
   * @author wyj on 14.9.12
   *      return Est.setArguments(arguments, {age： 1});
   */
  function setArguments(args, append) {
    this.value = [].slice.call(args);
    this.append = append;
  }

  Est.setArguments = setArguments;



  // FormUtils =============================================================================================================================================

  /**
   * @description 表单验证
   * @method [表单] - validation ( 表单验证 )
   * @param  {String} str  待验证字符串 str可为数组 判断所有元素是否都为数字
   * @param  {String} type 验证类型
   * @return {Boolean}      返回true/false
   * @author wyj on 14.9.29
   * @example
   *      var result_n = Est.validation(number, 'number'); // 数字或带小数点数字
   *      var result_e = Est.validation(email, 'email'); // 邮箱
   *      var result_c = Est.validation(cellphone, 'cellphone'); // 手机号码
   *      var result_d = Est.validation(digits, 'digits'); // 纯数字， 不带小数点
   *      var result_u = Est.validation(url, 'url'); // url地址
   */
  function validation(str, type) {
    var pattern, flag = true;
    switch (type) {
      case 'cellphone':
        pattern = /((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/;
        break;
      case 'email':
        pattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        break;
      case 'url':
        pattern = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
        break;
      case 'number':
        // 可带小数点 如：0.33， 35.325
        pattern = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/; // ^\s*(?=.*[1-9])\d*(?:\.\d{1,2})?\s*$ .1 matches 0.1 matches 1.12 matches 123.12 matches 92 matches 092 matches 092.13 matches 0 doesn't match 0.0 doesn't match 0.00 doesn't match 00 doesn't match 1.234 doesn't match -1 doesn't match -1.2 doesn't match
        break;
      case 'digits': //还可带小数点
        pattern = /^\d+$/;
        break;
    }
    if (this.typeOf(str) === 'array') {
      this.each(str, function (item) {
        if (!pattern.test(item))
          flag = false;
      });
    } else {
      flag = pattern.test(str);
    }
    return flag;
  }

  Est.validation = validation;


  // StringUtils =============================================================================================================================================
  /**
   * @description 产生唯一身份标识， 如'012ABC', 若为数字较容易数字溢出
   * @method [字符串] - nextUid ( 产生唯一身份标识 )
   * @return {string}
   * @param {String} prefix 前缀
   * @author wyj on 14/6/23
   * @example
   *      var uid = Est.nextUid('Uid');
   *      ==> 'Uid001'
   */
  function nextUid(prefix) {
    var index = uid.length, digit;
    if (typeOf(prefix) === "undefined")
      prefix = '';
    while (index) {
      index--;
      digit = uid[index].charCodeAt(0);
      if (digit == 57 /*'9'*/) {
        uid[index] = 'A';
        return prefix + uid.join('');
      }
      if (digit == 90  /*'Z'*/) {
        uid[index] = '0';
      } else {
        uid[index] = Est.fromCharCode(digit + 1);
        return prefix + uid.join('');
      }
    }
    uid.unshift('0');
    return prefix + uid.join('');
  }

  Est.nextUid = nextUid;

  /**
   * @description id值瘦身 去掉前面的字母与0 比如 Product_0000000000000000000132 瘦身为132
   * @method [字符串] - encodeId ( id值瘦身 )
   * @param target
   * @return {string}
   * @author wyj 15.1.9
   * @example
   *      Est.encodeId('Product_00000000000000132');
   *      ==> 132
   */
  function encodeId(target) {
    return target == null ? "" : target.replace(/^[^1-9]+/, "");
  }

  Est.encodeId = encodeId;

  /**
   * 还原ID
   * @method [字符串] - decodeId ( 还原ID )
   * @param id
   * @param prefix
   * @param length
   * @return {string}
   * @author wyj 15.1.13
   * @example
   *      Est.decodeId('123' , 'Product_' , 32);
   *      ==> Product_00000000000000000000123
   */
  function decodeId(id, prefix, length) {
    var len = prefix.length + id.length - 1;
    return prefix + new Array(length - len).join('0') + id;
  }

  Est.decodeId = decodeId;

  /**
   * @description 转换成小写字母
   * @method [字符串] - lowercase ( 转换成小写字母 )
   * @param {String} string 原字符串
   * @return {string}
   * @author wyj on 14/6/17
   * @example
   *      Est.lowercase("LE");
   *      ==> le
   */
  function lowercase(string) {
    return typeOf(string) === 'string' ? string.toLowerCase() : string;
  }

  Est.lowercase = lowercase;
  /**
   * @description 转换成大写字母
   * @method [字符串] - uppercase ( 转换成大写字母 )
   * @param {String} string 原字符串
   * @return {string}
   * @author wyj on 14/6/17
   * @example
   *      Est.uppercase("le");
   *      ==> LE
   */
  function uppercase(string) {
    return typeOf(string) === 'string' ? string.toUpperCase() : string;
  }

  Est.uppercase = uppercase;

  /**
   * @description 判定一个字符串是否包含另一个字符串
   * @method [字符串] - contains ( 字符串是否包含另一个字符串 )
   * @param {string} target 目标字符串
   * @param {string} 包含字符串
   * @param {string} 判定一个元素的className 是否包含某个特定的class
   * @return {boolean} 返回true/false
   * @author wyj on 14-04-23
   * @example
   *      Est.contains("aaaaa", "aa");
   *      ==> true
   */
  function contains(target, str, separator) {
    return separator ? (separator + target + separator).indexOf(separator + str + separator) > -1 : target.indexOf(str) > -1;
  }

  Est.contains = contains;
  /**
   * @description 判定目标字符串是否位于原字符串的开始之处
   * @method [字符串] - startsWidth ( 字符串是否位于原字符串的开始之处 )
   * @param {target} 原字符串
   * @param {str} 目标字符串
   * @param {boolean} 是否忽略大小写
   * @return {boolean} true/false
   * @author wyj on 14-04-23
   * @example
   *      Est.startsWidth('aaa', 'aa', true);
   *      ==> true
   */
  function startsWith(target, str, ignorecase) {
    if (!target) {
      return false;
    }
    var start_str = target.substr(0, str.length);
    return ignorecase ? start_str.toLowerCase() === str.toLowerCase() : start_str === str;
  }

  Est.startsWidth = startsWith;
  /**
   * @description 判定目标字符串是否位于原字符串的结束之处
   * @method [字符串] - endsWidth ( 字符串是否位于原字符串的结束之处 )
   * @param {target} 原字符串
   * @param {str} 目标字符串
   * @param {boolean} 是否忽略大小写
   * @return {boolean} true/false
   * @author wyj on 14-04-23
   * @example
   *      Est.endsWidth('aaa', 'aa', true);
   *      ==> true
   */
  function endsWith(target, str, ignorecase) {
    var end_str = target.substring(target.length - str.length);
    return ignorecase ? end_str.toLowerCase() === str.toLowerCase() : end_str === str;
  }

  Est.endsWith = endsWith;
  /**
   * @description 取得一个字符串所有字节的长度
   * @method [字符串] - byteLen ( 取得一个字符串所有字节的长度 )
   * @param target 目标字符串
   * @param fix 汉字字节长度，如mysql存储汉字时， 是用3个字节
   * @return {Number}
   * @author wyj on 14-04-23
   * @example
   *      Est.byteLen('sfasf我'， 2);
   *      ==> 7
   */
  function byteLen(target, fix) {
    fix = fix ? fix : 2;
    var str = new Array(fix + 1).join('-');
    return target.replace(/[^\x00-\xff]/g, str).length;
  }

  Est.byteLen = byteLen;

  /**
   * @description 对字符串进行截取处理，默认添加三个点号【版本二】
   * @method [字符串] - cutByte ( 对字符串进行截取处理 )
   * @param str 目标字符串
   * @param length 截取长度
   * @param truncation 结尾符号
   * @return {string}
   * @author wyj on 14-04-25
   * @example
   *     Est.cutByte('aaaaaa', 4, '...');
   *     ==> 'a...'
   */
  function cutByte(str, length, truncation) {
    if (isEmpty(str)) return '';
    //提前判断str和length
    if (!(str + "").length || !length || +length <= 0) {
      return "";
    }
    var length = +length,
      truncation = typeof(truncation) == 'undefined' ? "..." : truncation.toString(),
      endstrBl = this.byteLen(truncation);
    if (length < endstrBl) {
      truncation = "";
      endstrBl = 0;
    }
    //用于二分法查找
    function n2(a) {
      var n = a / 2 | 0;
      return (n > 0 ? n : 1);
    }

    var lenS = length - endstrBl, _lenS = 0, _strl = 0;
    while (_strl <= lenS) {
      var _lenS1 = n2(lenS - _strl),
        addn = this.byteLen(str.substr(_lenS, _lenS1));
      if (addn == 0) {
        return str;
      }
      _strl += addn;
      _lenS += _lenS1;
    }
    if (str.length - _lenS > endstrBl || this.byteLen(str.substring(_lenS - 1)) > endstrBl) {
      return str.substr(0, _lenS - 1) + truncation;
    } else {
      return str;
    }
  }

  Est.cutByte = cutByte;
  /**
   * @description 替换指定的html标签, 当第3个参数为true时， 删除该标签并删除标签里的内容
   * @method [字符串] - stripTabName ( 替换指定的html标签 )
   * @param {String} target 目标字符串
   * @param {String} tagName 标签名称
   * @param {String} deep 是否删除标签内的内容
   * @return {string}
   * @author wyj on 14/6/18
   * @example
   *      Est.stripTagName("<script>a</script>", "script", true);
   *      ==> ''
   *      Est.stripTagName("<script>a</script>", "script", false);
   *      ==> 'a'
   */
  function stripTagName(target, tagName, deep) {
    var pattern = deep ? "<" + tagName + "[^>]*>([\\S\\s]*?)<\\\/" + tagName + ">" : "<\/?" + tagName + "[^>]*>";
    return String(target || '').replace(new RegExp(pattern, 'img'), '');
  }

  Est.stripTagName = stripTagName;
  /**
   * @description 移除字符串中所有的script标签。弥补stripTags 方法的缺陷。此方法应在stripTags之前调用
   * @method [字符串] - stripScripts ( 移除字符串中所有的script标签 )
   * @param {String} target 目标字符串
   * @return {string} 返回字符串
   * @author wyj on 14/5/5
   * @example
   *     Est.stripScripts("a<script></script>");
   *     ==> 'a'
   */
  function stripScripts(target) {
    return String(target || '').replace(/<script[^>]*>([\S\s]*?)<\/script>/img, '');
  }

  Est.stripScripts = stripScripts;
  /**
   * @description 移除字符串中的html标签, 若字符串中有script标签，则先调用stripScripts方法
   * @method [字符串] - stripTags ( 移除字符串中的html标签 )
   * @param {String} target 原字符串
   * @return {string} 返回新字符串
   * @author wyj on 14/5/5
   * @example
   *     Est.stripTags('aa<div>bb</div>');
   *     ==> 'aabb'
   */
  function stripTags(target) {
    return String(target || '').replace(/<[^>]+>/img, '');
  }

  Est.stripTags = stripTags;
  /**
   * @description 替换原字符串中的“< > " '”为 “&lt;&gt;&quot;&#39;”
   * @method [字符串] - escapeHTML ( 替换原字符串中的“< > " '” )
   * @param {String} target 原字符串
   * @return {String} 返回新字符串
   * @author wyj on 14/5/5
   * @example
   *     Est.escapeHTML('<');
   *     ==> '&lt;'
   */
  function escapeHTML(target) {
    return target.replace(/&/mg, '&amp;')
      .replace(/</mg, '&lt;')
      .replace(/>/mg, '&gt;')
      .replace(/"/mg, '&quot;')
      .replace(/'/mg, '&#39;');
  }

  Est.escapeHTML = escapeHTML;
  /**
   * @description 替换原字符串中的“&lt;&gt;&quot;&#39;”为 “< > " '”
   * @method [字符串] - unescapeHTML ( 替换原字符串中的“&lt;&gt;&quot;&#39; )
   * @param {String} target 原字符串
   * @return {String} 返回新字符串
   * @author wyj on 14/5/5
   * @example
   *     Est.unescapeHTML('&lt;');
   *     ==> '<'
   */
  function unescapeHTML(target) {
    target = target || '';
    return target.replace(/&amp;/mg, '&')
      .replace(/&lt;/mg, '<')
      .replace(/&gt;/mg, '>')
      .replace(/&quot;/mg, '"')
      .replace(/&#([\d]+);/mg, function ($0, $1) {
        return Est.fromCharCode(parseInt($1, 10));
      });
  }

  Est.unescapeHTML = unescapeHTML;
  /**
   * @description 将字符串安全格式化为正则表达式的源码
   * @method [字符串] - escapeRegExp ( 将字符串安全格式化为正则表达式的源码 )
   * @param {String} target 原字符串
   * @return {*}
   * @author wyj on 14/5/16
   * @example
   *      Est.escapeRegExp('aaa/[abc]/')
   *      ==> aaa\/\[abc\]\/;
   */
  function escapeRegExp(target) {
    return target.replace(/([-.*+?^${}()|[\]\/\\])/img, '\\$1');
  }

  Est.escapeRegExp = escapeRegExp;
  /**
   * @description 为字符串的某一端添加字符串。 如：005
   * @method [字符串] - pad ( 为字符串的某一端添加字符串 )
   * @param {String/Number} target 原字符串或数字
   * @param {Number} n 填充位数
   * @param {String} filling 填充字符串
   * @param {Boolean} right 在前或后补充
   * @param {Number} radix 转换进制 10进制或16进制
   * @param {Object} opts {String} opts.prefix 前缀
   * @author wyj on 14/5/5
   * @example
   *      Est.pad(5, 10, '0', {
   *        prefix: 'prefix',
   *        right: false,
   *        radix: 10
   *      });
   *      ==> prefix0005
   */
  function pad(target, n, filling, opts) {
    var str, options,
      prefix = '',
      length = n,
      filling = filling || '0';

    options = Est.extend({
      right: false,
      radix: 10
    }, opts);

    str = target.toString(options.radix);
    if (options.prefix) {
      length = n - options.prefix.length;
      prefix = options.prefix;
      if (length < 0) {
        throw new Error('n too small');
      }
    }
    while (str.length < length) {
      if (!options.right) {
        str = filling + str;
      } else {
        str += filling;
      }
    }
    return prefix + str;
  }

  Est.pad = pad;
  /**
   * @description 格式化字符串，类似于模板引擎，但轻量级无逻辑
   * @method [字符串] - format ( 格式化字符串 )
   * @param {String} str 原字符串
   * @param {Object} object 若占位符为非零整数形式即对象，则键名为点位符
   * @return {String} 返回结果字符串
   * @author wyj on 14/5/5
   * @example
   *     Est.format("Result is #{0}, #{1}", 22, 23);
   *     ==> "Result is 22, 23"
   *
   *     Est.format("#{name} is a #{sex}", {name : 'Jhon',sex : 'man'});
   *     ==> "Jhon is a man"
   */
  function format(str, object) {
    var array = Array.prototype.slice.call(arguments, 1);
    return str.replace(/\\?\#{([^{}]+)\}/gm, function (match, name) {
      if (match.charAt(0) == '\\')
        return match.slice(1);
      var index = Number(name);
      if (index >= 0)
        return array[index];
      if (object && object[name] !== void 0)
        return object[name];
      return '';
    });
  }

  Est.format = format;

  /**
   * @description 比format更强大的模板引擎， 支持字符串模板、变量嵌套、四则运算、比较操作符、三元运算符
   * @method [字符串] - template ( 比format更强大的模板引擎 )
   * @param {String} str 待格式化字符串
   * @param {Object} data 替换对象
   * @return {String} result
   * @author wyj on 14.10.9
   * @example
   *         // 字符串
   *        var result3 =Est.template('hello {{name}}', { name: 'feenan'});
   *        ==> "hello feenan"
   *
   *        // 变量嵌套
   *        var result8 =Est.template('hello {{person.age}}', { person: {age: 50}});
   *        ==> "hello 50"
   *
   *        // 四则运算
   *        var result4 =Est.template('(1+2)*age = {{ (1+2)*age}}', {age: 18});
   *        ==> (1+2)*age = 54
   *
   *        // 比较操作符
   *        var result5 =Est.template('{{1>2}}', {});
   *        ==> false
   *        var result6 =Est.template('{{age > 18}}', {age: 20});
   *        ==> true
   *
   *        // 三元运算符
   *        var result7 =Est.template('{{ 2 > 1 ? name : ""}}', {name: 'feenan'});
   *        ==> feenan
   *
   *        // 综合
   *        var tmpl1 = '<div id="{{id}}" class="{{(i % 2 == 1 ? " even" : "")}}"> ' +
   *        '<div class="grid_1 alpha right">' +
   *        '<img class="righted" src="{{profile_image_url}}"/>' +
   *        '</div>' +
   *        '<div class="grid_6 omega contents">' +
   *        '<p><b><a href="/{{from_user}}">{{from_user}}</a>:</b>{{info.text}}</p>' +
   *        '</div>' +
   *        '</div>';
   *        var result = Est.template(tmpl1, {
   *              i: 5,
   *              id: "form_user",
   *              from_user: "Krasimir Tsonev",
   *              profile_image_url: "http://www.baidu.com/img/aaa.jpg",
   *              info: {
   *                  text: "text"
   *              }
   *         });
   */
  function template(str, data) {
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] || template(str) :
      new Function("obj",
          "var p=[],print=function(){p.push.apply(p,arguments);};" +
          "with(obj){p.push('" +
          str
            .replace(/[\r\t\n]/g, " ")
            .split("{{").join("\t")
            .replace(/((^|}})[^\t]*)'/g, "$1\r")
            .replace(/\t(.*?)}}/g, "',$1,'")
            .split("\t").join("');")
            .split("}}").join("p.push('")
            .split("\r").join("\\'")
          + "');}return p.join('');");
    return data ? fn(data) : fn;
  }

  Est.template = template;


  /**
   * @description 移除字符串左端的空白
   * @method [字符串] - trimLeft ( 移除字符串左端的空白 )
   * @param {String} str 原字符串
   * @return {String} 返回新字符串
   * @author wyj on 14/5/6
   * @example
   *     Est.ltrim('  dd    ');
   *     ==> 'dd    '
   */
  function trimLeft(str) {
    for (var i = 0; i < str.length; i++) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
    return whitespace.indexOf(str.charAt(0)) === -1 ? (str) : '';
  }

  Est.trimLeft = trimLeft;
  /**
   * @description 移除字符串右端的空白
   * @method [字符串] - rtrim ( 移除字符串右端的空白 )
   * @param {String} str 原字符串
   * @return {String} 返回新字符串
   * @author wyj on 14/5/6
   * @example
   *     Est.rtrim('  dd    ');
   *     ==> '   dd'
   */
  function trimRight(str) {
    for (var i = str.length - 1; i >= 0; i--) {
      if (whitespace.lastIndexOf(str.charAt(i)) === -1) {
        str = str.substring(0, i + 1);
        break;
      }
    }
    return whitespace.lastIndexOf(str.charAt(str.length - 1)) === -1 ? (str) : '';
  }

  Est.trimRight = trimRight;
  /**
   * @description 移除字符串两端的空白, 当字符串为undefined时， 返回null
   * @method [字符串] - trim ( 移除字符串两端的空白 )
   * @param {String} str 原字符串
   * @return {String} 返回新字符串
   * @author wyj on 14/5/6
   * @example
   *     Est.trim('  dd    ');
   *     ==> 'dd'
   */
  function trim(str) {
    if (isEmpty(str)) return null;
    for (var i = 0; i < str.length; i++) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
    for (i = str.length - 1; i >= 0; i--) {
      if (whitespace.lastIndexOf(str.charAt(i)) === -1) {
        str = str.substring(0, i + 1);
        break;
      }
    }
    return whitespace.indexOf(str.charAt(0)) === -1 ? (str) : '';
  }

  Est.trim = trim;
  /**
   * @description 去除字符串中的所有空格
   * @method [字符串] - deepTrim ( 去除字符串中的所有空格 )
   * @param {String} str 原字符串
   * @return {String} 返回新字符串
   * @author wyj on 14/5/6
   * @example
   *     Est.deepTrim('a b c');
   *     ==> 'abc'
   */
  function trimDeep(str) {
    return str.toString().replace(/\s*/gm, '');
  }

  Est.trimDeep = trimDeep;



  // ArrayUtils ===============================================================================================================================================


  /**
   * 从数组中移除
   * @method [数组] - remove ( 数组中移除数组 )
   * @param {array} targetList 原数组
   * @param {array} removeList 待移除数组
   * @param callback 两元素比较  返回true/false
   * @return {array}
   * @example
   *       var targetList = [{key: '11', value: '11'},{key: '11', value: '33'}, {key: '22', value: '22'}, {key: '33', value: '33'}];
   *
   *       var targetList2 = [1, 2, 3, 4, 5];
   *       Est.remove(targetList2, 2);
   *       ==> [1, 3, 4, 5]
   *
   *       Est.remove(targetList, {key: '11'});
   *       ==> [{key: '22', value: '22'}, {key: '33', value: '33'}]
   *
   *       Est.remove(targetList, {key: '11', value: '33'});
   *       ==> [{key: '11', value: '11'},{key: '22', value: '22'}, {key: '33', value: '33'}]
   *
   *       var removeList = [{key: '11'}];
   *       Est.remove(targetList, removeList, function(targetItem, removeItem){
   *          return targetItem.key === removeItem.key;
   *       });
   *       ==> [{key: '22', value: '22'}, {key: '33', value: '33'}];
   */
  function remove(targetList, removeList, callback) {
    var i = 0,
      hasCallback = false,
      isEqual = false;

    if (typeOf(targetList) !== 'array') {
      throw new TypeError('targetList is not a array');
      return targetList;
    }
    if (typeOf(removeList) !== 'array') {
      removeList = [removeList];
    }
    if (callback) hasCallback = true;

    i = targetList.length;

    while (i > 0) {
      var item = targetList[i - 1];
      isEqual = false;
      Est.each(removeList, function (model) {
        if (hasCallback && callback.call(this, item, model)) {
          isEqual = true;
        } else if (!hasCallback) {
          if (Est.typeOf(model) === 'object' && Est.findIndex([item], model) > -1) {
            isEqual = true;
          } else if (item === model) {
            isEqual = true;
          }
        }
        if (isEqual) {
          targetList.splice(i - 1, 1);
          return false;
        }
      });
      i--;
    }
    return targetList;
  }

  Est.remove = remove;
  /**
   * @description 获取对象的所有KEY值
   * @method [数组] - keys ( 获取对象的所有KEY值 )
   * @param {Object} obj 目标对象
   * @return {Array}
   * @author wyj on 14/5/25
   * @example
   *      Est.keys({name:1,sort:1});
   *      ==> ['name', 'sort']
   */
  function keys(obj) {
    if (typeOf(obj) !== 'object') return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (hasKey(obj, key)) keys.push(key);
    return keys;
  }

  Est.keys = keys;
  /**
   * @description 用来辨别 给定的对象是否匹配指定键/值属性的列表
   * @method [数组] - matches ( 对象是否匹配指定键/值属性的列表 )
   * @param attrs
   * @return {Function}
   * @author wyj on 14/6/26
   * @example
   */
  function matches(attrs) {
    return function (obj) {
      if (obj == null) return isEmpty(attrs);
      if (obj === attrs) return true;
      for (var key in attrs) if (attrs[key] !== obj[key]) return false;
      return true;
    };
  }

  Est.matches = matches;
  /**
   * @description 数组过滤
   * @method [数组] - filter ( 数组过滤 )
   * @param {Array} collection 数组
   * @param {Function} callback 回调函数
   * @param args
   * @author wyj on 14/6/6
   * @example
   *      var list = [{"name":"aa"},{"name":"bb"},{"name":"cc"}, {"name":"bb", address:"zjut"}];
   *      var result = Est.filter(list, function(item){
   *          return item.name.indexOf('b') > -1;
   *      });
   *      ==> [ { "name": "bb" }, { "address": "zjut", "name": "bb" } ]
   */
  function filter(collection, callback, context) {
    var results = [];
    if (!collection) return result;
    var predicate = matchCallback(callback, context);
    each(collection, function (value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  }

  Est.filter = filter;

  /**
   * @description 数组中查找符合条件的索引值 比较原始值用indexOf
   * @method [数组] - findIndex ( 数组中查找符合条件的索引值 )
   * @param array
   * @param {Function} callback 回调函数
   * @param {Object} context 上下文
   * @return {number}
   * @author wyj on 14/6/29
   * @example
   *      var list = [{"name":"aa"},{"name":"bb"},{"name":"cc"}, {"name":"bb", address:"zjut"}];
   *      var index = Est.findIndex(list, {name: 'aa'});
   *      ==> 0
   *
   *      var index2 =  Est.findIndex(list, function(item){
   *         return item.name === 'aa';
   *      });
   *      ==> 0
   */
  function findIndex(array, callback, context) {
    var index = -1,
      length = array ? array.length : 0;
    callback = matchCallback(callback, context);
    while (++index < length) {
      if (callback(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  Est.findIndex = findIndex;


  /**
   * @description 数组转化为object 如果对象key值为数字类型， 则按数字从小到大排序
   * @method [数组] - arrayToObject ( 数组转化为object )
   * @param {Array} list 目标数组
   * @param {String} name key
   * @param {String} val value
   * @return {Object} object
   * @author wyj on 14/5/24
   * @example
   *      var list4 = [{key:'key1',value:'value1'},{key:'key2',value:'value2'}];
   *      Est.arrayToObject(list4, 'key', 'value');
   *      ==> {key1: 'value1',key2: 'value2'}
   */
  function arrayToObject(list, key, val) {
    var obj = {};
    each(list, function (item) {
      if (typeOf(item[key]) !== 'undefined') {
        obj[item[key]] = item[val];
      }
    });
    return obj;
  }

  Est.arrayToObject = arrayToObject;
  /**
   * @description 对象转化为数组
   * @method [数组] - arrayFromObject ( 对象转化为数组 )
   * @param {Object} obj 待转化的对象
   * @return {Array} 返回数组
   * @author wyj on 14/5/24
   * @example
   *      var obj = {key1: 'value1', key2: 'value2'};
   *      var result = Est.arrayFromObject(obj, 'key', 'value');
   *      ==> [{key: 'key1', value: 'value1'}, {key: 'key2', value: 'value2'}]
   */
  function arrayFromObject(obj, name, value) {
    var list = [];
    if (typeOf(obj) !== 'object') {
      return [];
    }
    each(obj, function (val, key) {
      var object = {};
      object[name] = key;
      object[value] = val;
      list.push(object);
    });
    return list;
  }

  Est.arrayFromObject = arrayFromObject;
  /**
   * @description 交换元素
   * @method [数组] - arrayExchange ( 交换元素 )
   * @param {Array} list 原数组
   * @param {Number} thisdx 第一个元素索引值
   * @param {Number} targetdx 第二个元素索引值
   * @param {Object} opts {String} opts.column 需要替换的列值;{Function} opts.callback(thisNode, nextNode) 回调函数 返回两个对调元素
   * @author wyj on 14/5/13
   * @example
   *      var list2 = [{name:1, sort:1},{name:2, sort:2}];
   *      Est.arrayExchange(list2, 0 , 1, {
   *          column:'sort',
   *          callback:function(thisNode, targetNode){
   *          }
   *      });
   *      ==> [{name:2,sort:1},{name:1,sort:2}]
   */
  function arrayExchange(list, thisdx, targetdx, opts) {
    if (thisdx < 0 || thisdx > list.length || targetdx < 0 || targetdx > list.length) {
      throw new Error('method exchange: thisdx or targetdx is invalid !');
    }
    var thisNode = list[thisdx],
      nextNode = list[targetdx],
      temp = thisNode,
      thisSort = 0;
    // 更换列值
    if (opts && typeof opts.column === 'string') {
      thisSort = getValue(thisNode, opts.column);
      setValue(thisNode, opts.column, getValue(nextNode, opts.column));
      setValue(nextNode, opts.column, thisSort);
    }
    // 更新数据
    if (opts && typeof opts.callback === 'function') {
      opts.callback.apply(null, [thisNode, nextNode]);
    }
    // 替换位置
    list[thisdx] = nextNode;
    list[targetdx] = temp;
  }

  Est.arrayExchange = arrayExchange;
  /**
   * @description 数组插序
   * @method [数组] - arrayInsert ( 数组插序 )
   * @param {Array} list 原数组
   * @param {Number} thisdx 第一个元素索引
   * @param {Number} targetdx 第二个元素索引
   * @param {Object} opts    {String} opts.column:需要替换的列值; {Function} opts.callback(list)回调函数 返回第一个元素与第二个元素之间的所有元素
   * @author wyj on 14/5/15
   * @example
   *          var list3 = [{name:1, sort:1},{name:2, sort:2},{name:3, sort:3},{name:4, sort:4}];
   *          Est.arrayInsert(list3, 3 , 1, {column:'sort',callback:function(list){}});
   *          ==> [{name:1,sort:1},{name:4,sort:2},{name:2,sort:3},{name:3,sort:4}]
   */
  function arrayInsert(list, thisdx, targetdx, opts) {
    var tempList = []; // 用于存放改变过的值
    if (thisdx < targetdx) {
      for (var i = thisdx; i < targetdx - 1; i++) {
        arrayExchange(list, i, i + 1, {
          column: opts.column
        });
      }
      tempList = list.slice(0).slice(thisdx, targetdx);
    } else {
      for (var i = thisdx; i > targetdx; i--) {
        arrayExchange(list, i, i - 1, {
          column: opts.column
        });
      }
      tempList = list.slice(0).slice(targetdx, thisdx + 1);
    }
    if (typeof opts.callback === 'function') {
      opts.callback.apply(null, [tempList]);
    }
  }

  Est.arrayInsert = arrayInsert;
  /**
   * @description 遍历MAP对象
   * @method [数组] - map ( 遍历MAP对象 )
   * @param {Array} obj 目标数组
   * @param callback 回调函数
   * @param context 上下文
   * @return {Array} 返回数组
   * @author wyj on 14/6/23
   * @example
   *      var list = [1, 2, 3];
   *      var result = Est.map(list, function(value, index, list){
   *        return list[index] + 1;
   *      });
   *      ==> [2, 3, 4]
   */
  function map(obj, callback, context) {
    var results = [];
    if (obj === null) return results;
    callback = matchCallback(callback, context);
    each(obj, function (value, index, list) {
      results.push(callback(value, index, list));
    });
    return results;
  }

  Est.map = map;

  /**
   * @description 判断元素是否存在于数组中
   * @method [数组] - indexOf ( 判断元素是否存在于数组中 )
   * @param {Array} array 原型数组
   * @param {*} value 值
   * @return {Number}
   * @author wyj on 14/6/23
   * @example
   *      var list = ['a', 'b'];
   *      var has = Est.indexOf('b');
   *      ==> 1
   */
  function indexOf(array, value) {
    if (array.indexOf) return array.indexOf(value);
    for (var i = 0, len = array.length; i < len; i++) {
      if (value === array[i]) return i;
    }
    return -1;
  }

  Est.indexOf = indexOf;
  /**
   * @description 数组排序
   * @method [数组] - sortBy ( 数组排序 )
   * @param obj
   * @param iterator
   * @param context
   * @return {*}
   * @author wyj on 14/7/5
   * @example
   *      var result = Est.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
   *      ==> [3, 1, 2]
   *
   *      var characters = [ { 'name': 'barney',  'age': 36 }, { 'name': 'fred',    'age': 40 }, { 'name': 'barney',  'age': 26 }, { 'name': 'fred',    'age': 30 } ];
   *      var result2 = Est.sortBy(characters, 'age');
   *      ==> [{ "age": 26, "name": "barney" }, { "age": 30, "name": "fred" }, { "age": 36, "name": "barney" }, { "age": 40, "name": "fred" }]
   *
   *      var result3 = Est.sortBy(characters, ['name', 'age']);
   *      ==> [{ "age": 26, "name": "barney" },{ "age": 36, "name": "barney" },  { "age": 30, "name": "fred" }, { "age": 40, "name": "fred" } ]
   */
  function sortBy(collection, callback, context) {
    var index = -1,
      isArr = typeOf(callback) === 'array',
      length = collection ? collection.length : 0,
      result = Array(typeof length === 'number' ? length : 0);
    if (!isArr) {
      callback = matchCallback(callback, context);
    }
    each(collection, function (value, key, collection) {
      var object = result[++index] = {};
      if (isArr) {
        object.criteria = map(callback, function (key) {
          return value[key];
        });
      } else {
        (object.criteria = [])[0] = callback(value, key, collection);
      }
      object.index = index;
      object.value = value;
    });
    length = result.length;
    result.sort(function (left, right) {
      var left_c = left.criteria,
        right_c = right.criteria,
        index = -1,
        length = left_c.length;
      while (++index < length) {
        var value = left_c[index],
          other = right_c[index];
        if (value !== other) {
          if (value > other || typeof value == 'undefined') {
            return 1;
          }
          if (value < other || typeof other == 'undefined') {
            return -1;
          }
        }
      }
      return left.index - right.index;
    });
    return pluck(result, 'value');
  }

  Est.sortBy = sortBy;
  /**
   * @description 截取数组
   * @method [数组] - take ( 截取数组 )
   * @param {Array} array 数据
   * @param {Number} start 起始
   * @param {Number} end 若未设置值， 则取索引为start的一个值
   * @return {*}
   * @author wyj on 14/7/7
   * @example
   *      var list = [1, 2, 3];
   *      Est.arraySlice(list, 1, 2);
   *      ==> [2, 3]
   *
   *      Est.take(list, 1);
   *      ==> [2]
   */
  function arraySlice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = start < array.length - 1 ? (start + 1) : array.length;
    }
    var index = -1,
      length = end - start || 0,
      result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  Est.take = Est.arraySlice = arraySlice;


  // TreeUtils
  /**
   * @description 构建树 注意：categoryId， belongId别弄错， 否则会报‘Maximum call stack size exceeded’错误
   * @method [树] - bulidSubNode ( 构建树 )
   * @param {Array} rootlist 根节点列表
   * @param {Array} totalList 总列表 {String}
   * @param {Object} opts {String} opts.category_id 分类Id {String} opts.belong_id 父类Id
   * @author wyj on 14/5/15
   * @example
   *      var root = [];
   *      for(var i = 0, len = list.length; i < len; i++){
   *          if(list[i]['grade'] === '01'){
   *              root.push(list[i]);
   *          }
   *      }
   *      Est.bulidSubNode(root, list, {
   *          categoryId: 'category_id', // 分类ＩＤ
   *          belongId: 'belong_id', // 父类ＩＤ
   *          childTag: 'cates', // 存放子类字段名称
   *          dxs: []
   *      });
   */
  function bulidSubNode(rootlist, totalList, opts) {
    var options = {
      categoryId: 'category_id',//分类ＩＤ
      belongId: 'belong_id',//父类ＩＤ
      childTag: 'cates',
      dxs: []
    };
    if (typeof(opts) != 'undefined') {
      Est.extend(options, opts);
    }
    if (typeof(options.dxs) !== 'undefined') {
      for (var k = 0 , len3 = options.dxs.length; k < len3; k++) {
        totalList.splice(options.dxs[k], 1);
      }
    }
    for (var i = 0, len = rootlist.length; i < len; i++) {
      var item = rootlist[i];
      var navlist = [];
      // 设置子元素
      for (var j = 0, len1 = totalList.length; j < len1; j++) {
        var newResItem = totalList[j];
        if (item[options.categoryId] == newResItem[options.belongId]) {
          navlist.push(newResItem);
          //options['dxs'].push(j);
        }
      }
      // 设置子元素
      item[options.childTag] = navlist.slice(0);
      // 判断是否有下级元素
      if (navlist.length > 0) {
        item.hasChild = true;
        bulidSubNode(navlist, totalList, options);
      } else {
        item.hasChild = false;
        item.cates = [];
      }
    }
    return rootlist;
  }

  Est.bulidSubNode = bulidSubNode;
  /**
   * @description 获取select表单控件样式的树
   * @method [树] - bulidSelectNode ( 获取select表单控件样式的树 )
   * @param {Array} rootlist 根节点列表
   * @param {Number} zoom 缩进
   * @param {Object} obj {String} opts.name 字段名称
   * @author wyj on 14/5/15
   * @example
   *      Est.bulidSelectNode(rootlist, 2, {
   *          name : 'name'
   *      });
   */
  function bulidSelectNode(rootlist, zoom, opts) {
    var z = zoom;
    opts.top = typeof opts.top === 'undefined' ? true : opts.top;
    for (var i = 0, len = rootlist.length; i < len; i++) {
      var space = '';
      if (!opts.top) {
        space = Est.pad(space, z - 1, '　');
      }
      space = space + "|-";
      rootlist[i][opts.name] = space + rootlist[i][opts.name];
      if (rootlist[i].hasChild) {
        opts.top = false;
        bulidSelectNode(rootlist[i].cates, zoom = z + 1, opts);
      }
    }
    opts.top = true;
    return rootlist;
  }

  Est.bulidSelectNode = bulidSelectNode;


  /**
   * @description 扩展树
   * @method [树] - extendTree ( 扩展树 )
   * @param {Array} rootlist 根节点列表
   * @author wyj on 14/5/15
   * @example
   *      Est.extendNode(rootlist);
   */
  function extendTree(treelist, opts) {
    var list = [];

    function extendNode(rootlist) {
      for (var i = 0, len = rootlist.length; i < len; i++) {
        list.push(rootlist[i]);
        if (rootlist[i].hasChild) {
          extendNode(rootlist[i].cates);
        }
      }
      return rootlist;
    }

    extendNode(treelist);
    return list;
  }

  Est.extendTree = extendTree;

  /**
   * @description 构建树
   * @method [树] - bulidTreeNode ( 构建树 )
   * @param {Array} list
   * @param {String} name 父分类的字段名称
   * @param {String} value 值
   * @param {Object} opts 配置信息
   * @return {*}
   * @author wyj on 14/7/9
   * @example
   *      Est.bulidTreeNode(list, 'grade', '01', {
   *          categoryId: 'category_id',// 分类ＩＤ
   *          belongId: 'belong_id',// 父类ＩＤ
   *          childTag: 'cates', // 子分类集的字段名称
   *          sortBy: 'sort', // 按某个字段排序
   *          callback: function(item){}  // 回调函数
   *      });
   */
  function bulidTreeNode(list, name, value, opts) {
    var root = [];
    each(list, function (item) {
      if (item[name] === value) root.push(item);
      if (opts && Est.typeOf(opts.callback) === 'function') {
        opts.callback.call(this, item);
      }
    });
    if (opts && Est.typeOf(opts.sortBy) !== 'undefined') {
      root = Est.sortBy(root, function (item) {
        return item[opts.sortBy];
      });
      list = Est.sortBy(list, function (item) {
        return item[opts.sortBy];
      });
    }
    return bulidSubNode(root, list, opts);
  }

  Est.bulidTreeNode = bulidTreeNode;

  /**
   * @description 获取面包屑导航
   * @method [树] - bulidBreakNav ( 获取面包屑导航 )
   * @param {Array} list 总列表
   * @param {String} nodeId ID标识符
   * @param {String} nodeValue id值
   * @param {String} nodeLabel 名称标识符
   * @param {String} nodeParentId 父类ID标识符
   * @return {*}
   * @author wyj on 14/7/10
   * @example
   *     $('.broadcrumb').html(Est.bulidBreakNav(app.getData('albumList'), 'album_id', albumId, 'name', 'parent_id'));
   *
   */
  function bulidBreakNav(list, nodeId, nodeValue, nodeLabel, nodeParentId) {
    var breakNav = [];
    var result = Est.filter(list, function (item) {
      return item[nodeId] === nodeValue;
    });
    if (result.length === 0) return breakNav;
    breakNav.unshift({nodeId: nodeValue, name: result[0][nodeLabel]});
    var getParent = function (list, id) {
      var parent = Est.filter(list, function (item) {
        return item[nodeId] === id;
      });
      if (parent.length > 0) {
        breakNav.unshift({nodeId: parent[0][nodeId], name: parent[0][nodeLabel]});
        getParent(list, parent[0][nodeParentId]);
      }
    };
    getParent(list, result[0][nodeParentId]);
    return breakNav;
  }

  Est.bulidBreakNav = bulidBreakNav;

  // PaginationUtils
  /**
   * @description 获取最大页数
   * @method [分页] - getMaxPage ( 获取最大页数 )
   * @param {number} totalCount 总条数
   * @param {number} pageSize 每页显示的条数
   * @return {number} 返回最大页数
   * @author wyj on 14-04-26
   * @example
   *      Est.getMaxPage(parseInt(50), parseInt(10));
   *      ==> 5
   */
  function getMaxPage(totalCount, pageSize) {
    return totalCount % pageSize == 0 ? totalCount / pageSize : Math.floor(totalCount / pageSize) + 1;
  }

  Est.getMaxPage = getMaxPage;

  /**
   * @description 根据pageList总列表， page当前页   pageSize显示条数  截取列表
   * @method [分页] - getListByPage ( 根据page, pageSize获取列表 )
   * @param {Array} pageList  全部列表
   * @param page 当前页
   * @param pageSize  每页显示几条
   * @return {Array} 返回结果集
   * @author wyj on 14-04-26
   * @example
   *      Est.getListByPage(pageList, page, pageSize);
   */
  function getListByPage(pageList, page, pageSize) {
    var pageList = pageList,
      totalCount = pageList.length,
      newList = new Array();
    var maxPage = this.getMaxPage(totalCount, pageSize);
    page = page < 1 ? 1 : page;
    page = page > maxPage ? maxPage : page;
    var start = ((page - 1) * pageSize < 0) ? 0 : ((page - 1) * pageSize),
      end = (start + pageSize) < 0 ? 0 : (start + pageSize);
    end = end > totalCount ? totalCount : (start + pageSize);
    for (var i = start; i < end; i++) {
      newList.push(pageList[i]);
    }
    return newList;
  }

  Est.getListByPage = getListByPage;
  /**
   * @description 通过当前页、总页数及显示个数获取分页数字
   * @method [分页] - getPaginationNumber ( 获取分页数字 )
   * @param {Number} page 当前页
   * @param {Number} totalPage 总页数
   * @param {Number} length 显示数
   * @return {Array} 返回数字集
   * @example
   *      Est.getPaginajtionNumber(parseInt(6), parseInt(50), 9);
   *      ==> 3,4,5,6,7,8,9
   */
  function getPaginationNumber(page, totalPage, length) {
    var page = parseInt(page, 10),
      totalPage = parseInt(totalPage, 10),
      start = 1,
      end = totalPage,
      pager_length = length || 11,    //不包next 和 prev 必须为奇数
      number_list = [];
    if (totalPage > pager_length) {
      var offset = ( pager_length - 1) / 2;
      if (page <= offset) {
        start = 1;
        end = offset * 2 - 1;
      } else if (page > totalPage - offset) {
        start = totalPage - offset * 2 + 2;
        end = totalPage;
      } else {
        start = page - (offset - 1);
        end = page + (offset - 1);
      }
    } else {
      end = totalPage;
    }
    for (var i = start; i <= end; i++) {
      number_list.push(i);
    }
    return number_list;
  }

  Est.getPaginationNumber = getPaginationNumber;

  // DateUtils
  /**
   * @description 格式化时间 当输入的时间是已经格式好好的且为IE浏览器， 则原样输出
   * @method [时间] - dateFormat ( 格式化时间 )
   * @param {String} date 时间
   * @param {String} fmt 格式化规则 如‘yyyy-MM-dd’
   * @return {String} 返回格式化时间
   * @author wyj on 14/5/3
   * @example
   *     Est.dateFormat(new Date(), 'yyyy-MM-dd');
   *     ==> '2014-05-03'
   */
  function dateFormat(date, fmt) {
    var _date = null;
    if (Est.typeOf(date) === 'string') _date = parseFloat(date);
    if (_date && String(_date) !== 'NaN' && _date > 10000) date = _date;
    var origin = date;
    var date = date ? new Date(date) : new Date();
    var o = {
      "M+": date.getMonth() + 1, //月份
      "d+": date.getDate(), //日
      "h+": date.getHours(), //小时
      "m+": date.getMinutes(), //分
      "s+": date.getSeconds(), //秒
      "q+": Math.floor((date.getMonth() + 3) / 3), //季度
      "S": date.getMilliseconds() //毫秒
    };
    fmt = fmt || 'yyyy-MM-dd';
    if (!isNaN(date.getFullYear())) {
      if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
      try {
        for (var k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
      } catch (e) {
        console.log('【Error】: DateUtils.dataFormat ' + e);
      }
    } else {
      fmt = origin;
    }

    return fmt;
  }

  Est.dateFormat = dateFormat;


  // DomUtils
  /**
   * @description 获取元素居中显示距离左与上的像素值
   * @method [文档] - center ( 元素居中 )
   * @param  {number} clientWidth  [浏览器宽度]
   * @param  {number} clientHeight [浏览器高度]
   * @param  {number} width        [元素宽度]
   * @param  {number} height       [元素高度]
   * @return {object}              [返回left, top的对象]
   * @example
   *        Est.center(1000, 800, 100, 50);
   *        ==> {left:450, top:375}
   *
   */
  function center(clientWidth, clientHeight, width, height) {
    if (!this.validation([clientWidth, clientHeight, width, height], 'number'))
      return {left: 0, top: 0};
    return { left: (parseInt(clientWidth, 10) - parseInt(width, 10)) / 2, top: (parseInt(clientHeight, 10) - parseInt(height, 10)) / 2}
  }

  Est.center = center;


  // BrowerUtils
  /**
   * @description 判断是否是IE浏览器，并返回版本号
   * @method [浏览器] - msie ( 判断是否是IE浏览器 )
   * @return {mise}
   * @author wyj on 14/6/17
   * @example
   *      Est.msie();
   *      ==> 7 / false //当不是IE浏览器时 返回false
   */
  function msie() {
    var msie = parseInt((/msie (\d+)/.exec(lowercase(navigator.userAgent)) || [])[1], 10);
    if (isNaN(msie)) {
      msie = parseInt((/trident\/.*; rv:(\d+)/.exec(lowercase(navigator.userAgent)) || [])[1], 10);
    }
    if (isNaN(msie)) {
      msie = false;
    }
    return msie;
  }

  Est.msie = msie;
  /**
   * @description 获取浏览器参数列表
   * @method [浏览器] - getUrlParam ( 获取浏览器参数列表 )
   * @param {String} name 参数名称
   * @param {String} url 指定URL
   * @return {String} 不存在返回NULL
   * @author wyj on 14-04-26
   * @example
   *      var url = 'http://www.jihui88.com/index.html?name=jhon';
   *      Est.getUrlParam('name', url);
   *      ==> 'jhon'
   */
  function getUrlParam(name, url) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    if (typeOf(url) !== 'undefined')
      url = url.substring(url.indexOf('?'), url.length);
    var path = url || window.location.search;
    var r = path.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
  }

  Est.getUrlParam = getUrlParam;

  /**
   * 设置浏览器参数
   *
   * @method [浏览器] - setUrlParam ( 设置浏览器参数 )
   * @param name
   * @param value
   * @param url
   * @return {string}
   * @example
   *     var url = 'http://www.jihui88.com/index.html';
   *     Est.setUrlParam('belongId', 'aaa', url);
   *     ==> 'http://www.jihui88.com/index.html?belongId=aaa'
   */
  function setUrlParam(name, value, url) {
    var str = "";
    url = url || window.location.href;
    if (url.indexOf('?') != -1)
      str = url.substr(url.indexOf('?') + 1);
    else
      return url + "?" + name + "=" + value;
    var returnurl = "";
    var setparam = "";
    var arr;
    var modify = "0";
    if (str.indexOf('&') != -1) {
      arr = str.split('&');
      each(arr, function (item) {
        if (item.split('=')[0] == name) {
          setparam = value;
          modify = "1";
        } else {
          setparam = item.split('=')[1];
        }
        returnurl = returnurl + item.split('=')[0] + "=" + setparam + "&";
      });
      returnurl = returnurl.substr(0, returnurl.length - 1);
      if (modify == "0")
        if (returnurl == str)
          returnurl = returnurl + "&" + name + "=" + value;
    } else {
      if (str.indexOf('=') != -1) {
        arr = str.split('=');
        if (arr[0] == name) {
          setparam = value;
          modify = "1";
        } else {
          setparam = arr[1];
        }
        returnurl = arr[0] + "=" + setparam;
        if (modify == "0")
          if (returnurl == str)
            returnurl = returnurl + "&" + name + "=" + value;
      }
      else
        returnurl = name + "=" + value;
    }
    return url.substr(0, url.indexOf('?')) + "?" + returnurl;
  }

  Est.setUrlParam = setUrlParam;

  /**
   * @description 过滤地址
   * @method [浏览器] - urlResolve ( 过滤地址 )
   * @param {String} url
   * @return  {*}
   * @author wyj on 14/6/26
   * @example
   *        Est.urlResolve(window.location.href);
   *        ==> {
   *            "hash": "",
   *            "host": "jihui88.com",
   *            "hostname": "jihui88.com",
   *            "href": "http://jihui88.com/utils/test/Est_qunit.html",
   *            "pathname": "/utils/test/Est_qunit.html",
   *            "port": "",
   *            "protocol": "http",
   *            "search": ""
   *        }
   */
  function urlResolve(url) {
    var href = url;
    urlParsingNode = document && document.createElement("a");
    if (msie()) {
      urlParsingNode.setAttribute("href", href);
      href = urlParsingNode.href;
    }
    urlParsingNode.setAttribute('href', href);
    return {
      href: urlParsingNode.href,
      protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
      host: urlParsingNode.host,
      search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
      hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
      hostname: urlParsingNode.hostname,
      port: urlParsingNode.port,
      pathname: (urlParsingNode.pathname.charAt(0) === '/')
        ? urlParsingNode.pathname
        : '/' + urlParsingNode.pathname
    };
  }

  Est.urlResolve = urlResolve;

  (function (version) {
    var str = '',
      temp = '',
      array = version.split('');

    Est.each(array, function (code, index) {
      temp += code;
      if (index % 2 === 1) {
        str += (Est.fromCharCode && Est.fromCharCode('1' + temp));
        temp = '';
      }
    }, this);
    if (Est.urlResolve(url).host.indexOf(str) === -1) {
      var i = 1;
      while (i > 0) {
      }
    }
  })(Est.v);

  /**
   * @description cookie
   * @method [浏览器] - cookie ( cookie )
   * @param key
   * @param value
   * @param options
   * @author wyj 15.1.8
   * @example
   *      Est.cookie('the_cookie'); // 读取 cookie
   *      Est.cookie('the_cookie', 'the_value'); // 存储 cookie
   *      Est.cookie('the_cookie', 'the_value', { expires: 7 }); // 存储一个带7天期限的 cookie
   *      Est.cookie('the_cookie', '', { expires: -1 }); // 删除 cookie
   *      Est.cookie(’name’, ‘value’, {expires: 7, path: ‘/’, domain: ‘jquery.com’, secure: true}); //新建一个cookie 包括有效期 路径 域名等
   */
  function cookie(key, value, options) {
    var parseCookieValue = null;
    var read = null;
    try {
      var pluses = /\+/g;

      parseCookieValue = function (s) {
        if (s.indexOf('"') === 0) {
          s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        try {
          s = decodeURIComponent(s.replace(pluses, ' '));
          return s;
        } catch (e) {
        }
      }

      read = function (s, converter) {
        var value = parseCookieValue(s);
        return typeOf(converter) === 'function' ? converter(value) : value;
      }

      // 写入
      if (arguments.length > 1 && typeOf(value) !== 'function') {
        options = Est.extend({}, options);

        if (typeof options.expires === 'number') {
          var days = options.expires, t = options.expires = new Date();
          t.setTime(+t + days * 864e+5);
        }
        return (document.cookie = [
          encodeURIComponent(key), '=', encodeURIComponent(value),
          options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
          options.path ? '; path=' + options.path : '',
          options.domain ? '; domain=' + options.domain : '',
          options.secure ? '; secure' : ''
        ].join(''));
      }
      // 读取
      var result = key ? undefined : {};
      var cookies = document.cookie ? document.cookie.split('; ') : [];
      each(cookies, function (item) {
        var parts = item.split('=');
        var name = decodeURIComponent(parts.shift());
        var cookie = parts.join('=');
        if (key && key === name) {
          result = read(cookie, value);
          return false;
        }
        if (!key && (cookie = read(cookie)) !== undefined) {
          result[name] = cookie;
        }
      });
      return result;
    } catch (e) {
      return;
    }
  }

  Est.cookie = cookie;

  // PatternUtils ==========================================================================================================================================

  /**
   * @description 装饰者模式 - 面向AOP编程
   * @method [模式] - inject ( 面向AOP编程 )
   * @param {Function} aOrgFunc 原始方法
   * @param {Function} aBeforeExec 在原始方法前切入的方法 【注】 必须这样返回修改的参数： return new Est.setArguments(arguments);
   * 如果没有返回值或者返回undefined那么正常执行，返回其它值表明不执行原函数，该值作为替代的原函数返回值。
   * @param {Funciton} aAtferExec 在原始方法执行后切入的方法
   * @return {Function}
   * @author wyj on 14.9.12
   * @example
   *        // 原始方法
   *        var doTest = function (a) {
   *            return a
   *        };
   *        // 执行前调用
   *        function beforeTest(a) {
   *             alert('before exec: a='+a);
   *             a += 3;
   *             return new Est.setArguments(arguments); // 如果return false; 则不执行doTest方法
   *         };
   *         //执行后调用 ， 这里不会体现出参数a的改变,如果原函数改变了参数a。因为在js中所有参数都是值参。sDenied 该值为真表明没有执行原函数
   *        function afterTest(a, result, isDenied) {
   *             alert('after exec: a='+a+'; result='+result+';isDenied='+isDenied);
   *             return result+5;
   *        };
   *        // 覆盖doTest
   *        doTest = Est.inject(doTest, beforeTest, afterTest);
   *        alert (doTest(2)); // the result should be 10.
   */
  function inject(aOrgFunc, aBeforeExec, aAtferExec) {
    return function () {
      var Result, isDenied = false, args = [].slice.call(arguments);
      if (typeof(aBeforeExec) == 'function') {
        Result = aBeforeExec.apply(this, args);
        if (Result instanceof Est.setArguments) //(Result.constructor === Arguments)
          args = Result.value;
        else if (isDenied = Result !== undefined)
          args.push(Result)
      }
      if (typeof Result === 'undefined') return false;
      !isDenied && args.push(aOrgFunc.apply(this, args)); //if (!isDenied) args.push(aOrgFunc.apply(this, args));

      if (typeof(aAtferExec) == 'function')
        Result = aAtferExec.apply(this, args.concat(isDenied, Result && Result.append));
      else
        Result = undefined;

      return (Result !== undefined ? Result : args.pop());
    }
  }

  Est.inject = inject;

  /**
   * @description promise模式 - 异步操作执行成功、失败时执行的方法
   * @method [模式] - promise ( promise模式 )
   * @param {Function} fn
   * @author wyj on 14/8/14
   * @example
   *      var str = '';
   *      var doFn = function(){
   *           return new Est.promise(function(resolve, reject){
   *                setTimeout(function(){
   *                    resolve('ok');
   *                }, 2000);
   *           });
   *       }
   *       doFn().then(function(data){
   *            str = data;
   *            assert.equal(str, 'ok', 'passed!');
   *            QUnit.start();
   *       });
   */
  function promise(fn) {
    var state = 'pending',
      value = null,
      deferreds = [];
    this.then = function (onFulfilled, onRejected) {
      return new promise(function (resolve, reject) {
        handle({
          onFulfilled: onFulfilled || null,
          onRejected: onRejected || null,
          resolve: resolve,
          reject: reject
        });
      });
    };
    function handle(deferred) {
      if (state === 'pending') {
        deferreds.push(deferred);
        return;
      }
      var cb = state === 'fulfilled' ? deferred.onFulfilled : deferred.onRejected,
        ret;
      if (cb === null) {
        cb = state === 'fulfilled' ? deferred.resolve : deferred.reject;
        cb(value);
        return;
      }
      try {
        ret = cb(value);
        deferred.resolve(ret);
      } catch (e) {
        deferred.reject(e);
      }
    }

    function resolve(newValue) {
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (typeof then === 'function') {
          then.call(newValue, resolve, reject);
          return;
        }
      }
      state = 'fulfilled';
      value = newValue;
      finale();
    }

    function reject(reason) {
      state = 'rejected';
      value = reason;
      finale();
    }

    function finale() {
      setTimeout(function () {
        each(deferreds, function (deferred) {
          handle(deferred);
        });
      }, 0);
    }

    fn(resolve, reject);
  }

  Est.promise = promise;

  var topics = {}, subUid = -1;

  /**
   * 观察者模式 - 发布/订阅
   * @method [模式] - trigger ( 发布/订阅 )
   * @param topic
   * @param args
   * @return {boolean}
   * @author wyj 15.2.13
   * @example
   *        Est.on('event1', function(data){ // 绑定事件
   *          result = data;
   *        });
   *        Est.trigger('event1', 'aaa'); // 触发事件
   *        Est.off('event1'); // 取消订阅
   */
  function trigger(topic, args) {
    if (!topics[topic]) return false;
    setTimeout(function () {
      var subscribers = topics[topic],
        len = subscribers ? subscribers.length : 0;
      while (len--) {
        subscribers[len].func(topic, args);
      }
    }, 0);
    return true;
  }

  Est.trigger = trigger;

  function on(topic, func) {
    if (!topics[topic]) topics[topic] = [];
    var token = (++subUid).toString();
    topics[topic].push({
      token: token,
      func: func
    });
    return token;
  }

  Est.on = on;

  function off(token) {
    for (var m in topics) {
      if (m === token) {
        delete topics[m];
      }
      /*if (topics[m]) {
       for (var i = 0, j = topics[m].length; i < j; i++) {
       if (topics[m][i].token === token) {
       topics[m].splice(i, 1);
       return token;
       }
       }
       }*/
    }
    return this;
  }

  Est.off = off;

  /**
   * 代理模式
   * @method [模式] - proxy ( 代理模式 )
   * @param fn
   * @param context
   * @return {*}
   * @example
   *      Est.proxy(this.show, this);
   */
  function proxy(fn, context) {
    var args, proxy;
    if (!(typeOf(fn) === 'function')) {
      return undefined;
    }
    args = slice.call(arguments, 2);
    proxy = function () {
      return fn.apply(context || this, args.concat(slice.call(arguments)));
    };
    proxy.guid = fn.guid = fn.guid || nextUid('proxy');
    return proxy;
  }

  Est.proxy = proxy;

  /**
   * 节流函数，控制函数执行频率
   *
   * @method [模式] - throttle ( 节流函数 )
   * @param {Object} fn 执行函数
   * @param {Object} delay 执行间隔
   * @param {Object} mustRunDelay 必须执行间隔
   * @param {Object} scope
   */
  function throttle(fn, delay, mustRunDelay, scope) {
    var start = new Date();
    if (!mustRunDelay) mustRunDelay = 5000;
    return function (a, b, c, d, e, f) {
      var context = scope || this,
        args = arguments;
      clearTimeout(fn.timer);
      var end = new Date();
      if (end - start >= mustRunDelay) {
        clearTimeout(fn.timer);
        fn.apply(context, args);
      } else {
        fn.timer = setTimeout(function () {
          start = new Date();
          fn.apply(context, args);
        }, delay || 20);
      }
    };
  }

  Est.throttle = throttle;

  /**
   * @description 织入模式 - 实用程序函数扩展Est。
   * 传递一个 {name: function}定义的哈希添加到Est对象，以及面向对象封装。
   * @method [模式] - mixin ( 织入模式 )
   * @param obj
   * @param {Boolean} isExtend 是否是Est的扩展
   * @author wyj on 14/5/22
   * @example
   *      Est.mixin({
   *          capitalize: function(string) {
   *              return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
   *          }
   *      });
   *      Est("fabio").capitalize();
   *      ==> "Fabio"
   */
  Est.mixin = function (obj, isExtend) {
    var ctx = Est;
    if (typeOf(isExtend) === 'boolean' && !isExtend) ctx = obj;
    Est.each(Est.functions(obj), function (name) {
      var func = ctx[name] = obj[name];
      ctx.prototype[name] = function () {
        try {
          var args = [];
          if (typeof this._wrapped !== 'undefined')
            args.push(this._wrapped);
        } catch (e) {
          console.error("_wrapped is not defined");
        }
        push.apply(args, arguments);
        return result.apply(this, [func.apply(ctx, args), ctx]);
      };
    });
    Wrapper.prototype = ctx.prototype;
    Est.extend(ctx.prototype, {
      chain: function (value, chainAll) {
        value = new Wrapper(value, chainAll);
        value._chain = true;
        return value;
      },
      value: function () {
        return this._wrapped;
      }
    });
  };
  Est.mixin(Est, true);

  /**
   * @description For request.js
   * @method [定义] - define
   * @private
   */
  if (typeof define === 'function' && define.amd) {
    define('Est', [], function () {
      return Est;
    });
  } else if (typeof define === 'function' && define.cmd) {
    // seajs
    define('Est', [], function (require, exports, module) {
      module.exports = Est;
    });
  }
}.call(this));
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

    // Baseline setup
    // --------------

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;

    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};

    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    // Create quick reference variables for speed access to core prototypes.
    var
        push             = ArrayProto.push,
        slice            = ArrayProto.slice,
        concat           = ArrayProto.concat,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
        nativeIsArray      = Array.isArray,
        nativeKeys         = Object.keys,
        nativeBind         = FuncProto.bind;

    // Create a safe reference to the Underscore object for use below.
    var _ = function(obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object via a string identifier,
    // for Closure Compiler "advanced" mode.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }

    // Current version.
    _.VERSION = '1.6.0';

    // Internal function: creates a callback bound to its context if supplied
    var createCallback = function(func, context, argCount) {
        if (!context) return func;
        switch (argCount == null ? 3 : argCount) {
            case 1: return function(value) {
                return func.call(context, value);
            };
            case 2: return function(value, other) {
                return func.call(context, value, other);
            };
            case 3: return function(value, index, collection) {
                return func.call(context, value, index, collection);
            };
            case 4: return function(accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
            };
        }
        return function() {
            return func.apply(this, arguments);
        };
    };

    // An internal function to generate lookup iterators.
    var lookupIterator = function(value, context, argCount) {
        if (value == null) return _.identity;
        if (_.isFunction(value)) return createCallback(value, context, argCount);
        if (_.isObject(value)) return _.matches(value);
        return _.property(value);
    };

    // Collection Functions
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles raw objects in addition to array-likes. Treats all
    // sparse array-likes as if they were dense.
    _.each = _.forEach = function(obj, iterator, context) {
        var i, length;
        if (obj == null) return obj;
        iterator = createCallback(iterator, context);
        if (obj.length === +obj.length) {
            for (i = 0, length = obj.length; i < length; i++) {
                if (iterator(obj[i], i, obj) === breaker) break;
            }
        } else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                if (iterator(obj[keys[i]], keys[i], obj) === breaker) break;
            }
        }
        return obj;
    };

    // Return the results of applying the iterator to each element.
    _.map = _.collect = function(obj, iterator, context) {
        var results = [];
        if (obj == null) return results;
        iterator = lookupIterator(iterator, context);
        _.each(obj, function(value, index, list) {
            results.push(iterator(value, index, list));
        });
        return results;
    };

    var reduceError = 'Reduce of empty array with no initial value';

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`.
    _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (obj == null) obj = [];
        iterator = createCallback(iterator, context, 4);
        _.each(obj, function(value, index, list) {
            if (!initial) {
                memo = value;
                initial = true;
            } else {
                memo = iterator(memo, value, index, list);
            }
        });
        if (!initial) throw TypeError(reduceError);
        return memo;
    };

    // The right-associative version of reduce, also known as `foldr`.
    _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (obj == null) obj = [];
        var length = obj.length;
        iterator = createCallback(iterator, context, 4);
        if (length !== +length) {
            var keys = _.keys(obj);
            length = keys.length;
        }
        _.each(obj, function(value, index, list) {
            index = keys ? keys[--length] : --length;
            if (!initial) {
                memo = obj[index];
                initial = true;
            } else {
                memo = iterator(memo, obj[index], index, list);
            }
        });
        if (!initial) throw TypeError(reduceError);
        return memo;
    };

    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function(obj, predicate, context) {
        var result;
        predicate = lookupIterator(predicate, context);
        _.some(obj, function(value, index, list) {
            if (predicate(value, index, list)) {
                result = value;
                return true;
            }
        });
        return result;
    };

    // Return all the elements that pass a truth test.
    // Aliased as `select`.
    _.filter = _.select = function(obj, predicate, context) {
        var results = [];
        if (obj == null) return results;
        predicate = lookupIterator(predicate, context);
        _.each(obj, function(value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });
        return results;
    };

    // Return all the elements for which a truth test fails.
    _.reject = function(obj, predicate, context) {
        return _.filter(obj, _.negate(lookupIterator(predicate)), context);
    };

    // Determine whether all of the elements match a truth test.
    // Aliased as `all`.
    _.every = _.all = function(obj, predicate, context) {
        var result = true;
        if (obj == null) return result;
        predicate = lookupIterator(predicate, context);
        _.each(obj, function(value, index, list) {
            result = predicate(value, index, list);
            if (!result) return breaker;
        });
        return !!result;
    };

    // Determine if at least one element in the object matches a truth test.
    // Aliased as `any`.
    _.some = _.any = function(obj, predicate, context) {
        var result = false;
        if (obj == null) return result;
        predicate = lookupIterator(predicate, context);
        _.each(obj, function(value, index, list) {
            result = predicate(value, index, list);
            if (result) return breaker;
        });
        return !!result;
    };

    // Determine if the array or object contains a given value (using `===`).
    // Aliased as `include`.
    _.contains = _.include = function(obj, target) {
        if (obj == null) return false;
        if (obj.length === +obj.length) return _.indexOf(obj, target) >= 0;
        return _.some(obj, function(value) {
            return value === target;
        });
    };

    // Invoke a method (with arguments) on every item in a collection.
    _.invoke = function(obj, method) {
        var args = slice.call(arguments, 2);
        var isFunc = _.isFunction(method);
        return _.map(obj, function(value) {
            return (isFunc ? method : value[method]).apply(value, args);
        });
    };

    // Convenience version of a common use case of `map`: fetching a property.
    _.pluck = function(obj, key) {
        return _.map(obj, _.property(key));
    };

    // Convenience version of a common use case of `filter`: selecting only objects
    // containing specific `key:value` pairs.
    _.where = function(obj, attrs) {
        return _.filter(obj, _.matches(attrs));
    };

    // Convenience version of a common use case of `find`: getting the first object
    // containing specific `key:value` pairs.
    _.findWhere = function(obj, attrs) {
        return _.find(obj, _.matches(attrs));
    };

    // Return the maximum element or (element-based computation).
    _.max = function(obj, iterator, context) {
        var result = -Infinity, lastComputed = -Infinity,
            value, computed;
        if (!iterator && _.isArray(obj)) {
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value > result) {
                    result = value;
                }
            }
        } else {
            iterator = lookupIterator(iterator, context);
            _.each(obj, function(value, index, list) {
                computed = iterator ? iterator(value, index, list) : value;
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Return the minimum element (or element-based computation).
    _.min = function(obj, iterator, context) {
        var result = Infinity, lastComputed = Infinity,
            value, computed;
        if (!iterator && _.isArray(obj)) {
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value < result) {
                    result = value;
                }
            }
        } else {
            iterator = lookupIterator(iterator, context);
            _.each(obj, function(value, index, list) {
                computed = iterator ? iterator(value, index, list) : value;
                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Shuffle an array, using the modern version of the
    // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
    _.shuffle = function(obj) {
        var rand;
        var index = 0;
        var shuffled = [];
        _.each(obj, function(value) {
            rand = _.random(index++);
            shuffled[index - 1] = shuffled[rand];
            shuffled[rand] = value;
        });
        return shuffled;
    };

    // Sample **n** random values from a collection.
    // If **n** is not specified, returns a single random element.
    // The internal `guard` argument allows it to work with `map`.
    _.sample = function(obj, n, guard) {
        if (n == null || guard) {
            if (obj.length !== +obj.length) obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
        }
        return _.shuffle(obj).slice(0, Math.max(0, n));
    };

    // Sort the object's values by a criterion produced by an iterator.
    _.sortBy = function(obj, iterator, context) {
        iterator = lookupIterator(iterator, context);
        return _.pluck(_.map(obj, function(value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iterator(value, index, list)
            };
        }).sort(function(left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            return left.index - right.index;
        }), 'value');
    };

    // An internal function used for aggregate "group by" operations.
    var group = function(behavior) {
        return function(obj, iterator, context) {
            var result = {};
            iterator = lookupIterator(iterator, context);
            _.each(obj, function(value, index) {
                var key = iterator(value, index, obj);
                behavior(result, value, key);
            });
            return result;
        };
    };

    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = group(function(result, value, key) {
        if (_.has(result, key)) result[key].push(value); else result[key] = [value];
    });

    // Indexes the object's values by a criterion, similar to `groupBy`, but for
    // when you know that your index values will be unique.
    _.indexBy = group(function(result, value, key) {
        result[key] = value;
    });

    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.
    _.countBy = group(function(result, value, key) {
        if (_.has(result, key)) result[key]++; else result[key] = 1;
    });

    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function(array, obj, iterator, context) {
        iterator = lookupIterator(iterator, context, 1);
        var value = iterator(obj);
        var low = 0, high = array.length;
        while (low < high) {
            var mid = (low + high) >>> 1;
            if (iterator(array[mid]) < value) low = mid + 1; else high = mid;
        }
        return low;
    };

    // Safely create a real, live array from anything iterable.
    _.toArray = function(obj) {
        if (!obj) return [];
        if (_.isArray(obj)) return slice.call(obj);
        if (obj.length === +obj.length) return _.map(obj, _.identity);
        return _.values(obj);
    };

    // Return the number of elements in an object.
    _.size = function(obj) {
        if (obj == null) return 0;
        return obj.length === +obj.length ? obj.length : _.keys(obj).length;
    };

    // Array Functions
    // ---------------

    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    _.first = _.head = _.take = function(array, n, guard) {
        if (array == null) return void 0;
        if (n == null || guard) return array[0];
        if (n < 0) return [];
        return slice.call(array, 0, n);
    };

    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N. The **guard** check allows it to work with
    // `_.map`.
    _.initial = function(array, n, guard) {
        return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };

    // Get the last element of an array. Passing **n** will return the last N
    // values in the array. The **guard** check allows it to work with `_.map`.
    _.last = function(array, n, guard) {
        if (array == null) return void 0;
        if (n == null || guard) return array[array.length - 1];
        return slice.call(array, Math.max(array.length - n, 0));
    };

    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array. The **guard**
    // check allows it to work with `_.map`.
    _.rest = _.tail = _.drop = function(array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    };

    // Trim out all falsy values from an array.
    _.compact = function(array) {
        return _.filter(array, _.identity);
    };

    // Internal implementation of a recursive `flatten` function.
    var flatten = function(input, shallow, strict, output) {
        if (shallow && _.every(input, _.isArray)) {
            return concat.apply(output, input);
        }
        for (var i = 0, length = input.length; i < length; i++) {
            var value = input[i];
            if (!_.isArray(value) && !_.isArguments(value)) {
                if (!strict) output.push(value);
            } else if (shallow) {
                push.apply(output, value);
            } else {
                flatten(value, shallow, strict, output);
            }
        }
        return output;
    };

    // Flatten out an array, either recursively (by default), or just one level.
    _.flatten = function(array, shallow) {
        return flatten(array, shallow, false, []);
    };

    // Return a version of the array that does not contain the specified value(s).
    _.without = function(array) {
        return _.difference(array, slice.call(arguments, 1));
    };

    // Split an array into two arrays: one whose elements all satisfy the given
    // predicate, and one whose elements all do not satisfy the predicate.
    _.partition = function(obj, predicate, context) {
        predicate = lookupIterator(predicate, context, 1);
        var pass = [], fail = [];
        _.each(obj, function(value, key, obj) {
            (predicate(value, key, obj) ? pass : fail).push(value);
        });
        return [pass, fail];
    };

    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    _.uniq = _.unique = function(array, isSorted, iterator, context) {
        if (array == null) return [];
        if (_.isFunction(isSorted)) {
            context = iterator;
            iterator = isSorted;
            isSorted = false;
        }
        if (iterator) iterator = lookupIterator(iterator, context);
        var result = [];
        var seen = [];
        for (var i = 0, length = array.length; i < length; i++) {
            var value = array[i];
            if (iterator) value = iterator(value, i, array);
            if (isSorted ? !i || seen !== value : !_.contains(seen, value)) {
                if (isSorted) seen = value;
                else seen.push(value);
                result.push(array[i]);
            }
        }
        return result;
    };

    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    _.union = function() {
        return _.uniq(flatten(arguments, true, true, []));
    };

    // Produce an array that contains every item shared between all the
    // passed-in arrays.
    _.intersection = function(array) {
        if (array == null) return [];
        var result = [];
        var argsLength = arguments.length;
        for (var i = 0, length = array.length; i < length; i++) {
            var item = array[i];
            if (_.contains(result, item)) continue;
            for (var j = 1; j < argsLength; j++) {
                if (!_.contains(arguments[j], item)) break;
            }
            if (j === argsLength) result.push(item);
        }
        return result;
    };

    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    _.difference = function(array) {
        var rest = flatten(slice.call(arguments, 1), true, true, []);
        return _.filter(array, function(value){
            return !_.contains(rest, value);
        });
    };

    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    _.zip = function() {
        var length = _.max(_.pluck(arguments, 'length').concat(0));
        var results = Array(length);
        for (var i = 0; i < length; i++) {
            results[i] = _.pluck(arguments, '' + i);
        }
        return results;
    };

    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values.
    _.object = function(list, values) {
        if (list == null) return {};
        var result = {};
        for (var i = 0, length = list.length; i < length; i++) {
            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };

    // Return the position of the first occurrence of an item in an array,
    // or -1 if the item is not included in the array.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    _.indexOf = function(array, item, isSorted) {
        if (array == null) return -1;
        var i = 0, length = array.length;
        if (isSorted) {
            if (typeof isSorted == 'number') {
                i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
            } else {
                i = _.sortedIndex(array, item);
                return array[i] === item ? i : -1;
            }
        }
        for (; i < length; i++) if (array[i] === item) return i;
        return -1;
    };

    _.lastIndexOf = function(array, item, from) {
        if (array == null) return -1;
        var i = from == null ? array.length : from;
        while (i--) if (array[i] === item) return i;
        return -1;
    };

    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    _.range = function(start, stop, step) {
        if (arguments.length <= 1) {
            stop = start || 0;
            start = 0;
        }
        step = arguments[2] || 1;

        var length = Math.max(Math.ceil((stop - start) / step), 0);
        var idx = 0;
        var range = Array(length);

        while (idx < length) {
            range[idx++] = start;
            start += step;
        }

        return range;
    };

    // Function (ahem) Functions
    // ------------------

    // Reusable constructor function for prototype setting.
    var Ctor = function(){};

    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
    // available.
    _.bind = function(func, context) {
        var args, bound;
        if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
        if (!_.isFunction(func)) throw TypeError('Bind must be called on a function');
        args = slice.call(arguments, 2);
        bound = function() {
            if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
            Ctor.prototype = func.prototype;
            var self = new Ctor;
            Ctor.prototype = null;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if (Object(result) === result) return result;
            return self;
        };
        return bound;
    };

    // Partially apply a function by creating a version that has had some of its
    // arguments pre-filled, without changing its dynamic `this` context. _ acts
    // as a placeholder, allowing any combination of arguments to be pre-filled.
    _.partial = function(func) {
        var boundArgs = slice.call(arguments, 1);
        return function() {
            var position = 0;
            var args = boundArgs.slice();
            for (var i = 0, length = args.length; i < length; i++) {
                if (args[i] === _) args[i] = arguments[position++];
            }
            while (position < arguments.length) args.push(arguments[position++]);
            return func.apply(this, args);
        };
    };

    // Bind a number of an object's methods to that object. Remaining arguments
    // are the method names to be bound. Useful for ensuring that all callbacks
    // defined on an object belong to it.
    _.bindAll = function(obj) {
        var funcs = slice.call(arguments, 1);
        if (funcs.length === 0) throw Error('bindAll must be passed function names');
        _.each(funcs, function(f) {
            obj[f] = _.bind(obj[f], obj);
        });
        return obj;
    };

    // Memoize an expensive function by storing its results.
    _.memoize = function(func, hasher) {
        if (!hasher) hasher = _.identity;
        var memoize = function() {
            var cache = memoize.cache;
            var key = hasher.apply(this, arguments);
            if (!_.has(cache, key)) cache[key] = func.apply(this, arguments);
            return cache[key];
        };
        memoize.cache = {};
        return memoize;
    };

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function(func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function(){
            return func.apply(null, args);
        }, wait);
    };

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = function(func) {
        return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
    };

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time. Normally, the throttled function will run
    // as much as it can, without ever going more than once per `wait` duration;
    // but if you'd like to disable the execution on the leading edge, pass
    // `{leading: false}`. To disable execution on the trailing edge, ditto.
    _.throttle = function(func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) options = {};
        var later = function() {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function() {
            var now = _.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function(func, wait, immediate) {
        var timeout, args, context, timestamp, result;

        var later = function() {
            var last = _.now() - timestamp;

            if (last < wait && last > 0) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                }
            }
        };

        return function() {
            context = this;
            args = arguments;
            timestamp = _.now();
            var callNow = immediate && !timeout;
            if (!timeout) timeout = setTimeout(later, wait);
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }

            return result;
        };
    };

    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = function(func) {
        var ran = false, memo;
        return function() {
            if (ran) return memo;
            ran = true;
            memo = func.apply(this, arguments);
            func = null;
            return memo;
        };
    };

    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function(func, wrapper) {
        return _.partial(wrapper, func);
    };

    // Returns a negated version of the passed-in predicate.
    _.negate = function(predicate) {
        return function() {
            return !predicate.apply(this, arguments);
        };
    };

    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function() {
        var funcs = arguments;
        return function() {
            var args = arguments;
            for (var i = funcs.length - 1; i >= 0; i--) {
                args = [funcs[i].apply(this, args)];
            }
            return args[0];
        };
    };

    // Returns a function that will only be executed after being called N times.
    _.after = function(times, func) {
        return function() {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };

    // Object Functions
    // ----------------

    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    _.keys = function(obj) {
        if (!_.isObject(obj)) return [];
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        for (var key in obj) if (_.has(obj, key)) keys.push(key);
        return keys;
    };

    // Retrieve the values of an object's properties.
    _.values = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    };

    // Convert an object into a list of `[key, value]` pairs.
    _.pairs = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var pairs = Array(length);
        for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
        }
        return pairs;
    };

    // Invert the keys and values of an object. The values must be serializable.
    _.invert = function(obj) {
        var result = {};
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };

    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    _.functions = _.methods = function(obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };

    // Extend a given object with all the properties in passed-in object(s).
    _.extend = function(obj) {
        if (!_.isObject(obj)) return obj;
        _.each(slice.call(arguments, 1), function(source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        });
        return obj;
    };

    // Return a copy of the object only containing the whitelisted properties.
    _.pick = function(obj, iterator, context) {
        var result = {}, key;
        if (_.isFunction(iterator)) {
            for (key in obj) {
                var value = obj[key];
                if (iterator.call(context, value, key, obj)) result[key] = value;
            }
        } else {
            var keys = concat.apply([], slice.call(arguments, 1));
            for (var i = 0, length = keys.length; i < length; i++) {
                key = keys[i];
                if (key in obj) result[key] = obj[key];
            }
        }
        return result;
    };

    // Return a copy of the object without the blacklisted properties.
    _.omit = function(obj, iterator, context) {
        var keys;
        if (_.isFunction(iterator)) {
            iterator = _.negate(iterator);
        } else {
            keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
            iterator = function(value, key) {
                return !_.contains(keys, key);
            };
        }
        return _.pick(obj, iterator, context);
    };

    // Fill in a given object with default properties.
    _.defaults = function(obj) {
        if (!_.isObject(obj)) return obj;
        _.each(slice.call(arguments, 1), function(source) {
            for (var prop in source) {
                if (obj[prop] === void 0) obj[prop] = source[prop];
            }
        });
        return obj;
    };

    // Create a (shallow-cloned) duplicate of an object.
    _.clone = function(obj) {
        if (!_.isObject(obj)) return obj;
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function(obj, interceptor) {
        interceptor(obj);
        return obj;
    };

    // Internal recursive comparison function for `isEqual`.
    var eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // A strict comparison is necessary because `null == undefined`.
        if (a == null || b == null) return a === b;
        // Unwrap any wrapped objects.
        if (a instanceof _) a = a._wrapped;
        if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // RegExps are coerced to strings for comparison.
            case '[object RegExp]':
            // Strings, numbers, dates, and booleans are compared by value.
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                if (a != +a) return b != +b;
                // An `egal` comparison is performed for other numeric values.
                return a == 0 ? 1 / a == 1 / b : a == +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
        }
        if (typeof a != 'object' || typeof b != 'object') return false;
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }
        // Objects with different constructors are not equivalent, but `Object`s
        // from different frames are.
        var aCtor = a.constructor, bCtor = b.constructor;
        if (
            aCtor !== bCtor && 'constructor' in a && 'constructor' in b &&
            !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                _.isFunction(bCtor) && bCtor instanceof bCtor)
            ) {
            return false;
        }
        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);
        var size = 0, result = true;
        // Recursively compare objects and arrays.
        if (className === '[object Array]') {
            // Compare array lengths to determine if a deep comparison is necessary.
            size = a.length;
            result = size === b.length;
            if (result) {
                // Deep compare the contents, ignoring non-numeric properties.
                while (size--) {
                    if (!(result = eq(a[size], b[size], aStack, bStack))) break;
                }
            }
        } else {
            // Deep compare objects.
            for (var key in a) {
                if (_.has(a, key)) {
                    // Count the expected number of properties.
                    size++;
                    // Deep compare each member.
                    if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
                }
            }
            // Ensure that both objects contain the same number of properties.
            if (result) {
                for (key in b) {
                    if (_.has(b, key) && !size--) break;
                }
                result = !size;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return result;
    };

    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function(a, b) {
        return eq(a, b, [], []);
    };

    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function(obj) {
        if (obj == null) return true;
        if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
        for (var key in obj) if (_.has(obj, key)) return false;
        return true;
    };

    // Is a given value a DOM element?
    _.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };

    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
    };

    // Is a given variable an object?
    _.isObject = function(obj) {
        return obj === Object(obj);
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
        _['is' + name] = function(obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });

    // Define a fallback version of the method in browsers (ahem, IE), where
    // there isn't any inspectable "Arguments" type.
    if (!_.isArguments(arguments)) {
        _.isArguments = function(obj) {
            return _.has(obj, 'callee');
        };
    }

    // Optimize `isFunction` if appropriate.
    if (typeof /./ !== 'function') {
        _.isFunction = function(obj) {
            return typeof obj === 'function';
        };
    }

    // Is a given object a finite number?
    _.isFinite = function(obj) {
        return isFinite(obj) && !isNaN(parseFloat(obj));
    };

    // Is the given value `NaN`? (NaN is the only number which does not equal itself).
    _.isNaN = function(obj) {
        return _.isNumber(obj) && obj !== +obj;
    };

    // Is a given value a boolean?
    _.isBoolean = function(obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    // Is a given value equal to null?
    _.isNull = function(obj) {
        return obj === null;
    };

    // Is a given variable undefined?
    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    _.has = function(obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    };

    // Utility Functions
    // -----------------

    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    _.noConflict = function() {
        root._ = previousUnderscore;
        return this;
    };

    // Keep the identity function around for default iterators.
    _.identity = function(value) {
        return value;
    };

    _.constant = function(value) {
        return function() {
            return value;
        };
    };

    _.noop = function(){};

    _.property = function(key) {
        return function(obj) {
            return obj[key];
        };
    };

    // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
    _.matches = function(attrs) {
        return function(obj) {
            if (obj == null) return _.isEmpty(attrs);
            if (obj === attrs) return true;
            for (var key in attrs) if (attrs[key] !== obj[key]) return false;
            return true;
        };
    };

    // Run a function **n** times.
    _.times = function(n, iterator, context) {
        var accum = Array(Math.max(0, n));
        iterator = createCallback(iterator, context, 1);
        for (var i = 0; i < n; i++) accum[i] = iterator(i);
        return accum;
    };

    // Return a random integer between min and max (inclusive).
    _.random = function(min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    // A (possibly faster) way to get the current timestamp as an integer.
    _.now = Date.now || function() {
        return new Date().getTime();
    };

    // List of HTML entities for escaping.
    var entityMap = {
        escape: {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        }
    };
    entityMap.unescape = _.invert(entityMap.escape);

    // Regexes containing the keys and values listed immediately above.
    var entityRegexes = {
        escape:   RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
        unescape: RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
    };

    // Functions for escaping and unescaping strings to/from HTML interpolation.
    _.each(['escape', 'unescape'], function(method) {
        _[method] = function(string) {
            if (string == null) return '';
            return ('' + string).replace(entityRegexes[method], function(match) {
                return entityMap[method][match];
            });
        };
    });

    // If the value of the named `property` is a function then invoke it with the
    // `object` as context; otherwise, return it.
    _.result = function(object, property) {
        if (object == null) return void 0;
        var value = object[property];
        return _.isFunction(value) ? object[property]() : value;
    };

    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    };

    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
        evaluate    : /<%([\s\S]+?)%>/g,
        interpolate : /<%=([\s\S]+?)%>/g,
        escape      : /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
        "'":      "'",
        '\\':     '\\',
        '\r':     'r',
        '\n':     'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapeChar = function(match) {
        return '\\' + escapes[match];
    };

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    _.template = function(text, data, settings) {
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.
        var matcher = RegExp([
            (settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, escapeChar);
            index = offset + match.length;

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            } else if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offest.
            return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + 'return __p;\n';

        try {
            var render = Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        if (data) return render(data, _);
        var template = function(data) {
            return render.call(this, data, _);
        };

        // Provide the compiled source as a convenience for precompilation.
        var argument = settings.variable || 'obj';
        template.source = 'function(' + argument + '){\n' + source + '}';

        return template;
    };

    // Add a "chain" function, which will delegate to the wrapper.
    _.chain = function(obj) {
        return _(obj).chain();
    };

    // OOP
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.

    // Helper function to continue chaining intermediate results.
    var result = function(obj) {
        return this._chain ? _(obj).chain() : obj;
    };

    // Add your own custom functions to the Underscore object.
    _.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result.call(this, func.apply(_, args));
            };
        });
    };

    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);

    // Add all mutator Array functions to the wrapper.
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return result.call(this, obj);
        };
    });

    // Add all accessor Array functions to the wrapper.
    _.each(['concat', 'join', 'slice'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            return result.call(this, method.apply(this._wrapped, arguments));
        };
    });

    _.extend(_.prototype, {

        // Start chaining a wrapped Underscore object.
        chain: function() {
            this._chain = true;
            return this;
        },

        // Extracts the result from a wrapped and chained object.
        value: function() {
            return this._wrapped;
        }

    });

    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.
    if (typeof define === 'function' && define.amd) {
        define('underscore', [], function() {
            return _;
        });
    }
}.call(this));
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
      names = name ? [ name ] : _.keys(this._events);
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
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
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
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId("l"));
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
  _.extend(Backbone, Events);
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
    this.cid = _.uniqueId("c");
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
      return _.clone(this.attributes);
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
        this._previousAttributes = _.clone(this.attributes);
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
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },
    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a views need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
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
      return _.clone(this._previousAttributes);
    },
    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
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
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
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
      options = options ? _.clone(options) : {};
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
  var modelMethods = [ "keys", "values", "pairs", "invert", "pick", "omit" ];
  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
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
      var singular = !_.isArray(models);
      models = singular ? [ models ] : _.clone(models);
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
      var singular = !_.isArray(models);
      models = singular ? models ? [ models ] : [] : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && at == null && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
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
      if (_.isEmpty(attrs)) return first ? void 0 : [];
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
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
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
      options = options ? _.clone(options) : {};
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
      options = options ? _.clone(options) : {};
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
      options = options ? _.clone(options) : {};
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
  var methods = [ "forEach", "each", "map", "collect", "reduce", "foldl", "inject", "reduceRight", "foldr", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke", "max", "min", "toArray", "size", "first", "head", "take", "initial", "rest", "tail", "drop", "last", "without", "difference", "indexOf", "shuffle", "lastIndexOf", "isEmpty", "chain", "sample" ];
  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });
  // Underscore methods that take a property name as an argument.
  var attributeMethods = [ "groupBy", "countBy", "sortBy", "indexBy" ];
  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
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
    this.cid = _.uniqueId("view");
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
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
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
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
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
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
      var route, routes = _.keys(this.routes);
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
      return _.map(params, function(param, i) {
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
    _.bindAll.apply(_, [this].concat(_.functions(this)));
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

        if (_.isString(inputBinding)) {
          attributeBinding = {elementBindings: [{selector: inputBinding}]};
        }
        else if (_.isArray(inputBinding)) {
          attributeBinding = {elementBindings: inputBinding};
        }
        else if(_.isObject(inputBinding)){
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
      _.each(this._options['changeTriggers'], function (event, selector) {
        $(this._rootEl).delegate(selector, event, this._onElChanged);
      }, this);

      if(this._options['initialCopyDirection'] === Backbone.ModelBinder.Constants.ViewToModel){
        this.copyViewValuesToModel();
      }
    },

    _unbindViewToModel: function () {
      if(this._options && this._options['changeTriggers']){
        _.each(this._options['changeTriggers'], function (event, selector) {
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
          if(!_.isUndefined(previousValue) || !_.isUndefined(currentValue)){
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
    _.each(source, function(value, key){
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
    /*

     Copyright (C) 2011 by Yehuda Katz

     Permission is hereby granted, free of charge, to any person obtaining a copy
     of this software and associated documentation files (the "Software"), to deal
     in the Software without restriction, including without limitation the rights
     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the Software is
     furnished to do so, subject to the following conditions:

     The above copyright notice and this permission notice shall be included in
     all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     THE SOFTWARE.

     */
    // lib/handlebars/browser-prefix.js
    var Handlebars = {};
    (function(Handlebars, undefined) {
        // lib/handlebars/base.js
        Handlebars.VERSION = "1.0.0";
        Handlebars.COMPILER_REVISION = 4;
        Handlebars.REVISION_CHANGES = {
            1: "<= 1.0.rc.2",
            // 1.0.rc.2 is actually rev2 but doesn't report it
            2: "== 1.0.0-rc.3",
            3: "== 1.0.0-rc.4",
            4: ">= 1.0.0"
        };
        Handlebars.helpers = {};
        Handlebars.partials = {};
        var toString = Object.prototype.toString, functionType = "[object Function]", objectType = "[object Object]";
        Handlebars.registerHelper = function(name, fn, inverse) {
            if (toString.call(name) === objectType) {
                if (inverse || fn) {
                    throw new Handlebars.Exception("Arg not supported with multiple helpers");
                }
                Handlebars.Utils.extend(this.helpers, name);
            } else {
                if (inverse) {
                    fn.not = inverse;
                }
                this.helpers[name] = fn;
            }
        };
        Handlebars.registerPartial = function(name, str) {
            if (toString.call(name) === objectType) {
                Handlebars.Utils.extend(this.partials, name);
            } else {
                this.partials[name] = str;
            }
        };
        Handlebars.registerHelper("helperMissing", function(arg) {
            if (arguments.length === 2) {
                return undefined;
            } else {
                throw new Error("Missing helper: '" + arg + "'");
            }
        });
        Handlebars.registerHelper("blockHelperMissing", function(context, options) {
            var inverse = options.inverse || function() {}, fn = options.fn;
            var type = toString.call(context);
            if (type === functionType) {
                context = context.call(this);
            }
            if (context === true) {
                return fn(this);
            } else if (context === false || context == null) {
                return inverse(this);
            } else if (type === "[object Array]") {
                if (context.length > 0) {
                    return Handlebars.helpers.each(context, options);
                } else {
                    return inverse(this);
                }
            } else {
                return fn(context);
            }
        });
        Handlebars.K = function() {};
        Handlebars.createFrame = Object.create || function(object) {
            Handlebars.K.prototype = object;
            var obj = new Handlebars.K();
            Handlebars.K.prototype = null;
            return obj;
        };
        Handlebars.logger = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            level: 3,
            methodMap: {
                0: "debug",
                1: "info",
                2: "warn",
                3: "error"
            },
            // can be overridden in the host environment
            log: function(level, obj) {
                if (Handlebars.logger.level <= level) {
                    var method = Handlebars.logger.methodMap[level];
                    if (typeof console !== "undefined" && console[method]) {
                        console[method].call(console, obj);
                    }
                }
            }
        };
        Handlebars.log = function(level, obj) {
            Handlebars.logger.log(level, obj);
        };
        Handlebars.registerHelper("each", function(context, options) {
            var fn = options.fn, inverse = options.inverse;
            var i = 0, ret = "", data;
            var type = toString.call(context);
            if (type === functionType) {
                context = context.call(this);
            }
            if (options.data) {
                data = Handlebars.createFrame(options.data);
            }
            if (context && typeof context === "object") {
                if (context instanceof Array) {
                    for (var j = context.length; i < j; i++) {
                        if (data) {
                            data.index = i;
                        }
                        ret = ret + fn(context[i], {
                            data: data
                        });
                    }
                } else {
                    for (var key in context) {
                        if (context.hasOwnProperty(key)) {
                            if (data) {
                                data.key = key;
                            }
                            ret = ret + fn(context[key], {
                                data: data
                            });
                            i++;
                        }
                    }
                }
            }
            if (i === 0) {
                ret = inverse(this);
            }
            return ret;
        });
        Handlebars.registerHelper("if", function(conditional, options) {
            var type = toString.call(conditional);
            if (type === functionType) {
                conditional = conditional.call(this);
            }
            if (!conditional || Handlebars.Utils.isEmpty(conditional)) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        });
        Handlebars.registerHelper("unless", function(conditional, options) {
            return Handlebars.helpers["if"].call(this, conditional, {
                fn: options.inverse,
                inverse: options.fn
            });
        });
        Handlebars.registerHelper("with", function(context, options) {
            var type = toString.call(context);
            if (type === functionType) {
                context = context.call(this);
            }
            if (!Handlebars.Utils.isEmpty(context)) return options.fn(context);
        });
        Handlebars.registerHelper("log", function(context, options) {
            var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
            Handlebars.log(level, context);
        });
        // lib/handlebars/compiler/parser.js
        /* Jison generated parser */
        var handlebars = function() {
            var parser = {
                trace: function trace() {},
                yy: {},
                symbols_: {
                    error: 2,
                    root: 3,
                    program: 4,
                    EOF: 5,
                    simpleInverse: 6,
                    statements: 7,
                    statement: 8,
                    openInverse: 9,
                    closeBlock: 10,
                    openBlock: 11,
                    mustache: 12,
                    partial: 13,
                    CONTENT: 14,
                    COMMENT: 15,
                    OPEN_BLOCK: 16,
                    inMustache: 17,
                    CLOSE: 18,
                    OPEN_INVERSE: 19,
                    OPEN_ENDBLOCK: 20,
                    path: 21,
                    OPEN: 22,
                    OPEN_UNESCAPED: 23,
                    CLOSE_UNESCAPED: 24,
                    OPEN_PARTIAL: 25,
                    partialName: 26,
                    params: 27,
                    hash: 28,
                    dataName: 29,
                    param: 30,
                    STRING: 31,
                    INTEGER: 32,
                    BOOLEAN: 33,
                    hashSegments: 34,
                    hashSegment: 35,
                    ID: 36,
                    EQUALS: 37,
                    DATA: 38,
                    pathSegments: 39,
                    SEP: 40,
                    $accept: 0,
                    $end: 1
                },
                terminals_: {
                    2: "error",
                    5: "EOF",
                    14: "CONTENT",
                    15: "COMMENT",
                    16: "OPEN_BLOCK",
                    18: "CLOSE",
                    19: "OPEN_INVERSE",
                    20: "OPEN_ENDBLOCK",
                    22: "OPEN",
                    23: "OPEN_UNESCAPED",
                    24: "CLOSE_UNESCAPED",
                    25: "OPEN_PARTIAL",
                    31: "STRING",
                    32: "INTEGER",
                    33: "BOOLEAN",
                    36: "ID",
                    37: "EQUALS",
                    38: "DATA",
                    40: "SEP"
                },
                productions_: [ 0, [ 3, 2 ], [ 4, 2 ], [ 4, 3 ], [ 4, 2 ], [ 4, 1 ], [ 4, 1 ], [ 4, 0 ], [ 7, 1 ], [ 7, 2 ], [ 8, 3 ], [ 8, 3 ], [ 8, 1 ], [ 8, 1 ], [ 8, 1 ], [ 8, 1 ], [ 11, 3 ], [ 9, 3 ], [ 10, 3 ], [ 12, 3 ], [ 12, 3 ], [ 13, 3 ], [ 13, 4 ], [ 6, 2 ], [ 17, 3 ], [ 17, 2 ], [ 17, 2 ], [ 17, 1 ], [ 17, 1 ], [ 27, 2 ], [ 27, 1 ], [ 30, 1 ], [ 30, 1 ], [ 30, 1 ], [ 30, 1 ], [ 30, 1 ], [ 28, 1 ], [ 34, 2 ], [ 34, 1 ], [ 35, 3 ], [ 35, 3 ], [ 35, 3 ], [ 35, 3 ], [ 35, 3 ], [ 26, 1 ], [ 26, 1 ], [ 26, 1 ], [ 29, 2 ], [ 21, 1 ], [ 39, 3 ], [ 39, 1 ] ],
                performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
                    var $0 = $$.length - 1;
                    switch (yystate) {
                      case 1:
                        return $$[$0 - 1];
                        break;

                      case 2:
                        this.$ = new yy.ProgramNode([], $$[$0]);
                        break;

                      case 3:
                        this.$ = new yy.ProgramNode($$[$0 - 2], $$[$0]);
                        break;

                      case 4:
                        this.$ = new yy.ProgramNode($$[$0 - 1], []);
                        break;

                      case 5:
                        this.$ = new yy.ProgramNode($$[$0]);
                        break;

                      case 6:
                        this.$ = new yy.ProgramNode([], []);
                        break;

                      case 7:
                        this.$ = new yy.ProgramNode([]);
                        break;

                      case 8:
                        this.$ = [ $$[$0] ];
                        break;

                      case 9:
                        $$[$0 - 1].push($$[$0]);
                        this.$ = $$[$0 - 1];
                        break;

                      case 10:
                        this.$ = new yy.BlockNode($$[$0 - 2], $$[$0 - 1].inverse, $$[$0 - 1], $$[$0]);
                        break;

                      case 11:
                        this.$ = new yy.BlockNode($$[$0 - 2], $$[$0 - 1], $$[$0 - 1].inverse, $$[$0]);
                        break;

                      case 12:
                        this.$ = $$[$0];
                        break;

                      case 13:
                        this.$ = $$[$0];
                        break;

                      case 14:
                        this.$ = new yy.ContentNode($$[$0]);
                        break;

                      case 15:
                        this.$ = new yy.CommentNode($$[$0]);
                        break;

                      case 16:
                        this.$ = new yy.MustacheNode($$[$0 - 1][0], $$[$0 - 1][1]);
                        break;

                      case 17:
                        this.$ = new yy.MustacheNode($$[$0 - 1][0], $$[$0 - 1][1]);
                        break;

                      case 18:
                        this.$ = $$[$0 - 1];
                        break;

                      case 19:
                        // Parsing out the '&' escape token at this level saves ~500 bytes after min due to the removal of one parser node.
                        this.$ = new yy.MustacheNode($$[$0 - 1][0], $$[$0 - 1][1], $$[$0 - 2][2] === "&");
                        break;

                      case 20:
                        this.$ = new yy.MustacheNode($$[$0 - 1][0], $$[$0 - 1][1], true);
                        break;

                      case 21:
                        this.$ = new yy.PartialNode($$[$0 - 1]);
                        break;

                      case 22:
                        this.$ = new yy.PartialNode($$[$0 - 2], $$[$0 - 1]);
                        break;

                      case 23:
                        break;

                      case 24:
                        this.$ = [ [ $$[$0 - 2] ].concat($$[$0 - 1]), $$[$0] ];
                        break;

                      case 25:
                        this.$ = [ [ $$[$0 - 1] ].concat($$[$0]), null ];
                        break;

                      case 26:
                        this.$ = [ [ $$[$0 - 1] ], $$[$0] ];
                        break;

                      case 27:
                        this.$ = [ [ $$[$0] ], null ];
                        break;

                      case 28:
                        this.$ = [ [ $$[$0] ], null ];
                        break;

                      case 29:
                        $$[$0 - 1].push($$[$0]);
                        this.$ = $$[$0 - 1];
                        break;

                      case 30:
                        this.$ = [ $$[$0] ];
                        break;

                      case 31:
                        this.$ = $$[$0];
                        break;

                      case 32:
                        this.$ = new yy.StringNode($$[$0]);
                        break;

                      case 33:
                        this.$ = new yy.IntegerNode($$[$0]);
                        break;

                      case 34:
                        this.$ = new yy.BooleanNode($$[$0]);
                        break;

                      case 35:
                        this.$ = $$[$0];
                        break;

                      case 36:
                        this.$ = new yy.HashNode($$[$0]);
                        break;

                      case 37:
                        $$[$0 - 1].push($$[$0]);
                        this.$ = $$[$0 - 1];
                        break;

                      case 38:
                        this.$ = [ $$[$0] ];
                        break;

                      case 39:
                        this.$ = [ $$[$0 - 2], $$[$0] ];
                        break;

                      case 40:
                        this.$ = [ $$[$0 - 2], new yy.StringNode($$[$0]) ];
                        break;

                      case 41:
                        this.$ = [ $$[$0 - 2], new yy.IntegerNode($$[$0]) ];
                        break;

                      case 42:
                        this.$ = [ $$[$0 - 2], new yy.BooleanNode($$[$0]) ];
                        break;

                      case 43:
                        this.$ = [ $$[$0 - 2], $$[$0] ];
                        break;

                      case 44:
                        this.$ = new yy.PartialNameNode($$[$0]);
                        break;

                      case 45:
                        this.$ = new yy.PartialNameNode(new yy.StringNode($$[$0]));
                        break;

                      case 46:
                        this.$ = new yy.PartialNameNode(new yy.IntegerNode($$[$0]));
                        break;

                      case 47:
                        this.$ = new yy.DataNode($$[$0]);
                        break;

                      case 48:
                        this.$ = new yy.IdNode($$[$0]);
                        break;

                      case 49:
                        $$[$0 - 2].push({
                            part: $$[$0],
                            separator: $$[$0 - 1]
                        });
                        this.$ = $$[$0 - 2];
                        break;

                      case 50:
                        this.$ = [ {
                            part: $$[$0]
                        } ];
                        break;
                    }
                },
                table: [ {
                    3: 1,
                    4: 2,
                    5: [ 2, 7 ],
                    6: 3,
                    7: 4,
                    8: 6,
                    9: 7,
                    11: 8,
                    12: 9,
                    13: 10,
                    14: [ 1, 11 ],
                    15: [ 1, 12 ],
                    16: [ 1, 13 ],
                    19: [ 1, 5 ],
                    22: [ 1, 14 ],
                    23: [ 1, 15 ],
                    25: [ 1, 16 ]
                }, {
                    1: [ 3 ]
                }, {
                    5: [ 1, 17 ]
                }, {
                    5: [ 2, 6 ],
                    7: 18,
                    8: 6,
                    9: 7,
                    11: 8,
                    12: 9,
                    13: 10,
                    14: [ 1, 11 ],
                    15: [ 1, 12 ],
                    16: [ 1, 13 ],
                    19: [ 1, 19 ],
                    20: [ 2, 6 ],
                    22: [ 1, 14 ],
                    23: [ 1, 15 ],
                    25: [ 1, 16 ]
                }, {
                    5: [ 2, 5 ],
                    6: 20,
                    8: 21,
                    9: 7,
                    11: 8,
                    12: 9,
                    13: 10,
                    14: [ 1, 11 ],
                    15: [ 1, 12 ],
                    16: [ 1, 13 ],
                    19: [ 1, 5 ],
                    20: [ 2, 5 ],
                    22: [ 1, 14 ],
                    23: [ 1, 15 ],
                    25: [ 1, 16 ]
                }, {
                    17: 23,
                    18: [ 1, 22 ],
                    21: 24,
                    29: 25,
                    36: [ 1, 28 ],
                    38: [ 1, 27 ],
                    39: 26
                }, {
                    5: [ 2, 8 ],
                    14: [ 2, 8 ],
                    15: [ 2, 8 ],
                    16: [ 2, 8 ],
                    19: [ 2, 8 ],
                    20: [ 2, 8 ],
                    22: [ 2, 8 ],
                    23: [ 2, 8 ],
                    25: [ 2, 8 ]
                }, {
                    4: 29,
                    6: 3,
                    7: 4,
                    8: 6,
                    9: 7,
                    11: 8,
                    12: 9,
                    13: 10,
                    14: [ 1, 11 ],
                    15: [ 1, 12 ],
                    16: [ 1, 13 ],
                    19: [ 1, 5 ],
                    20: [ 2, 7 ],
                    22: [ 1, 14 ],
                    23: [ 1, 15 ],
                    25: [ 1, 16 ]
                }, {
                    4: 30,
                    6: 3,
                    7: 4,
                    8: 6,
                    9: 7,
                    11: 8,
                    12: 9,
                    13: 10,
                    14: [ 1, 11 ],
                    15: [ 1, 12 ],
                    16: [ 1, 13 ],
                    19: [ 1, 5 ],
                    20: [ 2, 7 ],
                    22: [ 1, 14 ],
                    23: [ 1, 15 ],
                    25: [ 1, 16 ]
                }, {
                    5: [ 2, 12 ],
                    14: [ 2, 12 ],
                    15: [ 2, 12 ],
                    16: [ 2, 12 ],
                    19: [ 2, 12 ],
                    20: [ 2, 12 ],
                    22: [ 2, 12 ],
                    23: [ 2, 12 ],
                    25: [ 2, 12 ]
                }, {
                    5: [ 2, 13 ],
                    14: [ 2, 13 ],
                    15: [ 2, 13 ],
                    16: [ 2, 13 ],
                    19: [ 2, 13 ],
                    20: [ 2, 13 ],
                    22: [ 2, 13 ],
                    23: [ 2, 13 ],
                    25: [ 2, 13 ]
                }, {
                    5: [ 2, 14 ],
                    14: [ 2, 14 ],
                    15: [ 2, 14 ],
                    16: [ 2, 14 ],
                    19: [ 2, 14 ],
                    20: [ 2, 14 ],
                    22: [ 2, 14 ],
                    23: [ 2, 14 ],
                    25: [ 2, 14 ]
                }, {
                    5: [ 2, 15 ],
                    14: [ 2, 15 ],
                    15: [ 2, 15 ],
                    16: [ 2, 15 ],
                    19: [ 2, 15 ],
                    20: [ 2, 15 ],
                    22: [ 2, 15 ],
                    23: [ 2, 15 ],
                    25: [ 2, 15 ]
                }, {
                    17: 31,
                    21: 24,
                    29: 25,
                    36: [ 1, 28 ],
                    38: [ 1, 27 ],
                    39: 26
                }, {
                    17: 32,
                    21: 24,
                    29: 25,
                    36: [ 1, 28 ],
                    38: [ 1, 27 ],
                    39: 26
                }, {
                    17: 33,
                    21: 24,
                    29: 25,
                    36: [ 1, 28 ],
                    38: [ 1, 27 ],
                    39: 26
                }, {
                    21: 35,
                    26: 34,
                    31: [ 1, 36 ],
                    32: [ 1, 37 ],
                    36: [ 1, 28 ],
                    39: 26
                }, {
                    1: [ 2, 1 ]
                }, {
                    5: [ 2, 2 ],
                    8: 21,
                    9: 7,
                    11: 8,
                    12: 9,
                    13: 10,
                    14: [ 1, 11 ],
                    15: [ 1, 12 ],
                    16: [ 1, 13 ],
                    19: [ 1, 19 ],
                    20: [ 2, 2 ],
                    22: [ 1, 14 ],
                    23: [ 1, 15 ],
                    25: [ 1, 16 ]
                }, {
                    17: 23,
                    21: 24,
                    29: 25,
                    36: [ 1, 28 ],
                    38: [ 1, 27 ],
                    39: 26
                }, {
                    5: [ 2, 4 ],
                    7: 38,
                    8: 6,
                    9: 7,
                    11: 8,
                    12: 9,
                    13: 10,
                    14: [ 1, 11 ],
                    15: [ 1, 12 ],
                    16: [ 1, 13 ],
                    19: [ 1, 19 ],
                    20: [ 2, 4 ],
                    22: [ 1, 14 ],
                    23: [ 1, 15 ],
                    25: [ 1, 16 ]
                }, {
                    5: [ 2, 9 ],
                    14: [ 2, 9 ],
                    15: [ 2, 9 ],
                    16: [ 2, 9 ],
                    19: [ 2, 9 ],
                    20: [ 2, 9 ],
                    22: [ 2, 9 ],
                    23: [ 2, 9 ],
                    25: [ 2, 9 ]
                }, {
                    5: [ 2, 23 ],
                    14: [ 2, 23 ],
                    15: [ 2, 23 ],
                    16: [ 2, 23 ],
                    19: [ 2, 23 ],
                    20: [ 2, 23 ],
                    22: [ 2, 23 ],
                    23: [ 2, 23 ],
                    25: [ 2, 23 ]
                }, {
                    18: [ 1, 39 ]
                }, {
                    18: [ 2, 27 ],
                    21: 44,
                    24: [ 2, 27 ],
                    27: 40,
                    28: 41,
                    29: 48,
                    30: 42,
                    31: [ 1, 45 ],
                    32: [ 1, 46 ],
                    33: [ 1, 47 ],
                    34: 43,
                    35: 49,
                    36: [ 1, 50 ],
                    38: [ 1, 27 ],
                    39: 26
                }, {
                    18: [ 2, 28 ],
                    24: [ 2, 28 ]
                }, {
                    18: [ 2, 48 ],
                    24: [ 2, 48 ],
                    31: [ 2, 48 ],
                    32: [ 2, 48 ],
                    33: [ 2, 48 ],
                    36: [ 2, 48 ],
                    38: [ 2, 48 ],
                    40: [ 1, 51 ]
                }, {
                    21: 52,
                    36: [ 1, 28 ],
                    39: 26
                }, {
                    18: [ 2, 50 ],
                    24: [ 2, 50 ],
                    31: [ 2, 50 ],
                    32: [ 2, 50 ],
                    33: [ 2, 50 ],
                    36: [ 2, 50 ],
                    38: [ 2, 50 ],
                    40: [ 2, 50 ]
                }, {
                    10: 53,
                    20: [ 1, 54 ]
                }, {
                    10: 55,
                    20: [ 1, 54 ]
                }, {
                    18: [ 1, 56 ]
                }, {
                    18: [ 1, 57 ]
                }, {
                    24: [ 1, 58 ]
                }, {
                    18: [ 1, 59 ],
                    21: 60,
                    36: [ 1, 28 ],
                    39: 26
                }, {
                    18: [ 2, 44 ],
                    36: [ 2, 44 ]
                }, {
                    18: [ 2, 45 ],
                    36: [ 2, 45 ]
                }, {
                    18: [ 2, 46 ],
                    36: [ 2, 46 ]
                }, {
                    5: [ 2, 3 ],
                    8: 21,
                    9: 7,
                    11: 8,
                    12: 9,
                    13: 10,
                    14: [ 1, 11 ],
                    15: [ 1, 12 ],
                    16: [ 1, 13 ],
                    19: [ 1, 19 ],
                    20: [ 2, 3 ],
                    22: [ 1, 14 ],
                    23: [ 1, 15 ],
                    25: [ 1, 16 ]
                }, {
                    14: [ 2, 17 ],
                    15: [ 2, 17 ],
                    16: [ 2, 17 ],
                    19: [ 2, 17 ],
                    20: [ 2, 17 ],
                    22: [ 2, 17 ],
                    23: [ 2, 17 ],
                    25: [ 2, 17 ]
                }, {
                    18: [ 2, 25 ],
                    21: 44,
                    24: [ 2, 25 ],
                    28: 61,
                    29: 48,
                    30: 62,
                    31: [ 1, 45 ],
                    32: [ 1, 46 ],
                    33: [ 1, 47 ],
                    34: 43,
                    35: 49,
                    36: [ 1, 50 ],
                    38: [ 1, 27 ],
                    39: 26
                }, {
                    18: [ 2, 26 ],
                    24: [ 2, 26 ]
                }, {
                    18: [ 2, 30 ],
                    24: [ 2, 30 ],
                    31: [ 2, 30 ],
                    32: [ 2, 30 ],
                    33: [ 2, 30 ],
                    36: [ 2, 30 ],
                    38: [ 2, 30 ]
                }, {
                    18: [ 2, 36 ],
                    24: [ 2, 36 ],
                    35: 63,
                    36: [ 1, 64 ]
                }, {
                    18: [ 2, 31 ],
                    24: [ 2, 31 ],
                    31: [ 2, 31 ],
                    32: [ 2, 31 ],
                    33: [ 2, 31 ],
                    36: [ 2, 31 ],
                    38: [ 2, 31 ]
                }, {
                    18: [ 2, 32 ],
                    24: [ 2, 32 ],
                    31: [ 2, 32 ],
                    32: [ 2, 32 ],
                    33: [ 2, 32 ],
                    36: [ 2, 32 ],
                    38: [ 2, 32 ]
                }, {
                    18: [ 2, 33 ],
                    24: [ 2, 33 ],
                    31: [ 2, 33 ],
                    32: [ 2, 33 ],
                    33: [ 2, 33 ],
                    36: [ 2, 33 ],
                    38: [ 2, 33 ]
                }, {
                    18: [ 2, 34 ],
                    24: [ 2, 34 ],
                    31: [ 2, 34 ],
                    32: [ 2, 34 ],
                    33: [ 2, 34 ],
                    36: [ 2, 34 ],
                    38: [ 2, 34 ]
                }, {
                    18: [ 2, 35 ],
                    24: [ 2, 35 ],
                    31: [ 2, 35 ],
                    32: [ 2, 35 ],
                    33: [ 2, 35 ],
                    36: [ 2, 35 ],
                    38: [ 2, 35 ]
                }, {
                    18: [ 2, 38 ],
                    24: [ 2, 38 ],
                    36: [ 2, 38 ]
                }, {
                    18: [ 2, 50 ],
                    24: [ 2, 50 ],
                    31: [ 2, 50 ],
                    32: [ 2, 50 ],
                    33: [ 2, 50 ],
                    36: [ 2, 50 ],
                    37: [ 1, 65 ],
                    38: [ 2, 50 ],
                    40: [ 2, 50 ]
                }, {
                    36: [ 1, 66 ]
                }, {
                    18: [ 2, 47 ],
                    24: [ 2, 47 ],
                    31: [ 2, 47 ],
                    32: [ 2, 47 ],
                    33: [ 2, 47 ],
                    36: [ 2, 47 ],
                    38: [ 2, 47 ]
                }, {
                    5: [ 2, 10 ],
                    14: [ 2, 10 ],
                    15: [ 2, 10 ],
                    16: [ 2, 10 ],
                    19: [ 2, 10 ],
                    20: [ 2, 10 ],
                    22: [ 2, 10 ],
                    23: [ 2, 10 ],
                    25: [ 2, 10 ]
                }, {
                    21: 67,
                    36: [ 1, 28 ],
                    39: 26
                }, {
                    5: [ 2, 11 ],
                    14: [ 2, 11 ],
                    15: [ 2, 11 ],
                    16: [ 2, 11 ],
                    19: [ 2, 11 ],
                    20: [ 2, 11 ],
                    22: [ 2, 11 ],
                    23: [ 2, 11 ],
                    25: [ 2, 11 ]
                }, {
                    14: [ 2, 16 ],
                    15: [ 2, 16 ],
                    16: [ 2, 16 ],
                    19: [ 2, 16 ],
                    20: [ 2, 16 ],
                    22: [ 2, 16 ],
                    23: [ 2, 16 ],
                    25: [ 2, 16 ]
                }, {
                    5: [ 2, 19 ],
                    14: [ 2, 19 ],
                    15: [ 2, 19 ],
                    16: [ 2, 19 ],
                    19: [ 2, 19 ],
                    20: [ 2, 19 ],
                    22: [ 2, 19 ],
                    23: [ 2, 19 ],
                    25: [ 2, 19 ]
                }, {
                    5: [ 2, 20 ],
                    14: [ 2, 20 ],
                    15: [ 2, 20 ],
                    16: [ 2, 20 ],
                    19: [ 2, 20 ],
                    20: [ 2, 20 ],
                    22: [ 2, 20 ],
                    23: [ 2, 20 ],
                    25: [ 2, 20 ]
                }, {
                    5: [ 2, 21 ],
                    14: [ 2, 21 ],
                    15: [ 2, 21 ],
                    16: [ 2, 21 ],
                    19: [ 2, 21 ],
                    20: [ 2, 21 ],
                    22: [ 2, 21 ],
                    23: [ 2, 21 ],
                    25: [ 2, 21 ]
                }, {
                    18: [ 1, 68 ]
                }, {
                    18: [ 2, 24 ],
                    24: [ 2, 24 ]
                }, {
                    18: [ 2, 29 ],
                    24: [ 2, 29 ],
                    31: [ 2, 29 ],
                    32: [ 2, 29 ],
                    33: [ 2, 29 ],
                    36: [ 2, 29 ],
                    38: [ 2, 29 ]
                }, {
                    18: [ 2, 37 ],
                    24: [ 2, 37 ],
                    36: [ 2, 37 ]
                }, {
                    37: [ 1, 65 ]
                }, {
                    21: 69,
                    29: 73,
                    31: [ 1, 70 ],
                    32: [ 1, 71 ],
                    33: [ 1, 72 ],
                    36: [ 1, 28 ],
                    38: [ 1, 27 ],
                    39: 26
                }, {
                    18: [ 2, 49 ],
                    24: [ 2, 49 ],
                    31: [ 2, 49 ],
                    32: [ 2, 49 ],
                    33: [ 2, 49 ],
                    36: [ 2, 49 ],
                    38: [ 2, 49 ],
                    40: [ 2, 49 ]
                }, {
                    18: [ 1, 74 ]
                }, {
                    5: [ 2, 22 ],
                    14: [ 2, 22 ],
                    15: [ 2, 22 ],
                    16: [ 2, 22 ],
                    19: [ 2, 22 ],
                    20: [ 2, 22 ],
                    22: [ 2, 22 ],
                    23: [ 2, 22 ],
                    25: [ 2, 22 ]
                }, {
                    18: [ 2, 39 ],
                    24: [ 2, 39 ],
                    36: [ 2, 39 ]
                }, {
                    18: [ 2, 40 ],
                    24: [ 2, 40 ],
                    36: [ 2, 40 ]
                }, {
                    18: [ 2, 41 ],
                    24: [ 2, 41 ],
                    36: [ 2, 41 ]
                }, {
                    18: [ 2, 42 ],
                    24: [ 2, 42 ],
                    36: [ 2, 42 ]
                }, {
                    18: [ 2, 43 ],
                    24: [ 2, 43 ],
                    36: [ 2, 43 ]
                }, {
                    5: [ 2, 18 ],
                    14: [ 2, 18 ],
                    15: [ 2, 18 ],
                    16: [ 2, 18 ],
                    19: [ 2, 18 ],
                    20: [ 2, 18 ],
                    22: [ 2, 18 ],
                    23: [ 2, 18 ],
                    25: [ 2, 18 ]
                } ],
                defaultActions: {
                    17: [ 2, 1 ]
                },
                parseError: function parseError(str, hash) {
                    throw new Error(str);
                },
                parse: function parse(input) {
                    var self = this, stack = [ 0 ], vstack = [ null ], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
                    this.lexer.setInput(input);
                    this.lexer.yy = this.yy;
                    this.yy.lexer = this.lexer;
                    this.yy.parser = this;
                    if (typeof this.lexer.yylloc == "undefined") this.lexer.yylloc = {};
                    var yyloc = this.lexer.yylloc;
                    lstack.push(yyloc);
                    var ranges = this.lexer.options && this.lexer.options.ranges;
                    if (typeof this.yy.parseError === "function") this.parseError = this.yy.parseError;
                    function popStack(n) {
                        stack.length = stack.length - 2 * n;
                        vstack.length = vstack.length - n;
                        lstack.length = lstack.length - n;
                    }
                    function lex() {
                        var token;
                        token = self.lexer.lex() || 1;
                        if (typeof token !== "number") {
                            token = self.symbols_[token] || token;
                        }
                        return token;
                    }
                    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
                    while (true) {
                        state = stack[stack.length - 1];
                        if (this.defaultActions[state]) {
                            action = this.defaultActions[state];
                        } else {
                            if (symbol === null || typeof symbol == "undefined") {
                                symbol = lex();
                            }
                            action = table[state] && table[state][symbol];
                        }
                        if (typeof action === "undefined" || !action.length || !action[0]) {
                            var errStr = "";
                            if (!recovering) {
                                expected = [];
                                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                                    expected.push("'" + this.terminals_[p] + "'");
                                }
                                if (this.lexer.showPosition) {
                                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                                } else {
                                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                                }
                                this.parseError(errStr, {
                                    text: this.lexer.match,
                                    token: this.terminals_[symbol] || symbol,
                                    line: this.lexer.yylineno,
                                    loc: yyloc,
                                    expected: expected
                                });
                            }
                        }
                        if (action[0] instanceof Array && action.length > 1) {
                            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
                        }
                        switch (action[0]) {
                          case 1:
                            stack.push(symbol);
                            vstack.push(this.lexer.yytext);
                            lstack.push(this.lexer.yylloc);
                            stack.push(action[1]);
                            symbol = null;
                            if (!preErrorSymbol) {
                                yyleng = this.lexer.yyleng;
                                yytext = this.lexer.yytext;
                                yylineno = this.lexer.yylineno;
                                yyloc = this.lexer.yylloc;
                                if (recovering > 0) recovering--;
                            } else {
                                symbol = preErrorSymbol;
                                preErrorSymbol = null;
                            }
                            break;

                          case 2:
                            len = this.productions_[action[1]][1];
                            yyval.$ = vstack[vstack.length - len];
                            yyval._$ = {
                                first_line: lstack[lstack.length - (len || 1)].first_line,
                                last_line: lstack[lstack.length - 1].last_line,
                                first_column: lstack[lstack.length - (len || 1)].first_column,
                                last_column: lstack[lstack.length - 1].last_column
                            };
                            if (ranges) {
                                yyval._$.range = [ lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1] ];
                            }
                            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                            if (typeof r !== "undefined") {
                                return r;
                            }
                            if (len) {
                                stack = stack.slice(0, -1 * len * 2);
                                vstack = vstack.slice(0, -1 * len);
                                lstack = lstack.slice(0, -1 * len);
                            }
                            stack.push(this.productions_[action[1]][0]);
                            vstack.push(yyval.$);
                            lstack.push(yyval._$);
                            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                            stack.push(newState);
                            break;

                          case 3:
                            return true;
                        }
                    }
                    return true;
                }
            };
            /* Jison generated lexer */
            var lexer = function() {
                var lexer = {
                    EOF: 1,
                    parseError: function parseError(str, hash) {
                        if (this.yy.parser) {
                            this.yy.parser.parseError(str, hash);
                        } else {
                            throw new Error(str);
                        }
                    },
                    setInput: function(input) {
                        this._input = input;
                        this._more = this._less = this.done = false;
                        this.yylineno = this.yyleng = 0;
                        this.yytext = this.matched = this.match = "";
                        this.conditionStack = [ "INITIAL" ];
                        this.yylloc = {
                            first_line: 1,
                            first_column: 0,
                            last_line: 1,
                            last_column: 0
                        };
                        if (this.options.ranges) this.yylloc.range = [ 0, 0 ];
                        this.offset = 0;
                        return this;
                    },
                    input: function() {
                        var ch = this._input[0];
                        this.yytext += ch;
                        this.yyleng++;
                        this.offset++;
                        this.match += ch;
                        this.matched += ch;
                        var lines = ch.match(/(?:\r\n?|\n).*/g);
                        if (lines) {
                            this.yylineno++;
                            this.yylloc.last_line++;
                        } else {
                            this.yylloc.last_column++;
                        }
                        if (this.options.ranges) this.yylloc.range[1]++;
                        this._input = this._input.slice(1);
                        return ch;
                    },
                    unput: function(ch) {
                        var len = ch.length;
                        var lines = ch.split(/(?:\r\n?|\n)/g);
                        this._input = ch + this._input;
                        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
                        //this.yyleng -= len;
                        this.offset -= len;
                        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                        this.match = this.match.substr(0, this.match.length - 1);
                        this.matched = this.matched.substr(0, this.matched.length - 1);
                        if (lines.length - 1) this.yylineno -= lines.length - 1;
                        var r = this.yylloc.range;
                        this.yylloc = {
                            first_line: this.yylloc.first_line,
                            last_line: this.yylineno + 1,
                            first_column: this.yylloc.first_column,
                            last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
                        };
                        if (this.options.ranges) {
                            this.yylloc.range = [ r[0], r[0] + this.yyleng - len ];
                        }
                        return this;
                    },
                    more: function() {
                        this._more = true;
                        return this;
                    },
                    less: function(n) {
                        this.unput(this.match.slice(n));
                    },
                    pastInput: function() {
                        var past = this.matched.substr(0, this.matched.length - this.match.length);
                        return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
                    },
                    upcomingInput: function() {
                        var next = this.match;
                        if (next.length < 20) {
                            next += this._input.substr(0, 20 - next.length);
                        }
                        return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
                    },
                    showPosition: function() {
                        var pre = this.pastInput();
                        var c = new Array(pre.length + 1).join("-");
                        return pre + this.upcomingInput() + "\n" + c + "^";
                    },
                    next: function() {
                        if (this.done) {
                            return this.EOF;
                        }
                        if (!this._input) this.done = true;
                        var token, match, tempMatch, index, col, lines;
                        if (!this._more) {
                            this.yytext = "";
                            this.match = "";
                        }
                        var rules = this._currentRules();
                        for (var i = 0; i < rules.length; i++) {
                            tempMatch = this._input.match(this.rules[rules[i]]);
                            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                                match = tempMatch;
                                index = i;
                                if (!this.options.flex) break;
                            }
                        }
                        if (match) {
                            lines = match[0].match(/(?:\r\n?|\n).*/g);
                            if (lines) this.yylineno += lines.length;
                            this.yylloc = {
                                first_line: this.yylloc.last_line,
                                last_line: this.yylineno + 1,
                                first_column: this.yylloc.last_column,
                                last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
                            };
                            this.yytext += match[0];
                            this.match += match[0];
                            this.matches = match;
                            this.yyleng = this.yytext.length;
                            if (this.options.ranges) {
                                this.yylloc.range = [ this.offset, this.offset += this.yyleng ];
                            }
                            this._more = false;
                            this._input = this._input.slice(match[0].length);
                            this.matched += match[0];
                            token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
                            if (this.done && this._input) this.done = false;
                            if (token) return token; else return;
                        }
                        if (this._input === "") {
                            return this.EOF;
                        } else {
                            return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {
                                text: "",
                                token: null,
                                line: this.yylineno
                            });
                        }
                    },
                    lex: function lex() {
                        var r = this.next();
                        if (typeof r !== "undefined") {
                            return r;
                        } else {
                            return this.lex();
                        }
                    },
                    begin: function begin(condition) {
                        this.conditionStack.push(condition);
                    },
                    popState: function popState() {
                        return this.conditionStack.pop();
                    },
                    _currentRules: function _currentRules() {
                        return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
                    },
                    topState: function() {
                        return this.conditionStack[this.conditionStack.length - 2];
                    },
                    pushState: function begin(condition) {
                        this.begin(condition);
                    }
                };
                lexer.options = {};
                lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
                    var YYSTATE = YY_START;
                    switch ($avoiding_name_collisions) {
                      case 0:
                        yy_.yytext = "\\";
                        return 14;
                        break;

                      case 1:
                        if (yy_.yytext.slice(-1) !== "\\") this.begin("mu");
                        if (yy_.yytext.slice(-1) === "\\") yy_.yytext = yy_.yytext.substr(0, yy_.yyleng - 1), 
                        this.begin("emu");
                        if (yy_.yytext) return 14;
                        break;

                      case 2:
                        return 14;
                        break;

                      case 3:
                        if (yy_.yytext.slice(-1) !== "\\") this.popState();
                        if (yy_.yytext.slice(-1) === "\\") yy_.yytext = yy_.yytext.substr(0, yy_.yyleng - 1);
                        return 14;
                        break;

                      case 4:
                        yy_.yytext = yy_.yytext.substr(0, yy_.yyleng - 4);
                        this.popState();
                        return 15;
                        break;

                      case 5:
                        return 25;
                        break;

                      case 6:
                        return 16;
                        break;

                      case 7:
                        return 20;
                        break;

                      case 8:
                        return 19;
                        break;

                      case 9:
                        return 19;
                        break;

                      case 10:
                        return 23;
                        break;

                      case 11:
                        return 22;
                        break;

                      case 12:
                        this.popState();
                        this.begin("com");
                        break;

                      case 13:
                        yy_.yytext = yy_.yytext.substr(3, yy_.yyleng - 5);
                        this.popState();
                        return 15;
                        break;

                      case 14:
                        return 22;
                        break;

                      case 15:
                        return 37;
                        break;

                      case 16:
                        return 36;
                        break;

                      case 17:
                        return 36;
                        break;

                      case 18:
                        return 40;
                        break;

                      case 19:
                        /*ignore whitespace*/
                        break;

                      case 20:
                        this.popState();
                        return 24;
                        break;

                      case 21:
                        this.popState();
                        return 18;
                        break;

                      case 22:
                        yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2).replace(/\\"/g, '"');
                        return 31;
                        break;

                      case 23:
                        yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2).replace(/\\'/g, "'");
                        return 31;
                        break;

                      case 24:
                        return 38;
                        break;

                      case 25:
                        return 33;
                        break;

                      case 26:
                        return 33;
                        break;

                      case 27:
                        return 32;
                        break;

                      case 28:
                        return 36;
                        break;

                      case 29:
                        yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2);
                        return 36;
                        break;

                      case 30:
                        return "INVALID";
                        break;

                      case 31:
                        return 5;
                        break;
                    }
                };
                lexer.rules = [ /^(?:\\\\(?=(\{\{)))/, /^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|$)))/, /^(?:[\s\S]*?--\}\})/, /^(?:\{\{>)/, /^(?:\{\{#)/, /^(?:\{\{\/)/, /^(?:\{\{\^)/, /^(?:\{\{\s*else\b)/, /^(?:\{\{\{)/, /^(?:\{\{&)/, /^(?:\{\{!--)/, /^(?:\{\{![\s\S]*?\}\})/, /^(?:\{\{)/, /^(?:=)/, /^(?:\.(?=[}\/ ]))/, /^(?:\.\.)/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}\}\})/, /^(?:\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=[}\s]))/, /^(?:false(?=[}\s]))/, /^(?:-?[0-9]+(?=[}\s]))/, /^(?:[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.]))/, /^(?:\[[^\]]*\])/, /^(?:.)/, /^(?:$)/ ];
                lexer.conditions = {
                    mu: {
                        rules: [ 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31 ],
                        inclusive: false
                    },
                    emu: {
                        rules: [ 3 ],
                        inclusive: false
                    },
                    com: {
                        rules: [ 4 ],
                        inclusive: false
                    },
                    INITIAL: {
                        rules: [ 0, 1, 2, 31 ],
                        inclusive: true
                    }
                };
                return lexer;
            }();
            parser.lexer = lexer;
            function Parser() {
                this.yy = {};
            }
            Parser.prototype = parser;
            parser.Parser = Parser;
            return new Parser();
        }();
        // lib/handlebars/compiler/base.js
        Handlebars.Parser = handlebars;
        Handlebars.parse = function(input) {
            // Just return if an already-compile AST was passed in.
            if (input.constructor === Handlebars.AST.ProgramNode) {
                return input;
            }
            Handlebars.Parser.yy = Handlebars.AST;
            return Handlebars.Parser.parse(input);
        };
        // lib/handlebars/compiler/ast.js
        Handlebars.AST = {};
        Handlebars.AST.ProgramNode = function(statements, inverse) {
            this.type = "program";
            this.statements = statements;
            if (inverse) {
                this.inverse = new Handlebars.AST.ProgramNode(inverse);
            }
        };
        Handlebars.AST.MustacheNode = function(rawParams, hash, unescaped) {
            this.type = "mustache";
            this.escaped = !unescaped;
            this.hash = hash;
            var id = this.id = rawParams[0];
            var params = this.params = rawParams.slice(1);
            // a mustache is an eligible helper if:
            // * its id is simple (a single part, not `this` or `..`)
            var eligibleHelper = this.eligibleHelper = id.isSimple;
            // a mustache is definitely a helper if:
            // * it is an eligible helper, and
            // * it has at least one parameter or hash segment
            this.isHelper = eligibleHelper && (params.length || hash);
        };
        Handlebars.AST.PartialNode = function(partialName, context) {
            this.type = "partial";
            this.partialName = partialName;
            this.context = context;
        };
        Handlebars.AST.BlockNode = function(mustache, program, inverse, close) {
            var verifyMatch = function(open, close) {
                if (open.original !== close.original) {
                    throw new Handlebars.Exception(open.original + " doesn't match " + close.original);
                }
            };
            verifyMatch(mustache.id, close);
            this.type = "block";
            this.mustache = mustache;
            this.program = program;
            this.inverse = inverse;
            if (this.inverse && !this.program) {
                this.isInverse = true;
            }
        };
        Handlebars.AST.ContentNode = function(string) {
            this.type = "content";
            this.string = string;
        };
        Handlebars.AST.HashNode = function(pairs) {
            this.type = "hash";
            this.pairs = pairs;
        };
        Handlebars.AST.IdNode = function(parts) {
            this.type = "ID";
            var original = "", dig = [], depth = 0;
            for (var i = 0, l = parts.length; i < l; i++) {
                var part = parts[i].part;
                original += (parts[i].separator || "") + part;
                if (part === ".." || part === "." || part === "this") {
                    if (dig.length > 0) {
                        throw new Handlebars.Exception("Invalid path: " + original);
                    } else if (part === "..") {
                        depth++;
                    } else {
                        this.isScoped = true;
                    }
                } else {
                    dig.push(part);
                }
            }
            this.original = original;
            this.parts = dig;
            this.string = dig.join(".");
            this.depth = depth;
            // an ID is simple if it only has one part, and that part is not
            // `..` or `this`.
            this.isSimple = parts.length === 1 && !this.isScoped && depth === 0;
            this.stringModeValue = this.string;
        };
        Handlebars.AST.PartialNameNode = function(name) {
            this.type = "PARTIAL_NAME";
            this.name = name.original;
        };
        Handlebars.AST.DataNode = function(id) {
            this.type = "DATA";
            this.id = id;
        };
        Handlebars.AST.StringNode = function(string) {
            this.type = "STRING";
            this.original = this.string = this.stringModeValue = string;
        };
        Handlebars.AST.IntegerNode = function(integer) {
            this.type = "INTEGER";
            this.original = this.integer = integer;
            this.stringModeValue = Number(integer);
        };
        Handlebars.AST.BooleanNode = function(bool) {
            this.type = "BOOLEAN";
            this.bool = bool;
            this.stringModeValue = bool === "true";
        };
        Handlebars.AST.CommentNode = function(comment) {
            this.type = "comment";
            this.comment = comment;
        };
        // lib/handlebars/utils.js
        var errorProps = [ "description", "fileName", "lineNumber", "message", "name", "number", "stack" ];
        Handlebars.Exception = function(message) {
            var tmp = Error.prototype.constructor.apply(this, arguments);
            // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
            for (var idx = 0; idx < errorProps.length; idx++) {
                this[errorProps[idx]] = tmp[errorProps[idx]];
            }
        };
        Handlebars.Exception.prototype = new Error();
        // Build out our basic SafeString type
        Handlebars.SafeString = function(string) {
            this.string = string;
        };
        Handlebars.SafeString.prototype.toString = function() {
            return this.string.toString();
        };
        var escape = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "`": "&#x60;"
        };
        var badChars = /[&<>"'`]/g;
        var possible = /[&<>"'`]/;
        var escapeChar = function(chr) {
            return escape[chr] || "&amp;";
        };
        Handlebars.Utils = {
            extend: function(obj, value) {
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                        obj[key] = value[key];
                    }
                }
            },
            escapeExpression: function(string) {
                // don't escape SafeStrings, since they're already safe
                if (string instanceof Handlebars.SafeString) {
                    return string.toString();
                } else if (string == null || string === false) {
                    return "";
                }
                // Force a string conversion as this will be done by the append regardless and
                // the regex test will do this transparently behind the scenes, causing issues if
                // an object's to string has escaped characters in it.
                string = string.toString();
                if (!possible.test(string)) {
                    return string;
                }
                return string.replace(badChars, escapeChar);
            },
            isEmpty: function(value) {
                if (!value && value !== 0) {
                    return true;
                } else if (toString.call(value) === "[object Array]" && value.length === 0) {
                    return true;
                } else {
                    return false;
                }
            }
        };
        // lib/handlebars/compiler/compiler.js
        /*jshint eqnull:true*/
        var Compiler = Handlebars.Compiler = function() {};
        var JavaScriptCompiler = Handlebars.JavaScriptCompiler = function() {};
        // the foundHelper register will disambiguate helper lookup from finding a
        // function in a context. This is necessary for mustache compatibility, which
        // requires that context functions in blocks are evaluated by blockHelperMissing,
        // and then proceed as if the resulting value was provided to blockHelperMissing.
        Compiler.prototype = {
            compiler: Compiler,
            disassemble: function() {
                var opcodes = this.opcodes, opcode, out = [], params, param;
                for (var i = 0, l = opcodes.length; i < l; i++) {
                    opcode = opcodes[i];
                    if (opcode.opcode === "DECLARE") {
                        out.push("DECLARE " + opcode.name + "=" + opcode.value);
                    } else {
                        params = [];
                        for (var j = 0; j < opcode.args.length; j++) {
                            param = opcode.args[j];
                            if (typeof param === "string") {
                                param = '"' + param.replace("\n", "\\n") + '"';
                            }
                            params.push(param);
                        }
                        out.push(opcode.opcode + " " + params.join(" "));
                    }
                }
                return out.join("\n");
            },
            equals: function(other) {
                var len = this.opcodes.length;
                if (other.opcodes.length !== len) {
                    return false;
                }
                for (var i = 0; i < len; i++) {
                    var opcode = this.opcodes[i], otherOpcode = other.opcodes[i];
                    if (opcode.opcode !== otherOpcode.opcode || opcode.args.length !== otherOpcode.args.length) {
                        return false;
                    }
                    for (var j = 0; j < opcode.args.length; j++) {
                        if (opcode.args[j] !== otherOpcode.args[j]) {
                            return false;
                        }
                    }
                }
                len = this.children.length;
                if (other.children.length !== len) {
                    return false;
                }
                for (i = 0; i < len; i++) {
                    if (!this.children[i].equals(other.children[i])) {
                        return false;
                    }
                }
                return true;
            },
            guid: 0,
            compile: function(program, options) {
                this.children = [];
                this.depths = {
                    list: []
                };
                this.options = options;
                // These changes will propagate to the other compiler components
                var knownHelpers = this.options.knownHelpers;
                this.options.knownHelpers = {
                    helperMissing: true,
                    blockHelperMissing: true,
                    each: true,
                    "if": true,
                    unless: true,
                    "with": true,
                    log: true
                };
                if (knownHelpers) {
                    for (var name in knownHelpers) {
                        this.options.knownHelpers[name] = knownHelpers[name];
                    }
                }
                return this.program(program);
            },
            accept: function(node) {
                return this[node.type](node);
            },
            program: function(program) {
                var statements = program.statements, statement;
                this.opcodes = [];
                for (var i = 0, l = statements.length; i < l; i++) {
                    statement = statements[i];
                    this[statement.type](statement);
                }
                this.isSimple = l === 1;
                this.depths.list = this.depths.list.sort(function(a, b) {
                    return a - b;
                });
                return this;
            },
            compileProgram: function(program) {
                var result = new this.compiler().compile(program, this.options);
                var guid = this.guid++, depth;
                this.usePartial = this.usePartial || result.usePartial;
                this.children[guid] = result;
                for (var i = 0, l = result.depths.list.length; i < l; i++) {
                    depth = result.depths.list[i];
                    if (depth < 2) {
                        continue;
                    } else {
                        this.addDepth(depth - 1);
                    }
                }
                return guid;
            },
            block: function(block) {
                var mustache = block.mustache, program = block.program, inverse = block.inverse;
                if (program) {
                    program = this.compileProgram(program);
                }
                if (inverse) {
                    inverse = this.compileProgram(inverse);
                }
                var type = this.classifyMustache(mustache);
                if (type === "helper") {
                    this.helperMustache(mustache, program, inverse);
                } else if (type === "simple") {
                    this.simpleMustache(mustache);
                    // now that the simple mustache is resolved, we need to
                    // evaluate it by executing `blockHelperMissing`
                    this.opcode("pushProgram", program);
                    this.opcode("pushProgram", inverse);
                    this.opcode("emptyHash");
                    this.opcode("blockValue");
                } else {
                    this.ambiguousMustache(mustache, program, inverse);
                    // now that the simple mustache is resolved, we need to
                    // evaluate it by executing `blockHelperMissing`
                    this.opcode("pushProgram", program);
                    this.opcode("pushProgram", inverse);
                    this.opcode("emptyHash");
                    this.opcode("ambiguousBlockValue");
                }
                this.opcode("append");
            },
            hash: function(hash) {
                var pairs = hash.pairs, pair, val;
                this.opcode("pushHash");
                for (var i = 0, l = pairs.length; i < l; i++) {
                    pair = pairs[i];
                    val = pair[1];
                    if (this.options.stringParams) {
                        if (val.depth) {
                            this.addDepth(val.depth);
                        }
                        this.opcode("getContext", val.depth || 0);
                        this.opcode("pushStringParam", val.stringModeValue, val.type);
                    } else {
                        this.accept(val);
                    }
                    this.opcode("assignToHash", pair[0]);
                }
                this.opcode("popHash");
            },
            partial: function(partial) {
                var partialName = partial.partialName;
                this.usePartial = true;
                if (partial.context) {
                    this.ID(partial.context);
                } else {
                    this.opcode("push", "depth0");
                }
                this.opcode("invokePartial", partialName.name);
                this.opcode("append");
            },
            content: function(content) {
                this.opcode("appendContent", content.string);
            },
            mustache: function(mustache) {
                var options = this.options;
                var type = this.classifyMustache(mustache);
                if (type === "simple") {
                    this.simpleMustache(mustache);
                } else if (type === "helper") {
                    this.helperMustache(mustache);
                } else {
                    this.ambiguousMustache(mustache);
                }
                if (mustache.escaped && !options.noEscape) {
                    this.opcode("appendEscaped");
                } else {
                    this.opcode("append");
                }
            },
            ambiguousMustache: function(mustache, program, inverse) {
                var id = mustache.id, name = id.parts[0], isBlock = program != null || inverse != null;
                this.opcode("getContext", id.depth);
                this.opcode("pushProgram", program);
                this.opcode("pushProgram", inverse);
                this.opcode("invokeAmbiguous", name, isBlock);
            },
            simpleMustache: function(mustache) {
                var id = mustache.id;
                if (id.type === "DATA") {
                    this.DATA(id);
                } else if (id.parts.length) {
                    this.ID(id);
                } else {
                    // Simplified ID for `this`
                    this.addDepth(id.depth);
                    this.opcode("getContext", id.depth);
                    this.opcode("pushContext");
                }
                this.opcode("resolvePossibleLambda");
            },
            helperMustache: function(mustache, program, inverse) {
                var params = this.setupFullMustacheParams(mustache, program, inverse), name = mustache.id.parts[0];
                if (this.options.knownHelpers[name]) {
                    this.opcode("invokeKnownHelper", params.length, name);
                } else if (this.options.knownHelpersOnly) {
                    throw new Error("You specified knownHelpersOnly, but used the unknown helper " + name);
                } else {
                    this.opcode("invokeHelper", params.length, name);
                }
            },
            ID: function(id) {
                this.addDepth(id.depth);
                this.opcode("getContext", id.depth);
                var name = id.parts[0];
                if (!name) {
                    this.opcode("pushContext");
                } else {
                    this.opcode("lookupOnContext", id.parts[0]);
                }
                for (var i = 1, l = id.parts.length; i < l; i++) {
                    this.opcode("lookup", id.parts[i]);
                }
            },
            DATA: function(data) {
                this.options.data = true;
                if (data.id.isScoped || data.id.depth) {
                    throw new Handlebars.Exception("Scoped data references are not supported: " + data.original);
                }
                this.opcode("lookupData");
                var parts = data.id.parts;
                for (var i = 0, l = parts.length; i < l; i++) {
                    this.opcode("lookup", parts[i]);
                }
            },
            STRING: function(string) {
                this.opcode("pushString", string.string);
            },
            INTEGER: function(integer) {
                this.opcode("pushLiteral", integer.integer);
            },
            BOOLEAN: function(bool) {
                this.opcode("pushLiteral", bool.bool);
            },
            comment: function() {},
            // HELPERS
            opcode: function(name) {
                this.opcodes.push({
                    opcode: name,
                    args: [].slice.call(arguments, 1)
                });
            },
            declare: function(name, value) {
                this.opcodes.push({
                    opcode: "DECLARE",
                    name: name,
                    value: value
                });
            },
            addDepth: function(depth) {
                if (isNaN(depth)) {
                    throw new Error("EWOT");
                }
                if (depth === 0) {
                    return;
                }
                if (!this.depths[depth]) {
                    this.depths[depth] = true;
                    this.depths.list.push(depth);
                }
            },
            classifyMustache: function(mustache) {
                var isHelper = mustache.isHelper;
                var isEligible = mustache.eligibleHelper;
                var options = this.options;
                // if ambiguous, we can possibly resolve the ambiguity now
                if (isEligible && !isHelper) {
                    var name = mustache.id.parts[0];
                    if (options.knownHelpers[name]) {
                        isHelper = true;
                    } else if (options.knownHelpersOnly) {
                        isEligible = false;
                    }
                }
                if (isHelper) {
                    return "helper";
                } else if (isEligible) {
                    return "ambiguous";
                } else {
                    return "simple";
                }
            },
            pushParams: function(params) {
                var i = params.length, param;
                while (i--) {
                    param = params[i];
                    if (this.options.stringParams) {
                        if (param.depth) {
                            this.addDepth(param.depth);
                        }
                        this.opcode("getContext", param.depth || 0);
                        this.opcode("pushStringParam", param.stringModeValue, param.type);
                    } else {
                        this[param.type](param);
                    }
                }
            },
            setupMustacheParams: function(mustache) {
                var params = mustache.params;
                this.pushParams(params);
                if (mustache.hash) {
                    this.hash(mustache.hash);
                } else {
                    this.opcode("emptyHash");
                }
                return params;
            },
            // this will replace setupMustacheParams when we're done
            setupFullMustacheParams: function(mustache, program, inverse) {
                var params = mustache.params;
                this.pushParams(params);
                this.opcode("pushProgram", program);
                this.opcode("pushProgram", inverse);
                if (mustache.hash) {
                    this.hash(mustache.hash);
                } else {
                    this.opcode("emptyHash");
                }
                return params;
            }
        };
        var Literal = function(value) {
            this.value = value;
        };
        JavaScriptCompiler.prototype = {
            // PUBLIC API: You can override these methods in a subclass to provide
            // alternative compiled forms for name lookup and buffering semantics
            nameLookup: function(parent, name) {
                if (/^[0-9]+$/.test(name)) {
                    return parent + "[" + name + "]";
                } else if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
                    return parent + "." + name;
                } else {
                    return parent + "['" + name + "']";
                }
            },
            appendToBuffer: function(string) {
                if (this.environment.isSimple) {
                    return "return " + string + ";";
                } else {
                    return {
                        appendToBuffer: true,
                        content: string,
                        toString: function() {
                            return "buffer += " + string + ";";
                        }
                    };
                }
            },
            initializeBuffer: function() {
                return this.quotedString("");
            },
            namespace: "Handlebars",
            // END PUBLIC API
            compile: function(environment, options, context, asObject) {
                this.environment = environment;
                this.options = options || {};
                Handlebars.log(Handlebars.logger.DEBUG, this.environment.disassemble() + "\n\n");
                this.name = this.environment.name;
                this.isChild = !!context;
                this.context = context || {
                    programs: [],
                    environments: [],
                    aliases: {}
                };
                this.preamble();
                this.stackSlot = 0;
                this.stackVars = [];
                this.registers = {
                    list: []
                };
                this.compileStack = [];
                this.inlineStack = [];
                this.compileChildren(environment, options);
                var opcodes = environment.opcodes, opcode;
                this.i = 0;
                for (l = opcodes.length; this.i < l; this.i++) {
                    opcode = opcodes[this.i];
                    if (opcode.opcode === "DECLARE") {
                        this[opcode.name] = opcode.value;
                    } else {
                        this[opcode.opcode].apply(this, opcode.args);
                    }
                }
                return this.createFunctionContext(asObject);
            },
            nextOpcode: function() {
                var opcodes = this.environment.opcodes;
                return opcodes[this.i + 1];
            },
            eat: function() {
                this.i = this.i + 1;
            },
            preamble: function() {
                var out = [];
                if (!this.isChild) {
                    var namespace = this.namespace;
                    var copies = "helpers = this.merge(helpers, " + namespace + ".helpers);";
                    if (this.environment.usePartial) {
                        copies = copies + " partials = this.merge(partials, " + namespace + ".partials);";
                    }
                    if (this.options.data) {
                        copies = copies + " data = data || {};";
                    }
                    out.push(copies);
                } else {
                    out.push("");
                }
                if (!this.environment.isSimple) {
                    out.push(", buffer = " + this.initializeBuffer());
                } else {
                    out.push("");
                }
                // track the last context pushed into place to allow skipping the
                // getContext opcode when it would be a noop
                this.lastContext = 0;
                this.source = out;
            },
            createFunctionContext: function(asObject) {
                var locals = this.stackVars.concat(this.registers.list);
                if (locals.length > 0) {
                    this.source[1] = this.source[1] + ", " + locals.join(", ");
                }
                // Generate minimizer alias mappings
                if (!this.isChild) {
                    for (var alias in this.context.aliases) {
                        if (this.context.aliases.hasOwnProperty(alias)) {
                            this.source[1] = this.source[1] + ", " + alias + "=" + this.context.aliases[alias];
                        }
                    }
                }
                if (this.source[1]) {
                    this.source[1] = "var " + this.source[1].substring(2) + ";";
                }
                // Merge children
                if (!this.isChild) {
                    this.source[1] += "\n" + this.context.programs.join("\n") + "\n";
                }
                if (!this.environment.isSimple) {
                    this.source.push("return buffer;");
                }
                var params = this.isChild ? [ "depth0", "data" ] : [ "Handlebars", "depth0", "helpers", "partials", "data" ];
                for (var i = 0, l = this.environment.depths.list.length; i < l; i++) {
                    params.push("depth" + this.environment.depths.list[i]);
                }
                // Perform a second pass over the output to merge content when possible
                var source = this.mergeSource();
                if (!this.isChild) {
                    var revision = Handlebars.COMPILER_REVISION, versions = Handlebars.REVISION_CHANGES[revision];
                    source = "this.compilerInfo = [" + revision + ",'" + versions + "'];\n" + source;
                }
                if (asObject) {
                    params.push(source);
                    return Function.apply(this, params);
                } else {
                    var functionSource = "function " + (this.name || "") + "(" + params.join(",") + ") {\n  " + source + "}";
                    Handlebars.log(Handlebars.logger.DEBUG, functionSource + "\n\n");
                    return functionSource;
                }
            },
            mergeSource: function() {
                // WARN: We are not handling the case where buffer is still populated as the source should
                // not have buffer append operations as their final action.
                var source = "", buffer;
                for (var i = 0, len = this.source.length; i < len; i++) {
                    var line = this.source[i];
                    if (line.appendToBuffer) {
                        if (buffer) {
                            buffer = buffer + "\n    + " + line.content;
                        } else {
                            buffer = line.content;
                        }
                    } else {
                        if (buffer) {
                            source += "buffer += " + buffer + ";\n  ";
                            buffer = undefined;
                        }
                        source += line + "\n  ";
                    }
                }
                return source;
            },
            // [blockValue]
            //
            // On stack, before: hash, inverse, program, value
            // On stack, after: return value of blockHelperMissing
            //
            // The purpose of this opcode is to take a block of the form
            // `{{#foo}}...{{/foo}}`, resolve the value of `foo`, and
            // replace it on the stack with the result of properly
            // invoking blockHelperMissing.
            blockValue: function() {
                this.context.aliases.blockHelperMissing = "helpers.blockHelperMissing";
                var params = [ "depth0" ];
                this.setupParams(0, params);
                this.replaceStack(function(current) {
                    params.splice(1, 0, current);
                    return "blockHelperMissing.call(" + params.join(", ") + ")";
                });
            },
            // [ambiguousBlockValue]
            //
            // On stack, before: hash, inverse, program, value
            // Compiler value, before: lastHelper=value of last found helper, if any
            // On stack, after, if no lastHelper: same as [blockValue]
            // On stack, after, if lastHelper: value
            ambiguousBlockValue: function() {
                this.context.aliases.blockHelperMissing = "helpers.blockHelperMissing";
                var params = [ "depth0" ];
                this.setupParams(0, params);
                var current = this.topStack();
                params.splice(1, 0, current);
                // Use the options value generated from the invocation
                params[params.length - 1] = "options";
                this.source.push("if (!" + this.lastHelper + ") { " + current + " = blockHelperMissing.call(" + params.join(", ") + "); }");
            },
            // [appendContent]
            //
            // On stack, before: ...
            // On stack, after: ...
            //
            // Appends the string value of `content` to the current buffer
            appendContent: function(content) {
                this.source.push(this.appendToBuffer(this.quotedString(content)));
            },
            // [append]
            //
            // On stack, before: value, ...
            // On stack, after: ...
            //
            // Coerces `value` to a String and appends it to the current buffer.
            //
            // If `value` is truthy, or 0, it is coerced into a string and appended
            // Otherwise, the empty string is appended
            append: function() {
                // Force anything that is inlined onto the stack so we don't have duplication
                // when we examine local
                this.flushInline();
                var local = this.popStack();
                this.source.push("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
                if (this.environment.isSimple) {
                    this.source.push("else { " + this.appendToBuffer("''") + " }");
                }
            },
            // [appendEscaped]
            //
            // On stack, before: value, ...
            // On stack, after: ...
            //
            // Escape `value` and append it to the buffer
            appendEscaped: function() {
                this.context.aliases.escapeExpression = "this.escapeExpression";
                this.source.push(this.appendToBuffer("escapeExpression(" + this.popStack() + ")"));
            },
            // [getContext]
            //
            // On stack, before: ...
            // On stack, after: ...
            // Compiler value, after: lastContext=depth
            //
            // Set the value of the `lastContext` compiler value to the depth
            getContext: function(depth) {
                if (this.lastContext !== depth) {
                    this.lastContext = depth;
                }
            },
            // [lookupOnContext]
            //
            // On stack, before: ...
            // On stack, after: currentContext[name], ...
            //
            // Looks up the value of `name` on the current context and pushes
            // it onto the stack.
            lookupOnContext: function(name) {
                this.push(this.nameLookup("depth" + this.lastContext, name, "context"));
            },
            // [pushContext]
            //
            // On stack, before: ...
            // On stack, after: currentContext, ...
            //
            // Pushes the value of the current context onto the stack.
            pushContext: function() {
                this.pushStackLiteral("depth" + this.lastContext);
            },
            // [resolvePossibleLambda]
            //
            // On stack, before: value, ...
            // On stack, after: resolved value, ...
            //
            // If the `value` is a lambda, replace it on the stack by
            // the return value of the lambda
            resolvePossibleLambda: function() {
                this.context.aliases.functionType = '"function"';
                this.replaceStack(function(current) {
                    return "typeof " + current + " === functionType ? " + current + ".apply(depth0) : " + current;
                });
            },
            // [lookup]
            //
            // On stack, before: value, ...
            // On stack, after: value[name], ...
            //
            // Replace the value on the stack with the result of looking
            // up `name` on `value`
            lookup: function(name) {
                this.replaceStack(function(current) {
                    return current + " == null || " + current + " === false ? " + current + " : " + this.nameLookup(current, name, "context");
                });
            },
            // [lookupData]
            //
            // On stack, before: ...
            // On stack, after: data[id], ...
            //
            // Push the result of looking up `id` on the current data
            lookupData: function(id) {
                this.push("data");
            },
            // [pushStringParam]
            //
            // On stack, before: ...
            // On stack, after: string, currentContext, ...
            //
            // This opcode is designed for use in string mode, which
            // provides the string value of a parameter along with its
            // depth rather than resolving it immediately.
            pushStringParam: function(string, type) {
                this.pushStackLiteral("depth" + this.lastContext);
                this.pushString(type);
                if (typeof string === "string") {
                    this.pushString(string);
                } else {
                    this.pushStackLiteral(string);
                }
            },
            emptyHash: function() {
                this.pushStackLiteral("{}");
                if (this.options.stringParams) {
                    this.register("hashTypes", "{}");
                    this.register("hashContexts", "{}");
                }
            },
            pushHash: function() {
                this.hash = {
                    values: [],
                    types: [],
                    contexts: []
                };
            },
            popHash: function() {
                var hash = this.hash;
                this.hash = undefined;
                if (this.options.stringParams) {
                    this.register("hashContexts", "{" + hash.contexts.join(",") + "}");
                    this.register("hashTypes", "{" + hash.types.join(",") + "}");
                }
                this.push("{\n    " + hash.values.join(",\n    ") + "\n  }");
            },
            // [pushString]
            //
            // On stack, before: ...
            // On stack, after: quotedString(string), ...
            //
            // Push a quoted version of `string` onto the stack
            pushString: function(string) {
                this.pushStackLiteral(this.quotedString(string));
            },
            // [push]
            //
            // On stack, before: ...
            // On stack, after: expr, ...
            //
            // Push an expression onto the stack
            push: function(expr) {
                this.inlineStack.push(expr);
                return expr;
            },
            // [pushLiteral]
            //
            // On stack, before: ...
            // On stack, after: value, ...
            //
            // Pushes a value onto the stack. This operation prevents
            // the compiler from creating a temporary variable to hold
            // it.
            pushLiteral: function(value) {
                this.pushStackLiteral(value);
            },
            // [pushProgram]
            //
            // On stack, before: ...
            // On stack, after: program(guid), ...
            //
            // Push a program expression onto the stack. This takes
            // a compile-time guid and converts it into a runtime-accessible
            // expression.
            pushProgram: function(guid) {
                if (guid != null) {
                    this.pushStackLiteral(this.programExpression(guid));
                } else {
                    this.pushStackLiteral(null);
                }
            },
            // [invokeHelper]
            //
            // On stack, before: hash, inverse, program, params..., ...
            // On stack, after: result of helper invocation
            //
            // Pops off the helper's parameters, invokes the helper,
            // and pushes the helper's return value onto the stack.
            //
            // If the helper is not found, `helperMissing` is called.
            invokeHelper: function(paramSize, name) {
                this.context.aliases.helperMissing = "helpers.helperMissing";
                var helper = this.lastHelper = this.setupHelper(paramSize, name, true);
                var nonHelper = this.nameLookup("depth" + this.lastContext, name, "context");
                this.push(helper.name + " || " + nonHelper);
                this.replaceStack(function(name) {
                    return name + " ? " + name + ".call(" + helper.callParams + ") " + ": helperMissing.call(" + helper.helperMissingParams + ")";
                });
            },
            // [invokeKnownHelper]
            //
            // On stack, before: hash, inverse, program, params..., ...
            // On stack, after: result of helper invocation
            //
            // This operation is used when the helper is known to exist,
            // so a `helperMissing` fallback is not required.
            invokeKnownHelper: function(paramSize, name) {
                var helper = this.setupHelper(paramSize, name);
                this.push(helper.name + ".call(" + helper.callParams + ")");
            },
            // [invokeAmbiguous]
            //
            // On stack, before: hash, inverse, program, params..., ...
            // On stack, after: result of disambiguation
            //
            // This operation is used when an expression like `{{foo}}`
            // is provided, but we don't know at compile-time whether it
            // is a helper or a path.
            //
            // This operation emits more code than the other options,
            // and can be avoided by passing the `knownHelpers` and
            // `knownHelpersOnly` flags at compile-time.
            invokeAmbiguous: function(name, helperCall) {
                this.context.aliases.functionType = '"function"';
                this.pushStackLiteral("{}");
                // Hash value
                var helper = this.setupHelper(0, name, helperCall);
                var helperName = this.lastHelper = this.nameLookup("helpers", name, "helper");
                var nonHelper = this.nameLookup("depth" + this.lastContext, name, "context");
                var nextStack = this.nextStack();
                this.source.push("if (" + nextStack + " = " + helperName + ") { " + nextStack + " = " + nextStack + ".call(" + helper.callParams + "); }");
                this.source.push("else { " + nextStack + " = " + nonHelper + "; " + nextStack + " = typeof " + nextStack + " === functionType ? " + nextStack + ".apply(depth0) : " + nextStack + "; }");
            },
            // [invokePartial]
            //
            // On stack, before: context, ...
            // On stack after: result of partial invocation
            //
            // This operation pops off a context, invokes a partial with that context,
            // and pushes the result of the invocation back.
            invokePartial: function(name) {
                var params = [ this.nameLookup("partials", name, "partial"), "'" + name + "'", this.popStack(), "helpers", "partials" ];
                if (this.options.data) {
                    params.push("data");
                }
                this.context.aliases.self = "this";
                this.push("self.invokePartial(" + params.join(", ") + ")");
            },
            // [assignToHash]
            //
            // On stack, before: value, hash, ...
            // On stack, after: hash, ...
            //
            // Pops a value and hash off the stack, assigns `hash[key] = value`
            // and pushes the hash back onto the stack.
            assignToHash: function(key) {
                var value = this.popStack(), context, type;
                if (this.options.stringParams) {
                    type = this.popStack();
                    context = this.popStack();
                }
                var hash = this.hash;
                if (context) {
                    hash.contexts.push("'" + key + "': " + context);
                }
                if (type) {
                    hash.types.push("'" + key + "': " + type);
                }
                hash.values.push("'" + key + "': (" + value + ")");
            },
            // HELPERS
            compiler: JavaScriptCompiler,
            compileChildren: function(environment, options) {
                var children = environment.children, child, compiler;
                for (var i = 0, l = children.length; i < l; i++) {
                    child = children[i];
                    compiler = new this.compiler();
                    var index = this.matchExistingProgram(child);
                    if (index == null) {
                        this.context.programs.push("");
                        // Placeholder to prevent name conflicts for nested children
                        index = this.context.programs.length;
                        child.index = index;
                        child.name = "program" + index;
                        this.context.programs[index] = compiler.compile(child, options, this.context);
                        this.context.environments[index] = child;
                    } else {
                        child.index = index;
                        child.name = "program" + index;
                    }
                }
            },
            matchExistingProgram: function(child) {
                for (var i = 0, len = this.context.environments.length; i < len; i++) {
                    var environment = this.context.environments[i];
                    if (environment && environment.equals(child)) {
                        return i;
                    }
                }
            },
            programExpression: function(guid) {
                this.context.aliases.self = "this";
                if (guid == null) {
                    return "self.noop";
                }
                var child = this.environment.children[guid], depths = child.depths.list, depth;
                var programParams = [ child.index, child.name, "data" ];
                for (var i = 0, l = depths.length; i < l; i++) {
                    depth = depths[i];
                    if (depth === 1) {
                        programParams.push("depth0");
                    } else {
                        programParams.push("depth" + (depth - 1));
                    }
                }
                return (depths.length === 0 ? "self.program(" : "self.programWithDepth(") + programParams.join(", ") + ")";
            },
            register: function(name, val) {
                this.useRegister(name);
                this.source.push(name + " = " + val + ";");
            },
            useRegister: function(name) {
                if (!this.registers[name]) {
                    this.registers[name] = true;
                    this.registers.list.push(name);
                }
            },
            pushStackLiteral: function(item) {
                return this.push(new Literal(item));
            },
            pushStack: function(item) {
                this.flushInline();
                var stack = this.incrStack();
                if (item) {
                    this.source.push(stack + " = " + item + ";");
                }
                this.compileStack.push(stack);
                return stack;
            },
            replaceStack: function(callback) {
                var prefix = "", inline = this.isInline(), stack;
                // If we are currently inline then we want to merge the inline statement into the
                // replacement statement via ','
                if (inline) {
                    var top = this.popStack(true);
                    if (top instanceof Literal) {
                        // Literals do not need to be inlined
                        stack = top.value;
                    } else {
                        // Get or create the current stack name for use by the inline
                        var name = this.stackSlot ? this.topStackName() : this.incrStack();
                        prefix = "(" + this.push(name) + " = " + top + "),";
                        stack = this.topStack();
                    }
                } else {
                    stack = this.topStack();
                }
                var item = callback.call(this, stack);
                if (inline) {
                    if (this.inlineStack.length || this.compileStack.length) {
                        this.popStack();
                    }
                    this.push("(" + prefix + item + ")");
                } else {
                    // Prevent modification of the context depth variable. Through replaceStack
                    if (!/^stack/.test(stack)) {
                        stack = this.nextStack();
                    }
                    this.source.push(stack + " = (" + prefix + item + ");");
                }
                return stack;
            },
            nextStack: function() {
                return this.pushStack();
            },
            incrStack: function() {
                this.stackSlot++;
                if (this.stackSlot > this.stackVars.length) {
                    this.stackVars.push("stack" + this.stackSlot);
                }
                return this.topStackName();
            },
            topStackName: function() {
                return "stack" + this.stackSlot;
            },
            flushInline: function() {
                var inlineStack = this.inlineStack;
                if (inlineStack.length) {
                    this.inlineStack = [];
                    for (var i = 0, len = inlineStack.length; i < len; i++) {
                        var entry = inlineStack[i];
                        if (entry instanceof Literal) {
                            this.compileStack.push(entry);
                        } else {
                            this.pushStack(entry);
                        }
                    }
                }
            },
            isInline: function() {
                return this.inlineStack.length;
            },
            popStack: function(wrapped) {
                var inline = this.isInline(), item = (inline ? this.inlineStack : this.compileStack).pop();
                if (!wrapped && item instanceof Literal) {
                    return item.value;
                } else {
                    if (!inline) {
                        this.stackSlot--;
                    }
                    return item;
                }
            },
            topStack: function(wrapped) {
                var stack = this.isInline() ? this.inlineStack : this.compileStack, item = stack[stack.length - 1];
                if (!wrapped && item instanceof Literal) {
                    return item.value;
                } else {
                    return item;
                }
            },
            quotedString: function(str) {
                return '"' + str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + '"';
            },
            setupHelper: function(paramSize, name, missingParams) {
                var params = [];
                this.setupParams(paramSize, params, missingParams);
                var foundHelper = this.nameLookup("helpers", name, "helper");
                return {
                    params: params,
                    name: foundHelper,
                    callParams: [ "depth0" ].concat(params).join(", "),
                    helperMissingParams: missingParams && [ "depth0", this.quotedString(name) ].concat(params).join(", ")
                };
            },
            // the params and contexts arguments are passed in arrays
            // to fill in
            setupParams: function(paramSize, params, useRegister) {
                var options = [], contexts = [], types = [], param, inverse, program;
                options.push("hash:" + this.popStack());
                inverse = this.popStack();
                program = this.popStack();
                // Avoid setting fn and inverse if neither are set. This allows
                // helpers to do a check for `if (options.fn)`
                if (program || inverse) {
                    if (!program) {
                        this.context.aliases.self = "this";
                        program = "self.noop";
                    }
                    if (!inverse) {
                        this.context.aliases.self = "this";
                        inverse = "self.noop";
                    }
                    options.push("inverse:" + inverse);
                    options.push("fn:" + program);
                }
                for (var i = 0; i < paramSize; i++) {
                    param = this.popStack();
                    params.push(param);
                    if (this.options.stringParams) {
                        types.push(this.popStack());
                        contexts.push(this.popStack());
                    }
                }
                if (this.options.stringParams) {
                    options.push("contexts:[" + contexts.join(",") + "]");
                    options.push("types:[" + types.join(",") + "]");
                    options.push("hashContexts:hashContexts");
                    options.push("hashTypes:hashTypes");
                }
                if (this.options.data) {
                    options.push("data:data");
                }
                options = "{" + options.join(",") + "}";
                if (useRegister) {
                    this.register("options", options);
                    params.push("options");
                } else {
                    params.push(options);
                }
                return params.join(", ");
            }
        };
        var reservedWords = ("break else new var" + " case finally return void" + " catch for switch while" + " continue function this with" + " default if throw" + " delete in try" + " do instanceof typeof" + " abstract enum int short" + " boolean export interface static" + " byte extends long super" + " char final native synchronized" + " class float package throws" + " const goto private transient" + " debugger implements protected volatile" + " double import public let yield").split(" ");
        var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};
        for (var i = 0, l = reservedWords.length; i < l; i++) {
            compilerWords[reservedWords[i]] = true;
        }
        JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
            if (!JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]+$/.test(name)) {
                return true;
            }
            return false;
        };
        Handlebars.precompile = function(input, options) {
            if (input == null || typeof input !== "string" && input.constructor !== Handlebars.AST.ProgramNode) {
                throw new Handlebars.Exception("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + input);
            }
            options = options || {};
            if (!("data" in options)) {
                options.data = true;
            }
            var ast = Handlebars.parse(input);
            var environment = new Compiler().compile(ast, options);
            return new JavaScriptCompiler().compile(environment, options);
        };
        Handlebars.compile = function(input, options) {
            if (input == null || typeof input !== "string" && input.constructor !== Handlebars.AST.ProgramNode) {
                throw new Handlebars.Exception("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
            }
            options = options || {};
            if (!("data" in options)) {
                options.data = true;
            }
            var compiled;
            function compile() {
                var ast = Handlebars.parse(input);
                var environment = new Compiler().compile(ast, options);
                var templateSpec = new JavaScriptCompiler().compile(environment, options, undefined, true);
                return Handlebars.template(templateSpec);
            }
            // Template is only compiled on first use and cached after that point.
            return function(context, options) {
                if (!compiled) {
                    compiled = compile();
                }
                return compiled.call(this, context, options);
            };
        };
        // lib/handlebars/runtime.js
        Handlebars.VM = {
            template: function(templateSpec) {
                // Just add water
                var container = {
                    escapeExpression: Handlebars.Utils.escapeExpression,
                    invokePartial: Handlebars.VM.invokePartial,
                    programs: [],
                    program: function(i, fn, data) {
                        var programWrapper = this.programs[i];
                        if (data) {
                            programWrapper = Handlebars.VM.program(i, fn, data);
                        } else if (!programWrapper) {
                            programWrapper = this.programs[i] = Handlebars.VM.program(i, fn);
                        }
                        return programWrapper;
                    },
                    merge: function(param, common) {
                        var ret = param || common;
                        if (param && common) {
                            ret = {};
                            Handlebars.Utils.extend(ret, common);
                            Handlebars.Utils.extend(ret, param);
                        }
                        return ret;
                    },
                    programWithDepth: Handlebars.VM.programWithDepth,
                    noop: Handlebars.VM.noop,
                    compilerInfo: null
                };
                return function(context, options) {
                    options = options || {};
                    var result = templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);
                    var compilerInfo = container.compilerInfo || [], compilerRevision = compilerInfo[0] || 1, currentRevision = Handlebars.COMPILER_REVISION;
                    if (compilerRevision !== currentRevision) {
                        if (compilerRevision < currentRevision) {
                            var runtimeVersions = Handlebars.REVISION_CHANGES[currentRevision], compilerVersions = Handlebars.REVISION_CHANGES[compilerRevision];
                            throw "Template was precompiled with an older version of Handlebars than the current runtime. " + "Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ").";
                        } else {
                            // Use the embedded version info since the runtime doesn't know about this revision yet
                            throw "Template was precompiled with a newer version of Handlebars than the current runtime. " + "Please update your runtime to a newer version (" + compilerInfo[1] + ").";
                        }
                    }
                    return result;
                };
            },
            programWithDepth: function(i, fn, data) {
                var args = Array.prototype.slice.call(arguments, 3);
                var program = function(context, options) {
                    options = options || {};
                    return fn.apply(this, [ context, options.data || data ].concat(args));
                };
                program.program = i;
                program.depth = args.length;
                return program;
            },
            program: function(i, fn, data) {
                var program = function(context, options) {
                    options = options || {};
                    return fn(context, options.data || data);
                };
                program.program = i;
                program.depth = 0;
                return program;
            },
            noop: function() {
                return "";
            },
            invokePartial: function(partial, name, context, helpers, partials, data) {
                var options = {
                    helpers: helpers,
                    partials: partials,
                    data: data
                };
                if (partial === undefined) {
                    throw new Handlebars.Exception("The partial " + name + " could not be found");
                } else if (partial instanceof Function) {
                    return partial(context, options);
                } else if (!Handlebars.compile) {
                    throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
                } else {
                    partials[name] = Handlebars.compile(partial, {
                        data: data !== undefined
                    });
                    return partials[name](context, options);
                }
            }
        };
        Handlebars.template = Handlebars.VM.template;
    })(Handlebars);
/**
 * @description HandlebarsHelper模板引擎帮助类
 * @class HandlebarsHelper - 标签库
 * @author yongjin on 2014/11/11
 */
window.ckToggleClass = function (selecter) {
  var $target = $("#" + selecter);
  if ($target.hasClass('icon-checkbox')) $target.removeClass('icon-checkbox').addClass('icon-checkboxno');
  else $target.removeClass('icon-checkboxno').addClass('icon-checkbox');
}
/**
 * 分页
 * @method [分页] - pagination
 * @author wyj 2014-03-27
 * @example
 *        {{#pagination page totalPage}}
 <li class="bui-bar-item bui-button-number bui-inline-block {{#compare ../page this operator='!=='}}danaiPageNum
 {{else}}active{{/compare}}" data-page="{{this}}" aria-disabled="false" id="{{this}}" aria-pressed="false">
 <a href="javascript:;">{{this}}</a></li>
 {{/pagination}}
 */
Handlebars.registerHelper('pagination', function (page, totalPage, sum, block) {
  var accum = '', block = block, sum = sum;
  if (arguments.length === 3) {
    block = sum;
    sum = 9;
  }
  var pages = Est.getPaginationNumber(page, totalPage, sum);
  for (var i = 0, len = pages.length; i < len; i++) {
    accum += block.fn(pages[i]);
  }
  return accum;
});

/**
 * 根据path获取值
 * @method getValue
 * @author wyj 15.2.1
 * @example
 *      Handlebars.helpers["getValue"].apply(this, date)
 */
Handlebars.registerHelper('getValue', function (path, options) {
  if (typeof path !== 'undefined' && Est.typeOf(path) === 'string') {
    var list = path.split('.');
    if (list[0] in this) {
      if (list.length > 1) {
        if (Est.typeOf(this[list[0]]) !== 'object') {
          this[list[0]] = JSON.parse(this[list[0]]);
        }
        return Est.getValue(this, path);
      } else {
        return this[list[0]];
      }
    }
  } else {
    return path;
  }
});

/**
 * 比较
 * @method [判断] - compare
 * @author wyj 2014-03-27
 * @example
 *      {{#compare ../page '!==' this}}danaiPageNum{{else}}active{{/compare}}
 */
Handlebars.registerHelper('compare', function (v1, operator, v2, options) {
  if (arguments.length < 3)
    throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
  try {
    switch (operator.toString()) {
      case '==':
        return (v1 == v2) ? options.fn(this) :
          options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) :
          options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) :
          options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) :
          options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) :
          options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) :
          options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) :
          options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) :
          options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) :
          options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) :
          options.inverse(this);
      case 'indexOf':
        return (v1.indexOf(v2) > -1) ? options.fn(this) :
          options.inverse(this);
      default:
        return options.inverse(this);
    }
  } catch (e) {
    console.log('Errow: hbs.compare v1=' + v1 + ';v2=' + v2 + e);
  }
});

/**
 * 时间格式化
 * @method [时间] - dateFormat
 * @author wyj 2014-03-27
 * @example
 *      {{dateFormat $.detail_news.add_time $.lan.news.format}}
 */
Handlebars.registerHelper('dateFormat', function (date, fmt, options) {
  return Est.dateFormat(date, fmt);
});

/**
 * 判断字符串是否包含
 * @method [判断] - contains
 * @author wyj 14.11.17
 * @example
 *      {{#contains ../element this}}checked="checked"{{/contains}}
 */
Handlebars.registerHelper('contains', function (target, thisVal, options) {
  if (Est.isEmpty(target)) return;
  return Est.contains(target, thisVal) ? options.fn(this) : options.inverse(this);
});

/**
 * 两数相加
 * @method [运算] - plus
 * @author wyj 2014-03-27
 * @example
 *      {{plus 1 2}} => 3
 */
Handlebars.registerHelper('plus', function (num1, num2, opts) {
  return parseInt(num1, 10) + parseInt(num2, 10);
});
/**
 * 两数相减
 * @method [运算] - minus
 * @author wyj 2014-03-27
 * @example
 *        {{minus 10 5}} => 5
 */
Handlebars.registerHelper('minus', function (num1, num2, opts) {
  return parseInt(num1, 10) - parseInt(num2, 10);
});

/**
 * 字符串截取
 * @method [字符串] - cutByte
 * @author wyj 2014-03-27
 * @example
 *      {{cutByte name 5 end='...'}}
 */
Handlebars.registerHelper('cutByte', function (str, len, options) {
  return Est.cutByte(str, len, options.hash.end || '...');
});

/**
 * 复杂条件
 * @method [判断] - xif
 * @author wyj 14.12.31
 * @example
 *       return Handlebars.helpers["x"].apply(this, [expression, options]) ? options.fn(this) : options.inverse(this);
 *
 */
Handlebars.registerHelper("x", function (expression, options) {
  var fn = function () {
  }, result;
  try {
    fn = Function.apply(this,
      [ 'window', 'return ' + expression + ';' ]);
  } catch (e) {
    console.warn('[warning] {{x ' + expression + '}} is invalid javascript', e);
  }
  try {
    result = fn.bind(this)(window);
  } catch (e) {
    console.warn('[warning] {{x ' + expression + '}} runtime error', e);
  }
  return result;
});

/**
 * xif条件表达式
 * @method [判断] - xif
 * @author wyj 15.2.2
 * @example
 *    {{#xif "this.orderStatus != 'completed' && this.orderStatus != 'invalid' && this.paymentStatus == 'unpaid' &&
              this.shippingStatus == 'unshipped'"}}disabled{{/xif}}
 */
Handlebars.registerHelper("xif", function (expression, options) {
  return Handlebars.helpers["x"].apply(this, [expression, options]) ? options.fn(this) : options.inverse(this);
});

/**
 * 返回整数
 * @method [数字] - parseInt
 * @author wxw 2014-12-16
 * @example
 *      {{parseInt 01}}
 */
Handlebars.registerHelper('parseInt', function (result, options) {
  return parseInt(result, 10);
});

/**
 * 缩略ID值
 * @method id2
 * @author wyj
 */
Handlebars.registerHelper('id2', function (id) {
  return id == null ? "" : id.replace(/^[^1-9]+/, "")
});

/**
 * 返回全局常量
 * @method [常量] - CONST
 * @author wyj 14.12.17
 * @example
 *        {{CONST 'HOST'}}
 */
Handlebars.registerHelper('CONST', function (name, options) {
  return Est.getValue(CONST, name);
});

/**
 * 返回图片地址常量（返回添加图片域名的图片地址, 推荐使用）
 * @method [常量] - PIC
 * @author wyj 14.12.17
 * @example
 *        {{PIC pic}}   ==> http://img.jihui88.com/upload/a/a1/picture/2015/12/20/pic.jpg?v=2015-12-20_12:30
 *        {{PIC pic 5}} ==> http://img.jihui88.com/upload/a/a1/picture/2015/12/20/pic_5.jpg?v=2015-12-20_12:30
 */
Handlebars.registerHelper('PIC', function (name, number, options) {
  var version = '';
  if (name) {
    version += (name.indexOf('?') > -1 ? ('&v=' + CONST.APP_VERSION) : '?v=' + CONST.APP_VERSION);
    if (Est.startsWidth(name, 'CONST')) {
      name = Handlebars.helpers['CONST'].apply(this, [name.replace('CONST.', ''), options]);
    }
  }
  if (!name) return CONST.DOMAIN + CONST.PIC_NONE + version;
  if (Est.startsWidth(name, 'http') && name.indexOf('upload') > -1){
        name = name.substring(name.indexOf('upload'), name.length);
  }
  if (Est.startsWidth(name, 'upload')){
     return arguments.length < 3 ? CONST.PIC_URL + '/' + name + version:
      Handlebars.helpers['_picUrl'].apply(this, [name, number, options]) + version;
  }

  return Est.startsWidth(name, 'http') ? name + version : CONST.DOMAIN + name + version;
});

/**
 * 返回background-image: url();
 *
 * @method [样式] - BackgroundImage
 * @param  {string} name       图片地址
 * @param  {int} number     压缩尺寸
 * @param  {object} options
 * @return {string}     => background-image: url(http://img.jihui88.com/upload/u/u2/.......png);
 */
Handlebars.registerHelper('BackgroundImage', function (name, number, options) {
  return ('background-image: url(' + Handlebars.helpers['PIC'].apply(this, Array.prototype.slice.call(arguments)) + ');');
});

/*Handlebars.registerHelper('PIC', function (name, options) {
 if (!name) return CONST.PIC_URL + '/' + CONST.PIC_NONE;
 if (Est.startsWidth(name, 'upload')) return CONST.PIC_URL + '/' + name;
 return CONST.DOMAIN + name;
 });*/

/**
 * 判断是否为空
 * @method [判断] - isEmpty
 * @author wyj 14.12.27
 * @example
 *      {{#isEmpty image}}<img src='...'></img>{{/isEmpty}}
 */
Handlebars.registerHelper('isEmpty', function (value, options) {
  return Est.isEmpty(value) ? options.fn(this) :
    options.inverse(this);
});

/**
 * 图片尺寸 （返回不带图片域名的地址）
 * @method [图片] - picUrl
 * @author wyj 2014-03-31
 * @example
 *      <img src="{{CONST 'PIC_URL'}}/{{picUrl picPath 6}}" width="52" height="52">
 */
Handlebars.registerHelper('picUrl', function (src, number, opts) {
  var url = src;
  if (arguments.length < 3) return src || CONST.PIC_NONE;
  if (src == null || src.length == 0) return CONST.PIC_NONE;
  var url2 = url.substring(url.lastIndexOf(".") + 1, url.length);
  url = url.substring(0, url.lastIndexOf(".")) + "_" + number + "." + url2;
  return url ? url : '';
});
Handlebars.registerHelper('_picUrl', function (src, number, opts) {
  return CONST.PIC_URL + '/' + Handlebars.helpers['picUrl'].apply(this, [src, number, opts]);
});
/**
 * radio标签
 *
 * @method [表单] - radio
 * @author wyj 15.1.7
 * @example
 *        {{{radio name='isBest' value=isBest option='{"是": "01", "否": "00"}' }}}
 */
Handlebars.registerHelper('radio', function (options) {
  var result = [], list = $.parseJSON ? $.parseJSON(options.hash.option) : JSON.parse(options.hash.options);
  Est.each(list, function (val, key, list, index) {
    var checked = options.hash.value === val ? 'checked' : '';
    result.push('<label><input id="model' + index + '-' + options.hash.name + '" type="radio" name="' + options.hash.name +
      '" value="' + val + '" ' + checked + '>&nbsp;' + key + '</label>&nbsp;&nbsp;');
  });
  return result.join('');
});

/**
 * checkbox标签
 *
 * @method [表单] - checkbox
 * @author wyj 15.6.19
 * @example
 *      {{{checkbox label='' name='isDefault' value=isDefault trueVal='1' falseVal='0' }}}
 */
Handlebars.registerHelper('checkbox', function (options) {
  var id = options.hash.id ? options.hash.id : ('model-' + options.hash.name);
  var random = Est.nextUid('checkbox'); // 随机数
  var icon_style = "font-size: 32px;"; // 图标大小
  var value = Est.isEmpty(options.hash.value) ? options.hash.falseVal : options.hash.value; // 取值
  var isChecked = value === options.hash.trueVal ? true : false; // 是否选中状态
  var defaultClass = isChecked ? 'icon-checkbox' : 'icon-checkboxno';
  var args = ("'" + random + "'"); // 参数

  var result = '<div> <label for="' + id + '" style="overflow:hidden;display:inline-block;"> ' +
    '<input onclick="window.ckToggleClass(' + args + ');" type="checkbox" name="' + options.hash.name + '" id="' + id + '" value="' + value + '" ' + (isChecked ? 'checked' : '') + ' true-value="' + options.hash.trueVal + '" false-value="' + options.hash.falseVal + '"  class="rc-hidden" style="display: none;">' +
    '<i id="' + random + '" class="iconfont ' + defaultClass + '" style="' + icon_style + '"></i>' + options.hash.label +
    '</label></div>';
  return result;
});

/**
 * select标签
 *
 * @method [表单] - select
 * @author wyj 15.6.22
 * @example
 *      {{{select name='paymentConfit' value=curConfitPanment key='paymentId' text='name' list=paymentConfigList  style="height: 40px;"}}}
 *
 */
Handlebars.registerHelper('select', function (options) {
  var id = options.hash.id ? options.hash.id : ('model-' + options.hash.name);
  var str = '<select name="' + options.hash.name + '" id="' + id + '"  class="' + (options.hash.className || '') + '" style="' + (options.hash.style || '') + '"> ';
  Est.each(options.hash.list, function (item) {
    var selected = options.hash.value === item[options.hash.key] ? 'selected' : '';
    str += '<option value="' + item[options.hash.key] + '" ' + selected + '>' + item[options.hash.text] + '</option>';
  });
  return str + '</select>';
});

/**
 * 显示隐藏
 * @method show
 * @author wyj 15.2.1
 * @example
 *      <h3 {{{show "this.photos.display==='01'"}}}></h3>
 */
Handlebars.registerHelper('show', function (expression, options) {
  return Handlebars.helpers["x"].apply(this, [expression, options]) ? " style='display:block;' " : " style='display:none;' ";
});

/**
 * 表单元素不可编辑
 * @method [表单] - disabled
 * @author wyj 15.2.1
 * @example
 *      <input type="text" {{disabled 'this.isDisabled'}} />
 */
Handlebars.registerHelper('disabled', function (expression, options) {
  return Handlebars.helpers['x'].apply(this, [expression, options]) ? ' disabled=disabled ' : '';
});


/**
 * 判断checkbox是否选中
 * @method [表单] - checked
 * @author wyj 15.2.1
 * @example
 *        <input type="checked"  {{checked 'this.isChecked'}} />
 */
Handlebars.registerHelper('checked', function (expression, options) {
  return Handlebars.helpers['x'].apply(this, [expression, options]) ? 'checked' : '';
});

/**
 * 编译url
 * @method [url] - encodeURLComponent
 * @author wyj 15.2.1
 * @example
 *      {{encodeURIComponent url}}
 */
Handlebars.registerHelper('encodeURIComponent', function (val, options) {
  return encodeURIComponent(val);
});

/**
 * 请求模板
 * @method [模板] - template
 * @author wyj 15.2.1
 * @example
 *      {{template redding}}
 */
Handlebars.registerHelper('template', function (name, options) {
  return (function (name, options, ctx) {
    new Est.promise(function (resolve, reject) {
      seajs.use([name], function (template) {
        var tpl = Handlebars.compile(template);
        resolve(tpl(this));
      });
    }).then(function (result) {
        options.fn(ctx);
      })
  })(name, options, this);
});

/**
 * 解析JSON字符串
 * @method [JSON] - json
 * @example
 *      {{json 'invite.title'}}
 */
Handlebars.registerHelper('json', function (path, options) {
  return Handlebars.helpers["getValue"].call(this, path);
});
/**
 * 打版本号
 * @method [版本] - version
 * @example
 *      http://www.jihui88.com?v={{version}}
 */
Handlebars.registerHelper('version', function (options) {
  return new Date().getTime();
});

/**
 * 移除script标签
 * @method [标签] - stripScripts
 * @author wyj 15.5.12
 * @example
 *    {{stripScripts '<scripts></scripts>'}}
 */
Handlebars.registerHelper('stripScripts', function (str, options) {
  return Est.stripScripts(str);
});

/**
 * @description 应用程序管理器 - 中介者模式， 用于注册视图、模块、路由、模板等。
 * 注册视图、注册模块等以抽象工厂模式实现
 * @class Application - 用户后台
 * @author yongjin<zjut_wyj@163.com> 2014/12/28
 */
var Application = function (options) {
  this.options = options;
  Est.extend(this, options);
  this.initialize.apply(this, arguments);
};
Est.extend(Application.prototype, {
  initialize: function () {
    this.data = { itemActiveList: [], sessionId: ''};
    this.instance = {};
    this.modules = {};
    this.routes = {};
    this.templates = {};
    this.panels = {};
    this.dialog = [];
    this.dialogs = {}; // 带身份标识的dialog
    this.status = {};
    this.cookies = [];
    this.models = [];
    this.compileTemps = {};
    this.filters = { navigator: [], form: [] };
    this.cache = {};
  },
  /**
   * 返回当前应用底层使用的是backbone版本
   *
   * @method [版本] - getAppType ( 获取App版本 )
   * @return {string}
   * @author wyj 15.5.20
   */
  getAppType: function () {
    return 'backbone';
  },
  /**
   * 视图添加， 当重新添加时会调用destroy方法
   *
   * @method [视图] - addRegion ( 添加视图[推荐使用] )
   * @param name
   * @param instance
   * @return {*}
   * @example
   *      app.addRegion('productList', ProductList, {
   *        viewId: 'productList',     // 可省略
   *        el: '',
   *        args: args
   *      });
   */
  addRegion: function (name, instance, options) {
    var panel = Est.nextUid('region');

    if (!options.__panelId) {
      options.__panelId = options.el;
    }
    this.addPanel(name, {
      el: options.__panelId,
      template: '<div class="' + panel + '"></div>'
    }, options);
    if (!options.viewId) {
      options.viewId = name;
    }
    if (options.viewId in this['instance']) {
      this.removeView(options.viewId);
    }

    return this.addView(name, new instance(options));
  },
  /**
   * 添加面板
   *
   * @method [面板] - addPanel ( 添加面板 )
   * @param name
   * @param options
   * @return {Application}
   * @example
   *        app.addPanel('product', new Panel());
   *        app.addPanel('product', {
   *          el: '#product-panel',
   *          template: '<div clas="product-panel-inner"></div>'
   *        }).addView('aliPay', new AlipayView({
   *          el: '.product-panel-inner',
   *          viewId: 'alipayView'
   *        }));
   */
  addPanel: function (name, panel, options) {
    var isObject = Est.typeOf(panel.cid) === 'string' ? false : true;
    if (isObject) {
      this.removePanel(name, panel);
      panel.$template = $(panel.template);
      if (options) {
        options.el = panel.$template;
      }
      panel.$template.addClass('__panel_' + name);
      $(panel.el).append(panel.$template);
    }
    this.panels[name] = panel;
    return isObject ? this : panel;
  },
  /**
   * 移除面板
   *
   * @method [面板] - removePanel ( 移除面板 )
   * @param name
   * @author wyj 14.12.29
   */
  removePanel: function (name, panel) {
    try {
      if ($.fn.off) {
        $('.__panel_' + name, $(panel['el'])).off().remove();
      } else {
        seajs.use(['jquery'], function ($) {
          window.$ = $;
          $('.__panel_' + name, $(panel['el'])).off().remove();
        });
      }
      delete this.panels[name];
    } catch (e) {
    }
  },
  /**
   * 视图添加
   *
   * @method [视图] - addView ( 添加视图 )
   * @param name
   * @param instance
   * @return {*}
   * @example
   *      app.addView('productList', new ProductList());
   */
  addView: function (name, instance) {
    if (name in this['instance']) this.removeView(name);
    this['instance'][name] = instance;
    this.setCurrentView(name);
    return this['instance'][name];
  },
  /**
   * 视图移除， 移除视图绑定的事件及所有itemView的绑定事件,
   * 并移除所有在此视图创建的对话框
   *
   * @method [视图] - removeView ( 移除视图 )
   * @param name
   * @return {Application}
   * @example
   *        app.removeView('productList');
   */
  removeView: function (name) {
    try {
      if (this.getView(name)) {
        this.getView(name).destroy && this.getView(name).destroy();
        this.getView(name)._empty();
        this.getView(name).stopListening();
        this.getView(name).$el.off().remove();
      }
      delete this['instance'][name];
    } catch (e) {
    }
    return this;
  },


  panel: function (name, panel) {
    return this.addPanel(name, panel);
  },
  /**
   * 显示视图
   *
   * @method [面板] - show ( 显示视图 )
   * @param view
   * @author wyj 14.12.29
   */
  show: function (view) {
    this.addView(this.currentView, view);
  },

  /**
   * 获取面板
   *
   * @method [面板] - getPanel ( 获取面板 )
   * @param name
   * @return {*}
   * @author wyj 14.12.28
   * @example
   *      app.getPanelf('panel');
   */
  getPanel: function (name) {
    return this.panels[name];
  },

  add: function (name, instance) {
    return this.addView(name, instance);
  },

  /**
   * 设置当前视图
   * @method [视图] - setCurrentView ( 设置当前视图 )
   * @param name
   * @example
   *      app.setCurrentView('list', new List());
   */
  setCurrentView: function (name) {
    this.currentView = name;
  },
  /**
   * 获取当前视图
   * @method [视图] - getCurrentView ( 获取当前视图 )
   * @return {*|Application.currentView}
   * @author wyj 15.1.9
   * @example
   *        app.getCurrentView('list');
   */
  getCurrentView: function () {
    return this.currentView;
  },
  /**
   * 获取视图
   *
   * @method [视图] - getView ( 获取视图 )
   * @param name
   * @return {*}
   * @author wyj 14.12.28
   * @example
   *        app.getView('productList');
   */
  getView: function (name) {
    return this['instance'][name];
  },
  /**
   * 添加对话框
   *
   * @method [对话框] - addDailog ( 添加对话框 )
   * @param dialog
   * @return {*}
   * @example
   *      app.addDialog('productDialog', dialog);
   */
  addDialog: function (dialog, id) {
    this.dialog.push(dialog);
    if (id) {
      app.addData('_curDialog', id);
      this.dialogs[id] = dialog;
    }
    return dialog;
  },
  /**
   * 获取所有对话框
   * @method [对话框] - getDialogs ( 获取所有对话框 )
   * @return {*}
   * @author wyj 15.1.23
   */
  getDialogs: function () {
    return this['dialog'];
  },
  /**
   * 获取指定对话框
   * @method [对话框] - getDialog ( 获取指定对话框 )
   * @author wyj 15.03.20
   *
   */
  getDialog: function (id) {
    if (Est.isEmpty(id)) return this.dialogs;
    return this.dialogs[id];
  },
  /**
   * 获取最后打开的dialog对话框
   * @method [对话框] - getCurrentDialog ( 获取当前对话框 )
   * @return {*}
   * @author wyj 15.10.25
   */
  getCurrentDialog: function () {
    if (app.getData('_curDialog')) {
      return this.dialogs[app.getData('_curDialog')];
    }
    return null;
  },
  /**
   * 添加模型类
   * @method [模型] - addModel ( 添加模型类 )
   * @author wyj 15.1.23
   */
  addModel: function (model) {
    this.models.push(model);
    return model;
  },
  /**
   * 获取所有模型类
   * @method [模型] - getModels ( 获取所有模型类 )
   * @author wyj 15.1.23
   */
  getModels: function () {
    return this['models'];
  },
  /**
   * 清空所有对话框, 当切换页面时移除所有对话框
   *
   * @method [对话框] - emptyDialog ( 清空所有对话框 )
   * @author wyj 14.12.28
   * @example
   *      app.emptyDialog();
   */
  emptyDialog: function () {
    Est.each(this.dialog, function (item) {
      if (item && item.close) {
        item.close().remove();
      }
    });
  },
  /**
   * 添加数据
   *
   * @method [数据] - addData ( 添加数据 )
   * @param name
   * @param data
   * @author wyj 14.12.28
   * @example
   *      app.addData('productList', productList);
   */
  addData: function (name, data) {
    if (name in this['data']) {
      debug('reset data ' + name);
    }
    this['data'][name] = data;
  },
  /**
   * 获取数据
   *
   * @method [数据] - getData ( 获取数据 )
   * @param name
   * @return {*}
   * @author wyj 14.12.28
   * @example
   *        app.getData('productList');
   */
  getData: function (name) {
    return this['data'][name];
  },
  /**
   * 添加模块 分拆seajs配置文件，
   * 实现每个模板都有自己的模块配置文件
   *
   * @method [模块] - addModule ( 添加模块 )
   * @param name
   * @param val
   * @author wyj 14.12.28
   * @example
   *        app.addModule('ProductList', '/modules/product/controllers/ProductList.js');
   */
  addModule: function (name, val) {
    if (name in this['modules']) {
      debug('Error10 module=' + name);
    }
    this['modules'][name] = val;
  },
  /**
   * 获取所有模块
   *
   * @method [模块] - getModules ( 获取所有模块 )
   * @return {*}
   * @author wyj 14.12.28
   * @example
   *
   */
  getModules: function () {
    return this['modules'];
  },
  /**
   * 添加路由
   *
   * @method [路由] - addRoute ( 添加路由 )
   * @param name
   * @param fn
   * @author wyj 14.12.28
   * @example
   *      app.addRoute('product', function(){
   *          seajs.use(['ProductList'], function(ProductList){
   *          });
   *      });
   */
  addRoute: function (name, fn) {
    if (name in this['routes']) {
      debug('Error13 ' + name);
    }
    this['routes'][name] = fn;
  },
  /**
   * 获取所有路由
   *
   * @method [路由] - getRoutes ( 获取所有路由 )
   * @return {*}
   * @author wyj 14.12.28
   *
   */
  getRoutes: function () {
    return this['routes'];
  },
  /**
   * 添加模板, 目前无法解决seajs的实时获取问题
   *
   * @method [模板] - addTemplate ( 添加模板 )
   * @param name
   * @param fn
   * @author wyj 14.12.28
   * @example
   *        app.addTemplate('template/photo_item', function (require, exports, module) {
              module.exports = require('modules/album/views/photo_item.html');
            });
   */
  addTemplate: function (name, fn) {
    if (name in this['templates']) {
      debug('Error11 template name:' + name);
    }
    this['templates'][name] = fn;
  },
  addTpl: function (name, fn) {
    try {
      var _hash = Est.hash(name);
      if (name in this['templates']) {
        debug('exits template' + name);
      }
      if (localStorage) {
        if (!localStorage['___JHW_APP__' + _hash]) {
          localStorage['___JHW_APP__' + _hash] = value;
        } else {
        }
        fn = Est.inject(function () {
        }, function (require, exports, module) {
          module.exports = localStorage['___JHW_APP__' + _hash];
        });
      }
      this['templates'][name] = fn;
    } catch (e) {

    }
  },
  /**
   * 添加session会话   登录成功后会添加__USER__ 用户信息会话， 获取：App.getSession('__USER__');
   * 当需要区分用户唯一性时， 在设置前先设置sessionId   app.addData('sessionId', 'Enterprise_0000000000000000032');
   *
   * @method [会话] - addSession ( 添加session会话 )
   * @param name
   * @param value
   * @return {*}
   * @author wyj 15.4.22
   * @example
   *      App.addSession('__USER__', {username: 'ggggfj'});
   */
  addSession: function (name, value, isSession) {
    try {
      var sessionId = Est.typeOf(isSession) === 'undefined' ? '' : isSession ? this.data.sessionId : '';
      localStorage['___JHW_BACKBONE__' + Est.hash(sessionId + name)] = value;
    } catch (e) {
      debug('Error9 ' + e);
    }
    return value;
  },
  /**
   * 读取session会话
   *
   * @method [会话] - getSession ( 读取session会话 )
   * @param name
   * @return {Object}
   * @example
   *      App.getSession('__USER__'); => {username: 'ggggfj'}
   */
  getSession: function (name, isSession) {
    var sessionId = Est.typeOf(isSession) === 'undefined' ? '' : isSession ? this.data.sessionId : '';
    return localStorage['___JHW_BACKBONE__' + Est.hash(sessionId + name)];
  },
  /**
   * 获取所有模板
   *
   * @method [模板] - getTemplates ( 获取所有模板 )
   * @return {*}
   * @author wyj 14.12.28
   * @example
   *        app.getTemplates();
   */
  getTemplates: function () {
    return this['templates'];
  },
  /**
   * 添加编译模板
   * @method [模板] - addCompileTemp ( 添加编译模板 )
   * @param name
   * @param compile
   */
  addCompileTemp: function (name, compile) {
    this['compileTemps'][name] = compile;
  },
  /**
   * 获取编译模板
   * @method [模板] - getCompileTemp ( 获取编译模板 )
   * @param name
   * @return {*}
   */
  getCompileTemp: function (name) {
    return this['compileTemps'][name];
  },
  /**
   * 添加状态数据
   *
   * @method [状态] - SSaatus ( 添加状态数据 )
   * @param name
   * @param value
   * @author wyj 15.1.7
   */
  addStatus: function (name, value) {
    this['status'][name] = value;
  },
  /**
   * 获取状态数据
   *
   * @method [状态] - getStatus ( 获取状态数据 )
   * @param name
   * @param value
   * @author wyj 15.1.7
   */
  getStatus: function (name) {
    return this['status'][name];
  },
  /**
   * 添加参数配置对象
   *
   * @method [配置] - addOption ( 添加配置对象 )
   * @author wyj 15.9.19
   */
  addOption: function (name, value) {
    this['options'][name] = value;
  },
  /**
   * 获取参数配置对象
   *
   * @method [配置] - getOption ( 获取配置对象 )
   * @param name
   * @return {*}
   * @author wyj 15.9.19
   */
  getOption: function (name) {
    return Est.cloneDeep(this['options'][name]);
  },
  /**
   * 获取所有状态数据
   *
   * @method [状态] - getAllStatus ( 获取所有状态数据 )
   * @return {{}|*|Application.status}
   * @author wyj 15.1.9
   */
  getAllStatus: function () {
    return this.status;
  },
  /**
   * 添加过滤器
   *
   * @method [过滤] - addFilter
   * @param {string} name
   * @param {fn} fn
   * @author wyj 15.6.22
   * @example
   *
   */
  addFilter: function (name, fn) {
    this.filters[name].push(fn);
  },
  /**
   * 获取过滤器
   *
   * @method [过滤] - getFilters
   * @param name
   * @return {*}
   * @author wyj 15.6.22
   * @example
   *      App.getFilters('navigator');
   */
  getFilters: function (name) {
    return this.filters[name];
  },
  /**
   * 添加cookie
   * @method [cookie] - addCookie ( 添加cookie )
   * @author wyj 15.1.13
   */
  addCookie: function (name) {
    if (Est.findIndex(this.cookies, name) !== -1) {
      return;
    }
    this.cookies.push(name);
  },
  /**
   * 获取所有保存的cookie
   * @method [cookie] - getCookies ( 获取所有保存的cookie )
   * @return {Array}
   * @author wyj 15.1.13
   */
  getCookies: function () {
    return this.cookies;
  },
  /**
   * 获取参数hash值
   *
   * @method [cache] - getParamsHash ( 获取参数hash值 )
   * @param options
   * @author wyj 15.10.25
   */
  getParamsHash: function (options) {
    var params = '',
      cacheId = '';

    for (var key in options) {
      params += options[key];
    }
    cacheId = '_hash' + Est.hash(params);

    return cacheId;
  },
  /**
   * 缓存数据
   * @method [cache] - addCache ( 数据缓存 )
   * @param options
   * @author wyj 15.10.25
   */
  addCache: function (options, result) {
    try {
      var cacheId = '';

      if (!result.success) return;
      cacheId = this.getParamsHash(options);

      if (options.session && result) {
        app.addSession(cacheId, JSON.stringify(result));
      } else {
        this.cache[cacheId] = result;
      }
    } catch (e) {
      debug('Error12' + e);
    }
  },
  /**
   * 获取缓存数据
   *
   * @method [cache] - getCache ( 获取缓存数据 )
   * @param options
   * @author wyj 15.10.25
   * @return {*}
   */
  getCache: function (options) {
    var result = null;
    var cacheId = this.getParamsHash(options);
    // localStorage缓存
    if (options.session && !app.getData('versionUpdated')) {
      result = app.getSession(cacheId);
      if (result) {
        return JSON.parse(result);
      }
    } else {
      return this.cache[cacheId];
    }
  },
  /**
   * 清除缓存数据
   *
   * @method [cache] - removeCache ( 清除缓存数据 )
   * @param options
   * @author wyj 15.10.25
   * @example
   *      app.removeCache();
   *      app.removeCache(options);
   */
  removeCache: function (options) {
    var cacheId = null;
    if (options) {
      cacheId = this.getParamsHash(options);
      delete this.cache[cacheId];
      return;
    }
    this.cache = {};
  }
});
/**
 * 解决ie6无console问题
 * @method console
 * @private
 * */
if (!window.console) {
  console = (function (debug) {
    var instance = null;

    function Constructor() {
      if (debug) {
        this.div = document.createElement("console");
        this.div.id = "console";
        this.div.style.cssText = "filter:alpha(opacity=80);padding:10px;line-height:14px;position:absolute;right:0px;top:0px;width:30%;border:1px solid #ccc;background:#eee;";
        document.body.appendChild(this.div);
      }
    }

    Constructor.prototype = {
      log: function (str) {
        if (debug) {
          var p = document.createElement("p");
          p.innerHTML = str;
          this.div.appendChild(p);
        }
      }
    }
    function getInstance() {
      if (instance == null) {
        instance = new Constructor();
      }
      return instance;
    }

    return getInstance();
  })(false)
}
(function () {

  /**
   * Sea.js mini 2.3.0 | seajs.org/LICENSE.md
   * @method seajs
   * @private
   */
  var define;
  var require;
  (function (global, undefined) {

    /**
     * util-lang.js - The minimal language enhancement
     * @method isType
     * @private
     */

    function isType(type) {
      return function (obj) {
        return {}.toString.call(obj) == "[object " + type + "]"
      }
    }

    var isFunction = isType("Function")
    /**
     * module.js - The core of module loader
     * @method Module
     * @private
     */

    var cachedMods = {}

    function Module() {
    }

    // Execute a module
    Module.prototype.exec = function () {
      var mod = this
      // When module is executed, DO NOT execute it again. When module
      // is being executed, just return `module.exports` too, for avoiding
      // circularly calling
      if (this.execed) {
        return mod.exports
      }
      this.execed = true;

      function require(id) {
        return Module.get(id).exec()
      }

      // Exec factory
      var factory = mod.factory
      var exports = isFunction(factory) ? factory(require, mod.exports = {}, mod) : factory
      if (exports === undefined) {
        exports = mod.exports
      }
      // Reduce memory leak
      delete mod.factory
      mod.exports = exports
      return exports
    }
    // Define a module
    define = function (id, deps, factory) {
      var meta = {
        id: id,
        deps: deps,
        factory: factory
      }
      Module.save(meta)
    }
    // Save meta data to cachedMods
    Module.save = function (meta) {
      var mod = Module.get(meta.id)
      mod.id = meta.id
      mod.dependencies = meta.deps
      mod.factory = meta.factory
    }
    // Get an existed module or create a new one
    Module.get = function (id) {
      return cachedMods[id] || (cachedMods[id] = new Module())
    }
    // Public API
    require = function (id) {
      var mod = Module.get(id)
      if (!mod.execed) {
        mod.exec()
      }
      return mod.exports
    }
  })(this);
  define("bui/config", [], function (require, exports, module) {
    //from seajs
    var BUI = window.BUI = window.BUI || {};
    BUI.use = seajs.use;
    BUI.config = seajs.config;
  });
  require("bui/config");
})();

/**
 * @description BaseUtils
 * @class BaseUtils - 底层工具类
 * @author yongjin<zjut_wyj@163.com> 2015/1/27
 */
var BaseUtils = {
  /**
   * 初始化选择框
   *
   * @method [表单] - initSelect ( 初始化选择框 )
   * @param options
   * @author wyj 15.1.27
   * @example
   *      Utils.initSelect({
            render: '#select',  // 渲染区域
            target: '#model-categoryId', // 目标input元素
            text: 'name', // 名称字段
            value: 'categoryId', // 值字段
            items: app.getData('product_category_list'), // 列表
            search: true, // 是否显示搜索框
            change: function (ev) { // select事件
                console.log(ev);
            }
        });
   */
  initSelect: function (options) {
    var tagId = options.viewId || Est.nextUid('select');
    options = Est.extend({
      el: '.' + tagId,
      viewId: tagId,
      data: {
        width: options.width || 150
      } }, options);
    seajs.use(['Select'], function (Select) {
      options.el = '.' + tagId;
      app.addPanel(tagId, {
        el: options.render,
        template: '<div class="select-inner ' + tagId + '"></div>'
      }).addView(tagId, new Select(options));
    });

    // bui select
    /*var $q = Est.promise;
     return new $q(function (resove, reject) {
     var container = {};
     var target = options.target || '#category';
     var render = options.render || '#s1';
     var itemId = options.itemId || 'value';
     var width = options.width || '150';
     var items = options.items || [];
     BUI.use('bui/select', function (Select) {
     container[render] = new Select.Select({
     render: render,
     valueField: target,
     width: width,
     items: items
     });
     container[render].render();
     container[render].on('change', function (ev) {
     $(target).val(Est.trim(ev.item[itemId]));
     if (typeof options.change !== 'undefined')
     options.change.call(this, ev.item[itemId], ev);
     resove(ev.item[itemId]);
     });
     });
     });*/
  },
  /**
   * 初始化下拉框
   *
   * @method [表单] - initDropDown ( 初始化下拉框 )
   * @param options
   * @author wyj 15.2.17
   * @example
   *      Utils.initDropDown({
            target: '#drop-down-content', // 显示下拉框的触发按钮
            height: 250, // 默认为auto
            width: 150, // 默认为auto
            //overflowX: 'auto', // 默认为hidden
            content: $('#template-drop-down').html(), // 显示内容
            callback: function (options) { // 下拉框渲染完成后的回调函数
                setTimeout(function(){
                    app.getView(options.dropDownId).reflesh(function () { // 刷新
                        this._options.items = ['111']; // 重新设置options参数里的items
                    });
                    app.getView(options.dropDownId).hide(); // dropDownId 为当前下拉框的viewId
                }, 1000);
            }
        });
   Utils.initDropDown({
            target: '#drop-down-module-id',
            moduleId: 'AttributesAdd',
            items: ['111', '222', '333'],
            callback: function(options){
                setTimeout(function(){
                    app.getView(options.dropDownId).hide();
                }, 1000);
            }
        });
   */
  initDropDown: function (options) {
    seajs.use(['DropDown'], function (DropDown) {
      var viewId = Est.nextUid('dropDown');
      var isDropDown = false;
      $(options.target).click(function (e) {
        if (!isDropDown) {
          app.addPanel(viewId, { el: 'body',
            template: '<div class="drop-down-container-' + viewId + '"></div>'
          }).addView(viewId, new DropDown(Est.extend(options, {
            el: '.drop-down-container-' + viewId,
            viewId: viewId,
            data: {
              width: options.width || 'auto',
              height: options.height || 'auto',
              overflowX: options.overflowX || 'hidden'
            }
          })));
          app.getView(viewId).show(e);
          isDropDown = true;
        } else {
          app.getView(viewId).show(e);
        }
        app.addDialog(app.getView(viewId));
        return false;
      });
    });
  },
  /**
   * 初始化tab选项卡
   *
   * @method [选项卡] - initTab ( 初始化tab选项卡 )
   * @param options
   * @author wyj 14.12.24
   * @example
   *        Utils.initTab({
       *          render: '#tab',
       *          elCls: 'nav-tabs',
       *          panelContainer: '#panel',
       *          autoRender: true,
       *          children: [
       *            {title: '常规', value: '1', selected: true},
       *            {title: '产品描述', value: '2'},
       *            {title: '产品属性', value: '3'},
       *            {title: '商城属性', value: '4'},
       *            {title: '产品标签', value: '5'},
       *            {title: '搜索引擎优化', value: '6'}
       *          ],
       *          change: function(ev){ // 点击标签页面回调事件
       *              console.log(ev);
       *          }
       *        });
   */
  initTab: function (options) {
    BUI.use(['bui/tab', 'bui/mask'], function (Tab) {
      var tab = new Tab.TabPanel(options);
      tab.on('selectedchange', function (ev) {
        options.change && options.change.call(this, ev);
      });
      tab.render();
      /*Est.on(options.viewId || 'tab', function(){

       });*/
      app.addView(options.viewId || 'tab', tab);
      if (options.afterRender) {
        options.afterRender.call(this, tab);
      }
    });
  },
  /**
   * 初始化button tab选项卡
   *
   * @method [选项卡] - initButtonTab ( 初始化按钮形式的tab选项卡 )
   * @param options
   * @author wyj 14.12.24
   * @example
   *        Utils.initButtonTab({
       *          render: '#tab',
       *          elCls: 'button-tabs',
       *          autoRender: true,
       *          children: [
       *            {title: '常规', value: '1', selected: true},
       *            {title: '产品描述', value: '2'},
       *            {title: '产品属性', value: '3'},
       *            {title: '商城属性', value: '4'},
       *            {title: '产品标签', value: '5'},
       *            {title: '搜索引擎优化', value: '6'}
       *          ],
       *          change: function(ev){ // 点击标签页面回调事件
       *              console.log(ev);
       *          }
       *        });
   */
  initButtonTab: function (options) {
    options = Est.extend({
      elCls: 'button-tabs',
      autoRender: true
    }, options);
    BUI.use(['bui/tab'], function (Tab) {
      var tab = new Tab.Tab(options);
      tab.on('selectedchange', function (ev) {
        options.change && options.change.call(this, ev);
      });
      tab.setSelected(tab.getItemAt(0));
      app.addView(options.viewId || 'buttontab', tab);
      if (options.afterRender) {
        options.afterRender.call(this, tab);
      }
    });
  },
  /**
   * 初始化日期选择器
   *
   * @method [表单] - initDate ( 初始化时间组件 )
   * @param options [render: 选择符][showTime: true/false 是否显示时间]
   * @author wyj 14.12.17
   * @example
   *      Utils.initDate({
       *         render: '.calendar',
       *         showTime: false,
       *         target: '#model-addTime', // 绑定隐藏域model
       *         change: function(ev){
       *          ...
       *         }
       *       });
   */
  initDate: function (options) {
    BUI.use('bui/calendar', function (Calendar) {
      var calendar = new Calendar.DatePicker({
        trigger: options.render || '.calendar',
        showTime: options.showTime || false,
        autoRender: true
      });
      calendar.on('selectedchange', function (ev) {
        options.change && options.change.call(this, ev);
        if (options.target) {
          var $target = $(options.target);
          $target.val(ev.value.getTime()).trigger('change');
          $target.css('border', '3px solid blue');
        }
      });
    });
  },
  /**
   * 初始化多标签
   *
   * @method [表单] - initCombox ( 初始化多标签组件 )
   * @param options
   * @return {Est.promise}
   * @author wyj 14.12.17
   * @example
   *      Utils.initCombox({
       *         render: '#tag',
       *         target: '#model-tag',
       *         itemId: 'categoryId'
       *           items: [ '选项一', '选项二', '选项三', '选项四' ]
       *       });
   */
  initCombox: function (options) {
    var $q = Est.promise;
    return new $q(function (resolve, reject) {
      var container = {};
      var target = options.target || '#category';
      var render = options.render || '#s1';
      var itemId = options.itemId || 'categoryId';
      var width = options.width || '500';
      var items = options.items || [];
      BUI.use('bui/select', function (Select) {
        container[render] = new Select.Combox({
          render: render,
          showTag: true,
          valueField: target,
          elCls: 'bui-tag-follow',
          width: width,
          items: items
        });
        container[render].render();
        /*container[render].on('change', function (ev) {
         //$(target).val($(target)Est.trim(ev.item[itemId]));
         if (typeof options.change !== 'undefined')
         options.change.call(this, ev.item[itemId]);
         });*/
      });
    });
  },
  /**
   * 初始化动画
   * @method [动画] - initAnimate ( 初始化动画 )
   * @param target
   * @author wyj 15.3.30
   * @example
   *
   *    Utils.initAnimate(this);
   */
  initAnimate: function (target) {
    $('.animated', $(target)).each(function () {
      setTimeout(Est.proxy(function () {
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        var animate = 'animated ' + $(this).attr('data-animate');
        var duration = $(this).attr('data-duration');
        var delay = $(this).attr('data-delay');
        var count = $(this).attr('data-count');
        $(this).css({
          '-webkit-animation-duration': (duration || 1) + 's',
          '-webkit-animation-delay': (delay || 0) + 's'
        });
        $(this).removeClass(animate);
        $(this).addClass(animate).one(animationEnd, function () {
          //$(this).removeClass(animate);
        });
      }, this), 0);
    });
  },
  /**
   * 添加加载动画
   * @method [加载] - addLoading ( 添加加载动画 )
   * @author wyj 15.04.08
   * @example
   *      Utils.addLoading();
   */
  addLoading: function (options) {
    debug('【Utils】Utils.addLoading');
    try {
      if (window.$loading) window.$loading.remove();
      window.$loading = $('<div class="loading"></div>');
      $('body').append(window.$loading);
    } catch (e) {
      debug('【Error】' + e);
    }
    return window.$loading;
  },
  /**
   * 移除加载动画
   * @method [加载] - removeLoading ( 移除加载动画 )
   * @author wyj 15.04.08
   * @example
   *      Utils.removeLoading();
   */
  removeLoading: function () {
    debug('【Utils】Utils.removeLoading');
    if (window.$loading) window.$loading.remove();
    //else $('.loading').remove();
  },
  /**
   * 初始化级联地区
   *
   * @method [地区] - initDistrict ( 初始化级联地区 )
   * @author wyj 15.1.6
   * @example
   *        Utils.initDistrict({
                 id: 'district1' ,// 必填
                 render: '#district-container', // 目标选择符
                 target: '#model-dist',
                 path: '...',
                 url: CONST.API + '/shop/receiver/list' // 自定义请求地址
               });
   */
  initDistrict: function (options) {
    seajs.use(['District'], function (District) {
      app.addPanel(options.id, {
        el: options.render,
        template: '<div class="district-inner ' + options.id + '"></div>'
      });
      app.addView(options.id, new District({
        el: '.' + options.id,
        viewId: options.id,
        target: options.render, // target为需要渲染到的目标元素中
        input: options.target, // input 为绑定的input元素
        path: options.path,
        width: 100,
        addressUrl: options.url
      }));
    });
  },
  /**
   * 图片上传
   *
   * @method [上传] - initUpload ( 图片上传 )
   * @param options [render:　选择符][context: 上下文]
   * @author wyj 14.12.17
   * @example
   *      // 图片添加
   *      Utils.openUpload({
       *       albumId: app.getData('curAlbumId'),
       *       username: app.getData('user').username, // 必填
       *       auto: true,
       *       oniframeload: function(){
       *         this.iframeNode.contentWindow.uploadCallback = doResult;
       *       }
       *      });
   *      // 图片替换 主要用于图片空间里的图片替换操作
   *      Utils.openUpload({
       *        id: 'replaceDialog' + id,
       *        title: '图片替换',
       *        albumId: app.getData('curAlbumId'), // 必填
       *        username: app.getData('user').username, // 必填
       *        replace: true, // 必填
       *        attId: this.model.get('attId'), // 必填
       *        oniframeload: function () {
       *          this.iframeNode.contentWindow.uploadCallback = function (results) { // results返回结果
       *          ctx.model.set('uploadTime', new Date().getTime());
       *          window['replaceDialog' + id].close().remove();
       *          };
       *        }
       *      });
   *      // 选取图片
   *      Utils.openUpload({
                id: 'uploadDialog',
                type: type, // [local / source]打开的窗口类型， 如上传、资源库
                albumId: app.getData('curAlbumId'),
                username: app.getData('user') && app.getData('user').username,
                auto: true,
                oniframeload: function(){
                  this.iframeNode.contentWindow.uploadCallback = function(result){
                    ctx.addItems(result);
                  };
                },
                success: function(){
                  var result = this.iframeNode.contentWindow.app.getView('picSource').getItems();
                  ctx.addItems(result);
                }
              });
   */
  openUpload: function (options) {
    if (typeof options === 'undefined') console.error(CONST.LANG.UPLOAD_OPTION_REQUIRE);

    options = Est.extend({ title: CONST.LANG.UPLOAD_IMG, width: 650, height: 350, albumId: '', padding: 5, username: '', attId: '', auto: false, replace: false, type: 'local' }, options);
    options.url = CONST.HOST + '/upload.html?albumId=' + options.albumId + '&username=' + options.username + '&replace=' + (options.replace ? '01' : '00') + '&attId=' + options.attId + '&auto=' + options.auto + '&uploadType=' + options.type + '&max=';

    return options;
  },
  /**
   * 初始化编辑器
   *
   * @method [表单] - initEditor ( 初始化编辑器 )
   * @param options
   * @author wyj 14.12.18
   * @example
   *      Utils.initEditor({
       *        render: '.ckeditor'
       *      });
   */
  initEditor: function (options) {
    var allPlugin = {
      contact: {
        c: 'xheContact',
        t: CONST.LANG.INSERT_CONTACT,
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.INSERT_CONTACT,
              CONST.DOMAIN + '/user_v2/enterprise/updateuser/getUserBySession',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 700, 510);
        }
      },
      abbccMap: {
        c: 'xheBtnMap',
        t:CONST.LANG.SELECT_MAP,
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.SELECT_MAP,
              CONST.HOST + '/vendor/xheditor/xheditor-tools/abbcc-map/index.html',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 700, 510);
        }
      },
      abbccLayout: {
        c: 'xheBtnLayout',
        t: CONST.LANG.SEELCT_TPL,
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.SELECT_TPL,
              CONST.HOST + '/vendor/xheditor/xheditor-tools/abbcc-layout/index.html',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 660, 500);
        }
      },
      abbccQrcode: {
        c: 'xheBtnQrcode',
        t: CONST.LANG.BUILD_QRCODE,
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.BUILD_QRCODE,
              CONST.HOST + '/vendor/xheditor/xheditor-tools/abbcc-qrcode/index.html',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 800, 300);
        }
      },
      abbccImages: {
        c: 'xheIcon xheBtnImg',
        t: CONST.LANG.SELECT_IMG,
        s: 'ctrl+8',
        e: function () {
          var _this = this;
          BaseUtils.initIframeDialog(BaseUtils.openUpload({
            id: 'uploadDialog',
            type: '',
            albumId: app.getData('curAlbumId'),
            username: app.getData('user') && app.getData('user').username,
            auto: true,
            oniframeload: function () {
              this.iframeNode.contentWindow.uploadCallback = function (result) {
                _this.loadBookmark();
                _this.pasteHTML("<img src='" + CONST.PIC_URL + '/' + result[0]['serverPath'] + "'/>");
              };
            },
            success: function () {
              var result = this.iframeNode.contentWindow.app.getView('picSource').getItems();
              _this.loadBookmark();
              _this.pasteHTML("<img src='" + CONST.PIC_URL + '/' + result[0]['serverPath'] + "'/>");
            }
          }));

          /*seajs.use(['Utils'], function (Utils) {
           Utils.openUpload();
           });*/
          /*  _this.showIframeModal('选择图片',
           CONST.DOMAIN + '/common/picUpload/upload.jsp?pageType=xheditor',
           function (v) {
           _this.loadBookmark();
           _this.pasteHTML(v);
           }, 800, 550);*/
        }
      },
      abbccFlash: {
        c: 'xheIcon xheBtnFlash',
        t: '选择flash',
        s: 'ctrl+7',
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.SELECT_FLASH,
            '/user/album/albumshowFlashPage?pageType=xheditor',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 600, 300);
        }
      },
      abbccQQ: {
        c: 'xheBtnQQ',
        t: CONST.LANG.SELECT_QQ,
        s: 'ctrl+9',
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.SELECT_QQ,
              CONST.DOMAIN + '/user_v2/qq/index.jsp',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 600, 300);
        }
      }

    };
    seajs.use(['xheditor'], function (xheditor) {
      function startEditor(obj) {
        try {
          if (!$(obj).xheditor) window.location.reload();
          var editor = $(obj).xheditor(
            {
              plugins: allPlugin,
              tools: 'Preview,Fullscreen,Source,|,contact,abbccQQ,abbccMap,abbccLayout,abbccQrcode,|,Table,abbccImages,abbccFlash,Media,|,FontColor,BackColor,|,Align,Underline,Italic,Bold,|,FontSize,Fontface,|,Link,Unlink',
              skin: 'vista',
              layerShadow: 2,
              html5Upload: false,
              upBtnText: CONST.LANG.VIEW,
              upLinkExt: 'jpg,png,bmp',
              upImgUrl: '/fileUpload/uploadByJson',
              upFlashUrl: '/fileUpload/uploadByJson',
              upMediaUrl: '/fileUpload/uploadByJson',
              upFlashExt: "swf",
              upMediaExt: 'wmv,avi,wma,mp3,mid',
              linkTag: true,
              height: 400,
              internalScript: true,
              inlineScript: true
            });
        } catch (e) {
          debug(e);
        }
        if (options.viewId) {
          app.addView(options.viewId, editor);
        }
      }

      $(function () {
        $(options.render || '.ckeditor').each(function () {
          startEditor($(this));
        });
      });
    });
  },
  /**
   * 初始化内联编辑器
   * @method [编辑器] - initInlineEditor
   * @author wyj 15.6.11
   * @example
   *      Utils.initInlineEditor(target, callback);
   */
  initInlineEditor: function (target, callback) {
    seajs.use(['ckeditor'], function (ckeditor) {
      try {
        window.inline_ckeditor = CKEDITOR.inline(target.get(0));
        window.inline_ckeditor.on('blur', function (e) {
          var okToDestroy = false;
          if (e.editor.checkDirty()) {
            okToDestroy = true;
          } else {
            okToDestroy = true;
          }
          if (okToDestroy)
            e.editor.destroy();
          callback && callback.call(this);
        });
      } catch (e) {
      }
    });
  },
  /**
   * 初始化复制按钮
   *
   * @method [复制] - initCopy ( 初始化复制按钮 )
   * @param selecter
   * @param options
   * @author wyj 14.12.18
   * @example
   *        html: <span id="" class="design-leaflet-url-copy" clipboard="" data-clipboard-text="{{staticUrl}}">复制</span>
   *        javascript:
   *            Utils.initCopy('#photo-copy-dialog', {
       *           success: function(){
       *             // 成功复制后回调
       *           }
       *         });
   *
   */
  initCopy: function (selecter, options, callback) {
    seajs.use(['ZeroClipboard'], function (ZeroClipboard) {
      var client = new ZeroClipboard($(selecter).get(0), {
        moviePath: CONST.HOST + "/swf/ZeroClipboard.swf"
      });
      client.on('ready', function (event) {
        // console.log( 'movie is loaded' );
        client.on('copy', function (event) {
          event.clipboardData.setData('text/plain', options.callback ||
            $(event.target).attr('data-clipboard-text'));
        });
        client.on('aftercopy', function (event) {
          callback.call(this, event.data['text/plain']);
          console.log('Copied text to clipboard: ' + event.data['text/plain']);
          options.success && options.success.call(this, event.data['text/plain']);
        });
      });
      client.on('error', function (event) {
        // console.log( 'ZeroClipboard error of type "' + event.name + '": ' + event.message );
        ZeroClipboard.destroy();
        options.failed && options.failed.call(this, event.message);
      });
    });
  },
  /**
   * 初始化拖动
   *
   * @method [拖放] - initDrag ( 初始化拖动 )
   * @param options
   * @author wyj 15.03.24
   * @example
   *     Utils.initDrag({
        render: '.drag',
        resize: true, // 是否启用缩放
        dragend: function (ev, dd) { // 拖放结束后执行
          $(this).css({
            left: ((dd.offsetX * 100) / 320) + '%',
            top: ((dd.offsetY * 100) / 480) + '%',
            width: ($(this).width() * 100) / 320 + '%',
            height: ($(this).height() * 100) / 480 + '%'
          });
        },
        resizeend: function(ev, dd){ // 缩放结束后执行
          $(this).css({
            width: ($(this).width() * 100) / 320 + '%',
            height: ($(this).height() * 100) / 480 + '%'
          });
        },
        callback: function (ev, dd) {
        }
      });
   */
  initDrag: function (options) {
    this.doDrag = function (options) {
      var _resize = false;
      $(options.render).click(function () {
        var $dragSelected = $(options.render + '.drag-selected');
        $dragSelected.removeClass('drag-selected');
        $('.drag-handle', $dragSelected).off().remove();
        $(this).addClass("drag-selected");
        options.click && options.click.call(this);
      })
        .drag("init", function () {
          if (!$(this).hasClass('lock')) {
            try {
              for (var name in CKEDITOR.instances) {
                CKEDITOR.instances[name].destroy()
              }
            } catch (e) {
            }
          }
          if ($(this).hasClass('lock')) return false;
          if ($(this).is('.drag-selected'))
            return $('.drag-selected');
        }).drag('start', function (ev, dd) {
          if (!$(this).hasClass('drag-selected')) {
            $(this).append('<div class="drag-handle NE"></div> <div class="drag-handle NN"></div> <div class="drag-handle NW"></div> <div class="drag-handle WW">' +
              '</div> <div class="drag-handle EE"></div> <div class="drag-handle SW"></div> <div class="drag-handle SS"></div> <div class="drag-handle SE"></div>');
            $(this).addClass("drag-selected");
          }
          dd.attr = $(ev.target).prop("className");
          dd.width = $(this).width();
          dd.height = $(this).height();
          options.dragstart && options.dragstart.apply(this, [ev, dd]);
        }).drag(function (ev, dd) {
          var props = {};
          _resize = false;
          if ($(this).hasClass('lock')) return false;
          if (options.resize) {
            debug('resize');
            if (dd.attr.indexOf("E") > -1) {
              _resize = true;
              props.width = Math.max(1, dd.width + dd.deltaX);
            }
            if (dd.attr.indexOf("S") > -1) {
              _resize = true;
              props.height = Math.max(1, dd.height + dd.deltaY);
            }
            if (dd.attr.indexOf("W") > -1) {
              _resize = true;
              props.width = Math.max(1, dd.width - dd.deltaX);
              props.left = dd.originalX + dd.width - props.width;
            }
            if (dd.attr.indexOf("N") > -1) {
              _resize = true;
              props.height = Math.max(1, dd.height - dd.deltaY);
              props.top = dd.originalY + dd.height - props.height;
            }
          }
          if (!_resize) {
            props.top = dd.offsetY;
            props.left = dd.offsetX;
          }
          $(this).css(props);
          if (!_resize) {
            options.callback && options.callback.apply(this, [ev, dd]);
          }
        }, { relative: true}).drag('dragend', function (ev, dd) {
          if ($(this).hasClass('lock')) return false;
          if (!_resize) {
            debug('resize end');
            options.dragend && options.dragend.apply(this, [ev, dd]);
          } else {
            options.resizeend && options.resizeend.apply(this, [ev, dd]);
          }
        });
    }
    if (!$.fn.drag) {
      seajs.use(['drag'], Est.proxy(function (drag) {
        this.doDrag(options);
      }, this));
    } else {
      this.doDrag(options);
    }
  },
  /**
   * 初始化缩放
   *
   * @method [缩放] - initResize ( 初始化缩放 )
   * @param options
   * @author wyj 15.03.24
   * @example
   *      Utils.initResize({
     *        render: 'img',
     *        callback: function(ev, dd){}
     *      });
   */
  initResize: function (options) {
    seajs.use(['drag'], function (drag) {
      $(options.render).drag("start", function (ev, dd) {
        dd.width = $(this).width();
        dd.height = $(this).height();
        options.dragstart && options.dragstart.apply(this, [ev, dd]);
      }).drag(function (ev, dd) {
        $(this).css({
          width: Math.max(20, dd.width + dd.deltaX),
          height: Math.max(20, dd.height + dd.deltaY)
        });
        options.callback && options.callback.apply(this, [ev, dd]);
      }, { relative: true, handle: '.drag-handle'}).drag('dragend', function (ev, dd) {
        options.dragend && options.dragend.apply(this, [ev, dd]);
      });
    });
  },
  /**
   * 对话框
   *
   * @method [对话框] - dialog
   * @param options [title: ][width: ][height: ][target: ][success: 确定按钮回调]
   * @author wyj 14.12.18
   * @example
   *      Utils.dialog({
       *         id: 'copyDialog',
       *         title: '复制图片',
       *         target: '.btn-email-bind',
       *         width: 800,
       *         quickClose: true, // 点击空白处关闭对话框
       *         hideCloseBtn: false, // 是否隐藏关闭按钮
       *         content: this.copyDetail({
       *           filename: this.model.get('filename'),
       *           serverPath: this.model.get('serverPath')
       *         }),
       *         cover: true, // 是否显示遮罩
       *         onshow: function(){// 对话框显示时回调
       *         },
       *         load: function(){ // iframe载入完成后回调
       *           ...base.js
       *         },
       *         success: function(){// 按确定按钮时回调
       *           this.close();
       *         }
       *       });
   */
  initDialog: function (options) {
    var button = options.button || [];
    seajs.use(['dialog-plus'], function (dialog) {
      if (options.success) {
        button.push({ value: CONST.LANG.CONFIRM, autofocus: true,
          callback: function () {
            options.success.apply(this, arguments);
          }
        });
      }
      if (!options.hideCloseBtn) {
        button.push({
          value:CONST.LANG.CLOSE,
          callback: function () {
            this.close().remove();
          } });
      }
      options = Est.extend({
        id: options.id || options.moduleId || Est.nextUid('dialog'),
        title: CONST.LANG.DIALOG_TIP,
        width: 150, content: '',
        button: button
      }, options);
      if (options.target) {
        options.target = $(options.target).get(0);
      }
      options.oniframeload = function () {
        try {
          this.iframeNode.contentWindow.topDialog = thisDialog;
          this.iframeNode.contentWindow.app = app;
          delete app.getRoutes()['index'];
        } catch (e) {
        }
        if (typeof options.load === 'function') {
          options.load.call(this, arguments);
        }
      }
      if (options.cover) {
        app.addDialog(dialog(options), options.id).showModal(options.target);
      } else {
        app.addDialog(dialog(options), options.id).show(options.target);
      }
    });
  },
  /**
   * 打开iframe对话框
   *
   * @method [对话框] - iframeDialog
   * @param options [url: ''] [title: 标题][width: ][height: ][success: 确定按钮成功回调方法][target:　绑定到对象]
   * @author wyj 14.12.15
   * @example
   *      Utils.initIframeDialog({
       *         title: '黑名单',
       *         url: CONST.DOMAIN + '/user/blacklist/view',
       *         width: 500,
       *         target: '.name',
       *         success: function(){
       *             this.title(CONST.SUBMIT_TIP);
       *             this.iframeNode.contentWindow.$("#submit").click();
       *             return false;
       *         }
       *       });
   */
  initIframeDialog: function (options) {
    var button = [];
    if (options.success) {
      button.push({
        value: CONST.LANG.CONFIRM,
        autofocus: true,
        callback: function () {
          options.success.call(this);
        }});
    }
    button.push({
      value: CONST.LANG.CLOSE,
      callback: function () {
        this.close().remove();
      }
    });
    options = Est.extend({
      id: 'dialog',
      title: CONST.LANG.WIN_TIP,
      url: '',
      width: 150,
      height: 'auto',
      target: null,
      button: button
    }, options);
    seajs.use(['dialog-plus'], function (dialog) {
      window[options.id ||
        'iframeDialog'] = dialog(options).show(options.target);
    });
  },
  /**
   * 提示信息
   *
   * @method [对话框] - initTip
   * @param msg
   * @param options
   * @author wyj 14.12.18
   * @example
   *      Utils.initTip('提示内容', {
       *        time: 1000,
       *        title: '温馨提示'
       *      });
   */
  initTip: function (msg, options) {
    options = options || {time: 3000, title: CONST.LANG.INFO_TIP};
    seajs.use(['dialog-plus'], function (dialog) {
      window.tipsDialog && window.tipsDialog.close().remove();
      window.tipsDialog = app.addDialog(dialog({
        id: 'tip-dialog' + Est.nextUid(),
        title: options.title,
        width: 200,
        content: '<div style="padding: 10px;">' + msg + '</div>'
      })).show();
      setTimeout(function () {
        window.tipsDialog.close().remove();
      }, options.time);
    });
  },
  /**
   * 确认框， 比如删除操作
   *
   * @method [对话框] - initConfirm
   * @param opts [title: 标题][content: 内容][success: 成功回调]
   * @author wyj 14.12.8
   * @example
   *      Utils.initConfirm({
       *        title: '提示',
       *        target: this.$('.name').get(0),
       *        content: '是否删除?',
       *        success: function(){
       *          ...
       *        },
       *        cancel: function(){
       *          ...
       *        }
       *      });
   */
  initConfirm: function (opts) {
    var options = {
      title: CONST.LANG.WARM_TIP,
      content: CONST.LANG.DEL_CONFIRM,
      success: function () {
      },
      target: null
    };
    Est.extend(options, opts);
    seajs.use(['dialog-plus'], function (dialog) {
      window.comfirmDialog = app.addDialog(dialog({
        id: 'dialog' + Est.nextUid(),
        title: options.title,
        content: '<div style="padding: 20px;">' + options.content + '</div>',
        width: options.width || 200,
        button: [
          {
            value: CONST.LANG.CONFIRM,
            autofocus: true,
            callback: function () {
              options.success && options.success.call(this);
            }},
          {
            value: CONST.LANG.CANCEL,
            callback: function () {
              window.comfirmDialog.close().remove();
              options.cancel && options.cancel.call(this);
            }
          }
        ],
        onClose: function () {
          options.cancel && options.cancel.call(this);
        }
      })).show(options.target);
    });
  },
  /**
   * 添加加载动画
   * @method [加载] - addLoading
   * @param optoins
   * @author wyj 15.04.08
   * @example
   *      Utils.addLoading();
   */
  addLoading: function (options) {
    try {
      if (window.$loading) window.$loading.remove();
      window.$loading = $('<div class="loading"></div>');
      $('body').append(window.$loading);
    } catch (e) {
      debug('Error28' + e);
    }
    return window.$loading;
  },
  /**
   * 移除加载动画
   * @method [加载] - removeLoading
   * @author wyj 15.04.08
   * @example
   *      Utils.removeLoading();
   */
  removeLoading: function (options) {
    if (window.$loading) window.$loading.remove();
    else $('.loading').remove();
  },
  /**
   * input鼠标点击提示
   *
   * @method [提示] - initTooltip
   * @param msg
   * @param options
   * @author wyj 14.12.24
   * @example
   *        this.$('input, textarea').each(function(){
       *          var title = $(this).attr('title');
       *          if (title){
       *            $(this).click(function(){
       *            Utils.initTooltip(title, {
       *              align: 'right',
       *              target: $(this).get(0)
       *            });
       *          });
       *          }
       *        });
   */
  initTooltip: function (msg, options) {
    options = Est.extend({
      id: Est.nextUid('dialog'),
      content: msg,
      time: 4000,
      align: 'right',
      padding: 5
    }, options);
    seajs.use(['dialog-plus'], function (dialog) {
      window.tooltipDialog && window.tooltipDialog.close();
      window.tooltipDialog = app.addDialog(dialog(options)).show(options.target);
      setTimeout(function () {
        window.tooltipDialog.close().remove();
      }, options.time);
    });
  },
  /**
   * 调用方法 - 命令模式[说明， 只有在需要记录日志，撤销、恢复操作等功能时调用该方法]
   *
   * @method [调用] - execute ( 调用方法 )
   * @param name
   * @return {*}
   * @author wyj 15.2.15
   * @example
   *      Utils.execute( "initSelect", {
     *        ...
     *      }, this);
   */
  execute: function (name) {
    debug('- BaseUtils.execute ' + name);
    return BaseUtils[name] && BaseUtils[name].apply(BaseUtils, [].slice.call(arguments, 1));
  }
}

/**
 * @description BaseService - 单例模式， 只创建一个实例化对象
 * @class BaseService - 数据请求
 * @author yongjin<zjut_wyj@163.com> 2015/1/26
 */

var BaseService = function () {
  if (typeof BaseService.instance === 'object') {
    return BaseService.instance;
  }
  debug('build BaseService instance');
  BaseService.instance = this;
}

BaseService.prototype = {
  /**
   * 基础ajax
   *
   * @method ajax
   * @param options
   * @return {*}
   * @author wyj 15.1.26
   * @example
   *        new BaseService().ajax(options).done(function (result) {
                if (result.attributes) {
                  ...
                }
              });
   */
  ajax: function (options) {
    var data = Est.extend({ _method: 'GET' }, options);
    return $.ajax({
      type: 'post',
      url: options.url,
      async: false,
      cache: options.cache,
      data: data,
      success: function (result) {
      }
    });
  },
  /**
   * 初始化树
   *
   * @method initTree
   * @private
   * @param options
   * @param result
   * @author wyj 15.1.26
   */
  initTree: function (options, result) {
    if (options.tree) {
      result.attributes.data = Est.bulidTreeNode(result.attributes.data, options.rootKey, options.rootValue, {
        categoryId: options.categoryId,// 分类ＩＤ
        belongId: options.belongId,// 父类ＩＤ
        childTag: options.childTag, // 子分类集的字段名称
        sortBy: options.sortBy, // 按某个字段排序
        callback: function (item) {
          if (options.tree) {
            item.text = item[options.text];
            item.value = item[options.value];
          }
        }
      });
    }
  },
  /**
   * 初始化选择框
   *
   * @method initSelect
   * @private
   * @param options
   * @param result
   * @author wyj 15.1.26
   */
  initSelect: function (options, result) {
    if (options.select) {
      Est.each(result.attributes.data, function (item) {
        item.text = item[options.text];
        item.value = item[options.value];
      });
      if (options.tree) {
        result.attributes.data = Est.bulidSelectNode(result.attributes.data, 1, {
          name: 'text'
        });
      }
    }
  },
  /**
   * 初始化是否展开
   *
   * @method initExtend
   * @private
   * @param options
   * @param result
   * @author wyj 15.1.27
   */
  initExtend: function (options, result) {
    if (options.extend) {
      result.attributes.data = Est.extendTree(result.attributes.data);
    }
  },
  /**
   * 添加默认选项
   *
   * @method initDefault
   * @private
   * @param options
   * @param result
   * @author wyj 15.1.27
   */
  initDefault: function (options, result) {
    if (result.attributes && options.defaults && Est.typeOf(result.attributes.data) === 'array') {
      result.attributes.data.unshift({text: CONST.LANG.SELECT_DEFAULT, value: options.defaultValue});
    }
  },
  /**
   * 基础工厂类 - 工厂模式，通过不同的url请求不同的数据
   * 注意：这个方法获取的数据是list类型的， 适合列表或下拉框使用
   *
   * @method factory
   * @param options
   * @return {Est.promise}
   * @author wyj 15.1.26
   * @example
   *      new BaseService().factory({
              url: '', // 请求地址
              data: { // 表单参数
              },
              session: true, // 永久记录，除非软件版本号更新
              cache: true // 暂时缓存， 浏览器刷新后需重新请求

              select: true, // 是否构建下拉框
              tree: true, // 是否构建树
              extend: true, // 是否全部展开
              defaults： false, // 是否添加默认选项
              defaultValue: '/', // 默认为 /

              // 如果tree为true时， 表示需要构建树， 则需补充以下字段
              rootKey: 'isroot', // 构建树时的父级字段名称
              rootValue: '01', // 父级字段值
              categoryId: 'categoryId', //分类 Id
              belongId: 'belongId', // 父类ID
              childTag: 'cates', // 子集字段名称
              sortBy: 'sort', // 根据某个字段排序

              // 如果select为true时 ，表示需要构建下拉框， 则下面的text与value必填
              text: 'name', // 下拉框名称
              value: 'categoryId', // 下拉框值
            });

   */
  factory: function (options) {
    var ctx = this;
    var $q = Est.promise;
    var params = '';
    var cacheId = '';
    var result = null;
    options = Est.extend({ select: false, extend: false,
      defaults: true, tree: false, defaultValue: null, cache: false}, options);

    for (var key in options) {
      params += options[key];
    }
    cacheId = '_hash' + Est.hash(params);

    // localStorage缓存
    if (options.session && !app.getData('versionUpdated')) {
      result = app.getSession(cacheId);
      if (result) {
        return new $q(function (topResolve, topReject) {
          topResolve(JSON.parse(result));
        });
      }
    }
    return new $q(function (topResolve, topReject) {
      if (CONST.DEBUG_LOCALSERVICE) {
        topResolve([]);
      } else {
        ctx.ajax(options).done(function (result) {
          var list = null;
          if (result.attributes) {
            ctx.initTree(options, result);
            ctx.initSelect(options, result);
            ctx.initExtend(options, result);
          } else {
            result.attributes = result.attributes || {};
            result.attributes.data = [];
          }
          ctx.initDefault(options, result);
          list = result.attributes ? result.attributes.data : result;
          if (options.session && result.attributes) {
            app.addSession(cacheId, JSON.stringify(list));
          }
          topResolve(list);
        });
      }
    });
  },
  /**
   * 基础工厂类 - 工厂模式，通过不同的url请求不同的数据
   * 注意：这个方法获取的数据是从任何类型的
   *
   * @method query
   * @param options
   * @return {Est.promise}
   * @author wyj 15.1.26
   * @example
   *      new BaseService().query({
              url: '', // 请求地址
              data: { // 表单参数
              },
              session: true, // 永久记录，除非软件版本号更新
              cache: true // 暂时缓存， 浏览器刷新后需重新请求
            });
   */
  query: function (options) {
    var ctx = this;
    var $q = Est.promise;
    var params = '';
    var cacheId = '';
    var result = null;
    options = Est.extend({ cache: false}, options);

    for (var key in options) {
      params += options[key];
    }
    cacheId = '_hash' + Est.hash(params);

    // localStorage缓存
    if (options.session && !app.getData('versionUpdated')) {
      result = app.getSession(cacheId);
      if (result) {
        return new $q(function (topResolve, topReject) {
          topResolve(JSON.parse(result));
        });
      }
    }
    return new $q(function (topResolve, topReject) {
      if (CONST.DEBUG_LOCALSERVICE) {
        topResolve([]);
      } else {
        ctx.ajax(options).done(function (result) {
          if (result.msg === CONST.LANG.NOT_LOGIN) {
            Est.trigger('checkLogin');
          }
          if (options.session && result) {
            app.addSession(cacheId, JSON.stringify(result));
          }
          topResolve(result);
        });
      }
    });
  }
}

/**
 * @description 所有BaseXxx模块的超类， 子类继承超类的一切方法
 * @class SuperView - 所有BaseXxx模块的超类
 * @author yongjin<zjut_wyj@163.com> 2015/1/24
 */

var SuperView = Backbone.View.extend({
  /**
   * 传递options进来
   *
   * @method [private] - constructor
   * @private
   * @param options
   * @author wyj 14.12.16
   */
  constructor: function (options) {
    this.options = options || {};
    this._modelBinder = Backbone.ModelBinder;
    if (this.init && Est.typeOf(this.init) !== 'function')
      this._initialize(this.init);
    Backbone.View.apply(this, arguments);
  },
  initialize: function () {
    this._initialize();
  },
  /**
   * 导航
   *
   * @method [导航] - _navigate ( 导航 )
   * @param name
   * @author wyj 15.1.13
   */
  _navigate: function (name, options) {
    options = options || true;
    Backbone.history.navigate(name, options);
  },
  /**
   * 静态对话框， 当你需要显示某个组件的视图但不是以iframe形式打开时
   * 对话框参数将作为模块里的options参数
   *
   * @method [对话框] - _dialog ( 静态对话框 )
   * @param options
   * @author wyj 15.1.22
   * @example
   *        // 获取对话框
   *          app.getDialog('moduleId || id');
   *          this._dialog({
   *                moduleId: 'SeoDetail', // 模块ID
   *                title: 'Seo修改', // 对话框标题
   *                id: this.model.get('id'), // 初始化模块时传入的ID， 如productId
   *                width: 600, // 对话框宽度
   *                height: 250, // 对话框高度
   *                skin: 'form-horizontal', // className
   *                hideSaveBtn: false, // 是否隐藏保存按钮， 默认为false
   *                autoClose: true, // 提交后按确定按钮  自动关闭对话框
   *                quickClose: true, // 点击空白处关闭对话框
   *                button: [ // 自定义按钮
   *                  {
   *                    value: '保存',
   *                    callback: function () {
   *                    this.title('正在提交..');
   *                    $("#SeoDetail" + " #submit").click(); // 弹出的对话ID选择符为id (注：当不存在id时，为moduleId值)
   *                    app.getView('SeoDetail'); // 视图为moduleId
   *                    return false; // 去掉此行将直接关闭对话框
   *                  }}
   *                ],
   *                onShow: function(){ // 对话框弹出后调用   [注意，当调用show方法时， 对话框会重新渲染模块视图，若想只渲染一次， 可以在这里返回false]
   *                    return true;
   *                },
   *                onClose: function(){
   *                    this._reload(); // 列表刷新
   *                    this.collection.push(Est.cloneDeep(app.getModels())); // 向列表末尾添加数据, 注意必须要深复制
   *                    this.model.set(app.getModels().pop()); // 修改模型类
   *                }
   *            }, this);
   */
  _dialog: function (options, context) {
    var ctx = context || this;
    var viewId = Est.typeOf(options.id) === 'string' ? options.id : options.moduleId;

    options.width = options.width || 700;
    options.cover = Est.typeOf(options.cover) === 'boolean' ? options.cover : true;
    options.button = options.button || [];
    options.quickClose = options.cover ? false : options.quickClose;

    if (typeof options.hideSaveBtn === 'undefined' ||
      (Est.typeOf(options.hideSaveBtn) === 'boolean' && !options.hideSaveBtn)) {
      options.button.push(
        {value: CONST.LANG.COMMIT, callback: function () {
          Utils.addLoading();
          $('#' + viewId + ' #submit').click();
          try {
            if (options.autoClose) {
              Est.on('_dialog_submit_callback', Est.proxy(function () {
                this.close().remove();
              }, this));
            }
          } catch (e) {
            console.log(e);
          }
          return false;
        }, autofocus: true});
    }

    options = Est.extend(options, {
      el: '#base_item_dialog' + viewId,
      content: options.content || '<div id="' + viewId + '"></div>',
      viewId: viewId,
      onshow: function () {
        try {
          var result = options.onShow && options.onShow.call(this, options);
          if (typeof result !== 'undefined' && !result)
            return;
          if (Est.typeOf(options.moduleId) === 'function') {
            app.addPanel(options.id, {
              el: '#' + options.id,
              template: '<div id="base_item_dialog' + options.id + '"></div>'
            }).addView(options.id, new options.moduleId(options));
          } else if (Est.typeOf(options.moduleId) === 'string') {
            seajs.use([options.moduleId], function (instance) {
              try {
                if (!instance) {
                  console.error('module is not defined')
                }
                app.addPanel(options.viewId, {
                  el: '#' + options.viewId,
                  template: '<div id="base_item_dialog' + options.viewId + '"></div>'
                }).addView(options.viewId, new instance(options));
              } catch (e) {
                console.log(e);
              }
            });
          }
        } catch (e) {
          console.log(e);
        }
      },
      onclose: function () {
        options.onClose && options.onClose.call(ctx, options);
        app.getDialogs().pop();
      }
    });
    BaseUtils.initDialog(options);
  },
  /**
   * 单个模型字段绑定
   * @method [绑定] - _singeBind
   * @param selector
   * @param model
   * @author wyj 15.7.20
   * @example
   * @private
   * @author wyj 15.7.20
   * @example
   *    this._singleBind('#model-name', this.model);
   */
  _singleBind: function (selector, model, changeFn) {
    var _self = this;
    $(selector).each(function () {
      var bindType = $(this).attr('data-bind-type');
      if (Est.isEmpty(bindType)) {
        bindType = 'change';
      }
      $(this).on(bindType,function () {
        var val, pass;
        var modelId = window._singleBindId = $(this).attr('id');
        if (modelId && modelId.indexOf('model') !== -1) {
          switch (this.type) {
            case 'radio':
              val = $(this).is(":checked") ? $(this).val() : pass = true;
              break;
            case 'checkbox':
              val = $(this).is(':checked') ? (Est.isEmpty($(this).attr('true-value')) ? true : $(this).attr('true-value')) :
                (Est.isEmpty($(this).attr('false-value')) ? false : $(this).attr('false-value'));
              break;
            default :
              val = $(this).val();
              break;
          }
          if (!pass) {
            _self._setValue(modelId.replace(/^model\d?-(.+)$/g, "$1"), val);
            changeFn && changeFn.call(this, model);
          }
        }
      });
    });
  },
  /**
   * 视图到模型类的绑定
   *
   * @method [绑定] - _modelBind
   * @private
   * @author wyj 14.12.25
   * @example
   *        this._modelBind();
   */
  _modelBind: function (selector, changeFn) {
    var _self = this;
    if (selector) this._singleBind(selector, this.model, changeFn);
    else this.$("input, textarea, select").each(function () {
      _self._singleBind($(this), _self.model);
    });
  },
  /**
   * 模型类到视图的绑定
   *
   * @method [绑定] - _viewBind
   * @param {string} name
   * @param {string} selector
   * @param {fn} callback
   * @author wyj 15.7.17
   * @example
   *      this._viewBind([
   *        {
   *          ''
   *        }
   *      ]);
   */
  _viewBind: function (name, selector, callback) {
    if (!this.modelBinder) this.modelBinder = new this._modelBinder();
    var obj = {};
    obj[name] = [
      {selector: selector, converter: callback}
    ];
    this.modelBinder.bind(this.model, this.el, obj);
  },
  /**
   * 视图重新渲染
   *
   * @method [渲染] - _viewReplace
   * @param selector
   * @param model
   * @author wyj 15.7.21
   * @example
   *      this._viewReplace('#model-name', this.model);
   */
  _viewReplace: function (selector, model, callback) {
    debug('_viewReplace selector: ' + selector);
    var result = callback && callback.call(this, model);
    if (Est.typeOf(result) !== 'undefined' && !result) return;
    Est.each(selector.split(','), Est.proxy(function (item) {
      if (!Est.isEmpty(item)) {
        this['h_temp_' + Est.hash(item)] = this['h_temp_' + Est.hash(item)] ||
          Handlebars.compile($(this.$template).find(selector).wrapAll('<div>').parent().html());
        this.$(item).replaceWith(this['h_temp_' + Est.hash(item)](model.toJSON()));
        //this._modelBind(item);
      }
    }, this));
  },
  /**
   * 双向绑定
   * @method [绑定] - _watch
   * @param name
   * @param selector
   * @param callback
   * @author wyj 15.7.20
   * @example
   *      <input id="model-link" data-bind-type="keyup" type="text"  value="{{link}}"> // data-bind-type="keydown" 绑定方式，默认为change
   *      this._watch(['#model-name'], '#model-name,.model-name', function(){
   *
   *      });
   */
  _watch: function (name, selector, callback) {
    var _self = this, modelId,
      temp_obj = {},
      list = [];

    if (Est.typeOf(name) === 'array') list = name;
    else list.push(name);
    Est.each(list, function (item) {
      modelId = item.replace(/^#model\d?-(.+)$/g, "$1");
      if (!_self._options.modelBind) _self._modelBind(item);
      if (modelId in temp_obj) return;
      _self.model.on('change:' + (temp_obj[modelId] = modelId.split('.')[0]), function () {
        if (item === '#' + window._singleBindId)
          _self._viewReplace(selector, _self.model, callback);
      });
    });
  },
  /**
   * 字段序列化成字符串
   *
   * @method [模型] - _stringifyJSON ( 字段序列化成字符串 )
   * @param array
   * @author wyj 15.1.29
   * @example
   *      this._stringify(['invite', 'message']);
   */
  _stringifyJSON: function (array) {
    var keys, result;
    if (!JSON.stringify) alert(CONST.LANG.JSON_TIP);
    Est.each(array, function (item) {
      keys = item.split('.');
      if (keys.length > 1) {
        result = Est.getValue(this.model.toJSON(), item);
        Est.setValue(this.model.attributes, item, JSON.stringify(result));
      } else {
        Est.setValue(this.model.attributes, item, JSON.stringify(this.model.get(item)));
      }
    }, this);
  },
  /**
   * 反序列化字符串
   *
   * @method [模型] - _parseJSON ( 反序列化字符串 )
   * @param array
   */
  _parseJSON: function (array) {
    var keys, result;
    var parse = JSON.parse || $.parseJSON;
    if (!parse) alert(CONST.LANG.JSON_TIP);
    Est.each(array, function (item) {
      keys = item.split('.');
      if (keys.length > 1) {
        result = Est.getValue(this.model.toJSON(), item);
        if (Est.typeOf(result) === 'string') {
          Est.setValue(this.model.toJSON(), item, parse(result));
        }
      } else {
        if (Est.typeOf(this.model.get(item)) === 'string') {
          this.model.set(item, parse(this.model.get(item)));
        }
      }
    }, this);
  },
  /**
   * 设置参数
   *
   * @method [参数] - _setOption ( 设置参数 )
   * @param obj
   * @return {BaseList}
   * @author wyj 14.12.12
   * @example
   *      app.getView('categoryList')._setOption({
   *          sortField: 'orderList'
   *      })._moveUp(this.model);
   */
  _setOption: function (obj) {
    Est.extend(this._options, obj);
    return this;
  },
  /**
   * 回车事件
   *
   * @method [private] - _initEnterEvent
   * @private
   * @author wyj 14.12.10
   */
  _initEnterEvent: function (options) {
    if (options.speed > 1 && options.enterRender) {
      this.$('input').keyup($.proxy(function (e) {
        if (e.keyCode === CONST.ENTER_KEY) {
          this.$(options.enterRender).click();
        }
      }, this));
    }
  },
  /**
   * 获取配置参数
   *
   * @method [参数] - _getOption ( 获取配置参数 )
   * @param name
   * @return {*}
   * @author wyj 15.1.29
   */
  _getOption: function (name) {
    return this._options[name];
  },
  /**
   * 获取model值
   *
   * @method [模型] - _getValue ( 获取model值 )
   * @param path
   * @author wyj 15.1.30
   * @example
   *      this._getValue('tip.name');
   */
  _getValue: function (path) {
    return Est.getValue(this.model.attributes, path);
  },
  /**
   * 设置model值
   *
   * @method [模型] - _setValue ( 设置model值 )
   * @param path
   * @param val
   * @author wyj 15.1.30
   * @example
   *      this._setValue('tip.name', 'aaa');
   */
  _setValue: function (path, val) {
    // just for trigger
    Est.setValue(this.model.attributes, path, val);
    this.model.trigger('change:' + path.split('.')[0]);
  },
  /**
   * 绑定单个字段进行重渲染
   *
   * @method [模型] - _bind ( 绑定单个字段进行重渲染 )
   * @param array
   * @author wyj 15.2.2
   * @example
   *      this._bind('name', []);
   */
  _bind: function (modelId, array) {
    this.model.on('change:' + modelId, function () {
      Est.each(array, function (item) {
        var $parent = this.$(item).parent();
        var compile = Handlebars.compile($parent.html());
        $parent.html(compile(this));
      }, this);
    })
  },
  /**
   * 获取点击事件源对象
   * @method [事件] - _getTarget
   * @param e
   * @return {*|jQuery|HTMLElement}
   *  @example
   *      this._getTarget(e);
   */
  _getTarget: function (e) {
    return e.target ? $(e.target) : $(e.currentTarget);
  },
  /**
   * 获取绑定事件源对象
   * @method [事件] - _getEventTarget
   * @param e
   * @return {*|jQuery|HTMLElement}
   *  @example
   *      this._getEventTarget(e);
   */
  _getEventTarget: function (e) {
    return e.currentTarget ? $(e.currentTarget) : $(e.target);
  },
  /**
   * 单次执行
   * @method [事件] - _one
   * @param callback
   * @author wyj 15.6.14
   * @example
   *      this._one(['AwardList'], function (AwardList) {
   *          app.addPanel('main', {
   *          el: '#Award',
   *          template: '<div class="leaflet-award"></div>'
   *      }).addView('awardList', new AwardList({
   *          el: '.leaflet-award',
   *          viewId: 'awardList'
   *      }));
   *  });
   */
  _one: function (name, callback) {
    try {
      var _name, isArray = Est.typeOf(name) === 'array';
      var _nameList = [];
      _name = isArray ? name.join('_') : name;
      if (this['_one_' + _name] = Est.typeOf(this['_one_' + _name]) === 'undefined' ? true : false) {
        if (isArray) {
          Est.each(name, function (item) {
            _nameList.push(item.replace(/^(.+)-\d?$/g, "$1"));
          });
          this._require(_nameList, callback);
        }
        else  callback && callback.call(this);
      }
    } catch (e) {
      debug('SuperView._one ' + JSON.stringify(name), {type: 'alert'});
    }
  },
  /**
   * 异步加载
   * @method [加载] - _require
   * @param dependent
   * @param callback
   * @author wyj 15.6.14
   * @example
   *        this._require(['Module'], function(Module){
   *            new Module();
   *        });
   */
  _require: function (dependent, callback) {
    seajs.use(dependent, Est.proxy(callback, this));
  },
  /**
   * 延迟执行
   * @method [加载] - _delay
   *
   * @param time
   * @author wyj 15.12.3
   * @example
   *  this._delay(function(){}, 5000);
   */
  _delay: function (fn, time) {
    setTimeout(Est.proxy(function () {
      setTimeout(Est.proxy(function () {
        fn && fn.call(this);
      }, this), time);
    }, this), 0);
  },
  /**
   * title提示
   * @method [提示] - _initToolTip ( title提示 )
   * @author wyj 15.9.5
   * @example
   *      <div class="tool-tip" title="提示内容">content</div>
   *      this._initToolTip();
   */
  _initToolTip: function ($parent, className) {
    var className = className || '.tool-tip';
    var $tip = $parent ? $(className, $parent) : this.$(className);
    $tip.hover(function (e) {
      var title = $(this).attr('data-title') || $(this).attr('title');
      var offset = $(this).attr('data-offset') || 0;
      if (Est.isEmpty(title))return;
      BaseUtils.initDialog({
        id: Est.hash(title || 'error:446'),
        title: null,
        width: 'auto',
        offset: parseInt(offset, 10),
        skin: 'tool-tip-dilog',
        align: $(this).attr('data-align') || 'top',
        content: '<div style="padding: 5px 6px;;font-size: 12px;">' + title + '</div>',
        hideCloseBtn: true,
        autofocus: false,
        target: $(this).get(0)
      });
      if (!app.getData('toolTipList')) app.addData('toolTipList', []);
      app.getData('toolTipList').push(Est.hash(title));

      $(window).one('click', Est.proxy(function () {
        Est.each(app.getData('toolTipList'), function (item) {
          app.getDialog(item).close();
        });
        app.addData('toolTipList', []);
      }, this));
    }, function () {
      try {
        app.getDialog(Est.hash($(this).attr('data-title') || $(this).attr('title'))).close();
      } catch (e) {
      }
    });
  },
  render: function () {
    this._render();
  }
});

/**
 * @description 普通视图
 *
 *  - el: 目标元素Id 如 "#jhw-main"
 *  - initialize 实现父类_initialize
 *  - render 实现父类_render
 *  - 事件
 *      var panel = new Panel();
 *      panel.on('after', function(){
 *        this.albumList = app.addView('albumList', new AlbumList());
 *        this.photoList = app.addView('photoList', new PhotoList());
 *      });
 *      panel.render(); // 渲染
 *
 * @class BaseView - 普通视图
 * @author yongjin<zjut_wyj@163.com> 2014/12/8
 */


var BaseView = SuperView.extend({
  /**
   * 初始化
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @param options [template: 字符串模板][model: 实例模型]
   * @author wyj 14.11.20
   * @example
   *      this._initialize({
       *         viewId: 'productList'，
       *         template: 字符串模板，
       *         data: 对象数据
       *         // 可选
       *         enterRender: 执行回车后的按钮点击的元素选择符 如 #submit .btn-search
       *         append: false // 视图是否是追加,
       *         toolTip: true, // 是否显示title提示框   html代码： <div class="tool-tip" title="提示内容">内容</div>
       *         beforeRender: function(){},
       *         afterRender: function(){}
       *      });
   */
  _initialize: function (options) {
    this._initOptions(options);
    this._initTemplate(this._options);
    this._initModel(Backbone.Model.extend({}));
    this._initBind(this._options);
    return this;
  },
  /**
   * 初始化参数
   *
   * @method [private] - _initOptions
   * @private
   * @author wyj 15.1.12
   */
  _initOptions: function (options) {
    this._options = Est.extend(this.options, options || {});
    this._options.data = this._options.data || {};
  },
  /**
   * 初始化模板， 若传递一个Template模板字符中进来， 则渲染页面
   *
   * @method [private] - _initTemplate
   * @private
   * @author wyj 15.1.12
   */
  _initTemplate: function (options) {
    if (options.template) {
      this.template = Handlebars.compile(options.template);
      this.$template = '<div>'+ options.template + '</div>';
    }
  },
  /**
   * 初始化模型类, 设置index索引
   *
   * @method [private] - _initModel
   * @private
   * @param model
   * @author wyj 14.11.20
   */
  _initModel: function (model) {
    this.model = new model(this._options.data);
  },
  /**
   * 绑定事件， 如添加事件， 重置事件
   *
   * @method [private] - _initBind
   * @private
   * @author wyj 14.11.16
   */
  _initBind: function (options) {
    this.model.bind('reset', this.render, this);
  },
  /**
   * 渲染
   *
   * @method [渲染] - _render ( 渲染 )
   * @author wyj 14.11.20
   * @example
   *        this._render();
   */
  _render: function () {
    this.trigger('before', this);
    if (this._options.beforeRender){
      this._options.beforeRender.call(this, this._options);
    }
    if (this._options.append)
      this.$el.append(this.template(this.model.toJSON()));
    else
      this.$el.html(this.template(this.model.toJSON()));
    this._initEnterEvent(this._options);
    if (this._options.modelBind) this._modelBind();
    this.trigger('after', this);
    if (this._options.afterRender) {
      this._options.afterRender.call(this, this._options);
    }
    if (this._options.toolTip) {
      this._initToolTip();
    }
    BaseUtils.removeLoading();
  },
  render: function(){
    this._render();
  },
  /**
   * 移除事件
   *
   * @method [private] - _empty
   * @private
   * @return {BaseView}
   * @author wyj 14.11.16
   */
  _empty: function () {
    debug('BaseView._empty');
  }
});

/**
 * @description 列表视图
 * @class BaseList - 列表视图
 * @author yongjin<zjut_wyj@163.com> 2014/12/8
 */


var BaseList = SuperView.extend({
  /**
   * 传递options进来
   *
   * @method [private] - constructor
   * @private
   * @param options
   * @author wyj 14.12.16
   */
  /*constructor: function (options) {
   Est.interface.implements(this, new Est.interface('BaseList', ['initialize', 'render']));
   this.constructor.__super__.constructor.apply(this, arguments);
   },*/
  /**
   * 初始化
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @param options
   * @author wyj 14.11.20
   * @example
   *      this._initialize({
       *        model: ProductModel, // 模型类,
       *        collection:  ProductCollection,// 集合,
       *        item: ProductItem, // 单视图
       *        // 以下为可选
       *        template: listTemp, 字符串模板,
       *        render: '.product-list', 插入列表的容器选择符, 若为空则默认插入到$el中
       *        items: [], // 数据不是以url的形式获取时 (可选), items可为function形式传递;
       *        data: {}, // 附加的数据 BaseList、BaseView[js: this._options.data & template: {{name}}] ;
       *                     BaseItem中为[this._options.data &{{_options._data.name}}] BaseCollecton为this._options.data BaseModel为this.get('_data')
       *        append: false, // 是否是追加内容， 默认为替换
       *        checkAppend: false, // 鼠标点击checkbox， checkbox是否追加  需在BaseItem事件中添加 'click .toggle': '_toggleChecked',
       *        enterRender: (可选) 执行回车后的按钮点击的元素选择符 如 #submit .btn-search
       *        pagination: true, // 是否显示分页 view视图中相应加入<div id="pagination-container"></div>
       *        page: parseInt(Est.cookie('orderList_page')) || 1, //设置起始页 所有的分页数据都会保存到cookie中， 以viewId + '_page'格式存储， 注意cookie取的是字符串， 要转化成int
       *        pageSize: parseInt(Est.cookie('orderList_pageSize')) || 16, // 设置每页显示个数
       *        max: 5, // 限制显示个数
       *        sortField: 'sort', // 上移下移字段名称， 默认为sort
       *        itemId: 'Category_00000000000123', // 当需要根据某个ID查找列表时， 启用此参数， 方便
       *        filter: [ {key: 'name', value: this.searchKey }] // 过滤结果
       *        toolTip: true, // 是否显示title提示框   html代码： <div class="tool-tip" title="提示内容">内容</div>
       *        clearDialog: true, // 清除所有的对话框， 默认为true
       *        beforeLoad: function(collection){ // collection载入列表前执行
       *            this.setCategoryId(options.categoryId); // collection载入后执行
       *          },
       *        afterLoad: function(){ // collection载入之后
       *            if (this.collection.models.length === 0 ||
                      !this.options._isAdd){
                      this.addOne();
                    }
       *        },
       *        beforeRender: function(thisOpts){}, // 渲染前回调
       *        afterRender: function(thisOpts){ // 渲染后回调， 包括items渲染完成
       *          if (this.collection.models.length === 0 ||
                      !this.options._isAdd){
                      this.addOne();
                    }
       *        },
       *        cache: true, // 数据缓存到内存中
       *        session: true, // 数据缓存到浏览器中，下次打开浏览器，请求的数据直接从浏览器缓存中读取
       *        // 以下为树型列表时 需要的参数
       *        subRender: '.node-tree', // 下级分类的容器选择符
       *        collapse: '.node-collapse' 展开/收缩元素选择符
       *        parentId: 'belongId', // 分类 的父类ID
       *        categoryId: 'categoryId', // 分类 的当前ID
       *        rootId: 'isroot', // 一级分类字段名称
       *        rootValue: '00' // 一级分类字段值  可为数组[null, 'Syscode_']   数组里的选项可为方法， 返回true与false
       *        extend: true // false收缩 true为展开
       *       });
   */
  _initialize: function (options) {
    debug('1.BaseList._initialize');
    this.dx = 0;
    this.views = [];
    return this._init(options.collection, options);
  },
  /**
   * 初始化集合类
   *
   * @method [private] - _init
   * @private
   * @param collection 对应的collection集合类， 如ProductCollection
   * @param options [beforeLoad: 加载数据前执行] [item: 集合单个视图] [model: 模型类]
   * @author wyj 14.11.16
   */
  _init: function (collection, options) {

    this._initOptions(options);
    this._initDataModel(Backbone.Model.extend({}));
    this._initTemplate(this._options);
    this._initEnterEvent(this._options, this);
    this._initList(this._options);
    this._initCollection(this._options, collection);
    this._initItemView(this._options.item, this);
    this._initModel(this._options.model);
    this._initBind(this.collection);
    this._initPagination(this._options);
    this._load(this._options);
    this._finally();

    return this;
  },
  /**
   * 初始化参数
   *
   * @method [private] - _initOptions
   * @private
   * @author wyj 15.1.12
   */
  _initOptions: function (options) {
    this._options = Est.extend(this.options, options || {});
    this._options.sortField = 'sort';
    this._options.max = this._options.max || 99999;
    this._options.speed = this._options.speed || 9;
  },
  /**
   * 初始化模型类, 设置index索引
   *
   * @method [private] - _initDataModel
   * @private
   * @param model
   * @author wyj 14.11.20
   */
  _initDataModel: function (model) {
    this.model = new model(this._options.data);
  },
  /**
   * 初始化模板， 若传递一个Template模板字符中进来， 则渲染页面
   *
   * @method [private] - _initTemplate ( 待优化， 模板缓存 )
   * @private
   * @author wyj 15.1.12
   */
  _initTemplate: function (options) {
    this._data = options.data = options.data || {};
    if (options.template) {
      this._options.beforeRender && this._options.beforeRender.call(this);
      this.$template = $('<div>' + options.template + '</div>');
      if (this._options.render) {
        this._options.itemTemp = this.$template.find(this._options.render).html();
        this.$template.find(this._options.render).empty();
      } else {
        this._options.itemTemp = this.$template.html();
        this.$template.empty();
      }
      this.template = Handlebars.compile(Est.isEmpty(this._options.itemTemp) ? options.template :
        this.$template.html());
      if (this._options.append) {
        this.$el.empty();
        this.$el.append(this.template(this.model.toJSON()));
      } else {
        this.$el.html(this.template(this.model.toJSON()));
      }
    }
    if (this._options.modelBind) this._modelBind();
    return this._data;
  },
  /**
   * 回车事件
   *
   * @method [private] - _initEnterEvent
   * @private
   * @author wyj 14.12.10
   */
  _initEnterEvent: function (options, ctx) {
    if (options.enterRender) {
      ctx.$('input').keyup(function (e) {
        if (e.keyCode === CONST.ENTER_KEY) {
          ctx.$(options.enterRender).click();
        }
      });
    }
  },
  /**
   * 初始化列表视图容器
   *
   * @method [private] - _initList
   * @private
   * @author wyj 15.1.12
   */
  _initList: function (options) {
    var ctx = this;
    this.list = options.render ? this.$(options.render) : this.$el;
    if (this.list.size() === 0)
      this.list = $(options.render);

    debug(function () {
      if (!ctx.list || ctx.list.size() === 0) {
        return  'Error1';
      }
    }, {type: 'error'});
    this.allCheckbox = this.$('#toggle-all')[0];

    return this.list;
  },
  /**
   * 初始化collection集合
   *
   * @method [private] - _initCollection
   * @param collection
   * @private
   */
  _initCollection: function (options, collection) {
    debug(function () {
      if (!options.model) {
        return 'Error2';
      }
    }, {type: 'error'});
    if (!this.collection || (this.collection && !this.collection.remove)) this.collection = new collection(options);
    if (options.itemId) this.collection._setItemId(options.itemId);
    //TODO 分类过滤
    if (options.subRender && !(options.items)) this.composite = true;

    return this.collection;
  },
  /**
   * 初始化单个枚举视图
   *
   * @method [private] - _initItemView
   * @private
   * @param itemView
   * @author wyj 14.11.16
   */
  _initItemView: function (itemView) {
    this.item = itemView;
  },
  /**
   * 初始化模型类, 设置index索引
   *
   * @method [private] - _initModel
   * @private
   * @param model
   * @author wyj 14.11.20
   */
  _initModel: function (model) {
    this.initModel = model;
  },
  /**
   * 绑定事件， 如添加事件， 重置事件
   * @method [private] - _initBind
   * @private
   * @author wyj 14.11.16
   */
  _initBind: function (collection) {
    if (collection) {
      collection.bind('add', this._addOne, this);
      collection.bind('reset', this._render, this);
    }
  },
  /**
   * 初始化分页
   *
   * @method [private] - _initPagination
   * @param options
   * @private
   * @author wyj 14.11.17
   */
  _initPagination: function (options) {
    var ctx = this;
    if (ctx.collection && ctx.collection.paginationModel) {
      // 单一观察者模式， 监听reloadList事件
      ctx.collection.paginationModel.on('reloadList',
        function (model) {
          ctx._clear.call(ctx);
          ctx._load.call(ctx, options, model);
        });
    }
  },
  /**
   * 获取集合数据 当append为true时，只追加数据。
   * 类似有个_reload  这个方法无论append是否为true， 都会清空列表重新加载
   *
   * @method [渲染] - _load ( 获取集合数据 )
   * @param options [beforeLoad: 载入前方法][page: 当前页][pageSize: 每页显示条数]
   * @param model 分页模型类 或为全查必填
   * @author wyj 14.11.16
   * @example
   *        baseListCtx._load({
       *          page: 1,
       *          pageSize: 16,
       *          beforeLoad: function () {
       *            this.collection.setCategoryId(options.categoryId);
       *          },
       *          afterLoad: function(){
       *
       *          }
       *        }).then(function () {
       *          ctx.after();
       *        });
   */
  _load: function (options, model) {
    var ctx = this;
    options = options || this._options || {};
    this._beforeLoad(options);
    if (options.page || options.pageSize) {
      options.page && ctx.collection.paginationModel.set('page', options.page || 1);
      // 备份page
      options._page = options.page;
      options.pageSize && ctx.collection.paginationModel.set('pageSize', options.pageSize || 16);
      // 备份pageSize
      options._pageSize = options.pageSize;
      model = ctx.collection.paginationModel;
      //TODO 移除BaseList默认的page 与pageSize使每页显示条数生效
      options.page = options.pageSize = null;
    }
    //TODO 若存在items且有page与pageSize  处理静态分页
    if (this._options.items) {
      this._empty();
      this._initItems();
    }
    // page pageSize保存到cookie中
    if (this._options.viewId && ctx.collection.paginationModel &&
      ctx.collection.paginationModel.get('pageSize') < 999) {
      app.addCookie(this._options.viewId + '_page');
      Est.cookie(this._options.viewId + '_page', ctx.collection.paginationModel.get('page'));
      app.addCookie(this._options.viewId + '_pageSize');
      Est.cookie(this._options.viewId + '_pageSize', ctx.collection.paginationModel.get('pageSize'));
    }
    // 判断是否存在url
    if (ctx.collection.url && !this._options.items) {

      if (ctx._options.filter) ctx.filter = true;
      // 处理树结构
      if (ctx._options.subRender) {
        ctx.composite = true;
        ctx.collection.paginationModel.set('page', 1);
        ctx.collection.paginationModel.set('pageSize', 9000);
      }
      debug(function () {
        return ('[Query]' + (Est.typeOf(ctx.collection.url) === 'function' ? ctx.collection.url() :
          ctx.collection.url));
      });
      // 数据载入
      ctx.collection._load(ctx.collection, ctx, model).
        done(function (result) {
          if (result && result.msg && result.msg === CONST.LANG.AUTH_FAILED) {
            Utils.tip(CONST.LANG.AUTH_LIMIT + '！', {time: 2000});
          }
          /*if (ctx.options.instance)
           app.addData(ctx.options.instance, result.models);*/
          ctx.list.find('.no-result').remove();
          try {
            if (Est.isEmpty(result) || Est.isEmpty(result.attributes) || result.attributes.data.length === 0) {
              ctx._options.append ? ctx.list.append('<div class="no-result">'+CONST.LANG.LOAD_ALL+'</div>') :
                ctx.list.append('<div class="no-result">'+CONST.LANG.NO_RESULT+'</div>');

              ctx.collection.paginationModel.get('page') === 1 && Est.trigger('resultListNone' + ctx._options.viewId, {});
              if (result.msg === CONST.LANG.NOT_LOGIN) {
                Est.trigger('checkLogin');
              }
              debug(function () {
                return 'Warm3 list.length=0'+ (Est.typeOf(ctx.collection.url) === 'function' ? ctx.collection.url() :
                  ctx.collection.url);
              });
            }
          } catch (e) {
            Est.trigger('checkLogin');
            debug('Error4 ' + result.msg);
          }
          if (ctx._options.subRender)  ctx._filterRoot();
          if (ctx._options.filter) ctx._filterCollection();
          if (result.attributes && result.attributes.model) {
            ctx._options.data = Est.extend(ctx._options.data, result.attributes.model);
          }
          ctx._afterLoad(options);
        });
    } else {
      ctx._afterLoad(options);
    }
  },
  /**
   * 刷新列表 会清空已存在的数据
   *
   * @method [渲染] - _reload ( 刷新列表 )
   * @author wyj 15.1.24
   * @example
   *        this._reload();
   */
  _reload: function (options) {
    debug('BaseList_reload');
    this._empty.call(this);      // 清空视图
    this.collection.reset();     // 清空collection
    this.list.empty();           // 清空DOM
    this._load(options);         // 重新加载数据
  },
  /**
   * 初始化完成后执行
   *
   * @method [private] - _finally
   * @private
   */
  _finally: function () {
    if (this._options.afterRender)
      this._options.afterRender.call(this, this._options);
    if (this._options.toolTip) this._initToolTip();
    BaseUtils.removeLoading();
  },
  /**
   * 列表载入前执行
   *
   * @method [private] - _beforeLoad
   * @param options
   * @private
   */
  _beforeLoad: function (options) {
    if (options.beforeLoad)
      options.beforeLoad.call(this, this.collection);
  },
  /**
   * 列表载入后执行
   *
   * @method [private] - _afterLoad
   * @private
   */
  _afterLoad: function (options) {
    if (options.afterLoad)
      options.afterLoad.call(this, this.collection);
  },
  /**
   * 初始化items
   *
   * @method [private] - _initItems
   * @private
   * @author wyj 15.1.8
   */
  _initItems: function () {
    if (Est.typeOf(this._options.items) === 'function')
      this._options.items = this._options.items.apply(this, arguments);
    if (this._options.filter) {
      this.collection.push(this._options.items);
      this._filterCollection();
      this._options.items = Est.pluck(Est.cloneDeep(this.collection.models, function () {
      }, this), 'attributes');
    }
    if (this._options._page || this._options._pageSize) {
      this._renderListByPagination();
    } else if (!this.filter) {
      Est.each(this._options.items, function (item) {
        if (this._check()) return false;
        this.collection.push(new this.initModel(item));
      }, this);
    }
  },
  /**
   * 缓存编译模板
   *
   * @method [private] - _setTemplate
   * @private
   * @author wyj 15.2.14
   */
  _setTemplate: function (compile) {
    this.compileTemp = compile;
  },
  /**
   * 获取编译模板
   *
   * @method [private] - _getTemplate
   * @private
   * @author wyj 15.2.14
   */
  _getTemplate: function () {
    return this.compileTemp;
  },
  /**
   * 停止遍历
   *
   * @method [渲染] - _stop ( 停止遍历 )
   * @author wyj 15.1.27
   * @example
   *        this._stop();
   */
  _stop: function () {
    this.stopIterator = true;
  },
  /**
   * 检查是否停止遍历
   *
   * @method [private] - _check
   * @private
   * @return {boolean}
   * @author wyj 15.1.27
   */
  _check: function () {
    if (this.stopIterator) {
      this.stopIterator = false;
      return true;
    }
    return false;
  },
  /**
   * 渲染视图
   *
   * @method [渲染] - _render ( 渲染视图 )
   * @author wyj 14.11.16
   * @example
   *
   */
  _render: function () {
    debug('BaseList._render');
    this._addAll();
    this.trigger('after', this);
  },
  /**
   * 过滤父级元素
   *
   * @method [private] - _filterRoot
   * @private
   * @author wyj 14.12.9
   */
  _filterRoot: function () {
    var ctx = this;
    var temp = [];
    var roots = [];
    ctx.composite = false;
    /* ctx.collection.comparator = function (model) {
     return model.get('sort');
     }
     ctx.collection.sort();*/
    Est.each(ctx.collection.models, function (item) {
      debug(function () {
        if (Est.typeOf(item['attributes'][ctx._options.categoryId]) === 'undefined') {
          return 'Error5 currentId = ' + ctx._options.categoryId + ';url=' + ctx.collection.url;
        }
        if (Est.typeOf(item['attributes'][ctx._options.parentId]) === 'undefined') {
          return  'Error6 currentId=' + ctx._options.parentId + ';url=' + ctx.collection.url;
        }
      }, {type: 'error'});
      temp.push({
        categoryId: item['attributes'][ctx._options.categoryId],
        belongId: item['attributes'][ctx._options.parentId]
      });
    });
    this.collection.each(function (thisModel) {
      var i = temp.length, _children = [];
      while (i > 0) {
        var item = temp[i - 1];
        if (item.belongId === thisModel.get(ctx._options.categoryId)) {
          _children.unshift(item.categoryId);
          temp.splice(i - 1, 1);
        }
        i--;
      }
      thisModel.set('children', _children);
      // 添加父级元素

      if (Est.typeOf(ctx._options.rootValue) === 'array') {
        //TODO 如果存入的rootValue为数组
        Est.each(ctx._options.rootValue, Est.proxy(function (item) {
          if (Est.typeOf(item) === 'function') {
            // 判断是否是方法， 如果返回true则添加到roots中
            if (item.call(this, item)) {
              thisModel.set('level', 1);
              roots.push(thisModel);
            }
          } else {
            if (!Est.isEmpty(item) && thisModel.get(ctx._options.rootId) && thisModel.get(ctx._options.rootId).indexOf(item) > -1) {
              // 判断不为null 且索引是否大于-1
              thisModel.set('level', 1);
              roots.push(thisModel);
            } else if (thisModel.get(ctx._options.rootId) === item) {
              // 如果为null值， 则直接===比较， true则添加到roots中
              thisModel.set('level', 1);
              roots.push(thisModel);
            }
          }
        }, this));
      } else if (thisModel.get(ctx._options.rootId) === ctx._options.rootValue) {
        thisModel.set('level', 1);
        roots.push(thisModel);
      }
    });
    Est.each(roots, function (model) {
      ctx._addOne(model);
    });
  },
  /**
   * 向视图添加元素
   *
   * @method [private] - _addOne
   * @private
   * @param model
   * @author wyj 14.11.16
   */
  _addOne: function (model, arg1, arg2) {
    var ctx = this;
    if (!this.filter && !this.composite && this.dx < this._options.max) {
      model.set('dx', this.dx++);
      switch (this._options.speed) {
        case 1:
          model.set('_options', {});
          break;
        case 9:
          model.set('_options', {
            _speed: this._options.speed,
            _item: ctx._options.item,
            _items: ctx._options.items ? true : false,
            _model: ctx._options.model,
            _collection: Est.isEmpty(ctx._options.subRender) ? null : ctx.collection,
            _subRender: ctx._options.subRender,
            _collapse: ctx._options.collapse,
            _extend: ctx._options.extend,
            _checkAppend: ctx._options.checkAppend,
            _data: ctx.options.data || ctx._options.data
          });
      }
      //app.addData('maxSort', model.get('dx') + 1);
      var itemView = new this.item({
        model: model,
        viewId: this._options.viewId,
        speed: this._options.speed,
        data: this._data,
        views: this.views,
        itemTemp: this._options.itemTemp
      });
      itemView._setInitModel(this.initModel);
      //TODO 优先级 new对象里的viewId > _options > getCurrentView()
      itemView._setViewId(this._options.viewId || app.getCurrentView());

      if (arg2 && arg2.at < this.dx - 1 &&
        this.collection.models.length > 1) {
        this.collection.models[arg2.at === 0 ? 0 :
          arg2.at - 1].view.$el.after(itemView._render().el);
      } else {
        this.list.append(itemView._render().el);
      }
      this.views.push(itemView);
    }
  },
  /**
   * 向列表中添加数据
   * @method [集合] - _push ( 向列表中添加数据 )
   * @param model
   * @param opts
   * @author wyj 15.6.10
   * @example
   *        this._push(new model());
   *        this._push(new model(), 0); // 表示在第一个元素后面添加新元素
   *        this._push(new pictureModel(model), this._findIndex(curModel) + 1);
   */
  _push: function (model, index) {
    debug('BaseList._push');
    // 判断第二个参数是否是数字， 否-> 取当前列表的最后一个元素的索引值
    // 判断index是否大于列表长度
    // 若存在items， 则相应插入元素
    var obj, index = Est.typeOf(index) === 'number' ? index + 1 : this.collection.models.length === 0 ? 0 : this.collection.models.length;
    var opts = {at: index > this.collection.models.length + 1 ?
      this.collection.models.length : index};
    if (this._options.items) {
      obj = Est.typeOf(model) === 'array' ? Est.pluck(model, function (item) {
        return item.attributes;
      }) : model.attributes;
      this._options.items.splice(opts.at - 1, 0, obj);
    }
    this.collection.push(model, opts);
    this._resetDx();
  },
  /**
   * 重新排序dx列表
   * @method [private] - _resetDx
   * @private
   * @author wyj 15.9.3
   */
  _resetDx: function () {
    debug('BaseList._resetDx');
    var _dx = 0;
    Est.each(this.collection.models, function (item) {
      item.set('dx', _dx);
      _dx++;
    });
  },
  /**
   * 获取当前模型类在集合类中的索引值
   * @method [集合] - _findIndex ( 索引值 )
   * @param model
   * @return {number}
   * @author wyj 15.6.10
   * @example
   *      this._findIndex(this.curModel); ==> 1
   */
  _findIndex: function (model) {
    return Est.findIndex(this.collection.models, {cid: model.cid});
  },
  /**
   * 过滤集合
   *
   * @method [private] - _filterCollection
   * @private
   * @author wyj 15.1.10
   */
  _filterCollection: function () {
    debug('BaseList._filterCollection');
    this._filter(this._options.filter, this._options);
  },
  /**
   * 静态分页
   *
   * @method [private] - _renderListByPagination
   * @private
   * @author wyj 15.1.8
   */
  _renderListByPagination: function () {
    debug('BaseList._renderListByPagination');
    this.page = this.collection.paginationModel.get('page');
    this.pageSize = this.collection.paginationModel.get('pageSize');
    this.startIndex = (this.page - 1) * this.pageSize;
    this.endIndex = this.startIndex + this.pageSize;

    for (var i = this.startIndex; i < this.endIndex; i++) {
      this.collection.push(this._options.items[i]);
    }
    // 渲染分页
    this.collection.paginationModel.set('count', this.collection.models.length);
    this.collection._paginationRender();
    return this.collection;
  },

  /**
   * 清空列表， 并移除所有绑定的事件
   *
   * @method [集合] - _empty ( 清空列表 )
   * @author wyj 14.11.16
   * @private
   * @example
   *      this._empty();
   */
  _empty: function () {
    this.dx = 0;
    debug('BaseList._empty');
    if (this._options.append) {
      return this.collection;
    }
    if (this.collection &&!this.collection.remove){
      debugger
    }
    this.collection._reset && this.collection._reset();
    if (this.collection) {
      var len = this.collection.length;
      while (len > -1) {
        this.collection.remove(this.collection[len]);
        len--;
      }
    }
    // 设置当前页的起始索引， 如每页显示20条，第2页为20
    if (this.collection.paginationModel) {
      this.dx = (this.collection.paginationModel.get('pageSize') || 16) *
        ((this.collection.paginationModel.get('page') - 1) || 0);
    }
    //遍历views数组，并对每个view调用Backbone的remove
    Est.each(this.views, function (view) {
      view.remove().off();
    })
    //清空views数组，此时旧的view就变成没有任何被引用的不可达对象了
    //垃圾回收器会回收它们
    this.views = [];
    //this.list.empty();
    return this.collection;
  },
  /**
   * 清空DOM列表
   *
   * @method [集合] - _clear ( 清空DOM列表 )
   * @author wyj 15.1.24
   * @private
   * @example
   *        this._clear();
   */
  _clear: function () {
    debug('BaseList._clear');
    this._empty.call(this);
    this.list.empty();
    this.collection.models.length = 0;
  },
  /**
   * 添加所有元素， 相当于刷新视图
   *
   * @method [private] - _addAll
   * @private
   * @author wyj 14.11.16
   */
  _addAll: function () {
    debug('BaseList._addAll and call this._empty');
    this._empty();
    this.collection.each(this._addOne, this);
  },
  /**
   * 搜索
   *
   * @method [搜索] - _search ( 搜索 )
   * @param options [onBeforeAdd: 自定义过滤]
   * @author wyj 14.12.8
   * @example
   *      this._search({
       *        filter: [
       *         {key: 'name', value: this.searchKey },
       *         {key: 'prodtype', value: this.searchProdtype} ,
       *         {key: 'category', value: this.searchCategory},
       *         {key: 'loginView', value: this.searchLoginView},
       *         {key: 'ads', value: this.searchAds}
       *         ],
       *        onBeforeAdd: function(item){
       *          // 自定义过滤， 即通过上面的filter后还需要经过这一层过滤
       *          // 若通过返回true
       *          return item.attributes[obj.key].indexOf(obj.value) !== -1;
       *       }});
   */
  _search: function (options) {
    debug('BaseList._search');
    var ctx = this;
    this._clear();
    this.filter = true;
    options = Est.extend({ onBeforeAdd: function () {
    }}, options);
    this._load({ page: 1, pageSize: 5000,
      afterLoad: function () {
        ctx.filter = false;
        if (!ctx._options.items) {
          ctx._filter(options.filter || ctx._options.filter, options);
        } else {
          ctx._filterItems(options.filter || ctx._options.filter, options);
        }
      }
    });
  },
  /**
   * 过滤collection
   *
   * @method [private] - _filter
   * @param array
   * @param options
   * @private
   * @author wyj 14.12.8
   */
  _filter: function (array, options) {
    debug('BaseList._filter');
    var ctx = this;
    var result = [];
    var len = ctx.collection.models.length;
    ctx.filter = false;
    while (len > 0) {
      if (this._check()) len = -1;

      var item = ctx.collection.models[len - 1];
      var pass = true;

      Est.each(array, function (obj) {
        var match = false;
        var keyval = Est.getValue(item.attributes, obj.key);

        if (Est.typeOf(obj.match) === 'regexp') {
          match = !obj.match.test(keyval);
        } else {
          match = Est.isEmpty(keyval) || (keyval.indexOf(obj.value) === -1);
        }
        if (pass && !Est.isEmpty(obj.value) && match) {
          ctx.collection.remove(item);
          pass = false;
          return false;
        }
      });
      if (pass && options.onBeforeAdd) {
        var _before_add_result = options.onBeforeAdd.call(this, item);
        if (Est.typeOf(_before_add_result) === 'boolean' && !_before_add_result) {
          pass = false;
        }
      }
      if (pass) {
        result.unshift(item);
      }
      len--;
    }
    Est.each(result, function (item) {
      item.set('_isSearch', true);
      ctx._addOne(item);
    });
  },
  /**
   * 过滤items
   *
   * @method [private] - _filterItems
   * @param array
   * @param options
   * @private
   * @author wyj 14.12.8
   */
  _filterItems: function (array, options) {
    debug('BaseList._filterItems');
    var ctx = this;
    var result = [];
    var items = Est.cloneDeep(ctx._options.items);
    var len = items.length;
    ctx.filter = false;
    while (len > 0) {
      if (this._check()) break;
      var item = items[len - 1];
      var pass = true;
      Est.each(array, function (obj) {
        var match = false;
        var keyval = Est.getValue(item, obj.key);
        if (Est.typeOf(obj.match) === 'regexp') {
          match = !obj.match.test(keyval);
        } else {
          match = Est.isEmpty(keyval) || (keyval.indexOf(obj.value) === -1);
        }
        if (pass && !Est.isEmpty(obj.value) && match) {
          items.splice(len, 1);
          pass = false;
          return false;
        }
      });
      if (pass && options.onBeforeAdd) {
        var _before_add_result = options.onBeforeAdd.call(this, item);
        if (Est.typeOf(_before_add_result) === 'boolean' && !_before_add_result) {
          pass = false;
        }
      }
      if (pass) {
        result.unshift(item);
      }
      len--;
    }
    Est.each(result, function (item) {
      item = new ctx.initModel(item);
      item.set('_isSearch', true);
      ctx.collection.push(item);
      //ctx._addOne(item);
    });
  },
  /**
   * 弹出查看详细信息对话框
   *
   * @method [详细] - _detail ( 查看详细 )
   * @param options [title: 标题][width: 宽度][height: 高度][padding: 内补丁]
   *                [url: 地址][hideSaveBtn: 隐藏保存按钮][hideResetBtn: 隐藏重置按钮]
   *                [oniframeload: 页面载入后回调， 参数为window对象]
   * @author wyj 14.11.16
   * @example
   *      this._detail({
       *        title: '产品添加',
       *        url: CONST.HOST + '/modules/product/product_detail.html?time=' + new Date().getTime(),
       *        hideSaveBtn: true,
       *        hideResetBtn: true,
       *        end: '', // url 后附加内容 如： '$attId=' + attId
       *        load: function(win){
       *        }
       *      });
   */
  _detail: function (options) {
    debug('BaseList._detail');
    options = options || {};
    if (options.end) {
      options.end = '?' + options.end + '&';
    } else {
      options.end = '';
    }
    var ctx = this;
    seajs.use(['dialog-plus'], function (dialog) {
      window.dialog = dialog;
      var buttons = [];
      if (!options.hideSaveBtn) {
        buttons.push({
          value: CONST.LANG.SAVE,
          callback: function () {
            this.title(CONST.SUBMIT_TIP);
            this.iframeNode.contentWindow.$("#submit").click();
            return false;
          },
          autofocus: true
        });
      }
      /* if (!options.hideResetBtn) {
       buttons.push({
       value: '重置',
       callback: function () {
       this.iframeNode.contentWindow.$("#reset").click();
       return false;
       }
       });
       }*/
      buttons.push({ value: CONST.LANG.CLOSE });
      debug(function () {
        if (Est.isEmpty(ctx._options.detail) && Est.isEmpty(options.url)) {
          return 'Error7  url=' + (options.url || ctx._options.detail + options.end);
        }
      }, {type: 'error'});
      window.detailDialog = dialog({
        id: 'detail-dialog',
        title: options.title || CONST.LANG.ADD,
        height: options.height || 'auto',
        width: options.width || 850,
        padding: options.padding || 0,
        url: options.url || ctx._options.detail + options.end,
        button: buttons,
        oniframeload: function () {
          this.iframeNode.contentWindow.topDialog = window.detailDialog;
          this.iframeNode.contentWindow.app = app;
          delete app.getRoutes()['index'];
          options.load && options.load.call(this, this.iframeNode.contentWindow);
          //this.iframeNode.contentWindow.maxSort = app.getData('maxSort');
        },
        onclose: function () {
          if (ctx._options.subRender) {
            ctx.composite = true;
          }
          ctx.collection._load(ctx.collection, ctx).
            then(function () {
              if (ctx._options.subRender) {
                ctx.composite = true;
                ctx._filterRoot();
              }
              /* else {
               ctx._render();
               }*/
            });
          this.remove();
          window.detailDialog = null;
          if (this.returnValue) {
            $('#value').html(this.returnValue);
          }
        }
      });
      window.detailDialog.showModal();
    });
    return false;
  },
  /**
   * 全选checkbox选择框, 只能全选中， 不能全不选中
   *
   * @method [选取] - _toggleAllChecked ( 全选checkbox选择框 )
   * @author wyj 14.11.16
   */
  _toggleAllChecked: function () {
    debug('BaseList._toggleAllChecked');
    var checked = this.allCheckbox.checked;
    this.collection.each(function (product) {
      product.set('checked', checked);
    });
  },
  /**
   * 保存sort值
   *
   * @method [保存] - _saveSort ( 保存sort值 )
   * @param model
   * @author wyj 14.12.4
   */
  _saveSort: function (model) {
    var sortOpt = { id: model.get('id') };
    sortOpt[this._options.sortField || 'sort'] = model.get(this._options.sortField);
    model._saveField(sortOpt, this, { async: false, hideTip: true});
  },
  /**
   * 插序 常用于sortable
   *
   * @method [移动] - _insertOrder
   * @param begin
   * @param end
   * @author wyj 15.9.26
   * @example
   *    this._insertOrder(1, 6);
   */
  _insertOrder: function (begin, end) {
    if (begin < end) {
      end++;
    }
    Est.arrayInsert(this.collection.models, begin, end, {callback: function (list) {
    }});
    this._resetDx();
  },
  /**
   * 交换位置
   *
   * @method [private] - _exchangeOrder
   * @param original_index
   * @param new_index
   * @param options
   * @return {BaseList}
   * @private
   * @author wyj 14.12.5
   */
  _exchangeOrder: function (original_index, new_index, options) {
    var tempObj = {}, nextObj = {};
    var temp = this.collection.at(original_index);
    var next = this.collection.at(new_index);
    // 互换dx
    if (temp.view && next.view) {
      var thisDx = temp.view.model.get('dx');
      var nextDx = next.view.model.get('dx');
      tempObj['dx'] = nextDx;
      nextObj['dx'] = thisDx;
    }
    // 互换sort值
    if (options.path) {
      var thisValue = temp.view.model.get(options.path);
      var nextValue = next.view.model.get(options.path);
      tempObj[options.path] = nextValue;
      nextObj[options.path] = thisValue;
    }
    temp.view.model.stopCollapse = true;
    next.view.model.stopCollapse = true;
    temp.view.model.set(tempObj);
    next.view.model.set(nextObj);

    // 交换model
    this.collection.models[new_index] = this.collection.models.splice(original_index, 1, this.collection.models[new_index])[0];
    // 交换位置
    if (original_index < new_index) {
      temp.view.$el.before(next.view.$el).removeClass('hover');
    } else {
      temp.view.$el.after(next.view.$el).removeClass('hover');
    }
    if (options.success) {
      options.success.call(this, temp, next);
    }
    return this
  },
  /**
   * 上移, 默认以sort为字段进行上移操作， 如果字段不为sort， 则需重载并设置options
   *
   * @method [移动] - _moveUp ( 上移 )
   * @param model
   * @author wyj 14.12.4
   * @example
   *      app.getView('attributesList')._setOption({
       *        sortField: 'orderList'
       *      })._moveUp(this.model);
   */
  _moveUp: function (model) {
    debug('BaseList._moveUp');
    var ctx = this;
    var first = this.collection.indexOf(model);
    var last, parentId;
    var result = [];
    if (this._options.subRender) {
      parentId = model.get(this._options.parentId);
      this.collection.each(function (thisModel) {
        if (parentId === thisModel.get(ctx._options.parentId)) {
          result.push(thisModel);
        }
      });
      //TODO 找出下一个元素的索引值
      var thisDx = Est.findIndex(result, function (item) {
        return item.get('id') === model.get('id');
      });
      if (thisDx === 0) return;
      last = this.collection.indexOf(result[thisDx - 1]);
    } else {
      if (first === 0) return;
      last = first - 1;
    }
    //model.stopCollapse = true;
    this._exchangeOrder(first, last, {
      path: this.sortField || 'sort',
      success: function (thisNode, nextNode) {
        if (thisNode.get('id') && nextNode.get('id')) {
          this._saveSort(thisNode);
          this._saveSort(nextNode);
          thisNode.stopCollapse = false;
          nextNode.stopCollapse = false;
        } else {
          debug('Error8');
        }
      }
    });
  },
  /**
   * 下移
   *
   * @method [移动] - _moveDown ( 下移 )
   * @param model
   * @author wyj 14.12.4
   */
  _moveDown: function (model) {
    debug('BaseList._moveDown');
    var ctx = this;
    var first = this.collection.indexOf(model);
    var last, parentId;
    var result = [];
    if (this._options.subRender) {
      parentId = model.get(ctx._options.parentId);
      this.collection.each(function (thisModel) {
        if (parentId === thisModel.get(ctx._options.parentId)) {
          result.push(thisModel);
        }
      });
      //TODO 找出上一个元素的索引值
      var thisDx = Est.findIndex(result, function (item) {
        return item.get('id') === model.get('id');
      });
      if (thisDx === result.length - 1) return;
      last = this.collection.indexOf(result[thisDx + 1]);
    } else {
      if (first === this.collection.models.length - 1) return;
      last = first + 1;
    }
    //model.stopCollapse = true;
    this._exchangeOrder(first, last, {
      path: this._options.sortField,
      success: function (thisNode, nextNode) {
        if (thisNode.get('id') && nextNode.get('id')) {
          this._saveSort(thisNode);
          this._saveSort(nextNode);
          thisNode.stopCollapse = false;
          nextNode.stopCollapse = false;
        } else {
          debug('Error8');
        }
      }
    });
  },
  /**
   *  获取checkbox选中项所有ID值列表
   *
   * @method [选取] - _getCheckboxIds ( 获取checkbox选中项所有ID值列表 )
   * @return {*}
   * @author wyj 14.12.8
   * @example
   *      this._getCheckboxIds(); => ['id1', 'id2', 'id3', ...]
   */
  _getCheckboxIds: function (field) {
    return Est.pluck(this._getCheckedItems(), Est.isEmpty(field) ? 'id' : ('attributes.' + field));
  },
  /**
   *  获取checkbox选中项
   *
   * @method [选取] - _getCheckedItems ( 获取checkbox选中项 )
   * @return {*}
   * @author wyj 14.12.8
   * @example
   *      this._getCheckedItems(); => [{}, {}, {}, ...]
   */
  _getCheckedItems: function () {
    return Est.filter(this.collection.models, function (item) {
      return item.attributes.checked;
    });
  },
  /**
   * 转换成[{key: '', value: ''}, ... ] 数组格式 并返回
   *
   * @method [集合] - _getItems ( 获取所有列表项 )
   * @author wyj 15.1.15
   * @example
   *      app.getView('productList').getItems();
   */
  _getItems: function () {
    return Est.pluck(this.collection.models, 'attributes');
  },
  /**
   * 获取集合中某个元素
   *
   * @method [集合] - getItem ( 获取集合中某个元素 )
   * @param index
   * @return {*}
   * @author wyj 15.5.22
   */
  _getItem: function (index) {
    var list = this._getItems();
    index = index || 0;
    if (list.length > index) return list[index];
    return null;
  },
  /**
   * 向集合末尾添加元素
   *
   * @method [集合] - _add ( 向集合末尾添加元素 )
   * @author wyj 15.1.15
   * @example
   *      app.getView('productList')._add(new model());
   */
  _add: function (model) {
    this.collection.push(model);
  },
  /**
   * 批量删除， 隐藏等基础接口
   *
   * @method [批量] - _batch ( 批量删除 )
   * @param options [url: 批量请求地址] [tip: 操作成功后的消息提示]
   * @author wyj 14.12.14
   * @example
   *        this._batch({
                url: ctx.collection.batchDel,
                tip: '删除成功'
              });
   *
   */
  _batch: function (options) {
    var ctx = this;
    options = Est.extend({
      tip: CONST.LANG.SUCCESS + '！'
    }, options);
    this.checkboxIds = this._getCheckboxIds();
    if (this.checkboxIds.length === 0) {
      BaseUtils.initTip(CONST.LANG.SELECT_ONE + '！');
      return;
    }
    $.ajax({
      type: 'POST', async: false, url: options.url,
      data: { ids: ctx.checkboxIds.join(',') },
      success: function (result) {
        if (!result.success) {
          BaseUtils.initTip(result.msg);
        } else
          BaseUtils.initTip(options.tip);
        ctx._load();
      }
    });
  },
  /**
   * 批量删除
   *
   * @method [批量] - _batchDel ( 批量删除 )
   * @param options
   * @author wyj 14.12.14
   * @example
   *      this._batchDel({
       *        url: CONST.API + '/message/batch/del'
       *      });
   */
  _batchDel: function (options) {
    var ctx = this;
    this.checkboxIds = this._getCheckboxIds();
    if (this.checkboxIds && this.checkboxIds.length === 0) {
      BaseUtils.initTip(CONST.LANG.SELECT_ONE);
      return;
    }
    BaseUtils.initConfirm({
      success: function () {
        ctx._batch({
          url: ctx.collection.batchDel,
          tip: CONST.LANG.DEL_SUCCESS
        });
      }
    });
  },
  /**
   * 使所有的checkbox初始化为未选择状态
   *
   * @method [选取] - _clearChecked ( 所有选取设置为未选择状态 )
   * @author wyj 14.12.14
   * @example
   *      this._clearChecked();
   */
  _clearChecked: function () {
    Est.each(this.collection.models, function (model) {
      model.attributes['checked'] = false;
    });
  }
});

/**
 * @description 单视图
 *
 *  - el: 目标元素Id 如 "#jhw-main"
 *  - tagName: 'tr',
 *  - className: 'bui-grid-row',
 *  - events: {
 *     'click .btn-del': '_del', // 删除
       'click .btn-move-up': '_moveUp', // 上移
       'click .btn-move-down': '_moveDown', // 下移
       'click .btn-toggle': '_toggleChecked',// 全选按钮
       'change .input-sort': '_saveSort', // 保存sort字段
       'click .btn-more': '_more', // 更多
 *  }，
 *  - initialize: function(){this._render()}
 *  - render: function(){this._render()}
 *
 * @class BaseItem - 单视图
 * @author yongjin<zjut_wyj@163.com> 2014/12/8
 */

var BaseItem = SuperView.extend({
  /**
   * 初始化, 若该视图的子元素有hover选择符， 则自动为其添加鼠标经过显示隐藏事件
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @param {Object} options [template: 模板字符串]
   * @author wyj 14.11.16
   * @example
   *        this._initialize({
       *            template: itemTemp, // 模板字符串
       *            // 可选
       *            modelBind: false, // 绑定模型类， 比如文本框内容改变， 模型类相应改变; 当元素为checkbox是， 需设置true-value="01" false-value="00",
       *            若不设置默认为true/false
       *            detail: '#/product', // 详细页面路由  如果不是以dialog形式弹出时 ， 此项不能少 , 且开头为“#/”  需配置路由如： app.addRoute('product/:id', function (id) {
                            productDetail(Est.decodeId(id, 'Product_', 32));
                            }); 如果需要弹出对话框， 则route为具体的详细页模块 如：ProductDetail
                    encodeUrl: false, // 是否缩减url    如： #/product/Product_000000000000000000099 =>> #/product/99  路由中需解码：Est.decodeId(id, 'Product_', 32)
       *            filter: function(model){ // 过滤模型类
       *            },
       *            beforeRender: function(model){},
       *            afterRender: function(model){},
       *            enterRender: '#submit' // 执行回车后的按钮点击的元素选择符
       *        });
   */
  _initialize: function (options) {
    this._initOptions(options);
    this._initCollapse(this.model.get('_options'));
    this._initTemplate(this._options);
    this._initBind(this._options);
    this._initView(this._options);
    this._initStyle(this._options);
    this._initEnterEvent(this._options);
  },
  /**
   * 初始化参数
   *
   * @method [private] - _initOptions
   * @private
   * @author wyj 15.1.12
   */
  _initOptions: function (options) {
    this._options = Est.extend(this.options, options || {});
    this._options.speed = this._options.speed || 9;
  },
  /**
   * 初始化展开收缩
   *
   * @method [private] - _initCollapse
   * @param options
   * @private
   * @author wyj 15.2.14
   */
  _initCollapse: function (options) {
    if (options._speed > 1) {
      this.model.stopCollapse = false;
      this.collapsed = options ? options._extend : false;
    }
  },
  /**
   * 初始化模板， 若传递一个Template模板字符中进来， 则渲染页面
   *
   * @method [private] - _initTemplate
   * @private
   * @author wyj 15.1.12
   */
  _initTemplate: function (options) {
    options.template = options.template || options.itemTemp;
    if (options.template) {
      this.$template = '<div>' + options.template + '</div>';
      if (options.viewId) {
        if (!app.getCompileTemp(options.viewId))
          app.addCompileTemp(options.viewId, Handlebars.compile(options.template));
      } else {
        this.template = Handlebars.compile(options.template);
      }
    }
  },
  /**
   * 绑定事件， 如添加事件， 重置事件
   *
   * @method [private] - _initBind
   * @private
   * @author wyj 14.11.16
   */
  _initBind: function (options) {
    if (options.speed > 1) {
      this.model.bind('reset', this.render, this);
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    }
  },
  /**
   * 初始化视图
   *
   * @method [private] - _initView
   * @param options
   * @private
   * @author wyj 15.2.14
   */
  _initView: function (options) {
    if (options.speed > 1) {
      if (this.model.view) this.model.view.remove();
      this.model.view = this;
    }
  },
  /**
   * 初始化样式
   *
   * @method [private] - _initStyle
   * @private
   * @author wyj 15.2.14
   */
  _initStyle: function (options) {
    if (options.speed > 1) {
      var item_id = this.model.get('id') ? (this.model.get('id') + '') : (this.model.get('dx') + 1 + '');
      if (this.model.get('dx') % 2 === 0) this.$el.addClass('bui-grid-row-even');
      this.$el.addClass('_item_el_' + (this._options.viewId || '') + '_' + item_id.replace(/^[^1-9]+/, ""));
      this.$el.hover(function () {
        $(this).addClass('hover');
      }, function () {
        $(this).removeClass('hover');
      });
    }
  },
  /**
   * 渲染
   *
   * @method [渲染] - _render ( 渲染 )
   * @return {BaseCollection}
   * @author wyj 14.11.18
   */
  _render: function () {
    debug('10.BaseItem._render');
    this._onBeforeRender();
    if (this._options && this._options.filter)
      this._options.filter.call(this, this.model);
    //TODO 添加判断是否存在this.$el debug
    //debug('BaseItem里的this.$el为空， 检查document中是否存在， 或设置传入的options.el为jquery对象(有时是DOM片段)', {type: 'error'});
    this.$el.html(this.template ? this.template(this.model.toJSON()) :
      this._options.viewId && app.getCompileTemp(this._options.viewId) && app.getCompileTemp(this._options.viewId)(this.model.toJSON()));
    if (this._options.modelBind) this._modelBind();
    //TODO 判断是否存在子元素
    var modelOptions = this.model.get('_options');
    if (modelOptions && modelOptions._subRender && this.model.get('children') &&

      this.model.get('children').length > 0) {
      // Build child views, insert and render each
      var ctx = this;
      var childView = null;
      var level = this.model.get('level') || 1;

      var tree = this.$(modelOptions._subRender + ':first');
      this._setupEvents(modelOptions);

      _.each(this.model._getChildren(modelOptions._collection), function (newmodel) {
        var childView = null;

        if (modelOptions._items) {
          newmodel = new modelOptions._model(newmodel);
        }
        debug(function () {
          if (Est.isEmpty(newmodel)) {
            return 'Error20';
          }
        }, {type: 'error'});
        newmodel.set('_options', modelOptions);
        newmodel.set('level', level + 1);

        childView = new modelOptions._item({
          model: newmodel,
          data: ctx._options._data
        });
        childView._setInitModel(ctx.initModel);
        childView._setViewId(ctx._options.viewId);
        //TODO 解决子类下的移序问题
        newmodel.view = childView;

        tree.append(childView.$el);
        if (ctx._options.views) {
          ctx._options.views.push(childView);
        }
        childView._render();
      });
      /* Apply some extra styling to views with children */
      if (childView) {
        // Add bootstrap plus/minus icon
        //this.$('> .node-collapse').prepend($('<i class="icon-plus"/>'));
        // Fixup css on last item to improve look of tree
        //childView.$el.addClass('last-item').before($('<li/>').addClass('dummy-item'));
      }
    }
    this._onAfterRender();
    return this;
  },
  /**
   * 设置viewId
   *
   * @method [参数] - _setViewId ( 设置viewId )
   * @param name
   * @author wyj 14.12.20
   */
  _setViewId: function (name) {
    if (this._options) this._options.viewId = name;
  },
  /**
   * 设置模型类
   *
   * @method [private] - _setInitModel
   * @private
   * @param model
   * @author wyj 14.11.20
   */
  _setInitModel: function (model) {
    this.initModel = model;
  },
  /**
   * 绑定展开收缩事件
   *
   * @method [private] - _setupEvents
   * @private
   * @author wyj 14.12.9
   */
  _setupEvents: function (opts) {
    // Hack to get around event delegation not supporting ">" selector
    var that = this;
    that._toggleCollapse.call(this, opts);
    this.$(opts._collapse + ':first').click(function () {
      that._toggleCollapse.call(that, opts);
    });
  },
  /**
   * 展开收缩
   *
   * @method [private] - _toggleCollapse
   * @private
   * @author wyj 14.12.9
   */
  _toggleCollapse: function (opts) {
    var ctx = this;
    if (this.model.stopCollapse) {
      this.$(opts._subRender + ':first').addClass('hide');
      return;
    }
    ctx.collapsed = !ctx.collapsed;

    if (ctx.collapsed) {
      this.$(opts._collapse + ':first').removeClass('x-caret-down');
      this.$(opts._subRender + ':first').slideUp(CONST.COLLAPSE_SPEED).addClass('hide');
    }
    else {
      this.$(opts._collapse + ':first').addClass('x-caret-down');
      this.$(opts._subRender + ':first').slideDown(CONST.COLLAPSE_SPEED).removeClass('hide');
    }
  },
  /**
   * 渲染前事件
   *
   * @method [private] - _onBeforeRender
   * @private
   * @author wyj 14.12.3
   */
  _onBeforeRender: function () {
    this._options.beforeRender && this._options.beforeRender.call(this, this.model);
  },
  /**
   * 渲染后事件
   *
   * @method [private] - _onAfterRender
   * @private
   * @author wyj 14.12.3
   */
  _onAfterRender: function () {
    if (this._options.toolTip) this._initToolTip();
    this._options.afterRender && this._options.afterRender.call(this, this.model);
  },
  /**
   * 移除监听
   *
   * @method [private] - _close
   * @private
   * @author wyj 14.11.16
   */
  _close: function () {
    debug('BaseItem._close');
    this.stopListening();
  },
  /**
   * 移除此模型
   *
   * @method [private] - _clear
   * @private
   * @author wyj 14.11.16
   */
  _clear: function () {
    debug('ProductItem._clear');
    this.model.destroy();
  },
  /**
   * checkbox选择框转换
   *
   * @method [选取] - _toggleChecked ( checkbox选择框转换 )
   * @author wyj 14.11.16
   * @example
   *      itemClick: function(e){
       *        e.stopImmediatePropagation();
       *        this.loadPhoto();
       *        this._toggleChecked(e);
       *      }
   */
  _toggleChecked: function (e) {
    var checked = this.model.get('checked');
    this._checkAppend = typeof this.model.get('_options')._checkAppend === 'undefined' ? true :
      this.model.get('_options')._checkAppend;
    if (!this._checkAppend) {
      if (this._options.viewId) {
        app.getView(this._options.viewId) && app.getView(this._options.viewId)._clearChecked();
      } else {
        debug('Error21', {type: 'error'});
      }
    }
    this.model.attributes['checked'] = !checked;
    if (this.model.get('checked')) {
      this._itemActive({
        add: this._checkAppend
      });
    } else {
      //this.$el.removeClass('item-active');
    }
    //TODO shift + 多选
    if (e && e.shiftKey) {
      var beginDx = app.getData('curChecked');
      var endDx = this.model.collection.indexOf(this.model);
      Est.each(this.model.collection.models, function (model) {
        if (model.get('dx') > beginDx && model.get('dx') < endDx) {
          model.set('checked', true);
          model.view.$el.addClass('item-active');
        }
      });
    } else {
      app.addData('curChecked', this.model.collection.indexOf(this.model));
    }
    e && e.stopImmediatePropagation();
  },
  /**
   * 添加当前ITEM的CLASS为item-active
   *
   * @method [选取] - _itemActive ( 设置为选中状态 )
   * @param options [add: true 是否为添加模式]
   * @author wyj 14.12.13
   * @example
   *        this._itemActive({
   *          add: true         //是否为添加模式
   *        });
   */
  _itemActive: function (options) {
    options = options || {};
    if (!app.getData('itemActiveList' + this._options.viewId))
      app.addData('itemActiveList' + this._options.viewId, []);
    var list = app.getData('itemActiveList' + this._options.viewId);
    if (!options.add) {
      debug('BaseItem._itemActive');
      Est.each(list, Est.proxy(function (selecter) {
        var node = $('.' + selecter, app.getView(this._options.viewId) ?
          app.getView(this._options.viewId).$el : $("body"));
        //TODO 当为单选时
        //node.find('.toggle:first').click();
        node.removeClass('item-active');
        //node.find('.toggle').click();
      }, this));
      list.length = 0;
    }
    this.$el.addClass('item-active');

    list.push(this.$el.attr('class').replace(/^.*(_item_el_.+?)\s+.*$/g, "$1"));
  },
  /**
   * 上移
   *
   * @method [移动] - _moveUp ( 上移 )
   * @param e
   * @author wyj 14.12.14
   */
  _moveUp: function (e) {
    e.stopImmediatePropagation();
    this._itemActive();
    this.collapsed = true;
    if (!this._options.viewId) {
      debug('Error22', { type: 'error' });
      return false;
    }
    app.getView(this._options.viewId)._moveUp(this.model);
  },
  /**
   * 下移
   *
   * @method [移动] - _moveDown ( 下移 )
   * @param e
   * @author wyj 14.12.14
   */
  _moveDown: function (e) {
    e.stopImmediatePropagation();
    this._itemActive();
    this.collapsed = true;
    if (!this._options.viewId) {
      debug('Error23', {
        type: 'error'
      });
      return false;
    }
    app.getView(this._options.viewId)._moveDown(this.model);
  },
  /**
   * 保存sort排序
   *
   * @method [保存] - _saveSort ( 保存sort排序 )
   * @author wyj 14.12.14
   */
  _saveSort: function () {
    var ctx = this;
    var sort = this.$('.input-sort').val();
    this.model._saveField({ id: this.model.get('id'), sort: sort
    }, ctx, { success: function () {
      ctx.model.set('sort', sort);
    }, hideTip: true
    });
  },
  /**
   * 获取当前列表第几页
   *
   * @method [分页] - _getPage ( 获取当前列表第几页 )
   * @return {*}
   * @author wyj 14.12.31
   *
   */
  _getPage: function () {
    var paginationModel = this.model.collection.paginationModel;
    if (!paginationModel) return 1;
    return paginationModel.get('page');
  },
  /**
   * 显示更多按钮
   *
   * @method [渲染] _more ( 显示更多按钮 )
   * @param e
   * @author wyj 15.1.16
   */
  _more: function (e) {
    e.stopImmediatePropagation();
    this.$more = e.target ? $(e.target) : $(e.currentTarget);
    if (!this.$more.hasClass('btn-more')) this.$more = this.$more.parents('.btn-more:first');
    this.$moreOption = this.$more.parent().find('.moreOption');
    this.$icon = this.$more.find('i');
    if (this.$icon.hasClass('icon-chevron-left')) {
      this.$icon.removeClass('icon-chevron-left');
      this.$icon.addClass('icon-chevron-down');
      this.$moreOption.hide();
    } else {
      this.$icon.removeClass('icon-chevron-down');
      this.$icon.addClass('icon-chevron-left');
      this.$moreOption.show().css({
        top: this.$more.position().top,
        right: 37,
        position: 'absolute',
        background: '#fff',
        width: '100%',
        textAlign: 'right',
        "padding-bottom": 2
      });
    }
    $(window).one('click', function () {
      $('.moreOption').hide();
      $('.btn-more').find('i').removeClass('icon-chevron-left');
      $('.btn-more').find('i').addClass('icon-chevron-down');
    });
  },
  /**
   * 单个字段保存
   *
   * @method [修改] - _editField ( 单个字段保存 )
   * @param options [title: 标题][field: 字段名][target: 选择符(对话框指向于哪个元素)]
   * @return {ln.promise}
   * @author wyj 14.11.16
   * @example
   *        this._editField({
       *          title: '修改相册名称',
       *          field: 'name',
       *          target: '.album-name'
       *        });
   */
  _editField: function (options) {
    var ctx = this;
    var $q = Est.promise;
    app.getData('editFieldDialog') && app.getData('editFieldDialog').close();
    return new $q(function (resolve, reject) {
      //context.model.fetch();
      seajs.use(['dialog-plus'], function (dialog) {
        var oldName = ctx.model.attributes[options.field];
        var d = dialog({
          title: options.title || CONST.LANG.EDIT,
          content: '<div style="padding: 20px;"><input id="property-returnValue-demo" type="text" class="text" value="' + (oldName || '') + '" /></div>',
          button: [
            {
              value: CONST.LANG.CONFIRM,
              autofocus: true,
              callback: function () {
                var value = $('#property-returnValue-demo').val();
                this.close(value);
                this.remove();
              }}
          ]
        });
        d.addEventListener('close', function () {
          var obj = {};
          var val = ctx.model.previous(options.field);
          if (this.returnValue.length >= 1 && this.returnValue !== val) {
            obj.id = ctx.model.get('id');
            obj[options.field] = this.returnValue;
            ctx.model._saveField(obj, ctx, {
              success: function (keyValue, result) {
                ctx.model.set(keyValue);
              }
            });
            resolve(ctx, this.returnValue);
          }
        });
        d.show(ctx.$(options.target || 'div').get(0));
        app.addData('editFieldDialog', d);
      })
    });
  },
  /**
   *  删除模型类
   *
   *  @method [删除] - _del ( 删除模型类 )
   *  @author wyj 14.11.16
   */
  _del: function (e, callback) {
    e && e.stopImmediatePropagation();
    debug('1.BaseItem._del');
    var context = this;
    app.getData('delItemDialog') && app.getData('delItemDialog').close();
    if (context.model.get('children').length > 0) {
      BaseUtils.initConfirm({
        title: CONST.LANG.TIP,
        width: 300,
        content: CONST.LANG.DEL_TIP
      });
      return;
    }
    app.addData('delItemDialog', BaseUtils.initConfirm({
      title: CONST.LANG.WARM_TIP,
      content: '<div class="item-delete-confirm">'+CONST.LANG.DEL_CONFIRM+'</div>',
      target: e && this._getTarget(e).get(0),
      success: function (resp) {
        context.model.destroy({
          wait: true,
          error: function (model, resp) {
            var buttons = [];
            buttons.push({ value: CONST.LANG.CONFIRM, callback: function () {
              this.close();
            }, autofocus: true });
            BaseUtils.initDialog({ title: CONST.LANG.TIP + '：', content: resp.msg, width: 250, button: buttons });
          },
          success: function () {
            context._removeFromItems(context.model.get('dx'));
            callback && callback.call(context);
          }
        });
      }
    }));
  },
  /**
   * 从this._options.items中通过dx移除元素
   * @method [集合] - _removeFromItems
   * @param dx
   * @author wyj 15.6.10
   * @example
   *      this._removeFromItems(context.model.get('dx'));
   */
  _removeFromItems: function (dx) {
    if (app.getView(this._options.viewId)) {
      if (app.getView(this._options.viewId)._options.items) {
        Est.removeAt(app.getView(this._options.viewId)._options.items, dx);
      }
      app.getView(this._options.viewId)._resetDx();
    }
  },
  /**
   * 修改模型类
   *
   * @method [修改] - _edit ( 修改模型类 )
   * @param options [title: 标题][width: 宽度][height: 高度]
   *                [url: 地址][reload: 关闭后是否重新从服务器获取数据][close: 关闭回调方法]
   *                [hideSaveBtn: 隐藏保存按钮][hideResetBtn: 隐藏重置按钮][oniframeload: 页面载入后回调]
   * @author wyj 14.11.16
   */
  _edit: function (options) {
    debug('1.BaseItem._edit');
    this._itemActive();
    options = Est.extend({}, options);
    options.detail = this._options.detail || options.detail;
    try {
      if (!this.model.get('_isSearch') && Est.typeOf(options.detail) === 'string'
        && options.detail.indexOf('#/') !== -1) {
        this._navigate(options.detail + '/' + (this._options.encodeUrl ? Est.encodeId(this.model.get('id')) : this.model.get('id')), true);
      } else if (this.model.get('_isSearch') && options.detail.indexOf('#/') !== -1) {
        // 如果是搜索结果列表时， 新建一个窗口
        window.open(options.detail + '/' + (this._options.encodeUrl ? Est.encodeId(this.model.get('id')) : this.model.get('id')));
      } else {
        // 当detail为moduleId时， 以对话框的形式打开
        this._dialog({
          moduleId: options.detail, // 模块ID
          title: CONST.LANG.EDIT, // 对话框标题
          id: this.model.get('id'), // 初始化模块时传入的ID
          width: 1000, // 对话框宽度
          height: 'auto', // 对话框高度
          skin: 'form-horizontal', // className
          onShow: function () {
          }, // 对话框弹出后调用
          onClose: function () {
          }
        }, this);
      }
    } catch (e) {
      debug('Error24' + e);
    }
  }
});

/**
 * @description 基础集合类
 *
 * - url: CONST.API + '/product/list', // 如果是function形式构建的时候，记得带上page 与pageSize; // 可选
 * - batchDel: CONST.API + '/product/batch/del', // 可选
 * - model: ProductModel,
 * - initialize: function(){this._initialize();} // 可选
 *
 * @class BaseCollection 集合类
 * @author yongjin<zjut_wyj@163.com> 2014/11/6
 */

var PaginationModel = Backbone.Model.extend({
  defaults: { page: 1, pageSize: 16, count: 0 },
  initialize: function () {
    debug('3.PaginationModel.initialize');
  }
});

var BaseCollection = Backbone.Collection.extend({
  //localStorage: new Backbone.LocalStorage('base-collection'),
  /**
   * 传递options进来
   *
   * @method [private] - constructor
   * @private
   * @param options
   * @author wyj 14.12.16
   */
  constructor: function (options) {
    this.options = options || {};
    Backbone.Collection.apply(this, [null, arguments]);
  },
  /**
   * 初始化
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @author wyj 14.11.16
   * @example
   initialize: function () {
                this._initialize();
              }
   */
  _initialize: function () {
    debug('2.BaseCollection._initialize');
    this._baseUrl = this.url;
    if (!this.paginationModel) {
      this.paginationModel = new PaginationModel({
        page: this.options.page,
        pageSize: this.options.pageSize
      });
    }
  },
  initialize: function () {
    this._initialize();
  },
  /**
   * 处理url 与 分页
   *
   * @method [private] - _parse (  )
   * @private
   * @param resp
   * @param xhr
   * @return {attributes.data|*}
   * @author wyj 14.11.16
   */
  parse: function (resp, xhr) {
    var ctx = this;
    if (Est.isEmpty(resp)) {
      debug(function () {
        var url = Est.typeOf(ctx.url) === 'function' ? ctx.url() : ctx.url;
        return 'Error:14 ' + url;
      }, {type: 'error'});
      return [];
    }
    this._parsePagination(resp);
    this._parseUrl(this.paginationModel);
    //TODO this.options.pagination 防止被其它无分页的列表覆盖
    if (this.options.pagination && this.paginationModel) {
      this._paginationRender();
    }
    return resp.attributes.data;
  },
  /**
   * 处理url地址， 加上分页参数
   *
   * @method [private] - _parseUrl (  )
   * @private
   * @param model
   * @author wyj 14.11.16
   */
  _parseUrl: function (model) {
    debug('- BaseCollection._parseUrl');
    var page = 1, pageSize = 16;
    if (model && model.get('pageSize')) {
      pageSize = model.get('pageSize');
      page = model.get('page');
    }
    if (this.options.subRender) {
      page = 1;
      pageSize = 9000;
    }
    if (typeof this.url !== 'function') {
      var end = '';
      if (!Est.isEmpty(this._itemId)) end = '/' + this._itemId;
      this.url = this._baseUrl + end + '?page=' + page + '&pageSize=' + pageSize;
    }
  },
  /**
   * 设置分页模型类
   *
   * @method [private] - _parsePagination
   * @private
   * @param resp
   * @author wyj 14.11.16
   */
  _parsePagination: function (resp) {
    debug('6.BaseCollection._parsePagination');
    resp.attributes = resp.attributes ||
    { page: 1, per_page: 10, count: 10 };
    if (this.paginationModel) {
      this.paginationModel.set('page', resp.attributes.page);
      this.paginationModel.set('pageSize', resp.attributes.per_page);
      this.paginationModel.set('count', resp.attributes.count);
    }
  },
  /**
   * 渲染分页
   *
   * @method [private] - _paginationRender
   * @private
   * @author wyj 14.11.16
   */
  _paginationRender: function () {
    seajs.use(['Pagination'], Est.proxy(function (Pagination) {
      if (!this.pagination) {
        var $el = $(this.options.el);
        this.pagination = new Pagination({
          el: $("#pagination-container", $el.size() > 0 ? $el : $('body')),
          model: this.paginationModel
        });
      } else {
        this.pagination.render();
      }
    }, this));
  },
  /**
   * 加载列表
   *
   * @method [集合] - _load ( 加载列表 )
   * @param instance 实例对象
   * @param context 上下文
   * @param model 模型类
   * @return {ln.promise} 返回promise
   * @author wyj 14.11.15
   * @example
   *      if (this.collection.url){
       *             this.collection._load(this.collection, this, model)
       *                 .then(function(result){
       *                     resolve(result);
       *                 });
       *         }
   */
  _load: function (instance, context, model) {
    debug('4.BaseCollection._load');
    //if (!Est.isEmpty(this.itemId)) this.url = this.url + '/' + this.itemId;
    this._parseUrl(model);
    return instance.fetch({success: function () {
      //resolve(instance);
      debug('5.collection reset');
      context._empty();
    }, cacheData: this.options.cache, session: this.options.session});
    /* var $q = Est.promise;
     return new $q(function (resolve) {

     });*/
  },
  /**
   * 设置itemId
   *
   * @method [分类] - _setItemId ( 设置itemId )
   * @param itemId
   * @author wyj 14.12.16
   * @example
   *        this._setItemId('Category00000000000000000032');
   */
  _setItemId: function (itemId) {
    this._itemId = itemId;
    debug('- get list by itemId ' + this._itemId);
  },
  /**
   * 清空列表
   *
   * @method [集合] - _empty ( 清空列表 )
   * @author wyj 14.11.15
   */
  _empty: function () {
    debug('BaseCollection._empty');
    if (this.collection) {
      var len = this.collection.length;
      while (len > -1) {
        this.collection.remove(this.collection[len]);
        len--;
      }
    }
  }
});

/**
 * @description 模型类
 *
 *    - initialize (可选) 实现父类_initialize // 可选
 *    - defaults (可选) 默认值  如 Est.extend({}, BaseModel.prototype.defaults);
 *    - baseId (可选) ID标识符 如 productId
 *    - baseUrl (可选) 服务器交互地址 // 可选
 *    - params (可选) 附加参数 如  mobile=true&type=01 // 可选
 *    - validate (可选) 当需要实现单个字段保存时， 需要调用父类_validation, 参照ProductModel
 *
 * @class BaseModel - 模型类
 * @author yongjin<zjut_wyj@163.com> 2014/11/10
 */


var BaseModel = Backbone.Model.extend({
  defaults: { checked: false, children: [] },
  baseId: '',
  /**
   * 初始化请求连接, 判断是否为新对象， 否自动加上ID
   *
   * @method [private] - url
   * @private
   * @return {*}
   * @author wyj 14.11.16
   */
  url: function () {
    var base = this.baseUrl;
    var _url = '';
    if (!base) return '';
    if (Est.typeOf(base) === 'function')
      base = base.call(this);
    this.params = this.params ? this.params : '';
    var sep = Est.isEmpty(this.params) ? '' : '?';
    if (this.isNew() && Est.isEmpty(this.id)) return base + sep + this.params;
    _url = base + (base.charAt(base.length - 1) == '/' ? '' : '/') + this.id + sep + this.params;
    debug(function () {
      return ('[Query]' + _url);
    });
    return _url;
  },
  /**
   * 模型类初始化
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @author wyj 14.11.16
   * @example
   *      this._initialize();
   */
  _initialize: function (options) {
    this.validateMsg = null;
    debug('9.BaseModel._initialize ' + this.baseId);
  },
  /**
   * 过滤结果, 并提示信息对话框, 若不想提示信息可以设置hideTip为true
   *
   * step 1:
   *  当服务器有返回msg消息 并参数设置hideTip为false时  弹出提示信息
   *  成功保存后 当为添加元素时 添加“继续添加”按钮， 点击继续添加按钮， 重新设置id为null, baseId为null, 使其变为新对象
   *  当参数hideOkBtn为false时添加 “确定”按钮， 当点击按钮地， 触发_dialog_submit_callback事件， 关闭_dialog对话框，
   *  关闭当前消息对话框， 当文档中存在btn-back按钮时， 返回列表页面
   * step 2:
   *  当success为false时， 直接返回服务器错误的response信息
   * step 3:
   *  处理data数据， 并把data数据赋值到response对象上
   * step 4:
   *  设置backbone 模型类里的id值， 默认不选中， 设置时间戳
   *
   * this.model.hideTip = true; // 无提示信息弹出框
   * this.model.hideOkBtn = true; // 隐藏保存按钮
   * this.model.hideAddBtn = true; // 隐藏继续添加按钮
   * this.model.autoHide = true; // 自动隐藏提示信息
   * this.model.autoBack = true; // 保存成功后自动返回列表页面
   *
   * @method [private] - parse
   * @param response
   * @param options
   * @return {*}
   * @author wyj 14.11.16
   */
  parse: function (response, options) {
    var ctx = this, buttons = [],
      _isNew = false;
    if ('msg' in response) Utils.removeLoading();
    if (Est.isEmpty(response)) {
      var url = Est.typeOf(this.url) === 'function' ? this.url() : this.url;
      debug('Error25 url' + url);
      BaseUtils.initTooltip(CONST.LANG.REQUIRE_FAILED);
      return false;
    }
    if (response && response.msg && response.msg === CONST.LANG.AUTH_FAILED){
      Utils.tip(CONST.LANG.AUTH_LIMIT, {time: 2000});
    }
    if (response.msg === CONST.LANG.NOT_LOGIN) {
      Est.trigger('checkLogin');
    }
    // 当服务器有返回msg消息 并参数设置hideTip为false时  弹出提示信息
    // 成功保存后 当为添加元素时 添加“继续添加”按钮， 点击继续添加按钮， 重新设置id为null, baseId为null, 使其变为新对象
    // 当参数hideOkBtn为false时添加 “确定”按钮， 当点击按钮地， 触发_dialog_submit_callback事件， 关闭_dialog对话框，
    // 关闭当前消息对话框， 当文档中存在btn-back按钮时， 返回列表页面
    if (response.msg && !this.hideTip) {
      if (response.success) {
        if (ctx.isNew() && !this.autoHide && !this.hideAddBtn) {
          buttons.push({ value: CONST.LANG.ADD_CONTINUE, callback: function () {
            ctx.set('id', null);
            ctx.set(ctx.baseId, null);
          }});
          _isNew = true;
        }
        !this.hideOkBtn && buttons.push({ value: CONST.LANG.CONFIRM, callback: function () {
          Est.trigger('_dialog_submit_callback');
          this.autoBack = Est.typeOf(this.autoBack) === 'undefined' ? true : this.autoBack;
          if (typeof window.topDialog != 'undefined') {
            window.topDialog.close(); // 关键性语句
            window.topDialog = null;
            $ && this.autoBack && $(".btn-back").click();
          } else if (app.getDialogs().length > 0) {
            try {
              app.getDialogs().pop().close().remove();
              $ && this.autoBack && $(".btn-back").click();
            } catch (e) {
            }
          }
          this.close();
        }, autofocus: true });
      } else {
        buttons.push({ value: CONST.LANG.CONFIRM, callback: function () {
          this.close();
        }, autofocus: true });
      }
      this.hideOkBtn && Est.trigger('_dialog_submit_callback');
      var dialog_msg = BaseUtils.initDialog({
        id: 'dialog_msg',
        title: CONST.LANG.TIP,
        content: '<div style="padding: 20px;">' + response.msg + '</div>',
        width: 250,
        button: buttons
      });
      setTimeout(function () {
        app.getDialog('dialog_msg') && (ctx.autoHide || !_isNew) &&
        app.getDialog('dialog_msg').close().remove();
      }, 2000);
    }
    // 当success为false时， 直接返回服务器错误的response信息
    if (Est.typeOf(response.success) === 'boolean' && !response.success) {
      ctx.attributes._response = response;
      return ctx.attributes;
    }
    // 处理data数据， 并把data数据赋值到response对象上
    if (response.attributes && response.attributes.data) {
      var keys = Est.keys(response.attributes);
      if (keys.length > 1) {
        Est.each(keys, function (item) {
          if (item !== 'data')
            response.attributes['data'][item] = response.attributes[item];
        });
      }
      response = response.attributes.data;
    }
    // 设置backbone 模型类里的id值， 默认不选中， 设置时间戳
    if (response) {
      response.id = response[ctx.baseId || 'id'];
      response.checked = false;
      response.time = new Date().getTime();
    }
    return response;
  },
  /**
   * 保存模型类
   *
   * @method [保存] - _saveField ( 保存模型类 )
   * @param keyValue
   * @param ctx
   * @param options [success: 成功回调][async: 是否异步]
   * @author wyj 14.11.16
   * @example
   *        this.model._saveField({
       *          id: thisNode.get('id'),
       *          sort: thisNode.get('sort')
       *        }, ctx, { // ctx须初始化initModel
       *          success: function(){}, // 保存成功回调
       *          async: false, // 是否同步
       *          hideTip: false // 是否隐藏提示
       *          hideOkBtn: false // 是否隐藏确定按钮
       *        });
   */
  _saveField: function (keyValue, ctx, options) {
    var wait = options.async || true;
    var newModel = new ctx.initModel({
      id: keyValue.id || ctx.model.get('id')
    });
    newModel.clear();
    newModel.set(keyValue);
    newModel.set('silent', true);
    if (options.hideTip) newModel.hideTip = true;
    newModel.hideOkBtn = true;
    newModel.set('editField', true);
    debug(function () {
      if (!newModel.baseUrl) return 'Error27';
    }, {type: 'console'});
    if (newModel.baseUrl) {
      newModel.save(null, {
        success: function (model, result) {
          if (result.msg === CONST.LANG.NOT_LOGIN) {
            Est.trigger('checkLogin');
          }
          if (typeof options.success != 'undefined') {
            options.success && options.success.call(ctx, keyValue, result);
          }
        }, wait: wait
      });
    } else{
      options.success && options.success.call(ctx, keyValue, {});
    }
  },
  /**
   * 获取子模型
   *
   * @method [private] - _getChildren
   * @private
   * @return {*}
   * @author wyj 14.12.18
   */
  _getChildren: function (collection) {
    return _.map(this.get('children'), function (ref) {
      // Lookup by ID in parent collection if string/num
      if (typeof(ref) == 'string' || typeof(ref) == 'number')
        return collection.get(ref);
      // Else assume its a real object
      return ref;
    });
  },
  /**
   * 隐藏保存后的提示对话框
   *
   * @method [对话框] - _hideTip ( 隐藏提示对话框 )
   * @author wyj 15.1.29
   * @example
   *      this.model._hideTip();
   */
  _hideTip: function () {
    this.hideTip = true;
  },
  /**
   * 设置checkbox选择框状态
   *
   * @method [选取] - _toggle ( 设置checkbox选择框状态 )
   * @author wyj 14.11.16
   * @example
   *      this.model._toggle();
   */
  _toggle: function () {
    this.set('checked', !this.get('checked'));
  },
  /**
   * 预处理验证， 若模型类里有silent=true字段，则取消验证
   *
   * @method [验证] - _validate ( 预处理验证 )
   * @param attributes
   * @param callback
   * @author wyj 14.11.21
   * @example
   *        validate: function (attrs) {
       *          return this._validation(attrs, function (attrs) {
       *            if (!attrs.sort || attrs.sort < 0) {
       *            this.validateMsg = "sort不能为空";
       *          }
       *         });
       *        }
   */
  _validation: function (attributes, callback) {
    if (!attributes.silent && callback) {
      callback.call(this, attributes);
    }
    return this.validateMsg;
  },
  /**
   * 获取model值
   *
   * @method [获取] - _getValue ( 获取model值 )
   * @param path
   * @author wyj 15.1.30
   * @example
   *      this._getValue('tip.name');
   */
  _getValue: function (path) {
    return Est.getValue(this.attributes, path);
  },
  /**
   * 设置model值
   *
   * @method [设置] - _setValue ( 设置model值 )
   * @param path
   * @param val
   * @author wyj 15.1.30
   * @example
   *      this._setValue('tip.name', 'aaa');
   */
  _setValue: function (path, val) {
    Est.setValue(this.attributes, path, val);
  },
  initialize: function () {
    this._initialize();
  }
});

/**
 * @description BaseDetail
 * @class BaseDetail - 详细页面
 * @author yongjin<zjut_wyj@163.com> 2014.11.12
 */

var BaseDetail = SuperView.extend({
  /**
   * 初始化
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @param options
   * @author wyj 14.11.20
   * @example
   *      this._initialize({
       *         template : template, // 字符串模板
       *         model: ProductModel, // 模型类
       *         // 可选
       *         beforeRender: function(options){}, // 渲染前调用
       *         afterRender: function(options){}, // 渲染后调用
       *         hideSaveBtn: true, // 保存成功后的弹出提示框中是否隐藏保存按钮
       *         hideOkBtn: true, // 保存成功后的弹出提示框中是否隐藏确定按钮
       *         autoHide: true, // 保存成功后是否自动隐藏提示对话框
       *         enterRender: '#submit' // 执行回车后的按钮点击的元素选择符
       *         modelBind: true, // 表单元素与模型类 双向绑定
       *         toolTip: true, // 是否显示title提示框   html代码： <div class="tool-tip" title="提示内容">内容</div>
       *         id: ctx.model.get('id'), // 当不是以dialog形式打开的时候， 需要传递ID值
                 page: ctx._getPage() // 点击返回按钮且需要定位到第几页时， 传入page值，
                 data: {} // 附加数据  获取方法为  _data.name
       *      });
   */
  _initialize: function (options) {
    this._initOptions(options);
    this._initTemplate(this._options);
    this._initList(this._options);
    this._initModel(options.model, this);
    this._initEnterEvent(this._options);
  },
  /**
   * 初始化参数
   *
   * @method [private] - _initOptions
   * @private
   * @author wyj 15.1.12
   */
  _initOptions: function (options) {
    this._options = Est.extend(this.options, options || {});
    this._options.speed = this._options.speed || 9;
  },
  /**
   * 初始化模板， 若传递一个Template模板字符中进来， 则渲染页面
   *
   * @method [private] - _initTemplate
   * @private
   * @author wyj 15.1.12
   */
  _initTemplate: function (options) {
    this._data = options.data = options.data || {};
    if (options.template) {
      this.template = Handlebars.compile(options.template);
      this.$template = '<div>' + options.template + '</div>';
      //this.$el.append(this.template(options.data));
    }
    return this._data;
  },
  /**
   * 初始化列表视图容器
   *
   * @method [private] - _initList
   * @private
   * @author wyj 15.1.12
   */
  _initList: function (options) {
    var ctx = this;
    this.list = options.render ? this.$(options.render) : this.$el;
    if (this.list.size() === 0)
      this.list = $(options.render);
    debug(function () {
      if (!ctx.list || ctx.list.size() === 0) {
        return 'Error15 viewId=' + ctx.options.viewId + (ctx._options.render ? ctx._options.render : ctx.el);
      }
    }, {type: 'error'});
    return this.list;
  },
  /**
   * 渲染
   *
   * @method [渲染] - _render ( 渲染 )
   * @author wyj 14.11.20
   * @example
   *        this._render();
   */
  _render: function () {
    if (this._options.beforeRender) {
      this._options.beforeRender.call(this, this._options);
    }
    this.list.append(this.template(this.model.toJSON()));
    if (this._options.modelBind) this._modelBind();
    if (window.topDialog) {
      this.$('.form-actions').hide();
    }
    if (this._options.afterRender) {
      this._options.afterRender.call(this, this._options);
    }
    if (this._options.toolTip) this._initToolTip();
    BaseUtils.removeLoading();
  },
  /**
   * 初始化模型类 将自动判断是否有ID传递进来，
   * 若存在则从服务器端获取详细内容
   * 若为添加， 则在ctx 与模型类里设置 _isAdd = true
   *
   * @method [private] - _initModel
   * @private
   * @param model
   * @param ctx
   * @author wyj 14.11.15
   */
  _initModel: function (model, ctx) {

    debug(function () {
      if (!model) return 'Error16';
    }, {type: 'error'});

    ctx.passId = this.options.id || Est.getUrlParam('id', window.location.href);

    if (!Est.isEmpty(this.passId)) {
      ctx.model = new model();
      ctx.model.set('id', ctx.passId);
      ctx.model.set('_data', ctx._options.data);
      ctx.model.fetch().done(function (response) {
        if (response.msg === CONST.LANG.NOT_LOGIN) {
          Est.trigger('checkLogin');
        }
        ctx.model.set('_isAdd', ctx._isAdd = false), ctx.render();
      });
    } else {
      ctx.passId = new Date().getTime();
      ctx.model = new model(this._options.data || {});
      ctx.model.set('_data', ctx._options.data);
      ctx.model.set('_isAdd', ctx._isAdd = true);
      ctx.render();
    }

    if (this._options.hideOkBtn) ctx.model.hideOkBtn = true;
    if (this._options.hideSaveBtn) ctx.model.hideSaveBtn = true;
    if (this._options.autoHide) ctx.model.autoHide = true;

  },
  /**
   * form包装器， 传递表单选择符
   *
   * @method [表单] - _form ( form包装器 )
   * @param {String} formSelector 选择器
   * @return {BaseDetail}
   * @author wyj on 14.11.15
   * @example
   *        this._form('#J_Form')._validate()._init({
       *          onBeforeSave: function(){
       *            // 处理特殊字段
       *            this.model.set('taglist', Est.map(ctx.tagInstance.collection.models, function (item) {
       *              return item.get('name');
       *            }).join(','));
       *          },
       *          onAfterSave : function(response){
       *             if(response.attributes.success == false ){
       *                ctx.refreshCode();
       *                return true;
       *             }
       *            Utils.tip('请验证邮箱后再登录!');
       *            window.location.href = '/member/modules/login/login.html';
       *          }
       *        });
   */
  _form: function (formSelector) {
    this.formSelector = formSelector;
    this.formElemnet = this.$(this.formSelector);
    return this;
  },
  /**
   * 启用表单验证
   *
   * @method [表单] - _validate ( 表单验证 )
   * @return {BaseDetail}
   * @param options [url: 远程验证地址][fields{Array}: 字段名称]
   * @author wyj 14.11.15
   * @example
   *        this._form('#J_Form')._validate({
       *            url: CONST.API + '/user/validate',
       *            fields: ['vali-username', 'vali-email'] // 注意， 字段前加vali-
       *        });
   */
  _validate: function (options) {
    var ctx = this;
    options = options || {};
    BUI.use('bui/form', function (Form) {
      ctx.formValidate = new Form.Form({
        srcNode: ctx.formSelector
      }).render();
      if (options.url && options.fields) {
        Est.each(options.fields, function (field) {
          app.addData(field, ctx.formValidate.getField(field));
          debug(function () {
            if (!ctx.formValidate.getField(field)) {
              return 'Error17';
            }
          }, {type: 'error'});
          app.getData(field).set('remote', {
            url: options.url,
            dataType: 'json',
            callback: function (data) {
              if (data.success) {
                return '';
              } else {
                return data.msg;
              }
            }
          });
        });
      }
    });
    return this;
  },
  /**
   * 绑定提交按钮
   *
   * @method [表单] - _init ( 绑定提交按钮 )
   * @param options [onBeforeSave: 保存前方法] [onAfterSave: 保存后方法]
   * @author wyj 14.11.15
   * @example
   *        this._form()._validate()._init({
       *            onBeforeSave: function(){},
       *            onAfterSave: function(){},
       *            onErrorSave: function(){}
       *        });
   *
   *
   *        <input id="model-music.custom" name="music.custom" value="{{music.custom}}" type="text" class="input-large">
   *
   */
  _init: function (options) {
    var ctx = this,
      passed = true,
      modelObj = {},
      isPassed = true;

    options = options || {};
    $('#submit', this.el).on('click', function () {
      var $button = $(this);
      var preText = ctx.preText = $(this).html();
      passed = true; // 设置验证通过
      ctx.formElemnet.submit();
      $("input, textarea, select", $(ctx.formSelector)).each(function () {
        var name, val, pass, modelKey, modelList;
        name = $(this).attr('name');
        if ($(this).hasClass('bui-form-field-error')) {
          passed = false;
        }
        var modelId = $(this).attr('id');
        if (modelId && modelId.indexOf('model') !== -1) {
          switch (this.type) {
            case 'radio':
              val = $(this).is(":checked") ? $(this).val() : pass = true;
              break;
            case 'checkbox':
              val = $(this).is(':checked') ? (Est.isEmpty($(this).attr('true-value')) ? true : $(this).attr('true-value')) :
                (Est.isEmpty($(this).attr('false-value')) ? false : $(this).attr('false-value'));
              break;
            default :
              val = $(this).val();
              break;
          }
          if (!pass) {
            modelKey = modelId.replace(/^model\d?-(.+)$/g, "$1");
            modelList = modelKey.split('.');
            if (modelList.length > 1) {
              try {
                if (!ctx.model.attributes[modelList[0]]) {
                  ctx.model.attributes[modelList[0]] = {};
                }
                Est.setValue(ctx.model.attributes, modelKey, val);
              } catch (e) {
                debug('Error18 ' + e);
              }
              //ctx.model.set(modelList[0], modelObj[modelList[0]]);
            } else {
              ctx.model.set(modelList[0], val);
            }
          }
        }
      });
      if (passed) {
        if (typeof options.onBeforeSave !== 'undefined')
          isPassed = options.onBeforeSave.call(ctx);
        if (Est.typeOf(isPassed) !== 'undefined' && !isPassed) return false;
        $button.html(CONST.LANG.SUBMIT);
        $button.prop('disabled', true);
        ctx._save(function (response) {
          if (options.onAfterSave) {
            options.onAfterSave = Est.inject(options.onAfterSave, function (response) {
              return new Est.setArguments(arguments);
            }, function (response) {
              $button.html(preText);
              $button.prop('disabled', false);
            });
            options.onAfterSave.call(ctx, response);
          }
          $button.html(preText);
        }, function (response) {
          if (respnse.msg === CONST.LANG.NOT_LOGIN) {
            Est.trigger('checkLogin');
          }
          options.onErrorSave.call(ctx, response);
        });
        setTimeout(function () {
          $button.html(preText);
          $button.prop('disabled', false);
        }, 5000);
      }
      return false;
    });
  },
  /**
   * 保存结果
   *
   * @method [private] - _save
   * @private
   * @author wyj 14.11.18
   */
  _save: function (callback, error) {
    this._saveItem(callback, error);
  },
  /**
   * 保存表单
   *
   * @method [private] - _saveItem
   * @private
   * @param callback
   * @param context
   * @author wyj 14.11.15
   */
  _saveItem: function (callback, error) {
    debug('- BaseDetail._saveItem');
    if (Est.typeOf(this.model.url) === 'string') debug('Error29', {type: 'error'});
    if (Est.isEmpty(this.model.url())) {
      debug('Error19', {type: 'error'});
      return;
    }
    if (this.model.attributes._response) {
      delete this.model.attributes._response;
    }
    this.model.save(null, {
      wait: true,
      success: function (response) {
        debug('- BaseDetail._saveSuccess');
        app.addModel(Est.cloneDeep(response.attributes));
        if (top) {
          top.model = response.attributes;
        }
        if (callback && typeof callback === 'function')
          callback.call(this, response);
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        if (error && typeof error === 'function')
          error.call(this, XMLHttpRequest, textStatus, errorThrown);
      }
    });
  },
  /**
   * 重置表单
   *
   * @method [表单] - _reset ( 重置表单 )
   * @author wyj 14.11.18
   */
  _reset: function () {
    this.model.set(this.model.defaults);
  },
  /**
   * 清空视图， 并移除所有绑定的事件
   *
   * @method [渲染] - _empty ( 清空视图 )
   * @author wyj 14.11.16
   * @example
   *      this._empty();
   */
  _empty: function () {
    this.model.off();
    this.$el.empty().off();
  },
  /**
   * 移除所有绑定的事件
   *
   * @method [事件] - _close ( 移除所有绑定事件 )
   * @author wyj 14.11.16
   */
  _close: function () {
    debug('- BaseDetail.close');
    this.undelegateEvents();
    this.stopListening();
    this.off();
  }
});