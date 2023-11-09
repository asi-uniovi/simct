'use strict'

/**
 * @module control/actions
 */

import { gr, measureSVGText } from '../../gridmanager.js'
import { baseConvert as bc } from '../../../lib/baseconvert.js'
import { CtElement } from '../ctelement.js'

import { SVGRect, SVGGroup, SVGTextHex } from '../../svg.js'
import { Forms } from '../../../lib/forms.js'
import { Bitop } from '../../../lib/bits.js'
import { _jStr } from '../../../lib/jstr.js'

/**
 * @class RegisterValue
 * @extends CtElement
 * @property {SVGGroup} registervalue SVG group
 * @property {SVGRect} valueWrap SVG rect
 * @property {SVGTextHex} value SVG text
 * @property {Boolean} editable Editable
 * @property {String} id Register id
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 * @property {Number} bbox.y Bounding box y
 * @property {Number} bbox.width Bounding box width
 * @property {Number} bbox.height Bounding box height
 * @property {String} id Register id
 * @property {Object} anchors Register anchors
 */
class RegisterValue extends CtElement {

  static labels = {
    bin: 'labels.registervalue.bin',
    dec: 'labels.registervalue.dec',
    dec_c2: 'labels.registervalue.dec_c2',
  }

  constructor (container, x, y, editable = false, callable = null, checkEditable = null) {
    super()

    this.editable = editable
    this.id = ''

    this.registervalue = new SVGGroup('', this.id)

    const valueBox = measureSVGText('0000', gr.gridSize * 2)
    const yValue = gr.gridSize * 2 - valueBox.heightAdjust
    const fontSize = gr.gridSize * 2

    const valueWrap = new SVGRect(...gr.gridtoxy(0, 0, gr.gridSize), ...gr.gridtowh(6, 2.2), 'register-sq-inner')
    this.value = new SVGTextHex(...gr.gridtoxy(0.8, 0.2 + gr.pxTogrid(yValue, gr.gridSize)), '0000', fontSize, 'register-value', '', true)

    const that = this

    if (this.editable) {
      this.value.svg.addEventListener('click', (event) => {
        if ((checkEditable === null || checkEditable())) {
          Forms.editableTextInput('Register value', 'register-value', 'register-value', event.target, event.target.parentNode.querySelector('.register-sq-inner').getBoundingClientRect(), that.value.svg.textContent, callable, true)
        }
      })
    }

    this.registervalue.svg.addEventListener('mousemove', (event) => {
      const mousebox = document.querySelector('#mousebox')
      mousebox.style.left = event.clientX + 10 + 'px'
      mousebox.style.top = event.clientY - 10 + 'px'
      mousebox.innerHTML = _jStr(RegisterValue.labels.bin).translate() + bc.hex2bin(that.value.svg.textContent).replace(/([\S\s]{4})/g, '$1&nbsp;') + '<br />' + _jStr(RegisterValue.labels.dec).translate() + bc.hex2dec(that.value.svg.textContent) + '<br />' + _jStr(RegisterValue.labels.dec_c2).translate() + Bitop.two(bc.hex2dec(that.value.svg.textContent))
    })

    this.registervalue.svg.addEventListener('mouseleave', (event) => {
      const mousebox = document.querySelector('#mousebox')
      mousebox.style.display = 'none'
    })
    this.registervalue.svg.addEventListener('mouseenter', (event) => {
      let mousebox = document.querySelector('#mousebox')
      if (!mousebox) {
        mousebox = document.createElement('div')
        mousebox.id = 'mousebox'
        document.body.appendChild(mousebox)
      }
      // let mousebox = document.querySelector('#mousebox');
      mousebox.style.display = 'block'
    })

    container.append(this.registervalue)

    this.registervalue
      .append(valueWrap)
      .append(this.value)

    this.registervalue.translate(x, y)

    this.bbox = this.registervalue.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y
  }

  getBBox () {
    return this.bbox
  }

  translate (x, y) {
    this.bbox.x = x
    this.bbox.y = y
    this.registervalue.translate(x, y)
  }

  get text () {
    return this.value.text
  }

  set text (value) {
    this.value.text = value
  }
}

export { RegisterValue }
