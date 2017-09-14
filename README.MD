# HTMLStringParser

A parser to parse HTML string to js object (json). The final json is the same tree relationship as HTML DOM structure.

## Usage

```
import HTMLStringParser from './HTMLStringParser'

let html = '...'
let parser = new HTMLStringParser(html)

let rootNodes = parser.getRoots()
let header = parser.getElementById('header')
let logo = header.getElementById('logo')

console.log(JSON.stringify(rootNodes[0]))
```

It's source code in `HTMLStringParser.js`, you should have to install `htmlparser2` first if you want to use HTMLStringParser.js. And if you do not want to install thirdpart vendor, use `HTMLStringParser.browser.js` instead, it contains dependencies.

## Methods of Parser

### getRoots()

Get root nodes from your passed html. Not like other template driver, in HTMLStringParser, you can pass parallel root elements to parse. i.e.

```
let parser = new HTMLStringParser(`
  <div id="header"></div>
  <div id="footer"></div>
`)
```

And `getRoots` will get two nodes, header and footer, in an array.

### getElements()

Get all elements/tags without level gap in an array.

### getElementById(id)

Get a node by its id. However in some cases, there may be several tags with same id, only the first one will be return.

### getElementsByClassName(className)

Get nodes by one of its class name. Results in an array.

### getElementsByTagName(tagName)

Get nodes by its tag name. Results in an array.

### getElementsByAttribute(attrName, attrValue)

Get nodes by one of its attribute. Attribution name and value should be given tegother. Results in an array.

### querySelector(selector)

A simple way to select an element, return this first vnode if several vnodes match. i.e.

```
let header = parser.querySelector('#header') // by id
let container = parser.querySelector('.container') // by className
let p = parser.querySelector('p') // by tagName
let data = parser.querySelector('[data=my_name]') // by attribute key and value
```

### querySelectorAll(selector)

A simple way to select elements, return an array (even though by id). i.e

```
let header = parser.querySelectorAll('#header') // by id, an array
let container = parser.querySelectorAll('.container') // by className
let p = parser.querySelectorAll('p') // by tagName
let data = parser.querySelectorAll('[data=my_name]') // by attribute key and value
```

## Virtual Node

Every HTML tag will be convert to be a object which is called **Virtual Node** here.

A Virtual Node is like:

```
{
  name: 'div',
  id: 'header', // undefined if no id
  class: ['float-right', 'font-big'], // empty array if no class
  attrs: {
    id: 'header',
    class: 'float-right font-big',
    ...
  },
  text: 'My BLOG', // the text in this tag. Children's tags text will not stay here
  parent: ..., // a reference to another Virtual Node, null if this node is top level
  children: [...], // references to other Virtual Nodes, empty array if no children
}
```

A Virtual Node Tree is constituted by all Virtual Nodes. The structure is the same with your html structure.

And a Virtual Node also has its methods:

### getElementById(id)

### getElementsByClassName(className)

### getElementsByTagName(tagName)

### getElementsByAttribute(attrName, attrValue)

### querySelector(selector)

### querySelectorAll(selector)

Whose usage is the same with Parser.

## Extends

As a developer, you may want to build your own VNode structure. In fact, developers can extend easly:

```
class MyParser extends HTMLStringParser {
  createVNode(name, attrs) {
    let obj = Object.create(HTMLStringParser.VNodeProtoType)
    obj.tagName = name
    obj.attributes = attrs
    return obj
  }
}
```

Then your VNode properties' name change to what you want.

You may notice `Object.create(this.VNodeProtoType)`, yes this is the key for a VNode to have methods like `getElementById`. If you do not need this, you can drop this step. `this.VNodeProtoType` is like:

```
{
  parent: null,
  children: [],
  text: null,
  getElementById: function() {},
  // .... other methods ...
}
```

`parent`, `children`, `text`, `events` are both in prototype.


## renderToHTMLString

Use `renderToHTMLString.js` to do a reverse action. It provide a function `renderToHTMLString` to get a html string from VNode.

```
let vnode = {
  name: 'div',
  attrs: {
    id: 'test',
    class: 'fadeIn fade',
  },
  children: [
    {
      name: 'p',
      text: 'I love you!',
    },
  ],
}
let html = renderToHTMLString(vnode)
```

Even you can use this function to get a xml structure data.

## createElement

Use createElement.js to build a real DOM element from VNode.

```
let vnode = {
  name: 'div',
  attrs: {
    id: 'test',
    class: 'fadeIn fade',
  },
  children: [
    {
      name: 'p',
      text: 'I love you!',
    },
  ],
  events: {
    click(e) {
      e.target.style.color = 'red'
    },
  },
}
let el = createElement(vnode)
document.body.appendChild(el)
```

Notice `events` property. Unlike `renderToHTMLString`, you can use `events` to build callback functions.

VNodes when using `renderToHTMLString` and `createElement` should not have both `text` and `children`. If a VNode has both `text` and `children`, `text` will be used and `children` will be ignored. So it is recommended to wrap a textNode in a single html tag like `span` if the textNode has brother nodes.
