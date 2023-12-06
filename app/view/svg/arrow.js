'use strict'

import { SVGPolygon } from './polygon.js'
import { gr } from '../gridmanager.js'

class SVGArrow extends SVGPolygon {
  constructor (id = '') {
    super('0 0 ' + (gr.gridSize / 2) + ' ' + (gr.gridSize / 2) + ' 0 ' + (gr.gridSize) + ' 0 0', 'arrow-bullet-inactive', id)
  }

  orientate (direction) {
    switch (direction) {
      case 'R': this.right()
        break
      case 'L': this.left()
        break
      case 'U': this.up()
        break
      case 'D': this.down()
        break
    }
  }

  left () {
    const x = this.svg.getBoundingClientRect().x; const y = this.svg.getBoundingClientRect().y
    // super.translate(x, y - gr.gridSize / 2);
    super.translate(x, y - gr.gridSize * 0.5)
    return this.rotate(180, gr.gridSize * 0.25, gr.gridSize * 0.5)
  }

  right () {
    const x = this.svg.getBoundingClientRect().x; const y = this.svg.getBoundingClientRect().y
    super.translate(x - gr.gridSize / 2, y - gr.gridSize / 2)
    return this.rotate(0, 0, 0)
  }

  up () {
    const x = this.svg.getBoundingClientRect().x; const y = this.svg.getBoundingClientRect().y
    super.translate(x, y)
    return this.rotate(270, 0, gr.gridSize * 0.5)
  }

  down () {
    const x = this.svg.getBoundingClientRect().x; const y = this.svg.getBoundingClientRect().y
    super.translate(x, y - gr.gridSize)
    return this.rotate(90, 0, gr.gridSize * 0.5)
  }
}

export { SVGArrow }
