

if (typeof require != "undefined") {

  var library = require("module-library")(require)

  module.exports = library.export(
    "web-element",
    generator
  )
} else {
  var element = generator()
}

function generator() {
  function Element() {
    this.children = []
    this.classes = []
    this.attributes = {}
    this.tagName = null
    this.style = null
    this.__isNrtvElement = true
  }

  Element.prototype.onclick = 
    function(call) {
      if (call.evalable) {
        call = call.evalable()
      }
      this.attributes.onclick = call
    }

  Element.prototype.appendStyles = 
    function(properties) {
      var style = this.attributes.style || ""

      for(var key in properties) {
        style += stylePropertySource(key, properties[key])
      }

      this.attributes.style = style
    }

  function element() {

    var el = new Element()

    element.generator(arguments).apply(el)

    return el
  }

  function getArgType(arg) {
    var isArray = Array.isArray(arg)
    var isString = typeof arg == "string"
    var isSelector = isASelector(arg)
    var isElement = arg && arg.__isNrtvElement == true || typeof arg.html == "function"
    var isRaw = typeof arg.__raw == "string"
    var isTagName = arg.__nrtvElementTagName
    var isStyle = arg.__isNrtvElementStyle
    var isObject = typeof arg == "object"
    var isAttributes = isObject && !isRaw && !isStyle && !isTagName
    var isStringable = !!arg.toString

    if (isArray) {
      return "array"
    } else if (isElement || isRaw) {
      return "child"
    } else if (isString && isSelector) {
      return "selector"
    } else if (isString && !isSelector) {
      return "child"
    } else if (isTagName) {
      return "tagName"
    } else if (isAttributes) {
      return "attributes"
    } else if (isStyle) {
      return "style"
    } else if (isStringable) {
      return "stringable"
    } else {
      throw new Error("Element doesn't know how to handle " + arg.toString())
    }
  }


  element.generator =
    function(args) {

      args = Array.prototype.slice.call(args)

      args.forEach(checkForUndefinedArgs)

      function generate() {
        if (this.constructor.name != "Element") {
          throw new Error("Tried run an element generator on "+this+" but it's not an element")
        }
        args.forEach(addArg.bind(this))
        return this
      }

      function checkForUndefinedArgs(arg, i) {

        if (typeof arg == "undefined") {
          throw new Error("You're trying to make an element out of "+JSON.stringify(args).slice(0,1000)+" but the "+i+"th argument is undefined")
        }

        var type = getArgType(arg)

        if (type == "array") {
          arg.forEach(checkForUndefinedChild)
        }
      }


      function checkForUndefinedChild(child, i) {
        if (typeof child == "undefined") {
          var summarize = JSON.stringify(args).slice(0,1000)

          if (summarize.length == 1000) {
            summarize += "... "
          }

          throw new Error("You're trying to make an element out of "+summarize+" but the "+i+"th child in your array is undefined")
        }
      }

      return generate
    }

  function addArg(arg) {
    var type = getArgType(arg)

    if (type == "array") {
      addChildren(this, arg)
    } else if (type == "tagName") {
      this.tagName = arg.__nrtvElementTagName
    } else if (type == "child") {
      this.addChild(arg)
    } else if (type == "contents") {
      this.addChild(arg)
    } else if (type == "selector") {
      this.addSelector(arg)
    } else if (type == "attributes") {
      this.addAttributes(arg)
    } else if (type == "style") {
      this.appendStyles(arg.properties)
    } else if (type == "stringable") {
      this.addChild(arg.toString())
    }
  }

  function merge(a, b) {
    for(key in b) {
      a[key] = b[key]
    }
  }

  function addChildren(el, args) {
    args.map(function(arg) {
      if (isASelector(arg) || Array.isArray(arg)) {
        el.addChild(element(arg))
      } else {
        el.addChild(arg)
      }

    })
  }

  var whitelist = /^(\.|(a|body|br|button|canvas|div|form|h1|h2|h3|head|hr|html|iframe|img|input|label|li|link|meta|ol|option|p|em|strong|underline|b|i|script|select|span|style|textarea|title|ul|video)(\[|\.|#|$))/

  function isASelector(string) {
    if (string.match && string.match(/^(\#[a-z0-9\_\-]+|\.[a-z0-9\_\-]+)+$/)) {
      return true
    }
    if (typeof string != "string") {
      return false
    }
    var itIs = !!string.match(whitelist)
    return itIs
  }

  Element.prototype.addSelector = function(selector) {
    if (!selector) { selector = "" }

    if (!selector.match) {
      throw new Error("Tried to add selector "+selector+" to web element "+this.html().slice(0,100)+", but it doesn't look like a string?")
    }

    var tagNameMatch = selector.match(/^[a-z][a-z0-9-]*/)

    if (tagNameMatch) {
      this.tagName = tagNameMatch[0]
      var remainder = selector.slice(
        this.tagName.length)
    } else {
      var remainder = selector
    }

    var idMatch = remainder.match(/^\#([a-z][a-z0-9-]*)/)

    if (idMatch) {
      this.id = idMatch[1]
      remainder = remainder.slice(this.id.length)
    }

    var classesMatch = remainder.match(/^\.(.*)/)

    if (classesMatch) {
      var classes = classesMatch[1].split(".")
      this.classes = this.classes.concat(classes)
    }
  }

  Element.prototype.addChild = Element.prototype.addChildren = function(content, more) {
      if (Array.isArray(content)) {
        var children = content
        addChildren(this, children)
      } else if (more) {
        var children = Array.prototype.slice.call(arguments)
        addChildren(this, children)
      } else if (typeof content == "undefined") {
        throw new Error("tried to add an undefined child to element "+this.html())
      } else {
        this.children.push(content)
      }
    }

  Element.prototype.addAttributes = function(object) {
    for (var key in object) {
      if (key === 'id') {
        this.id = object[key]
      }
      this.addAttribute(key, object[key])
    }
  }

  Element.prototype.addAttribute = function(key, value) {
    ensureValue(value, key)

    if (typeof this.attributes[key] != "undefined") {
      throw new Error("Tried to set "+key+" attribute on element to "+value+" but it was already set to "+this.attributes[key]+". I am but a lowly computer and resolving this is too much for me.")
    }

    this.attributes[key] = value
  }

  Element.prototype.html =
    function(stack) {

      if (!stack) {
        stack = {
          ids: [],
          html: []
        }
      }

      if (!this.__uniqueId) {
        this.__uniqueId = parseInt(Math.random()*100000000)
      }

      var html = openingTag.call(this)

      if (stack.ids.indexOf(this.__uniqueId) >= 0) {  

        console.log("element stack:\n  "+stack.html.join("\n  "))

        throw new Error("Already tried to render "+html.slice(0,100)+". Do you have a circular dependecy in your element tree?")

      } else {
        stack.ids.push(this.__uniqueId)
        stack.html.push(html.slice(0,100))
      }

      var tag = this.tagName || "div"

      var needsToClose = tag != "br" && tag != "hr" && tag != "input"

      if (needsToClose) {
        html = addChildrenToHtml(this.children, html, stack)
        html = html + (this.contents || "")
        html = html + "</" + tag + ">"
      }

      stack.ids.pop()
      stack.html.pop()
      return html
    }

    function openingTag() {
      var tag = this.tagName || "div"
      var html = ""

      html = "<" + tag

      if (this.id) {
        html = html + " id=\"" + this.id + "\""
      }

      if (this.classes && this.classes.length) {
        html = html + " class=\"" + this.classes.join(" ") + "\""
      }

      for (key in this.attributes || {}) {
        var value = this.attributes[key]
        ensureValue(value, key)
        html = html + " " + key + "='" + escape(value) + "'"
      }

      html = html + ">"

      return html
    }

    function escape(value) {
      return value.replace(/'/g, "&#39;")
    }

    function ensureValue(value, key) {
      if (typeof value != "string") {
        if (value && value.evalable) {
          throw new Error("You passed a binding ("+value.evalable()+") as your "+key+" attribute. Did you mean to do yourFunction.evalable()?")
        } else {
          throw new Error("Trying to set the "+key+" attribute on a web-element to "+stringify(value)+" that seems weird. It should be a string. The attributes object looks like this: "+stringify(this.attributes))
        }
      }
    }

    function addChildrenToHtml(children, html, stack) {
      if (!children) { return html }

      for(var i=0; i<children.length; i++) {
        var child = children[i]

        if (typeof child == "undefined") {
          throw new Error("Added an undefined child to and element. HTML so far: "+html)
        }

        if (typeof child.__raw == "string") {
          html = html + child.__raw
        } else if (child.html) {
          html = html + child.html(stack)
        } else {
          html = html + child
        }
      }

      return html
    }

    function stringify(whatnot) {
      if (typeof whatnot == "function") {
        return whatnot.toString()
      } else if (typeof whatnot == "object") {
        if (Array.isArray(whatnot)) {
          return JSON.stringify(whatnot)
        }
        var keys = Object.keys(whatnot)
        for(var key in whatnot) {
          keys.push(key)
        }
        return "[ object "+whatnot.constructor.name+" with keys "+keys.join(", ")+" ]"
      } else {
        return JSON.stringify(whatnot)
      }
    }

  var onServer = typeof document == "undefined"
  var next = onServer ? 10000*100 : 10000

  function anId() {
    var prefix = onServer ? "node-" : "brws-"
    return prefix+(next++).toString(36)    
  }

  Element.prototype.assignId =
    function() {
      if (!this.id) {
        this.id = anId()
      }
      return this.id
    }

  function ElementStyle(args) {
    this.__isNrtvElementStyle = true
    for(var i=0; i<args.length; i++) {
      var arg = args[i]
      if (typeof arg == "object") {
        this.properties = arg
      } else if (typeof arg == "string") {
        this.identifier = arg
      }
    }
  }

  ElementStyle.prototype.styleSource = function() {
    if (!this.identifier) {
      throw new Error("Element styles must have a selector associated with them.")
    }
    return styleSource(this.identifier, this.properties)
  }

  element.style =
    function() {
      return new ElementStyle(arguments)
    }

  element.tag = function(tagName) {
    return {
      __nrtvElementTagName: tagName
    }
  }

  element.template = function() {
    var elementArgs = []
    var cssProperties
    var generators = []

    for (var i=0; i<arguments.length; i++) {
      var arg = arguments[i]
      var isStyle = arg.__isNrtvElementStyle
      var isFunction = typeof arg == "function"
      var isTemplate = isFunction && arg.name == "template"
      var isGenerator = isFunction && !isTemplate

      if (isTemplate) {
        generators.push(arg.generator)
      } else if (isStyle) {
        if (!cssProperties) {
          cssProperties = {}
        }
        merge(cssProperties, arg.properties)
      } else if (isGenerator) {
        generators.push(arg)
      } else {
        elementArgs.push(arg)
      }
    }

    assertSelector(elementArgs)
    generators.push(element.generator(elementArgs))

    // A template is different than an element. They have different interfaces. A template takes non-htmly stuff like a burger, or a house. Element takes tag names, classes, children, DOM attributes, etc.

    // Although for convenience, since the template always has a toplevel element associated with it and you generally want to style that and add events and such to the template, template takes all of the elements arguments PLUS all the template args in one call.

    // A template also lets you associate a style with an element. There's a 1:N relationship between styles and elements, but there's a 1:1 relationship between styles and templates, so it makes sense they go here.

    function template() {
      var templateArgs = Array.prototype.slice.call(arguments)

      var el = element()  

      for (var i=generators.length-1; i> -1; i--) {
        generators[i].apply(el, templateArgs)
      }

      return el
    }

    template.styleSource =
      function() {
        return styleSource(this.styleIdentifier, this.cssProperties
        )
      }

    template.generator = element.generator(elementArgs)

    template.styleIdentifier = 
      getStyleIdentifier(elementArgs)

    template.cssProperties = cssProperties

    return template
  }

  function assertSelector(args) {
    var selector = getStyleIdentifier(args)

    if (!selector) {
      throw new Error(
        "Templates must have a selector associated with them. You passed element.template("+JSON.stringify(args)+")")}

    return !!selector
    // var hasSomeCalasses = classes && this.classes.length

    // var hasAnId = !!id

    // var hasATagName = !!tagName

    // if (!hasSomeClasses && !hasAnId && !hasATagName) {

  }

  element.template.container =
    function() {
      var args = Array.prototype.slice.call(arguments)

      args.push(containerGenerator)

      return element.template.apply(null, args)
    }

  function containerGenerator() {
    for (var i=0; i<arguments.length; i++) {
      this.addChild(arguments[i])
    }
  }

  function styleSource(identifier, properties) {
      var mediaQueries = ""
      var descendants = ""
      var keyframes = ""

      var css = "\n" 
        + identifier
        + " {"

      var isKeyframe = identifier.match(/@keyframes/)

      for (key in properties) {

        if (isKeyframe) {
          keyframes += styleSource(key, properties[key])

        } else if (key.match(/@media/)) {

          mediaQueries += getMediaSource(
              key,
              identifier,
              properties[key]
            )

        } else if (key.match(/[$.#: ]/)) {

          descendants += getDescendantSource(
              key,
              identifier,
              properties[key]
            )

        } else {
          css += "\n  "+stylePropertySource(key, properties[key])
        }
      }

      return css + keyframes + "\n}\n" +mediaQueries + descendants
  }

  function stylePropertySource(key, value) {
    if (key == "content") {
      value = '"'+value.replace('"', '\"')+'"'
    }
    return key+": "+value+";"
  }

  function getMediaSource(query, identifier, styles) {
    var css = "\n" + query + " {\n" + identifier + " {"

    for (var name in styles) {
      css += "\n  "+name+": "+styles[name]+";"
    }
    css += "\n}\n}"
    return css
  }

  function getKeyframes(query, identifier, styles) {
    debugger
    var css = "\n" + query + " {\n" + identifier + " {"

    for (var name in styles) {
      css += "\n  "+name+" "+styles[name]+";"
    }
    css += "\n}\n}"
    return css
  }
  function getDescendantSource(descendantSelector, parentSelector, styles) {

    var parents = parentSelector.split(",")
    var descendants = descendantSelector.split(",")
    var selectors = []

    for(var i=0; i<parents.length; i++) {
      var parent = parents[i]

      for(var j=0; j<descendants.length; j++) {
        var descendant = descendants[j]
        selectors.push(parent+descendant)
      }
    }

    var css = "\n" + selectors.join(",") + " {"

    for (var name in styles) {
      css += "\n  "+name+": "+styles[name]+";"
    }
    css += "\n}"
    return css
  }

  function getStyleIdentifier(args) {
    for(var i=0; i<args.length; i++) {
      var arg = args[0]
      if (isASelector(arg)) {
        var parts = arg.split(".")
        if (parts[1]) {
          return "."+parts[1]
        } else {
          return  parts[0]
        }
      }
    }
  }

  element.stylesheet = function(styles) {
    var el = element("style")

    if (!Array.isArray(styles)) {
      styles = Array.prototype.slice.call(arguments)
    }

    for(var i=0; i<styles.length; i++) {
      var style = styles[i]
      if (typeof style == "undefined") {
        throw new Error(i+"th style you passed to element.stylesheet was undefined. Sad.")
      }
      if (style.styleSource) {
        style = style.styleSource()
      } else {
        throw new Error("You can only add element.style and element.template instances to an element.stylesheet. You tried to add "+style)
      }
      el.children.push(style)
    }
    return el
  }

  element.raw = function(html) {
    if (typeof html != "string") {
      throw new Error("You tried to use "+JSON.stringify(html)+" as raw HTML, but it isn't a string. HTML is strings bro.")
    }
    return {__raw: html}
  }

  element.escape = function(unsafe) {
    var safe = unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    return {__raw: safe}
  }

  element.defineOn = function(bridge) {
    var binding = bridge.remember("web-element")
    if (binding) { return binding }
    binding = bridge.defineSingleton("element", generator)
    bridge.see("web-element", binding)
    return binding
  }

  element.anId = anId

  return element
}