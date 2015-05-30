if (typeof define !== 'function') {
  var define = require('amdefine')(
    module)}

define(
  ["extend", "he"],
  function(extend, he) {
    function Element() {
      this.children = []
      this.classes = []
    }

    function element() {

      var el = new Element()

      element.generator(arguments).apply(el)

      return el
    }

    element.generator =
      function(args) {
        return function() {
          if (this.constructor.name != "Element") {
            throw new Error("Tried run an element generator on "+this+" but it's not an element")
          }
          var selectors = []

          for(var i=0; i<args.length; i++) {
            var arg = args[i]
            var isArray = Array.isArray(arg)
            var isString = typeof arg == "string"
            var isElement = arg.constructor.name == "Element"
            var isObject = typeof arg == "object"

            if (isArray) {
              addElements(this.children, arg)
            } else if (isElement) {
              this.children.push(arg)
            } else if (isString) {
              if (isASelector(arg)) {
                selectors.push(arg)
              } else {
                this.contents = arg
              }
            } else if (isObject) {
              this.attributes = arg
            } else {
              throw new Error("Element doesn't know how to handle " + arg.toString())
            }
          }

          for (var i=0; i<selectors.length; i++) {

            addSelector(this, selectors[i])
          }

          return this
        }
      }

    function addElements(children, args) {
      return args.map(function(arg) {
        if (arg.html) {
          children.push(arg)
        } else {
          children.push(element(arg))
        }
      })
    }

    function isASelector(string) {
      return !!string.match(/^(img|a|div|input|button|p|h1|script|head|html|body|style)?(\.[^.]+)*$/)
    }

    function addSelector(parsed, selector) {
      if (!selector) { selector = "" }

      var parts = selector.split(".")
      var tagName = parts[0]
      var classes = parts.slice(1)

      if (tagName.length > 0) {
        parsed.tagName = tagName
      }

      for(var i=0; i<classes.length; i++) {
        parsed.classes.push(classes[i])
      }
    }

    function styleToString(style) {
      var string = ""
      for (key in style.properties) {
        var value = style.properties[key]
        if (string.length) {
          string = string + ";"
        }
        string = string + key + ": " + value
      }
      return string
    }

    Element.prototype.html =
      function() {

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
          html = html + " " + key + "=\"" + he.encode(this.attributes[key]) + "\""
        }

        html = html + ">"

        if (this.children) {
          html = html + this.children.map(
              function(el) {
                if (el.html) {
                  return el.html()
                } else {
                  return el
                }a
              }
            ).join("")
        }
        html = html + (this.contents || "")
        html = html + "</" + tag + ">"

        return html
      }

    Element.next = 10000
    Element.prototype.assignId =
      function() {
        this.id = "el-"+(
          Element.next++
        ).toString(36)
        return this.id
      }

    function ElementStyle(properties) {
      this.properties = properties
    }

    element.style =
      function(properties) {
        return new ElementStyle(properties)
      }

    element.template = function() {
      var elementArgs = []
      var cssProperties
      var generators = []

      for (var i=0; i<arguments.length; i++) {
        var arg = arguments[i]
        var isStyle = arg.constructor.name == "ElementStyle"
        var isFunction = typeof arg == "function"
        var isTemplate = isFunction && arg.name == "template"
        var isGenerator = isFunction && !isTemplate

        // console.log("arg:", arg, isTemplate?"isTemplate":"", isStyle?"style":"", isFunction?"isFunction":"", isGenerator?"isFenerator":"", "constructor:"+arg.constructor.name)

        if (isTemplate) {
          generators.push(arg.generator)
        } else if (isStyle) {
          cssProperties = arg.properties
        } else if (isGenerator) {
          generators.push(arg)
        } else {
          elementArgs.push(arg)
        }
      }

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

      template.style =
        function() {
          var css = this.styleSelector + " {"
          for (name in this.cssProperties) {
            css = css + name + ": " + this.cssProperties[name] + ";"
          }
          css = css + "}"
          return css
        }

      template.generator = element.generator(elementArgs)

      template.styleSelector = 
        getFirstClass(elementArgs)

      template.cssProperties = cssProperties

      return template
    }

    function getFirstClass(args) {
      for(var i=0; i<args.length; i++) {
        var arg = args[0]
        if (typeof arg == "string") {
          var parts = arg.match(/^\.([a-zA-Z-]+)/)
          if (parts) {
            return parts[1]
          }
        }
      }
    }

    element.stylesheet = function() {
      var el = element("style")
      for(var i=0; i<arguments.length; i++) {
        el.children.push(arguments[i].style())
      }
      return el
    }

    return element
  }
)