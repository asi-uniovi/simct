'use strict'

/**
 * @module control/register
 */

import { gr, measureSVGText } from '../../gridmanager.js'
import { CtElement } from '../ctelement.js'
import { SVGText, SVGRect, SVGGroup } from '../../svg.js'
import { RegisterValue } from './registervalue.js'
import { Register as RegisterControl } from '../../../control/register.js'
import { SignalManager } from '../../../control/signalmanager.js'

/**
 * @class Register
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 * @property {Number} bbox.y Bounding box y
 * @property {Number} bbox.width Bounding box width
 * @property {Number} bbox.height Bounding box height
 * @property {String} id Register id
 * @property {Object} anchors Register anchors
 *
 */
class Register extends CtElement {
  static current = null
  constructor (container, id, x, y, readonly = true, callable = null, checkEditable) {
    super()

    this.anchors = {}

    this.id = id

    const register = new SVGGroup('', this.id)

    const labelBox = measureSVGText(id, gr.gridSize * 2)
    const yLabel = gr.gridSize * 2 - labelBox.heightAdjust
    const fontSize = gr.gridSize * 2

    const textLabel = new SVGText(...gr.gridtoxy(0.6, 1.1 + gr.pxTogrid(yLabel)), id, fontSize, 'component-label')

    container.appendChild(register.svg)

    const outWrap = new SVGRect(...gr.gridtoxy(0, 0, gr.gridSize), ...gr.gridtowh(0.6 + gr.pxTogrid(labelBox.width) + 0.8 + gr.pxTogrid(gr.gridSize * 7), 4), 'register-sq-outer')

    register.append(outWrap)
    register.append(textLabel)

    this.registerValue = new RegisterValue(register, ...gr.gridtoxy(0.6 + gr.pxTogrid(labelBox.width) + 0.8, 0.9, gr.gridSize), !readonly, callable, checkEditable)

    register.translate(x, y)

    this.bbox = register.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y
  }

  /**
   * @method getBBox Get bounding box
   * @returns {Object} Bounding box
   */
  getBBox () {
    return this.bbox
  }

  /**
   * @method updateValue Update register value
   * @param {*} value Value
   */
  updateValue (value) {
    this.registerValue.text = value
  }

  /**
   * @method activate Activate register
   * @returns {Boolean} True if activated
   */
  activate () {
    this.registerValue.value.addClass('active')
  }

  /**
   * @method deactivate Deactivate register
   * @returns {Boolean} True if deactivated
   */
  deactivate () {
    this.registerValue.value.removeClass('active')
  }

  /**
   * @method listen Listen to messages
   * @param {*} message Message
   */
  listen (message) {
    switch (message.topic) {
      case this.id + '_' + RegisterControl.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case SignalManager.topic.empty:
        this.deactivate()
        break
      case this.id + '_' + RegisterControl.topic.updated:
        this.updateValue(message.value)
        break
    }
  }
}

export { Register }
