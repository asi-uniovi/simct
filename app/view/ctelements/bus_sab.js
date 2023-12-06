'use strict'

/**
 * @module control/actions
 */

import { _jStr } from '../../lib/jstr.js'
import { gr } from '../gridmanager.js'
import { Bus } from './partials/bus.js'
import { SignalManager } from '../../control/signalmanager.js'

/**
 * @class BusSAB
 * @extends Bus
 * @property {Number} lastMessageStep Last message step
 * @property {Object} labels Labels
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 *
 *
 */
class BusSAB extends Bus {
  static labels = {
    address_bus: 'labels.bussab.address_bus'
  }

  constructor (container, id, x, y) {
    super(container, id, x, y)

    this.width = gr.gridTopx(46)
    this.setLabel(_jStr(BusSAB.labels.address_bus).translate())

    this.addAnchor('bus_sab_orig', this.bbox.x, this.bbox.y)
    this.addAnchor('bus_sab_orig_bottom', this.bbox.x, this.bbox.y + this.bbox.height)

    this.addAnchor('sab_io_bus', this.bbox.x + this.bbox.width - gr.gridTopx(4), this.bbox.y + this.bbox.height)

    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case 'ib-mar':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      case SignalManager.topic.empty:
        this.deactivate()
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

export { BusSAB }
