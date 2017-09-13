function renderToHTMLString(json) {
  let html = ''

  // if it is an Array, it means there are several nodes on the top level
  if (Array.isArray(json)) {
    json.forEach(node => {
      html += renderToHTMLString(node)
    })
    return html
  }

  // if it is an Object
  html += createNode(json)

  return html
}

function createNode(node) {
  let name = node.name
  let html = `<${name}`
  let voidElements = ['br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'command', 'embed', 'keygen', 'param', 'source', 'track', 'wbr']
  let attrs = node.attrs
  let keys = Object.keys(attrs)

  if (keys && keys.length) {
    keys.forEach(key => {
      let value = attrs[key]
      if (value === '' || value === true) {
        html += ` ${key}`
      }
      else {
        html += ` ${key}="${value}"`
      }
    })
  }

  if (voidElements.indexOf(name) > -1) {
    html += ' />'
    return html
  }

  html += '>'

  if (node.text) {
    html += node.text + `</${name}>`
    return html
  }

  if (node.children && node.children.length) {
    html += renderToHTMLString(node.children)
  }

  html += `</${name}>`
  return html
}

if(typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = renderToHTMLString
}
