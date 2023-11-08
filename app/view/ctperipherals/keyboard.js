'use strict'

/**
 * @module view/ctperipherals/keyboard
 */

import { _jStr } from '../../lib/jstr.js'
import { Observer } from '../../lib/observer.js'
import { _jsc, _jss } from '../../lib/jsnc.js'
import { baseConvert as bc } from '../../lib/baseconvert.js'
import { Keyboard } from '../../control/devices/keyboard.js'

/**
 * @class CTKeyboard
 * @extends Observer
 * @property {String} name Name
 * @property {HTMLElement} content Content
 * @property {Keyboard} control Control
 * @property {Object} error Errors
 * @property {Object} labels Labels
 *
 */
class CTKeyboard extends Observer {
  static error = {
    keyboard_must: 'errors.ctkeyboard.keyboard_must'
  }

  static labels = {
    buffer: 'labels.ctkeyboard.buffer',
    buffer_hex: 'labels.ctkeyboard.buffer_hex',
    buffer_char: 'labels.ctkeyboard.buffer_char',
    caps: 'labels.ctkeyboard.caps',
    address: 'labels.ctkeyboard.address',
    vector: 'labels.ctkeyboard.vector',
    priority: 'labels.ctkeyboard.priority',
    int: 'labels.ctkeyboard.int',
    state: 'labels.ctkeyboard.state'
  }

  constructor (keyboard) {
    super()
    this.name = keyboard.name
    this.content = _jsc({ s: 'div', _class: 'keyboard' })
    this.control = keyboard
    this.control.subscribe(this)
    this.draw()
  }

  /**
   * @method drawBuffer Draws the keyboard buffer
   */
  drawBuffer () {
    this.content.element.querySelector('.keyboard-body-right').innerHTML = ''
    const buffer = this.control.buffer.asArray()

    const title = _jsc({ s: 'div' })
    const tableheader = _jsc({ s: 'table', _class: 'keyboard-buffer' })
    const head = _jsc({ s: 'thead' })
    const headtr = _jsc({ s: 'tr' })

    const table = _jsc({ s: 'table', _class: 'keyboard-buffer' })
    const body = _jsc({ s: 'tbody' })
    const hex = _jsc({ s: 'th', _class: 'keyboard-buffer-hex' })
    const car = _jsc({ s: 'th', _class: 'keyboard-buffer-car' })

    title.addClass('title')
    title.text(_jStr(CTKeyboard.labels.buffer).translate())
    tableheader.append(head)
    head.append(headtr)
    headtr.append(hex)
    headtr.append(car)
    table.append(body)

    hex.text(_jStr(CTKeyboard.labels.buffer_hex).translate())
    car.text(_jStr(CTKeyboard.labels.buffer_char).translate())

    for (let i = 0; i < buffer.length; i++) {
      const tr = _jsc({ s: 'tr' })
      const hextd = _jsc({ s: 'td', _class: 'keyboard-buffer-hex' })
      const cartd = _jsc({ s: 'td', _class: 'keyboard-buffer-car' })

      tr.append(hextd)
      tr.append(cartd)

      hextd.text(buffer[i].code)
      cartd.text(buffer[i].value)

      body.append(tr)
    }

    this.content.element.querySelector('.keyboard-body-right').append(title.element)
    this.content.element.querySelector('.keyboard-body-right').append(tableheader.element)
    this.content.element.querySelector('.keyboard-body-right').append(table.element)
  }

  /**
   * @method addButton Adds a button to the keyboard
   * @param {*} buttonline Represents a line of buttons
   * @param {*} value Value of the button
   * @param {*} area Area of the button
   */
  addButton (buttonline, value, area) {
    const _this = this
    const button = _jsc({ s: 'button' })
    button.addClass('keyboard-button')
    button.text(value)

    switch (value) {
      case ' ':button.addClass('keyboard-button-space')

        break
      case '#': button.addClass('keyboard-button-caps')
        break
    }

    button.on('click', function () {
      if (value !== '#') {
        try {
          if (area === 'num') _this.control.pushNumKey(value)
          else _this.control.pushMainKey(value)

          _this.drawBuffer()
          _this.drawHead()
        } catch (e) {
          alert(Keyboard.error.bufferfull)
        }
      } else _this.toggleCaps()
    })

    buttonline.append(button)
  }

  /**
   * @method createKbLine Creates a line of buttons
   * @param {*} doc Kbline dom elemeent
   * @param {*} buttonlines Array of button lines
   * @param {*} keys Array of keys
   * @param {*} area Area of the line
   */
  createKbLine (doc, buttonlines, keys, area) {
    if (!this.control) throw new Error(CTKeyboard.error.keyboard_must)

    buttonlines.push(_jsc({ s: 'div' }))

    doc.append(buttonlines[buttonlines.length - 1])

    buttonlines[buttonlines.length - 1].addClass('keyboard-button-line')

    const currentLine = buttonlines.length - 1

    keys.forEach((v) => {
      this.addButton(buttonlines[currentLine], v.value, area)
    })
  }

  /**
   * @method createMain Creates the main area of the keyboard
   * @param {*} doc Main area dom element
   */
  createMain (doc) {
    if (!this.control) throw new Error(CTKeyboard.error.keyboard_must)

    doc.style({ display: 'inline-block', padding: '3px', float: 'left' })

    const buttonlines = []

    // Starting index of each keyboard line
    const keyboardLinesStart = [0, 10, 20, 30, 38]
    keyboardLinesStart.forEach((i, index) => {
      this.createKbLine(doc, buttonlines, this.control.mainkeys.slice(i, keyboardLinesStart[index + 1]), 'main')
    })
  }

  /**
   * @method createCapsRadio Creates the caps radio button
   * @param {*} doc Caps radio dom element
   */
  createCapsRadio (doc) {
    const capslock = _jsc({ s: 'div' })
    const radio = _jsc({ s: 'div' })
    const radiolabel = _jsc({ s: 'label' })

    capslock.addClass('caps-lock')

    radiolabel.text(_jStr(CTKeyboard.labels.caps).translate())

    radio.addClass('caps-radio')
    radio.addClass('caps-radio-inactive')
    capslock.append(radio)
    capslock.append(radiolabel)
    doc.append(capslock)
  }

  /**
   *  @method createNumeric Creates the numeric area of the keyboard
   * @param {*} doc  Numeric area dom element
   */
  createNumeric (doc) {
    const wraplines = _jsc({ s: 'div' })
    wraplines.addClass('keyboard-lines')
    doc.append(wraplines)

    wraplines.style.display = 'inline-block'

    wraplines.style.padding = '3px'

    const buttonlines = []

    const keyboardLinesStart = [0, 3, 6]
    keyboardLinesStart.forEach((i, index) => {
      this.createKbLine(wraplines, buttonlines, this.control.numkeys.slice(i, keyboardLinesStart[index + 1]), 'num')
    })
  }

  /**
   * @method drawHead Draws the keyboard head
   * @param {*} doc Head dom element
   */
  drawHead () {
    this.head.empty()

    this.head.style.display = 'block'
    this.head.style.margin = '5px'
    this.head.style.padding = '3px'

    this.head.style.width = 'auto'

    const dir = _jsc({ s: 'div' })
    const vec = _jsc({ s: 'div' })
    const prior = _jsc({ s: 'div' })
    const state = _jsc({ s: 'div' })

    dir.html(_jStr(CTKeyboard.labels.address).translate() + ': <strong>' + bc.dec2hex(this.control.baseaddress).toUpperCase() + 'h</strong>')
    vec.html(_jStr(CTKeyboard.labels.vector).translate() + ': <strong>' + bc.dec2hex(this.control.vector).toUpperCase() + 'h</strong>')
    prior.html(_jStr(CTKeyboard.labels.priority).translate() + ': <strong>' + this.control.priority + '</strong>')
    state.html(_jStr(CTKeyboard.labels.state).translate() + ': <strong>' + bc.dec2hex(this.control.ecregister).toUpperCase() + 'h</strong>')

    this.head.append(dir)
    this.head.append(state)
    if (this.control.int) this.head.append(vec)
    if (this.control.int) this.head.append(prior)
  }

  /**
   * @method draw Draws the keyboard
   * @returns {HTMLElement} Keyboard
   * @throws {Error} Keyboard must be defined
   * @throws {Error} Keyboard buffer full
   */
  draw () {
    this.content.element.innerHTML = ''
    if (!this.control) throw new Error(Keyboard.error.keyboard_must)

    this.head = _jsc({ s: 'div' })
    this.body = _jsc({ s: 'div', _class: 'keyboard-body' })
    const mainkeyboard = _jsc({ s: 'div' })
    const numkeyboard = _jsc({ s: 'div' })
    const left = _jsc({ s: 'div' })
    const buffer = _jsc({ s: 'div' })

    this.head.addClass('keyboard-head')
    mainkeyboard.addClass('keyboard-main')
    numkeyboard.addClass('keyboard-num')
    left.addClass('keyboard-body-left')
    buffer.addClass('keyboard-body-right')

    this.content.append(this.head)
    this.content.append(this.body)
    this.body.append(left)

    left.append(mainkeyboard)
    left.append(numkeyboard)
    this.body.append(buffer)

    this.createMain(mainkeyboard)
    this.createCapsRadio(numkeyboard)
    this.createNumeric(numkeyboard)
    this.drawHead(this.head)
    this.drawBuffer()
  }

  /**
   * @method toggleCaps Toggles the caps lock
   */
  toggleCaps () {
    this.control.toggleCaps()
    const caps = _jss(this.content.element.querySelector('.caps-radio'))
    caps.removeClass('caps-radio-inactive')
    caps.removeClass('caps-radio-active')
    caps.addClass('caps-radio-' + (this.control.caps ? 'active' : 'inactive'))
  }

  listen (message) {
    switch (message.topic) {
      case Keyboard.topics.update + this.name:
        this.draw()
        break
    }
  }
}

export { CTKeyboard }
