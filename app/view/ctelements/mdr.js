'use strict'

/**
 * @module control/anchor
 */

import { Register } from './partials/register.js'
import { Register as RegisterControl } from '../../control/register.js'
import { Memory } from '../../control/memory.js'

/**
 * @class MDRRegister
 */
class MDRRegister extends Register {
  /**
   * @method reset Reset the register
   */
  reset () {
    this.updateValue(0x0000)
  }

  constructor (container, id, x, y) {
    super(container, id, x, y)
    this.addAnchor('mdr_ib', this.bbox.x, this.bbox.y)
    this.addAnchor('ib_mdr', this.bbox.x, this.bbox.y + this.bbox.height * 0.5)

    this.addAnchor('mdr_ib_bus', this.bbox.x + this.bbox.width * 0.75, this.bbox.y)

    this.addAnchor('mdr_sdb', this.bbox.x + this.bbox.width * 0.5, this.bbox.y + this.bbox.height)

    this.addAnchor('mdr_ib_bus', this.bbox.x + this.bbox.width * 0.5, this.bbox.y)

    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case this.id + '_' + RegisterControl.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case 'ib-mdr':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      case Memory.topic.mem_sdb:
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

export { MDRRegister }
