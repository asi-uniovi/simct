'use strict'
/**
 * @module devices/device
 */
import { ObservableObserver } from '../../lib/observer.js'

/**
 * @typedef {Object} withInt
 */
const withInt = {
  /**
   * @property {boolean} activeInt Indicates if the device is in interrupt mode
   */
  activeInt: false,
  /**
   * @method clockPulse When the clock pulse is received, the device checks if read operation must be executed
   */
  clockPulse () {
    if (this.readMode) {
      if (this.readStep < 1) this.readStep++
      else this.exeRead()
    }
  },
  /**
   * @method inta When the CPU sends an INTA signal, the device checks if it has to acknoledge it
   */
  inta () {
    if (this.int) {
      this.readMode = true
    }
  },
  /**
   * @method resetReadMode Reset the read mode
   */
  resetReadMode () {
    this.readMode = false
    this.readStep = 0
    this.activeInt = false
  },
  /**
   * @method exeRead Execute the read operation
   */
  exeRead () {
    this.sdb.value = this.vector
    this.resetReadMode()
    this.cpu.unSetInt()
  },
  /* istanbul ignore next */
  /**
   * @method isInt Check if the device is in interrupt mode
   */
  isInt () {
    throw new Error('Implement this!')
  }
}

/**
 * @class Device
 * @extends ObservableObserver
 * @abstract
 * @property {string} name Name of the device
 * @property {number} baseaddress Base address of the device
 * @property {number} memsize  Size that device needs in memory
 * @property {number} sdb SDB bus link
 * @property {number} cpu CPU link
 */
class Device extends ObservableObserver {
  constructor (name, baseaddress, mempositions, sdb, cpu) {
    super()
    this.sdb = sdb
    this.cpu = cpu
    this.name = name
    this.baseaddress = baseaddress
    this.memsize = mempositions
  }

  /* istanbul ignore next */
  /**
   * @method getPos Read the device position value
   */
  getPos () {
    throw new Error('Implement this!')
  }

  /* istanbul ignore next */
  /**
   * @method setPos Set the device position value
   */
  setPos () {
    throw new Error('Implement this!')
  }
}

export { Device, withInt }
