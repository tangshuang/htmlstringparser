const Parser = require('htmlparser2').Parser

class HTMLStringParser {
  constructor(html) {
    let self = this
    let elements = []
    let recordtree = []
    let VNodeProtoType = {
      get elements() {
        return getElements(this)
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
      getElementsByAttribution(attrName, attrValue) {
        return self.getElementsByAttribution.call(this, attrName, attrValue)
      },
      select(selector) {
        return self.select.call(this, selector)
      },
    }
    function getElements(vnode) {
      let elements = []
      vnode.children.forEach(item => {
        elements.push(item)
        if (item.children.length) {
          elements = elements.concat(getElements(item))
        }
      })
      return elements
    }
    function createVNode(props) {
      let obj = Object.create(VNodeProtoType)
      let keys = Object.keys(props)
      keys.forEach(prop => obj[prop] = props[prop])
      return obj
    }

    let parser = new Parser({
      onopentag(name, attrs) {
        let parent = recordtree.length ? recordtree[recordtree.length - 1] : undefined
        let vnode = createVNode({
          name: name,
          id: attrs.id,
          class: attrs.class ? attrs.class.split(' ') : [],
          attrs: attrs,
          parent,
          children: [],
          text: undefined,
        })
        if (parent) {
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
  getElements() {
    return this.elements.filter(item => !item.parent)
  }
  getElementById(id) {
    let els = this.elements.filter(item => item.id === id)
    if (els.length) {
      return els[0]
    }
    return null
  }
  getElementsByClassName(className) {
    return this.elements.filter(item => item.class.indexOf(className) > -1)
  }
  getElementsByTagName(tagName) {
    return this.elements.filter(item => item.name == tagName)
  }
  getElementsByAttribution(attrName, attrValue) {
    return this.elements.filter(item => item.attrs[attrName] && item.attrs[attrName] === attrValue)
  }
  select(selector) {
    let type = selector.substring(0, 1)
    let formula = selector.substring(1)
    switch (type) {
      case '#':
        return this.getElementById(formula)
        break
      case '.':
        return this.getElementsByClassName(formula)
        break
      case '[':
        formula = formula.substring(0, formula.length - 1)
        let [attrName, attrValue] = formula.split('=')
        return this.getElementsByAttribution(attrName, attrValue)
        break
      default:
        return this.getElementsByTagName(selector)
    }
  }
}

module.exports = HTMLStringParser
