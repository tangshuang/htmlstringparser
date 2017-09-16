export default function diff(oldNodes, newNodes, parentNode) {
  let oldIdentifies = oldNodes.map(vnode => identify(vnode))
  let newIdentifies = newNodes.map(vnode => identify(vnode))

  let patches = []

  let finalIndentifies = []
  let finalNodes = []

  oldIdentifies.forEach((id, i) => {
    let oldNode = oldNodes[i]
    if (newIdentifies.indexOf(id) === -1) {
      patches.push(makePatch('removeChild', parentNode, oldNode))
    }
    else {
      finalIndentifies.push(id)
      finalNodes.push(oldNode)
    }
  })

  newIdentifies.forEach((id, i) => {
    let newNode = newNodes[i]

    // all nodes are new
    if (oldIdentifies.length === 0) {
      patches.push(makePatch('appendChild', parentNode, newNode))
      return
    }

    let targetIndentify = finalIndentifies[i]
    let targetNode = finalNodes[i]

    let foundPosition = findIndentifyIndex(id, finalIndentifies, i)

    // identifies are at the same position, means node has not changed
    if (id === targetIndentify) {
      patches = patches.concat(diffSameNodes(targetNode, newNode))
    }
    // identifies are NOT at the same position, but exists in old nodes, means node has been moved
    else if (foundPosition !== -1) {
      let oldNode = finalNodes[foundPosition]
      let oldIndentify = finalIndentifies[foundPosition]
      patches.push(makePatch('insertBefore', targetNode, oldNode))

      finalNodes.splice(foundPosition, 1)
      finalNodes.splice(i, 0, oldNode)
      finalIndentifies.splice(foundPosition, 1)
      finalIndentifies.splice(i, 0, oldIndentify)

      usedIndentifies.push(oldIndentify)
    }
    // not exists, insert
    else if (i < finalIndentifies.length) {
      patches.push(makePatch('insertBefore', targetNode, newNode))
      finalNodes.splice(i, 0, newNode)
      finalIndentifies.splice(i, 0, id)
    }
    // not exists, append
    else {
      patches.push(makePatch('appendChild', parentNode, newNode))
      finalNodes.push(newNode)
      finalIndentifies.push(id)
    }
  })

  return patches
}

function identify(vnode) {
  if (vnode.attrs.key) {
    return vnode.name + ':' + vnode.attrs.key
  }
  return vnode.name + ':' + Object.keys(vnode.attrs).join(',')
}

function makePatch(action, target, context) {
  return {
    action,
    target,
    context,
  }
}

function diffSameNodes(oldNode, newNode) {
  let patches = []

  if (oldNode.text !== newNode.text) {
    patches.push(makePatch('innerText', oldNode, newNode.text))
  }

  let attrsPatches = diffAttributes(oldNode, newNode)
  if (attrsPatches.length) {
    patches = patches.push(makePatch('setAttribute', oldNode, attrsPatches))
  }

  let oldChildren = oldNode.children
  let newChildren = newNode.children

  patches = patches.concat(diff(oldChildren, newChildren, oldNode))

  return patches
}

function diffAttributes(oldNode, newNode) {
  let patches = []

  let oldAttrs = oldNode.attrs
  let newAttrs = newNode.attrs

  let keys = Object.keys(newAttrs)
  if (keys.length) {
    keys.forEach(key => {
      let oldValue = oldAttrs[key]
      let newVaule = newAttrs[key]

      if (oldValue !== newVaule) {
        patches.push({
          key,
          value: newVaule,
        })
      }
    })
  }

  return patches
}

function findIndentifyIndex(id, ids, cursor) {
  for (let i = cursor, len = ids.length; i < len; i ++) {
    if (id === ids[i]) {
      return i
    }
  }
  return -1
}
