'use strict'
/**
 * @module devices/input
 */
import { Device, withInt } from './device.js'

/**
 * @class InputDevice
 * @extends Device
 * @abstract
 * @property {number} vector Interuption Vector of the device
 * @property {number} priority Priority of the device
 * @property {boolean} int Indicates if the device generates interrupts
 * @property {number} readStep Indicates the current step of the read operation
 * @property {boolean} readMode Indicates if the device is in read mode
 *
 */
class InputDevice extends Device {
  constructor (name, baseaddress, memsize, vector, priority, int, sdb, cpu) {
    super(name, baseaddress, memsize, sdb, cpu)

    this.vector = vector
    this.priority = priority
    this.int = int
    this.readStep = 0

    //  State that indicates that the device is in read mode
    this.readMode = false

    Object.assign(InputDevice.prototype, withInt)
  }
}

export { InputDevice }
