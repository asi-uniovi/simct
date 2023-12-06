'use strict'

import { SVGBase } from './svgbase.js'

class SVGLine extends SVGBase {
  constructor (x1, y1, x2, y2, _class = '', id = '') {
    super('line', _class, id)
    this.svg.setAttribute('x1', x1)
    this.svg.setAttribute('y1', y1)
    this.svg.setAttribute('x2', x2)
    this.svg.setAttribute('y2', y2)

    //    <line x1="0" y1="1" x2="30" y2="1" stroke="black" />
  }
}

export { SVGLine }
