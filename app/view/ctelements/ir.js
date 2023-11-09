'use strict'

/**
 * @module control/anchor
 */

import { measureSVGText, gr } from '../gridmanager.js'
import { baseConvert as bc } from '../../lib/baseconvert.js'
import { SVGGroup, SVGRect, SVGText } from '../svg.js'
import { RegisterValue } from './partials/registervalue.js'
import { CtElement } from './ctelement.js'
import { decodeInstruction } from '../../config/instructions.js'
import { Register as RegisterControl } from '../../control/register.js'

/**
 * @class Ir
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 * @property {Object} bbox Bounding box
 */
class Ir extends CtElement {
  constructor (container, id, x, y) {
    super()

    this.id = id

    const group = new SVGGroup('', this.id)

    container.appendChild(group.svg)

    const outerWrapper = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(18, 9.5), 'register-sq-outer')

    this.operationwrap = new SVGRect(...gr.gridtoxy(1, 3), ...gr.gridtowh(16, 2), 'register-sq-inner')
    this.operation = new SVGText(...gr.gridtoxy(1.1, 4.8), 'NOP', 1.8 * gr.gridSize, 'register-value')

    group.append(outerWrapper)
      .append(new SVGText(...gr.gridtoxy(7.5, 2), 'IR', 2 * gr.gridSize, 'component-label'))
      .append(this.operationwrap)
      .append(this.operation)

    this.value = new RegisterValue(group, ...gr.gridtoxy(5.8, 6), false, null, null, false)

    group.translate(x, y)

    this.bbox = outerWrapper.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.addAnchor('ib_ir_in', this.bbox.x, this.bbox.y * 1.1)
    this.addAnchor('irl_ibh_in', this.bbox.x, this.bbox.y * 1.5)
    this.addAnchor('irl_ibl_in', this.bbox.x, this.bbox.y * 1.9)
    this.addAnchor('ExtIrl_ib_in', this.bbox.x, this.bbox.y * 2.3)

    this.addAnchor('ir_bus_ib', this.bbox.x + this.bbox.width, (this.bbox.y + this.bbox.height * 0.5))

    this.addAnchor('uc_out_bus', this.bbox.x, this.bbox.y * 3.3)

    this.reDraw()

    this.lastMessageStep = 0
  }

  /**
   * @method reDraw Redraw the register dom element
   */
  reDraw () {
    const optext = measureSVGText(this.operation.text)

    this.operation.translate((optext.x + this.operationwrap.width * 0.5) - optext.width * 0.55, optext.y + optext.height - optext.heightAdjust - 2)
  }

  updateValue (value) {
    this.value.text = bc.dec2hex(value)
    this.operation.text = decodeInstruction(bc.dec2bin(value))
    this.reDraw()
  }

  activate () {
    this.value.value.addClass('active')
    this.operation.addClass('active')
  }

  deactivate () {
    this.value.value.removeClass('active')
    this.operation.removeClass('active')
  }

  listen (message) {
    switch (message.topic) {
      case this.id + '_' + RegisterControl.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case this.id + '_' + RegisterControl.topic.updated:
        this.updateValue(message.value)
        break
      case 'ib-ir':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default:
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
        break
    }
  }
}

export { Ir }
