'use strict'

/**
 * @module view/memoryedit
 */

import { Memory } from '../control/memory.js'
import { baseConvert as bc } from '../lib/baseconvert.js'
import { Forms } from '../lib/forms.js'
import { _jsc } from '../lib/jsnc.js'
import { _jStr } from '../lib/jstr.js'
import { Observer } from '../lib/observer.js'
import { decodeInstruction } from '../config/instructions.js'
import { vwactions } from './navigation/viewactions.js'

/**
 * @class Memoryedit
 * @property {HTMLElement} dom DOM
 * @property {HTMLElement} scrollable Scrollable
 * @property {HTMLElement} nodes Nodes
 * @property {Number} startNode Start node
 * @property {Memory} mem Memory object link
 * @property {Number} ct Current context
 * @property {String} lastValue Last value
 * @property {HTMLElement} scrollable Scrollable
 * @property {HTMLElement} nodes Nodes
 * @property {HTMLElement} dom_ DOM
 * @property {HTMLElement} scrollable Scrollable
 * @property {HTMLElement} nodes Nodes
 * @property {Number} startNode Start node
 * @property {Memory} mem Memory object link
 *
 */
class Memoryedit extends Observer {
  static labels = {
    hex_addr: 'labels.memedit.hex_addr',
    addr: 'labels.memedit.addr',
    go: 'labels.memedit.go',
    load: 'labels.memedit.load',
    value: 'labels.memedit.value'
  }

  /**
   * @method init Initialize memory editor
   * @param {*} wrap Content wrapper
   * @param {*} config Configuration
   * @param {*} itemCount Number  of items
   * @returns {Array} Array with scrollable and itemwrap
   */
  init (wrap, config, itemCount) {
    const scrollable = _jsc({ s: 'div', _id: 'vt-scroll', _style: { height: (config.itemHeight * config.itemVisible) + 'px', overflow: 'auto' } })
    const viewport = _jsc({ s: 'div', _id: 'viewport', _style: { height: (config.itemHeight * itemCount) + 'px', overflow: 'hidden', position: 'relative' } })
    const itemwrap = _jsc({ s: 'div', _id: 'items', _style: { 'will-change': 'transform', transform: 'translateY(0px)' } })

    wrap.append(scrollable)
    scrollable.append(viewport)
    viewport.append(itemwrap)

    return [scrollable, itemwrap]
  }

  /**
   * @method drawNode Draw a memory node
   * @param {*} nodeLabel Node label
   * @param {*} nodeValue Node value
   * @param {*} callable Callable to call when node is edited
   */
  drawNode (nodeLabel, nodeValue, callable) {
    const itemWrap = _jsc({ s: 'div', _class: 'vt-nodewrap' })

    const itemLabel = _jsc({ s: 'div', _class: 'vt-nodewrap-label' })

    itemLabel.text(bc.dec2hex(nodeLabel).toUpperCase())
    itemWrap.append(itemLabel)

    const itemValue = _jsc({ s: 'div', _class: 'vt-nodewrap-value' })

    itemWrap.append(itemValue)
    if (nodeValue === Memory.labels.empty || nodeValue === Memory.labels.IOlabel) {
      itemValue.text(_jStr(nodeValue).translate() || 0)
    } else {
      itemValue.text(nodeValue.toUpperCase() || 0)
    }

    const itemDecoded = _jsc({ s: 'div', _class: 'vt-nodewrap-decoded' })
    itemWrap.append(itemDecoded)

    let decoded = ''

    try {
      if (nodeValue === Memory.labels.empty) {
        decoded = _jStr(Memory.labels.empty).translate()
      } else if (nodeValue === Memory.labels.IOlabel) {
        decoded = '----'
      } else {
        decoded = decodeInstruction(bc.hex2bin(nodeValue))
      }
      // decoded = (nodeValue === Memory.labels.empty) ? _jStr(Memory.labels.empty).translate() : decodeInstruction(bc.hex2bin(nodeValue))
    } catch (e) {
      decoded = '----'
    }

    itemDecoded.text(decoded)

    if (nodeValue !== Memory.labels.empty && nodeValue !== Memory.labels.IOlabel) {
      itemValue.on('click', (event) => {
        event.stopPropagation()
        document.querySelectorAll('.inputmempos').forEach((item) => item.remove())
        Forms.editableTextInput('Memory value', 'inputmempos', 'inputmempos', itemValue, event.target.getBoundingClientRect(), itemValue.text(), callable)
      })
    }

    return itemWrap
  }

  /**
   * @method drawNodes Draw memory nodes
   * @param {*} parent Parent element
   * @param {*} startNode Start node
   */
  drawNodes (parent, startNode) {
    parent.empty()
    parent.style({ transform: 'translateY(' + (startNode * 30) + 'px)' })
    const _this = this
    for (let i = 0; i < 10; i++) {
      let mempos = 'XXXX'
      try {
        mempos = this.mem.peekPos(i + startNode)
        if (mempos !== 'XXXX' && mempos !== 'ESES') {
          mempos = bc.dec2hex(mempos)
        }
      } catch (e) {
      }

      parent.append(this.drawNode(i + startNode, mempos,
        function (value) {
          _this.mem.setPos(i + startNode, bc.hex2dec(value))
        }))
    }
  }

  /**
 * @method reDraw Redraw memory editor
 */
  reDraw () {
    this.scrollable.element.scroll({
      top: this.startNode * 30,
      left: 0,
      behavior: 'auto'
    })
  }

  constructor (mem, ct) {
    super()
    this.mem = mem
    this.ct = ct

    const wrap = _jsc({ s: 'div', _id: 'memeditor' })

    const addrFinder = _jsc({ s: 'div', _id: 'addrfinder' })

    wrap.append(addrFinder)

    const afInput = _jsc({ s: 'input', _id: 'position' })
    afInput.attr({ placeholder: _jStr(Memoryedit.labels.hex_addr).translate(), type: 'text' })
    const afButton = _jsc({ s: 'button', _id: 'gotopos' })
    afButton.text(_jStr(Memoryedit.labels.go).translate())
    const afButton2 = _jsc({ s: 'button', _id: 'loadpos' })
    afButton2.text(_jStr(Memoryedit.labels.load).translate())

    addrFinder.append(afInput)
    addrFinder.append(afButton)
    addrFinder.append(afButton2)

    const vtHeader = _jsc({ s: 'div' })
    wrap.append(vtHeader.element)
    const vtHeader1 = _jsc({ s: 'div', _class: 'vt-header' })
    const vtHeader2 = _jsc({ s: 'div', _class: 'vt-header' })

    vtHeader.append(vtHeader1)
    vtHeader.append(vtHeader2)

    vtHeader1.text(_jStr(Memoryedit.labels.addr).translate())
    vtHeader2.text(_jStr(Memoryedit.labels.value).translate())

    const tmp = this.init(wrap, {
      itemHeight: 30,
      itemVisible: 10
    }, this.mem.positions.length)

    this.nodes = tmp[1]

    this.dom_ = wrap
    const scrollable = tmp[0]

    this.scrollable = scrollable
    this.startNode = 0
    this.drawNodes(this.nodes, this.startNode)

    this.lastValue = ''

    const _this = this

    afInput.style({ 'text-transform': 'uppercase' })

    afInput.on('keydown', (event) => {
      _this.lastValue = event.target.value
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
    afInput.on('keyup', (event) => {
      if (Forms.especialKeyEvents('Esc', event)) {
        event.preventDefault()
        return false
      } else if (Forms.especialKeyEvents('Enter', event)) {
        event.preventDefault()
        if (event.target.value === undefined || event.target.value === '') {
          event.target.value = '0000'
        }
        event.target.value = bc.dec2hex(bc.hex2dec(event.target.value))

        afButton.element.click()

        return false
      } else {
        if (Forms.especialKeyEvents('CopyPaste', event)) {
          if (!Forms.isHexString(event.target.value)) {
            alert(_jStr(Forms.error.hex16).translate())
            event.target.value = _this.lastValue
          }
        }
      }
    })

    afButton.on('click', function (event) {
      scrollable.element.scroll({
        top: bc.hex2dec(afInput.element.value) * 30,
        left: 0,
        behavior: 'auto'
      })
    })

    afButton2.on('click', function (event) {
      afInput.element.value = afInput.element.value ? afInput.element.value : bc.dec2hex(that.startNode)
      vwactions.loadMemory(ct, afInput.element.value, function () { afButton.element.click() })
    })

    const that = this
    scrollable.on('scroll', () => {
      const scrolled = scrollable.element.scrollTop // reuse `scrollContent` innstead of querying the DOM again
      that.startNode = Math.floor(scrolled / 30)

      this.drawNodes(that.nodes, that.startNode)
    }, { passive: true })
  }

  listen (message) {
    if (message.topic === Memory.topic.edited_mem_pos || message.topic === Memory.topic.module_add || message.topic === Memory.topic.reset || message.topic === Memory.topic.module_rm) {
      this.drawNodes(this.nodes, this.startNode)
    }
  }

  get dom () {
    return this.dom_.element
  }
}

export { Memoryedit }
