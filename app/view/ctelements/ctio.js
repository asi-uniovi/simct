'use strict'

/**
 * @module control/anchor
 */

import { SVGGroup, SVGRect, SVGText } from '../svg.js'

import { gr } from '../gridmanager.js'
import { CtElement } from './ctelement.js'
import { iconLib } from '../navigation/icons.js'
import { _jStr } from '../../lib/jstr.js'
import { ContextMenu } from '../navigation/contextmenu.js'

/**
 * @class CTIO
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 *
 */
class CTIO extends CtElement {
  static labels = {
    connect_keyboard: 'labels.ctio.connect_keyboard',
    connect_screen: 'labels.ctio.connect_screen',
    connect_lights: 'labels.ctio.connect_lights',
    controllabel: 'labels.ctio.controllabel'
  }

  constructor (container, id, x, y) {
    super()

    const _this = this

    this.id = id

    this._addKeyboard = null
    this._addLights = null
    this._addScreen = null

    const group = new SVGGroup('', this.id)

    container.appendChild(group.svg)

    const outerWrapper = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(13, 18), 'register-sq-outer')
    group.svg.style.cursor = 'pointer'
    group.append(outerWrapper)
      .append(new SVGText(...gr.gridtoxy(4, 8), _jStr(CTIO.labels.controllabel).translate(), 2.5 * gr.gridSize, 'component-label'))

    const icongroup = new SVGGroup('icons-es', this.id)
    const keyboard = iconLib.keyboard()
    const screen = iconLib.screen()
    const bulb = iconLib.bulb()

    icongroup.svg.appendChild(keyboard)
    keyboard.setAttribute('y', 4)
    screen.setAttribute('x', 40)
    screen.setAttribute('y', 4)
    icongroup.svg.appendChild(screen)
    bulb.setAttribute('x', 76)
    icongroup.svg.appendChild(bulb)

    group.append(icongroup)

    icongroup.translate(...gr.gridtoxy(0.5, 10))

    group.translate(x, y)

    const items = [{
      label: _jStr(CTIO.labels.connect_keyboard).translate(),
      callback: function () {
        if (_this._addKeyboard) _this._addKeyboard()
      }
    },
    {
      label: _jStr(CTIO.labels.connect_screen).translate(),
      callback: function () {
        if (_this._addScreen) _this._addScreen()
      }
    },
    {
      label: _jStr(CTIO.labels.connect_lights).translate(),
      callback: function () {
        if (_this._addLights) _this._addLights()
      }
    }
    ]

    ContextMenu.new(group.svg, items)

    this.bbox = outerWrapper.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.addAnchor('io_write_in', this.bbox.x, this.bbox.y + this.bbox.height * 0.22)
    this.addAnchor('io_read_in', this.bbox.x, this.bbox.y + this.bbox.height * 0.29)

    this.addAnchor('io_inta_in', this.bbox.x, this.bbox.y)
    this.addAnchor('io_int_in', this.bbox.x, this.bbox.y + gr.gridTopx(1.3))

    this.addAnchor('io_leftside', this.bbox.x, this.bbox.y)
  }

  /**
   * @method addKeyboard Add a keyboard to the CTIO
   * @param {*} callback Callback to call after adding the keyboard
   */
  addKeyboard (callback) {
    this._addKeyboard = callback
  }

  /**
   * @method  addScreen Add a screen to the CTIO
   * @param {*} callback Callback to call after adding the screen
   */
  addScreen (callback) {
    this._addScreen = callback
  }

  /**
   * @method addLights Add lights to the CTIO
   * @param {*} callback Callback to call after adding the lights
   */
  addLights (callback) {
    this._addLights = callback
  }
}

export { CTIO }
