var runTest = require("run-test")(require)


runTest(
  "escape html",
  ["./"],
  function(expect, done, element) {
    var el = element(element.escape("<br>&nbsp;"))
    expect(el.html()).to.equal("<div>&lt;br&gt;&amp;nbsp;</div>")
    done()
  }
)


runTest(
  "custom tags",
  ["./"],
  function(expect, done, element) {
    var hen = element(element.tag("hen"))
    expect(hen.html()).to.equal("<hen></hen>")
    done()
  }
)


runTest(
  ".htmlable objects can be children",
  ["./"],
  function(expect, done, element) {
    var el = element({html: function() { return "waz" }})
    expect(el.html()).to.equal("<div>waz</div>")
    done()
  }
)


runTest(
  "generators",
  ["./"],
  function(expect, done, element) {

    var generator = element.generator(["a"])

    var el = element()
    generator.apply(el)
    expect(el.html()).to.equal("<a></a>")

    // The template function also makes it easy to pass along element args, by proxying whatever else you pass to the element:

    var houseBurger = element.template(function(house) {
        this.children.push(house.parts.join())
      },
      ".burger"
    )

    var house = {
      parts: ["door", "window"]
    }

    var el = houseBurger(house)

    expect(el.html()).to.equal("<div class=\"burger\">door,window</div>")

    done()
  }
)


runTest(
  "template composition",
  ["./"],
  function(expect, done, element) {

    var Image = element.template("img")
    var Polaroid = element.template(Image, ".polaroid")
    var el = Polaroid()

    expect(el.html()).to.equal("<img class=\"polaroid\"></img>")

    done()
  }
)




runTest(
  "generating container templates",
  ["./"],
  function(expect, done, element) {

    // It's pretty common for templates to just take some children, so we provide a handy dandy containerGenerator.

    var Body = element.template.container("body")

    var el = Body(
      element("img"),
      element("a")
    )

    expect(el.html()).to.equal("<body><img></img><a></a></body>")

    // Which is equivalent to

    element.template(
      "body",
      function(a, b /*etc*/) {
        this.children.push(a)
        this.children.push(b)
        /*etc*/
      }
    )

    done()
  }
)




runTest(
  "inline styles",
  ["./"],
  function(expect, done, element) {
    var red = element(
      element.style({color: "red"})
    )

    expect(red.html()).to.equal("<div style='color: red;'></div>")

    done()
  }
)

runTest(
  "template styles",
  ["./"],
  function(expect, done, element) {

    var Foo = element.template(".foo", element.style({"color": "red"}))
    var el = Foo()
    expect(el.html()).to.equal("<div class=\"foo\"></div>")
    expect(Foo.styleSource()).to.contain(".foo {\n  color: red;\n}")

    expect(element.stylesheet(Foo).html()).to.equal("<style>\n.foo {\n  color: red;\n\}\n</style>")

    var Tag = element.template(
      "span.tag",
      element.style({
        "background": "springgreen"
      })
    )
    expect(Tag.styleSource()).to.contain(".tag {\n  background: springgreen;\n}")

    var responsive = element.template(
      ".responsive",
      element.style({
        "@media (max-width: 600px)": {
          "font-size": "0.8em"
        }
      })
    )

    expect(responsive.styleSource()).to.contain("@media (max-width: 600px) {\n.responsive {\n  font-size: 0.8em;\n}\n}")

    done()
  }
)


runTest(
  "multiple targets in one selector",
  ["./"],
  function(expect, done, element) {
    var red = element.style(
      "body.big, body.small",{
        " span, p": {
          "color": "red"}})

    var source = element.stylesheet(red).html()

    expect(source).to.contain("body.big span")

    expect(source).to.contain("body.small span")

    expect(source).to.contain("body.big p")

    expect(source).to.contain("body.small p")

    done()
  }
)


runTest(
  "CSS keyframes",[
  "./"],
  function(expect, done, element) {
    var style = element.style(
      "@keyframes flash",{
      "from": {
        "opacity": "0.1"},
      "to": {
        "opacity": "1.0"},
      })

    var css = style.styleSource().replace(/[\n\s]+/g, " ").trim()

    expect(css).to.equal("@keyframes flash { from { opacity: 0.1; } to { opacity: 1.0; } }")

    done()
  })


runTest(
  "contents",
  ["./"],
  function(expect, done, element) {

    expect(element(element()).html()).to.equal("<div><div></div></div>")

    var bar = element.template(".bar")
    var foo = element.template(".foo", bar())
    var el = foo([bar()])
    expect(el.html()).to.equal("<div class=\"foo\"><div class=\"bar\"></div></div>")

    expect(element("hi").html()).to.equal("<div>hi</div>")

    expect(element([".foo", element("hi")]).html()).to.equal("<div><div class=\"foo\"></div><div>hi</div></div>")

    expect(element("<br>").html()).to.equal("<div><br></div>")

    expect(element(element.raw(".foo")).html()).to.equal("<div>.foo</div>")

    expect(element(element.raw("")).html()).to.equal("<div></div>")

    done()
  }
)



runTest(
  "selectors",
  ["./"],
  function(expect, done, element) {

    expect(element(".fancy").html()).to.equal("<div class=\"fancy\"></div>")

    expect(element(".fancy.feast").html()).to.equal("<div class=\"fancy feast\"></div>")

    expect(element("img").html()).to.equal("<img></img>")

    expect(element(".fancy", "party").html()).to.equal("<div class=\"fancy\">party</div>")

    done()
  }
)



runTest(
  "attributes",
  ["./"],
  function(expect, done, element) {

    expect(element({onclick: "doSomething()"}).html()).to.equal("<div onclick='doSomething()'></div>")

    var el = element({
      onclick: "alert(\"foo\")"
    })

    expect(el.html()).to.equal("<div onclick='alert(\"foo\")'></div>")

    el.addAttributes({"data-foo": "bar"})
    
    done()
  }
)


runTest("javascript attributes",
  ["./"],
  function(expect, done, element) {
    var el = element("a", {href: "javascript:console.log('ezrp')"})

    expect(el.html()).to.equal("<a href='javascript:console.log(&#39;ezrp&#39;)'></a>")
    done()
  }
)



runTest(
  "binding",
  ["./"],
  function(expect, done, element) {

    var el = element()
    var id = el.assignId()
    expect(el.id).to.match(/node-[a-z0-9]{3}/)
    expect(id).to.equal(el.id)
    expect(el.html()).to.equal("<div id=\""+id+"\"></div>")

    done()
  }
)



runTest(
  "bodies",

  ["./"],
  function(expect, done, element) {

    var body = element.template(
      "body",
      element.style({
        margin: "0"
      })
    )

    var html = element.stylesheet(body).html()

    expect(html).to.match(/body {/)
    done()
  }
)


runTest(
  "standalone styles",
  ["./"],
  function(expect, done, element) {
    var body = element.style(
      "body, input", {
        "font-family": "Helvetica",
      }
    )

    expect(body.styleSource()).to.equal(
      "\nbody, input {\n" +
      "  font-family: Helvetica;\n" +
      "}\n"
    )

    done()
  }
)


runTest(
  "quote content styles",
  ["./"],
  function(expect, done, element) {
    var after = element.style(
      ".thing::before", {
        "content": "burb"
      }
    )

    expect(after.styleSource()).to.equal(
      "\n.thing::before {\n" +
      "  content: \"burb\";\n" +
      "}\n"
    )

    done()
  }
)

runTest(
  "descendant styles",
  ["./"],
  function(expect, done, element) {

    var button = element.style(".button", {
      "background": "red",
      "color": "white",

      ".lit": {
        "background": "pink",
      },
    })

    expect(button.styleSource().trim())
    .to.equal([
      ".button {",
      "  background: red;",
      "  color: white;",
      "}",
      "",
      ".button.lit {",
      "  background: pink;",
      "}",
    ].join("\n"))


    button = element.style(".button", {
      " div": {
        "display": "inline-block",
      }
    })

    expect(button.styleSource().trim())
    .to.equal([
      ".button {",
      "}",
      "",
      ".button div {",
      "  display: inline-block;",
      "}",
    ].join("\n"))


    done()
  }
)


runTest(
  "pseudoelements",
  ["./"],
  function(expect, done, element) {

    var arrow = element.style(".arrow", {
      "::after": {
        "content": "\"hiya\"",
      }
    })

    console.log(arrow.styleSource())


    expect(arrow.styleSource().trim())
    .to.equal([
      ".arrow {",
      "}",
      "",
      ".arrow::after {",
      "  content: \"hiya\";",
      "}",
    ].join("\n"))

    done()
  }
)


runTest(
  "onclick",
  ["./", "function-call"],
  function(expect, done, element, functionCall) {

    var el = element()
    el.onclick(functionCall("dirt"))

    expect(el.html()).to.equal("<div onclick='dirt()'></div>")

    done()
  }
)

runTest(
  "spans in text",
  ["./"],
  function(expect, done, element) {
    var el = element([
      "x",
      element("span.foo", "y"),
      "z"
    ])

    expect(el.html()).to.equal("<div>x<span class=\"foo\">y</span>z</div>")
    done()
  }
)

runTest(
  "children can be numbers",
  ["./"],
  function(expect, done, element) {
    var el = element(".answer", [42])

    expect(el.html()).to.equal("<div class=\"answer\">42</div>")

    done()
  }
)

runTest(
  "arrays of arrays of elements",
  ["./"],
  function(expect, done, element) {
    var el = element(["hi", [element(".ho")], "the dairy o"])

    expect(el.html()).to.equal("<div>hi<div><div class=\"ho\"></div></div>the dairy o</div>")

    done()
  }
)


runTest(
  "br",
  ["./"],
  function(expect, done, element) {
    expect(element("br").html()).to.equal("<br>")

    done()
  }
)




