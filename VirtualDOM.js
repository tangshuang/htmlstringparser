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
      if (str.indexOf('{{') && str.indexOf('}}')) {
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
              child.text = interpose(child.text, key, i)
              child.text = interpose(child.text, value, item)
              foreach(child.attrs, (k, v) => {
                child.attrs[k] = interpose(v, key, i)
                child.attrs[k] = interpose(v, value, item)
              })
              child.id = child.attrs.id
              child.class = child.attrs.class ? child.attrs.class.split(' ') : []
            })
            childNodes = childNodes.concat(children)
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
      return node.name + ':' + JSON.stringify(node.attrs) + '|' + node.text
    }
    function diffNodes(oldNodes, newNodes, patches) {
      let oldHashes = oldNodes.map(node => hashNode(node))
      let newHashes = newNodes.map(node => hashNode(node))
      let finalHashes = []
      let finalNodes = []

      oldHashes.forEach((item, i) => {
        // remove
        if (newHashes.indexOf(item) === -1) {
          patches.push({
            action: 'remove',
            target: oldNodes[i],
          })
        }
        else {
          finalHashes.push(item)
          finalNodes.push(oldNodes[i])
        }
      })

      newHashes.forEach((item, i) => {
        let index = finalHashes.indexOf(item)
        // not exists, insert
        if (index === -1) {
          let targetNode
          let action
          if (!finalNodes.length || i > finalNodes.length) {
            targetNode = oldNodes[i].parent
            action = 'appendChild'
          }
          else {
            targetNode = finalNodes[i]
            action = 'insertBefore'
          }
          finalHashes.splice(i, 0, item)
          finalNodes.splice(i, 0, newNodes[i])
          patches.push({
            vnode: newNodes[i],
            action,
            target: targetNode,
          })
        }
        // moved
        else if (index !== i) {
          let oldChangedNode = finalNodes[index]
          let targetNode = finalNodes[i]
          finalHashes.splice(index, 1)
          finalNodes.splice(index, 1)
          finalHashes.splice(i, 0, item)
          finalNodes.splice(i, 0, newNodes[i])
          patches.push({
            vnode: newNodes[i],
            action: 'insertBefore',
            target: targetNode,
          })
          diffChildren(oldChangedNode, newNodes[i], patches)
        }
        // the same, diff children
        else {
          diffChildren(finalNodes[index], newNodes[i], patches)
        }
      })
    }
    function diffChildren(oldNode, newNode, patches) {
      let oldChildren = oldNode.children
      let newChildren = newNode.children
      diffNodes(oldChildren, newChildren, patches)
    }

    let lastVnodes = this.vnodes
    let newVnodes = this.createVirtualDOM()
    diffNodes(lastVnodes, newVnodes, patches)

    this.patches = patches
    this.vnodes = newVnodes
  }
  patch() {
    this.patches.forEach(item => {
      let target = item.target.$el
      switch (item.type) {
        case 'insertBefore':
          target.parentNode.insertBefore(createElement(item.vnode), target)
          break
        case 'appendChild':
          target.parentNode.appendChild(createElement(item.vnode))
          break
        case 'remove':
          target.parentNode.removeChild(target)
          item.target.$el = null
          break
        default:
          ;
      }
    })
  }
}
