import {Parser} from 'htmlparser2'

export default class HTMLStringParser {
  constructor(html) {
    let self = this
    let elements = []
    let recordtree = []

    let parser = new Parser({
      onopentag(name, attrs) {
        let vnode = self.createVNode(name, attrs)

        let parent = recordtree.length ? recordtree[recordtree.length - 1] : null
        if (parent) {
          vnode.parent = parent
          if (!parent.hasOwnProperty('children')) {
            parent.children = []
          }
          parent.children.push(vnode)
        }

        recordtree.push(vnode)
        elements.push(vnode)
      },
      ontext(text) {
        let vnode = recordtree[recordtree.length - 1]
        if (vnode) {
          vnode.text = text.trim()
        }
      },
      onclosetag(name) {
        recordtree.pop()
      }
    })
    parser.parseChunk(html)
    parser.done()

    this.elements = elements
  }
  static get VNodePrototype() {
      let self = this
      return {
        parent: null,
        children: [],
        text: null,
        getElements() {
            let elements = []
            this.children.forEach(item => {
              elements.push(item)
              if (item.children.length) {
                elements = elements.concat(this.getElements(item))
              }
            })
            return elements
        },
        getElementById(id) {
          return self.getElementById.call(this, id)
        },
        getElementsByClassName(className) {
          return self.getElementsByClassName.call(this, className)
        },
        getElementsByTagName(tagName) {
          return self.getElementsByTagName.call(this, tagName)
        },
        getElementsByAttribute(attrName, attrValue) {
          return self.getElementsByAttribute.call(this, attrName, attrValue)
        },
        querySelector(selector) {
          return self.querySelector.call(this, selector)
        },
        querySelectorAll(selector) {
          return self.querySelectorAll.call(this, selector)
        },
      }
  }
  createVNode(name, attrs) {
      let obj = Object.create(HTMLStringParser.VNodePrototype)
      obj.name = name
      obj.id = attrs.id
      obj.class = attrs.class ? attrs.class.split(' ') : []
      obj.attrs = attrs
      return obj
  }
  getRoots() {
      return this.elements.filter(item => !item.parent)
  }
  getElements() {
    return this.elements
  }
  getElementById(id) {
    let els = this.getElements().filter(item => item.id === id)
    if (els.length) {
      return els[0]
    }
    return null
  }
  getElementsByClassName(className) {
    return this.getElements().filter(item => item.class.indexOf(className) > -1)
  }
  getElementsByTagName(tagName) {
    return this.getElements().filter(item => item.name == tagName)
  }
  getElementsByAttribute(attrName, attrValue) {
    return this.getElements().filter(item => item.attrs[attrName] && item.attrs[attrName] === attrValue)
  }
  querySelectorAll(selector) {
    let type = selector.substring(0, 1)
    let formula = selector.substring(1)
    switch (type) {
      case '#':
        return this.getElements().filter(item => item.id === formula)
        break
      case '.':
        return this.getElementsByClassName(formula)
        break
      case '[':
        formula = formula.substring(0, formula.length - 1)
        let [attrName, attrValue] = formula.split('=')
        return this.getElementsByAttribute(attrName, attrValue)
        break
      default:
        return this.getElementsByTagName(selector)
    }
  }
  querySelector(selector) {
    let results = this.querySelectorAll(selector)
    return results[0]
  }
}
