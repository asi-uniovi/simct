'use strict'
/**
 * @module control/actions
 */

import { Register } from './partials/register.js'

/**
 * @class PCRegister
 */
class PCRegister extends Register {
  constructor (container, id, x, y, callable = null, checkEditable = null) {
    super(container, id, x, y, false, callable, checkEditable)
    this.addAnchor('pc_bus_ib', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.5)

    this.addAnchor('pc_ib', this.bbox.x, this.bbox.y + this.bbox.height * 0.3)
    this.addAnchor('ib_pc', this.bbox.x, this.bbox.y + this.bbox.height * 0.7)

    this.lastMessageStep = 0

    this.registerValue.showDec = false
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case 'ib-pc':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

export { PCRegister }
