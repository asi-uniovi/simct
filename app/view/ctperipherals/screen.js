'use strict'

/**
 * @module view/ctperipherals/screen
 */

import { baseConvert as bc } from '../../lib/baseconvert.js'
import { _jsc, _jss } from '../../lib/jsnc.js'
import { _jStr } from '../../lib/jstr.js'
import { Observer } from '../../lib/observer.js'

/**
 * @class CTScreen
 * @extends Observer
 * @property {String} name Name
 * @property {HTMLElement} content Content
 * @property {Screen} control Control
 * @property {HTMLElement} screen Screen
 * @property {Object} labels Labels
 *
 */
class CTScreen extends Observer {
  static labels = {
    onoff: 'labels.ctscreen.onoff',
    address: 'labels.ctscreen.address'
  }

  constructor (screen) {
    super()
    this.name = screen.name
    this.control = screen
    this.control.subscribe(this)

    this.content = _jsc({ s: 'div' })
    this.draw()
  }

  /**
   * @method toggleOnOff Toggles the on/off state of the screen
   */
  toggleOnOff () {
    const onoff = _jss(this.content.querySelector('.caps-radio'))
    onoff.removeClass('radio-onoff-inactive')
    onoff.removeClass('radio-onoff-active')
    onoff.addClass('radio-onoff-' + (this.control.isOn() ? 'active' : 'inactive'))
  }

  /**
   * @method createOnOff Creates the on/off indicator
   * @param {*} dom Dom element to wrap the on/off indicator
   */
  createOnOff (dom) {
    const onoff = _jsc({ s: 'div', _class: 'radio-onoff-wrap' })
    const radio = _jsc({ s: 'div', _class: 'radio-onoff' })
    const radiolabel = _jsc({ s: 'label' })

    radiolabel.text(_jStr(CTScreen.labels.onoff).translate())

    radio.addClass('radio-onoff-' + (this.control.isOn() ? '' : 'in') + 'active')

    onoff.append(radio)
    onoff.append(radiolabel)
    dom.append(onoff)
  }

  /**
   * @method decode Decodes the screen character color
   * @param {*} hex Hexadecimal value
   */
  decode (hex) {
    const colors = {
      0x0: '#000000', // Black
      0x1: '#0000FF', // Blue
      0x2: '#00FF00', // Green
      0x3: '#00FFFF', // Cyan
      0x4: '#FF0000', // Red
      0x5: '#FF00FF', // Magenta
      0x6: '#FFFF00', // Yellow
      0x7: '#FFFFFF'// White
    }
    const character = +(hex & 0x00FF)
    const fgcolor = (hex & 0x0700) >> 8
    const bgcolor = (hex & 0x3800) >> 11

    let htmlChar = String.fromCharCode(character)
    if (htmlChar === ' ') {
      // This is a special case, because HTML does not show a space
      htmlChar = '&nbsp;'
    }

    return '<div style="color:' + colors[fgcolor] + ';background-color:' + colors[bgcolor] + '">' + htmlChar + '</div>'
  }

  /**
   * @method drawScreen Draws the screen
   */
  drawScreen () {
    this.screen = _jsc({ s: 'div', _class: this.control.isOn() ? 'screen-wrap' : 'screen-wrap-off' })

    this.content.append(this.screen)

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 15; j++) {
        const div = _jsc({ s: 'div', _class: 'screen-col' })

        this.screen.append(div)
        const position = this.control.positions[15 * i + j]
        if (this.control.isOn()) div.html(position ? this.decode(position) : this.decode(0x0))
        else div.html('<div style="background-color: #666666;"></div>')
      }

      const br = _jsc({ s: 'div', _class: 'screen-newrow' })
      this.screen.append(br)
    }
    const br = _jsc({ s: 'div', _class: 'screen-newrow' })

    this.screen.append(br)
  }

  /**
   * @method drawFoot Draws the footer of the screen window
   */
  drawFoot () {
    const footer = _jsc({ s: 'div', _class: 'screen-footer' })

    const label = _jsc({ s: 'div', _style: { 'text-align': 'center' } })

    label.html('<span>' + _jStr(CTScreen.labels.address).translate() + ': ' + bc.dec2hex(this.control.baseaddress).toUpperCase() + 'h</span>')

    this.createOnOff(footer)
    footer.append(label)
    this.content.append(footer)
  }

  /**
   * @method draw Draws the screen
   */
  draw () {
    this.content.empty()
    this.drawScreen()
    this.drawFoot()
  }

  listen (message) {
    switch (message.topic) {
      case 'updatedScreen' + this.name:
        this.draw()
        break
    }
  }

  /**
 *  @method getSvg Gets the screen SVG
 * @returns {HTMLElement} Screen
 */
  getSvg () {
    return this.content
  }
}

export { CTScreen }
