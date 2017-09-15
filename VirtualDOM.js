import {Parser} from 'htmlparser2'
import createElement from './createElement'

function foreach(obj, callback) {
  let keys = Object.keys(obj)
  keys.forEach(key => {
    let value = obj[key]
    callback(key, value)
  })
}
function merge(obj1, obj2) {
  let obj = {}
  foreach(obj1, (key, value) => obj[key] = value)
  foreach(obj2, (key, value) => obj[key] = value)
  return obj
}

export default class VirtualDOM {
  constructor({template, data, events = {}, selector}) {
    this.template = template
    this.data = data
    this.events = events
    this.selector = selector
    this.vnodes = this.createVirtualDOM()
  }
  createVirtualDOM() {
    let template = this.template
    let data = this.data
    let interpose = (str, key, value) => {
      if (typeof str !== 'string') {
        return str
      }
      if (str.indexOf('{{') > -1 && str.indexOf('}}')) {
        let reg = new RegExp('\{\{' + key + '\}\}', 'g')
        str = str.replace(reg, value)
      }
      return str
    }

    let dataKeys = Object.keys(data)
    if (dataKeys.length) {
      dataKeys.forEach(key => {
        let value = data[key]
        template = interpose(template, key, value)
      })
    }

    let self = this
    let elements = []
    let recordtree = []
    let createVNode = (name, attrs) => {
      let obj = {
        name,
        id: attrs.id,
        class: attrs.class ? attrs.class.split(' ') : [],
        parent: null,
        children: [],
        text: null,
        events: {},
      }

      let attrKeys = Object.keys(attrs)
      attrKeys.forEach(key => {
        let value = attrs[key]
        if (key.indexOf('on') === 0 && value.substring(0, 3) == '{{:' && value.substring(value.length - 2) == '}}') {
          let eventName = key.substring(2).toLowerCase()
          let eventCallbackName = value.substring(3, value.length - 2)

          obj.events[eventName] = this.events[eventCallbackName].bind(this)
          delete attrs[key]
        }
      })
      obj.attrs = attrs

      return obj
    }

    let parser = new Parser({
      onopentag(name, attrs) {
        let vnode = createVNode(name, attrs)

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
    parser.parseChunk(template)
    parser.done()

    elements.forEach(vnode => {
      if (vnode.name === '@foreach') {
        let attrs = vnode.attrs
        let items = data[attrs.target]
        let key = attrs.key
        let value = attrs.value
        let children = vnode.children
        let childNodes = []

        if (items) {
          foreach(items, (i, item) => {
            children.forEach(child => {
              let node = {}
              foreach(child, (prop, value) => {
                node[prop] = value
              })
              node.text = interpose(node.text, key, i)
              node.text = interpose(node.text, value, item)
              foreach(node.attrs, (k, v) => {
                node.attrs[k] = interpose(v, key, i)
                node.attrs[k] = interpose(v, value, item)
              })
              node.id = node.attrs.id
              node.class = node.attrs.class ? node.attrs.class.split(' ') : []
              childNodes.push(node)
            })
          })
        }

        if (childNodes.length) {
          let parentChildren = vnode.parent ? vnode.parent.children : elements
          let i = parentChildren.indexOf(vnode)
          parentChildren.splice(i, 1, ...childNodes)
        }
      }
      else if (vnode.name === '@if') {
        let attrs = vnode.attrs
        let condition = attrs.condition
        let children = vnode.children
        let parentChildren = vnode.parent ? vnode.parent.children : elements
        let i = parentChildren.indexOf(vnode)

        if (eval(condition)) {
          parentChildren.splice(i, 1, ...children)
        }
        else {
          parentChildren.splice(i, 1)
        }
      }
    })

    let roots = elements.filter(item => !item.parent)
    return roots
  }
  createDOM() {
    let elements = this.vnodes.map(item => createElement(item))
    return elements
  }
  render() {
    if (!this.selector) {
      return
    }

    let selector = this.selector
    let elements = this.createDOM()
    let container = document.querySelector(selector)

    container.innerHTML = ''
    elements.forEach(item => container.appendChild(item))
  }
  update(data) {
    this.data = merge(this.data, data)

    console.log(this.vnodes)

    this.diff()

    console.log(this.vnodes)

    this.patch()

    console.log(this.vnodes)
  }
  diff() {
    function diffNodes(oldNodes, newNodes, parentNodeElement) {
      let patches = []
      let cursor = -1

      if (!parentNodeElement) {
        parentNodeElement = oldNodes[0].$element.parentNode
      }

      for (let i = 0, len = newNodes.length; i < len; i ++) {
        cursor = i

        let newNode = newNodes[i]
        let oldNode = oldNodes[i]

        if (oldNode === undefined) {
          break
        }

        if (newNode.name !== oldNode.name) {
          break
        }

        if (newNode.id !== oldNode.id) {
          break
        }

        if (JSON.stringify(newNode.attrs) != JSON.stringify(oldNode.attrs)) {
          break
        }

        let textPatches = diffText(oldNode, newNode)
        let childrenPatches = diffChildren(oldNode, newNode)
        patches = patches.concat(textPatches).concat(childrenPatches)
      }

      if (cursor > -1) {
        for (let i = cursor, len = oldNodes.length; i < len; i ++) {
          let oldNode = oldNodes[i]
          patches.push({
            action: 'removeChild',
            target: parentNodeElement,
            vnode: oldNode,
          })
        }
        oldNodes.splice(cursor, oldNodes.length - cursor)

        for (let i = cursor, len = newNodes.length; i < len; i ++) {
          let newNode = newNodes[i]
          patches.push({
            action: 'appendChild',
            target: parentNodeElement,
            vnode: newNode,
          })
        }
      }

      return patches
    }
    function diffChildren(oldNode, newNode) {
      let oldChildren = oldNode.children
      let newChildren = newNode.children
      let patches = diffNodes(oldChildren, newChildren, oldNode.$element)
      return patches
    }
    function diffText(oldNode, newNode) {
      let patches = []
      let oldText = oldNode.text
      let newText = newNode.text
      if (oldText !== newText) {
        patches.push({
          action: 'innerText',
          target: oldNode.$element,
          text: newText,
        })
      }
      return patches
    }

    let lastVnodes = this.vnodes
    let newVnodes = this.createVirtualDOM()
    let patches = diffNodes(lastVnodes, newVnodes)

    this.patches = patches
  }
  patch() {
    this.patches.forEach(item => {
      let target
      let vnode
      switch (item.action) {
        case 'removeChild':
          target = item.target
          vnode = item.vnode
          target.removeChild(vnode.$element)
          vnode.$element.$vnode = null
          vnode.$element = null
          break
        case 'appendChild':
          target = item.target
          vnode = item.vnode
          target.appendChild(createElement(vnode))
          break
        case 'innerText':
          target = item.target
          target.innerText = item.text
          break
        default:
          ;
      }
    })
  }
}
