/*global requestAnimationFrame*/
var formatter = require('data-format')()
var fieldTypes = require('data-fields')
var vhook = require('virtual-hook')
var createHeader = require('./header')

module.exports = Form

function Form (h, options) {
  var activeColumnKey = options.activeColumnKey
  var oninput = options.oninput
  var onclick = options.onclick
  var ondestroy = options.ondestroy
  var onclose = options.onclose
  var onupdate = options.onupdate
  var onfocus = options.onfocus
  var properties = options.properties
  var row = options.row
  var columns = row.value
  var fields = []
  var header

  if (typeof options.header === 'object') {
    header = options.header
  } else if (options.header !== false) {
    header = createHeader(h, {
      onclick: onClose,
      closeButtonText: options.closeButtonText
    })
  }

  function onInput (rowKey, propertyKey) {
    return function (event) {
      var inputValue = event.target.value
      if (oninput) oninput(event, rowKey, propertyKey, inputValue)
      if (onupdate) {
        row.value[propertyKey] = inputValue
        onupdate(event, row)
      }
    }
  }

  function onClick (rowKey, propertyKey) {
    return function (event) {
      if (onclick) return onclick(event, rowKey, propertyKey)
    }
  }

  function onDestroy (event) {
    if (ondestroy) return ondestroy(event, row.key)
  }

  function onClose (event) {
    if (onclose) return onclose(event)
  }

  function onUpdate (event, row) {
    if (onupdate) return onupdate(event, row)
  }

  function onFocus (rowKey, propertyKey) {
    return function (event) {
      if (onfocus) return onfocus(event, rowKey, propertyKey)
    }
  }

  Object.keys(columns).forEach(function (propertyKey) {
    var property = formatter.findProperty(properties, propertyKey)
    var value = columns[propertyKey]
    var rowKey = row.key
    var type = property.type[0]

    var hooks = {
      hook: function (node, prop, prev) {
        if (propertyKey === activeColumnKey) {
          requestAnimationFrame(function () {
            node.focus()
          })
        }
      }
    }

    var fieldOptions = {
      h: h,
      custom: vhook(hooks),
      id: 'item-property-' + row.key + '-' + propertyKey,
      attributes: { 'data-key': propertyKey },
      value: columns[propertyKey],
      className: 'item-property-value',
      oninput: onInput(rowKey, propertyKey),
      onclick: onClick(rowKey, propertyKey),
      onfocus: onFocus(rowKey, propertyKey),
      onupdate: onUpdate,
      center: [47.621958, -122.33636],
      zoom: 12
    }

    if (type === 'array') { type = 'list' }
    if (type === 'object') {
      if (value.type && value.type === 'Feature') {
        type = 'geoJSON'
      } else {
        type = 'list'
      }
    }

    // Register default options & event handlers for type `list`
    if (type === 'list') {
      fieldOptions.keys = false

      fieldOptions.removeItem = function removeItem (e, items) {
        if (Array.isArray(row.value[propertyKey])) {
          items = Object.keys(items).map(function (key) {
            return items[key]
          })
        }
        row.value[propertyKey] = items
        onUpdate(e, row)
      }

      fieldOptions.oninput = function onsubmit (e, items, item) {
        onUpdate(e, row)
      }

      fieldOptions.onsubmit = function onsubmit (e, items, item) {
        row.value[propertyKey] = items
        onUpdate(e, row)
      }
    }

    var field = fieldTypes[type](h, fieldOptions)

    var fieldwrapper = h('div.item-property-wrapper', [
      h('span.item-property-label', property.name),
      field
    ])

    fields.push(fieldwrapper)
  })

  return h('div#item.active', [
    h('div.item', [
      header,
      h('button#destroyRow.small.button-orange', {
        onclick: onDestroy
      }, 'destroy row'),
      h('div.item-properties-wrapper', {
        attributes: {
          'data-key': row.key
        }
      }, fields)
    ])
  ])
}
