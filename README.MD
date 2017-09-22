# HTMLStringParser

A parser to parse HTML string to js object (json).
The final json is the same tree relationship as HTML DOM structure.

## Install

```
npm install --save htmlstringparser
```

If you want to use in browser:

```
<script src="dist/HTMLStringParser"></script>
<script>
window['HTMLStringParser'] = window['HTMLStringParser']['default']
</script>
```

## Usage

```
import HTMLStringParser from 'htmlstringparser'

let html = '...'
let parser = new HTMLStringParser(html)

let rootNodes = parser.getRoots()
let header = parser.getElementById('header')
let containers = header.getElementsByClassName('container')

console.log(rootNodes, header, containers)
```

HTMLStringParser is based on `htmlparser2`, and packed it in the dist code. If you have another module using `htmlparser2`, you can use source code which is in ES6:

```
import HTMLStringParser from 'htmlstringparser/HTMLStringParser'
```

## Methods

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

Get all elements/tags without level gap/flat in an array.

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

## VNode

Every HTML tag will be convert to be a object which is called **Virtual Node**/**VNode** here.

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

Return the first element under current VNode which has id attribute equals passed id.

### getElementsByClassName(className)

Return elements by className under current VNode in an array.

### getElementsByTagName(tagName)

Return elements by tagName under current VNode in an array.

### getElementsByAttribute(attrName, attrValue)

Return elements by attribute name and value under current VNode in an array.

### querySelector(selector)

Return the first element by selector under current VNode.

### querySelectorAll(selector)

Return elements by selector under current VNode in an array.

## renderToHTMLString

Use `renderToHTMLString.js` to do a reverse action. It provides a function `renderToHTMLString` to get a html string from VNode.

```
import renderToHTMLString from 'htmlstringparser/renderToHTMLString'

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
let htmlstr = renderToHTMLString(vnode)
```

Even you can use this function to get a xml structure data. However, html has special tags like `img` `input` `meta` which has no close tag, so it is not recommended. 

## Extends

As a developer, you may want to build your own VNode structure. In fact, developers can extend easly:

```
class MyParser extends HTMLStringParser {
  createVNode(name, attrs, proto) {
    proto.tagName = name
    proto.attributes = attrs
    return proto
  }
}
```

Then your VNode properties' name change to what you want.

You may notice `proto`, yes this is the key for a VNode to have methods like `getElementById`. If you do not need this, you can drop it by return a new object. `parent`, `children`, `text`, `events` are all in prototype.

## Virtual DOM

I have create a virtual dom class, but moved to a new repository [here](https://github.com/tangshuang/hst-virtual-dom).

## MIT License

Copyright 2017 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.