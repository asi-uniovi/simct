'use strict'

import { SVGText } from './text.js'

import { baseConvert as bc } from '../../lib/baseconvert.js'

class SVGTextHex extends SVGText {
  constructor (x, y, text, size = '8', _class = '', id = '') {
    super(x, y, text, size, _class, id)
  }

  set text (value) {
    this.svg.textContent = bc.dec2hex(value).toUpperCase()
  }

  get text () {
    return this.svg.textContent
  }
}

export { SVGTextHex }
