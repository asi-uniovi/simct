'use strict'

import { SVGBase } from './svgbase.js'

class SVGTspan extends SVGBase {
  constructor (x, dy, text, size = '8', _class = '', id = '') {
    super('tspan', _class, id)
    this.x = x
    this.dy = dy
    this.text = text
    this.fontSize = size
  }

  get text () {
    return this.svg.textContent
  }

  set text (value) {
    this.svg.textContent = value
  }

  get x () {
    return this.svgNS.getAttribute('x')
  }

  set x (value) {
    this.svgNS.setAttribute('x', value)
  }

  get dy () {
    return this.svgNS.getAttribute('dy')
  }

  set dy (value) {
    this.svgNS.setAttribute('dy', value)
  }

  get fontSize () {
    return this.svg.style.fontSize
  }

  set fontSize (value) {
    this.svg.style.fontSize = value + 'px'
  }
}

export { SVGTspan }
