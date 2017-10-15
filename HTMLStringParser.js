import {Parser} from 'htmlparser2'

export default class HTMLStringParser {
  constructor(html) {
    let that = this
    let elements = []
    let recordtree = []
    let VNodePrototype = {
      parent: null,
      children: [],
      getText() {
        let texts = []
        this.children.forEach(item => {
          if (item.text !== undefined) {
            texts.push(item.text)
          }
          else if (item.children.length) {
            texts = texts.concat(this.getText.call(item))
          }
        })
        return texts.join(' ')
      },
      getElements() {
        let elements = []
        this.children.forEach(item => {
          if (item.text !== undefined) {
            return
          }
          
          elements.push(item)
          if (item.children.length) {
            elements = elements.concat(this.getElements.call(item))
          }
        })
        return elements
      },
      getElementById(id) {
        return that.getElementById.call(this, id)
      },
      getElementsByClassName(className) {
        return that.getElementsByClassName.call(this, className)
      },
      getElementsByTagName(tagName) {
        return that.getElementsByTagName.call(this, tagName)
      },
      getElementsByAttribute(attrName, attrValue) {
        return that.getElementsByAttribute.call(this, attrName, attrValue)
      },
      querySelector(selector) {
        return that.querySelector.call(this, selector)
      },
      querySelectorAll(selector) {
        return that.querySelectorAll.call(this, selector)
      },
    }

    let parser = new Parser({
      onopentag(name, attrs) {
        let proto = Object.create(VNodePrototype)
        let vnode = that.createVNode(name, attrs, proto)

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
        if (!text.trim()) {
          return
        }
        
        let parent = recordtree.length ? recordtree[recordtree.length - 1] : null
        let content = text.replace(/\s+/g, ' ')
        let vnode = {
          text: content,
          parent,
        }
        if (parent) {
          if (!parent.hasOwnProperty('children')) {
            parent.children = []
          }
          parent.children.push(vnode)
        }
        
        elements.push(vnode)
      },
      onclosetag(name) {
        recordtree.pop()
      }
    })
    parser.parseChunk(html)
    parser.done()

    this.elements = elements
  }
  createVNode(name, attrs, proto) {
    proto.name = name
    proto.id = attrs.id || ''
    proto.class = attrs.class ? attrs.class.split(' ') : []
    proto.attrs = attrs
    return proto
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
