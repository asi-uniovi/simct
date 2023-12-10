'use strict'

/**
 * @module view/ctelements/ctmemory
 */

import { SVGGroup, SVGRect, SVGText } from '../svg.js'
import { gr } from '../gridmanager.js'
import { CtElement } from './ctelement.js'
import { iconLib } from '../navigation/icons.js'
import { _jStr } from '../../lib/jstr.js'
import { ContextMenu } from '../navigation/contextmenu.js'

/**
 * @class CTMemory
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 * @property {Object} labels Labels
 *
 */
class CTMemory extends CtElement {
  static labels = {
    config: 'labels.ctmemory.config',
    editor: 'labels.ctmemory.editor',
    controllabel: 'labels.ctmemory.controllabel'
  }

  constructor (container, id, x, y) {
    super()
    const _this = this
    this.id = id

    this._memoryEditor = null
    this._memoryConfig = null
    this._memoryLoader = null

    const group = new SVGGroup('', this.id)

    container.appendChild(group.svg)

    const outerWrapper = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(13, 18), 'register-sq-outer')

    outerWrapper.svg.setAttribute('fill', 'url(#dashedline_pattern1)')
    group.svg.style.cursor = 'pointer'
    group.append(outerWrapper)
      .append(new SVGText(...gr.gridtoxy(1, 8), _jStr(CTMemory.labels.controllabel).translate(), 2.3 * gr.gridSize, 'component-label'))

    const icongroup = new SVGGroup('icons-es', this.id)
    const memory = iconLib.memory()

    icongroup.svg.appendChild(memory)
    memory.setAttribute('x', 40)
    memory.setAttribute('y', 4)

    group.append(icongroup)

    icongroup.translate(...gr.gridtoxy(0.3, 10))

    group.translate(x, y)

    const items = [
      {
        label: _jStr(CTMemory.labels.config).translate(),
        callback: function () {
          if (_this._memoryConfig) _this._memoryConfig()
        }
      },
      {
        label: _jStr(CTMemory.labels.editor).translate(),
        callback: function () {
          if (_this._memoryEditor) {
            _this._memoryEditor()
          }
        }
      }]

    ContextMenu.new(group.svg, items)

    this.bbox = outerWrapper.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.addAnchor('mem_write_in', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.22)
    this.addAnchor('mem_read_in', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.29)

    this.addAnchor('mem_rightside', this.bbox.x + this.bbox.width, this.bbox.y)
  }

  /**
   * @method memoryEditor Set the memory editor callback
   * @param {*} callback Callback to process the memory editor
   */
  memoryEditor (callback) {
    this._memoryEditor = callback
  }

  /**
   * @method memoryConfig Set the memory config callback
   * @param {*} callback Callback to process the memory config
   */
  memoryConfig (callback) {
    this._memoryConfig = callback
  }

  /**
   * @method memoryLoader Set the memory loader callback
   * @param {*} callback Callback to process the memory loader
   */
  memoryLoader (callback) {
    this._memoryLoader = callback
  }
}

export { CTMemory }
