'use strict'

/**
 * @module control/anchor
 */

import { Register } from './partials/register.js'

/**
 * @class MarRegister
 * @extends Register
 * @property {Number} lastMessageStep Last message step
 * @property {Object} labels Labels
 * @property {Object} bbox Bounding box
 */
class MarRegister extends Register {
  constructor (container, id, x, y) {
    super(container, id, x, y)
    this.addAnchor('ib_mar', this.bbox.x + this.bbox.width, this.bbox.y)
    this.addAnchor('mar_ib_bus', this.bbox.x + this.bbox.width * 0.25, this.bbox.y)

    this.addAnchor('mar_ib_bus', this.bbox.x + this.bbox.width * 0.5, this.bbox.y)
    this.addAnchor('mar_sab', this.bbox.x + this.bbox.width * 0.5, this.bbox.y + this.bbox.height)

    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case 'ib-mar':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

export { MarRegister }
