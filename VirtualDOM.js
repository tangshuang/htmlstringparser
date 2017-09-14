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
    this.vnodes = this.createVirtualDOM()
    if (selector) {
      this.render(selector)
    }
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
          // vnode.index = parent.children.length
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
          let parent = vnode.parent
          let i = parent.children.indexOf(vnode)
          parent.children.splice(i, 1, ...childNodes)
        }
      }
    })

    return elements.filter(item => !item.parent)
  }
  createDOM() {
    let elements = this.vnodes.map(item => createElement(item))
    return elements
  }
  render(selector) {
    let elements = this.createDOM()
    let container = document.querySelector(selector)
    elements.forEach(item => container.appendChild(item))
  }
  update(data) {
    this.data = merge(this.data, data)

    this.diff()
    this.patch()
  }
  diff() {
    let patches = []
    let hashNode = node => {
      return node.name + ':' + JSON.stringify(node.attrs)
    }
    function diffNodes(oldNodes, newNodes, patches) {
      let oldHashes = oldNodes.map(node => hashNode(node))
      let newHashes = newNodes.map(node => hashNode(node))
      let finalHashes = []
      let finalNodes = []

      oldHashes.forEach((item, i) => {
        let oldNode = oldNodes[i]
        // remove
        if (newHashes.indexOf(item) === -1) {
          patches.push({
            action: 'removeChild',
            target: oldNode,
          })
        }
        else {
          finalHashes.push(item)
          finalNodes.push(oldNode)
        }
      })

      newHashes.forEach((item, i) => {
        let newNode = newNodes[i]
        let index = finalHashes.indexOf(item)
        // not exists, insert
        if (index === -1) {
          if (finalNodes.length && i < finalNodes.length) {
            let oldNode = finalNodes[i] // its must be a rendered vnode which has $element property
            patches.push({
              vnode: newNode,
              action: 'insertBefore',
              target: oldNode,
            })
          }
          else {
            patches.push({
              vnode: newNode,
              action: 'appendChild',
              target: oldNodes[0],
            })
          }

          finalHashes.splice(i, 0, item)
          finalNodes.splice(i, 0, newNode)
        }
        // moved, just treat it to be new
        else if (index !== i) {
          finalHashes.splice(i, finalHashes.length - i)
          finalNodes.splice(i, finalNodes.length - i)

          let oldNode = finalNodes[i] // do NOT know whether it is rendered vnode
          patches.push({
            vnode: newNode,
            action: 'appendChild',
            target: oldNode,
          })
        }
        // the same, diff children
        else {
          diffChildren(finalNodes[i], newNodes[i], patches)
        }
      })

      return finalNodes
    }
    function diffChildren(oldNode, newNode, patches) {
      let oldText = oldNode.text
      let newText = newNode.text
      if (oldText !== newText) {
        patches.push({
          vnode: oldNode,
          action: 'innerText',
          text: newText,
        })
      }

      let oldChildren = oldNode.children
      let newChildren = newNode.children
      diffNodes(oldChildren, newChildren, patches)
    }

    let lastVnodes = this.vnodes
    let newVnodes = this.createVirtualDOM()
    let finalNodes = diffNodes(lastVnodes, newVnodes, patches)

    this.patches = patches
    this.vnodes = finalNodes
  }
  patch() {
    this.patches.forEach(item => {
      let target = item.target
      switch (item.action) {
        case 'removeChild':
          target.$element.parentNode.removeChild(target)
          target.$element.$vnode = null
          target.$element = null
          break
        case 'insertBefore':
          target.$element.parentNode.insertBefore(createElement(item.vnode), target.$element)
          break
        case 'appendChild':
          target.$element.parentNode.appendChild(createElement(item.vnode))
          break
        case 'innerText':
          item.vnode.$element.innerText = item.text
          break
        default:
          ;
      }
    })
  }
}
