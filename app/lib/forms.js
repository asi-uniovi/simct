'use strict'
import { gr } from '../view/gridmanager.js'
import { _jsc, _jss } from './jsnc.js'
import { _jStr } from './jstr.js'
import { baseConvert as bc } from './baseconvert.js'

class Forms {
  static error = {
    hex16: 'error.forms.hex16'
  }

  static input (type, label, id) {
    const input = document.createElement('input')
    const inputlabel = document.createElement('label')
    input.type = type
    inputlabel.textContent = label
    inputlabel.for = id

    input.id = id
    input.name = id

    return { input, label: inputlabel }
  }

  static especialKeyEvents (key, event) {
    switch (key) {
      case 'Esc': return event.key === 'Esc' || event.keyCode === 27 || event.which === 27

      case 'Enter': return event.key === 'Enter' || event.keyCode === 13 || event.which === 13
      case 'CopyPaste': return event.ctrlKey && /[CV]$/.test(event.key.toUpperCase())
    }
  }

  static isNavKey (keycode) {
    // Enable Delete(46), Backspace(8),Home(35), End(36),cursor keys(37,38,39,40)
    return [46, 8, 35, 36, 37, 38, 39, 40].includes(keycode)
  }

  static isHexChar (value) {
    return /[0-9ABCDEF]$/.test(value.toUpperCase())
  }

  static isHexString (value, size = 4) {
    return value !== undefined && value.length <= 4 && /^[0-9ABCDEF]+$/.test(value.toUpperCase())
  }

  static isTextSelected (input) {
    if (typeof input.selectionStart === 'number') {
      return input.selectionEnd > input.selectionStart
    } else if (typeof document.selection !== 'undefined') {
      input.focus()

      return document.selection.createRange().text === input.value
    }
  }

  static hexInput (basedir, defaultValue = false) {
    let lastValue = ''

    basedir.input.style.textTransform = 'uppercase'
    basedir.input.addEventListener('keydown', (event) => {
      if (event.key) {
        lastValue = event.target.value
        const validChar = Forms.isHexChar(event.key.toUpperCase())
        const cursorKey = Forms.isNavKey(event.keyCode)
        const copyPaste = Forms.especialKeyEvents('CopyPaste', event)
        if (!Forms.isTextSelected(event.target) && event.target.value.length + 1 > 4 && !cursorKey && !copyPaste) {
          event.preventDefault()
          return false
        }
        if (!(validChar || cursorKey || copyPaste)) {
          event.preventDefault()
        }
      }
    })
    basedir.input.addEventListener('keyup', (event) => {
      if (Forms.especialKeyEvents('Esc', event)) {
        event.preventDefault()
        return false
      } else {
        if (Forms.especialKeyEvents('CopyPaste', event)) {
          if (!Forms.isHexString(event.target.value)) {
            alert(_jStr(Forms.error.hex16).translate())
            event.target.value = lastValue
          }
        }
      }
    })

    basedir.input.addEventListener('blur', function (event) {
      if (event.target.value === undefined || event.target.value === '') {
        if (defaultValue) event.target.value = defaultValue
      } else {
        event.target.value = bc.dec2hex(bc.hex2dec(event.target.value))
      }
    })
  }

  static decInput (basedir, min, max) {
    let lastValue = ''

    basedir.input.addEventListener('keydown', (event) => {
      if (event.key) {
        if (!(event.target.value <= 255 && event.target.value >= 0)) {
          event.preventDefault()
        } else {
          lastValue = event.target.value
        }
      }
    })

    basedir.input.addEventListener('keyup', (event) => {
      if (!(event.target.value <= 255 && event.target.value >= 0)) {
        event.target.value = lastValue
      }
    })
  }

  static editableTextInput (label, id, _class, target, position, value, callable, svg = false) {
    function confirmValue (callable, value) {
      if (value === '') value = '0'
      callable(value)
    }

    const input = _jsc({ s: 'input', _class })
    input.style({ 'text-transform': 'uppercase' })
    input.on('click', (e) => { e.stopPropagation() })
    const backupText = value
    if (!svg) {
      target.addClass('inputshadow')
      // backupText = target.element.textContent
      target.element.innerHTML = ''
      target.element.appendChild(input.element)
    } else {
      const wrap = _jsc({ s: 'div', _class: 'inputwrap' })
      wrap.append(input)
      _jss(document.body).append(wrap)
      // document.body.appendChild(input.element)
      wrap.addClass('inputshadow')
      wrap.style({
        position: 'absolute',
        top: position.y + 'px',
        left: position.x + 'px',
        width: position.width + 'px',
        height: position.height + 'px',
        backgroundColor: 'var(--secondary-background-color)',
        color: 'var(--secondary-text-color)',
        fontSize: gr.gridSize * 2 + 'px',
        fontFamily: 'monospace'
      })

      input.style({
        width: position.width - 5 + 'px',
        height: position.height + 'px',
        color: 'var(--secondary-text-color)',
        border: '0px',
        'text-align': 'center',
        'font-size': gr.gridSize * 2 + 'px',
        'font-family': 'monospace',
        'background-color': 'transparent'
      })
    }
    input.element.value = value

    input.element.focus()

    input.on('keyup', (event) => {
      if (Forms.especialKeyEvents('Esc', event)) {
        event.preventDefault()
        input.element.blur()
        return false
      } else if (Forms.especialKeyEvents('Enter', event)) {
        event.preventDefault()
        confirmValue(callable, event.target.value)
        input.element.blur()
        return false
      } else {
        if (Forms.especialKeyEvents('CopyPaste', event)) {
          if (!Forms.isHexString(event.target.value)) {
            alert(_jStr(Forms.error.hex16).translate())
            input.element.blur()
          }
        }
      }
    })

    input.on('keydown', (event) => {
      const validChar = Forms.isHexChar(event.key.toUpperCase())
      const cursorKey = Forms.isNavKey(event.keyCode)
      const copyPaste = Forms.especialKeyEvents('CopyPaste', event)
      if (!Forms.isTextSelected(event.target) && event.target.value.length + 1 > 4 && !cursorKey && !copyPaste) {
        event.preventDefault()
        return false
      }
      if (!(validChar || cursorKey || copyPaste)) {
        event.preventDefault()
      }
    })

    input.on('blur', function (event) {
      if (!svg) {
        target.text(backupText)
      }
      if (event.target) {
        if (svg) event.target.parentNode.remove()
        event.target.remove()
      }
    })
    input.on('focus', function () {
      input.style.border = '0px solid'
    })
  }

  static inputwlabel (type, label, id, labelx = 'right') {
    const div = document.createElement('div')
    const input = this.input(type, label, id)

    div.id = 'wrap-' + id

    div.appendChild(input.label)
    div.appendChild(input.input)

    if (labelx === 'left') div.insertBefore(input.input, input.label)

    return { dom: div, input: input.input }
  }

  static inputwlabel2 (type, label, id, labelx = 'right') {
    const labeldom = _jsc({ s: 'label', _id: 'wrap-' + id })
    labeldom.text(label)
    labeldom.attr('for', id)
    const input = _jsc({ s: 'input', _id: id })
    input.attr('type', 'checkbox')

    labeldom.prepend(input)

    return { dom: labeldom.element }
  }

  static button (label, id) {
    const button = document.createElement('button')
    button.textContent = label
    button.id = id
    button.name = id

    return { input: button }
  }
}

export { Forms }
