# HTMLStringParser

A parser to parse HTML string to js object (json). The final json is the same tree relationship as HTML DOM structure.

## Usage

```
import HTMLStringParser from './htmlstring-parser'

let html = '...'
let parser = new HTMLStringParser(html)

let rootNodes = parser.getElements()
let header = parser.getElementById('header')
let logo = header.getElementById('logo')

console.log(JSON.stringify(rootNodes[0]))
```

It's source code in `htmlstring-parser.js`, you should have to install `htmlparser2` first if you want to use htmlstring-parser.js. And if you do not want to install thirdpart vendor, use `htmlstring-parser.bundle.js` instead, it contains dependencies.

## Methods of Parser

### getElements()

Get root nodes from your passed html. Not like other template driver, in HTMLStringParser, you can pass parallel root elements to parse. i.e.

```
let parser = new HTMLStringParser(`
  <div id="header"></div>
  <div id="footer"></div>
`)
```

And `getElements` will get two nodes, header and footer, in an array.

### getElementById(id)

Get a node by its id. However in some cases, there may be several tags with same id, only the first one will be return.

### getElementsByClassName(className)

Get nodes by one of its class name. Results in an array.

### getElementsByTagName(tagName)

Get nodes by its tag name. Results in an array.

### getElementsByAttribution(attrName, attrValue)

Get nodes by one of its attribution. Attribution name and value should be given tegother. Results in an array.

### select(selector)

A simple way to select elements. i.e.

```
let header = parser.select('#header') // a node
let containers = parser.select('.container') // an array of nodes
let p = parser.select('p') // an array
let data = parser.select('[data=my_name]') // an array, fuzzy match NOT work
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
  parent: ..., // a reference to another Virtual Node, null if this node is top level
  children: [...], // references to other Virtual Nodes, empty array if no children
  text: 'My BLOG', // the text in this tag. Children's tags text will not stay here
}
```

A Virtual Node Tree is constituted by all Virtual Nodes. The structure is the same with your html structure.

And a Virtual Node has its methods:

### getElementById(id)

### getElementsByClassName(className)

### getElementsByTagName(tagName)

### getElementsByAttribution(attrName, attrValue)

### select(selector)

Whose usage is the same with Parser.
