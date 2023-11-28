'use strict'
/**
 * @module devices/lights
 */
import { Bitop } from '../../lib/bits.js'
import { InputDevice } from './input.js'

/**
 * @class Lights
 * @extends InputDevice
 * @property {number} lights Lights value
 * @property {number} switches Switches value
 * @property {number} _lights Internal lights value
 * @property {number} _switches Internal switches value
 * @property {number} vector Interrupt vector
 * @property {number} priority Interrupt priority
 * @property {boolean} int Indicates if the device generates interrupts
 * @property {Object} error Error messages
 * @property {Object} topics Topics used by the device
 */
class Lights extends InputDevice {
  /**
   * @property {Object} error Error messages
   */
  static error = {
    outofbounds: 'error.lights.out-of-bounds'
  }

  /**
   * @property {Object} topics Topics used by the device
   */
  static topics = {
    update: 'lights-update-'
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    return {
      type: 'lights',
      name: this.name,
      lights: this.lights,
      switches: this.switches,
      address: this.baseaddress,
      priority: this.priority,
      vector: this.vector,
      int: this.int
    }
  }

  /**
   * @method reset Reset the device to its initial state
   */
  reset () {
    this._lights = 0x0000
    this._switches = 0x0000
    this.reportUpdate()
  }

  constructor (name, baseaddress, vector, priority, int, sdb, cpu) {
    super(name, baseaddress, 1, vector, priority, int, sdb, cpu)

    this.reset()

    // this.activeInt = false
  }

  /**
   * @method lights Get the lights value
   */
  get lights () {
    return this._lights
  }

  /**
   * @method lights Set the lights value
   * @param {number} value Value to set it has to be 16bit decimal value
   */
  set lights (value) {
    this._lights = value
  }

  /**
   * @method switches Get the switches value
   * @returns {number} value Value of the switches
   */
  get switches () {
    return this._switches
  }

  /**
   * @method switches Set the switches value
   * @param {number} value Value to set it has to be 16bit decimal value
   */
  set switches (value) {
    this._switches = value
  }

  /**
   * @method switchOn Switch on a switch
   * @param {*} _switch switch to switch on
   * @returns instance of the device
   */
  switchOn (_switch) {
    this.switches = Bitop.on(this.switches, _switch)
    return this
  }

  /**
   * @method switchOff Switch off a switch
   * @param {*} _switch switch to switch off
   * @returns instance of the device
   */
  switchOff (_switch) {
    this.switches = Bitop.off(this.switches, _switch)
    return this
  }

  /**
   * @method resetReadMode Reset the read mode
   */
  resetReadMode () {
    super.resetReadMode()
    this.readMode = false
  }

  /**
   * @method getPos Get the value of the given position
   * @param {*} position position to get the value from
   */
  getPos (position) {
    if (position !== 0) throw new Error(Lights.error.outofbounds)
    return this.switches
  }

  /**
   * @method setPos Set the value of the given position
   * @param {*} position position to set the value
   * @param {*} value value to set
   */
  setPos (position, value) {
    if (position !== 0) throw new Error(Lights.error.outofbounds)
    this.lights = value
    this.reportUpdate(value)
  }

  /**
   * @method setInt Set the interrupt flag
   */
  setInt () {
    this.cpu.setInt()
    this.activeInt = true
  }

  /**
   * @method isInt Check if the device is in interrupt mode
   * @returns {boolean} true if the device is in interrupt mode
   */
  isInt () {
    return this.activeInt
  }

  /**
   * @method reportUpdate Report an update
   * @param {*} value value to report
   */
  reportUpdate (value) {
    this.broadCast({ topic: Lights.topics.update + this.name, value })
  }
}

export { Lights }
