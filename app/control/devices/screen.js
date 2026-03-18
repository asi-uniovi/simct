'use strict'
/**
 * @module devices/screen
 *
 */

import { Bitop } from '../../lib/bits.js'
import { Device } from './device.js'
import { baseConvert as bC } from '../../lib/baseconvert.js'

/**
 * @class Screen
 * @extends Device
 * @property {number} controlregister Control register
 * @property {Array} _positions Internal positions array of the screen
 * */
class Screen extends Device {
  /**
   * @property colors Colors of the screen
   */
  static colors = [
    { rbg: '#000000', label: 'Black' }, // Black
    { rbg: '#0000FF', label: 'Blue' }, // Blue
    { rbg: '#00FF00', label: 'Green' }, // Green
    { rbg: '#00FFFF', label: 'Cyan' }, // Cyan
    { rbg: '#FF0000', label: 'Red' }, // Red
    { rbg: '#FF00FF', label: 'Magenta' }, // Magenta
    { rbg: '#FFFF00', label: 'Yellow' }, // Yellow
    { rbg: '#FFFFFF', label: 'White' }// White
  ]

  /**
   * @property {Object} colorMap Map over the colors
   */
  static colorMap = {
    Black: 0,
    Blue: 1,
    Green: 2,
    Cyan: 3,
    Red: 4,
    Magenta: 5,
    Yellow: 6,
    White: 7
  }

  /**
   * @method reset Reset the device to its initial state
   */
  reset () {
    this._positions = []
    this.controlregister = 0x0000
    this.reportUpdate()
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    return {
      type: 'screen',
      name: this.name,
      controlregister: this.controlregister,
      positions: this._positions,
      address: this.baseaddress
    }
  }

  constructor (name, baseaddress) {
    super(name, baseaddress, 128)
    this.reset()
  }

  /**
   * @method powerOn Turn on the device
   */
  powerOn () {
    this.setPos(120, Bitop.off(this.controlregister, 1))
    // this.reportUpdate()
  }

  /**
   * @method powerOff Turn off the device
   */
  powerOff () {
    this.setPos(120, Bitop.on(this.controlregister, 1))
  }

  /**
   * @method isOn Check if the device is on
   * @returns {boolean} True if the device is on (bit 1 = 1 means OFF per spec)
   */
  isOn () {
    return !Bitop.isOn(this.controlregister, 1) // Bit 1 = 1 means OFF per spec
  }

  /**
   * @method getPos Get the value of given position
   * */
  getPos (position) {
    if (position > 120) throw new Error(Screen.error.outofbounds)
    if (position < 120) return this.positions[position]
    else return this.controlregister
  }

  /**
   * @method getPosInfo Get the information of given position
   * @param {*} position position to get the information
   * @returns {Object} Information of the position (character, foreground color, background color)
   */
  getPosInfo (position) {
    const hex = this.getPos(position)
    return {
      char: hex & 0x00FF,
      fg: (hex & 0x0700) >> 8,
      bg: (hex & 0x3800) >> 11
    }
  }

  /**
   * @method positions Get the positions of the screen as an array
   */
  get positions () {
    if (this.isOn()) return this._positions
    else return []
  }

  /**
   * @method matrix Print the screen as a matrix
   */
  matrix () {
    const tmp = []
    for (let i = 0; i < 8; i++) {
      tmp[i] = []
      for (let j = 0; j < 15; j++) {
        tmp[i][j] = this.positions[15 * i + j] ? bC.dec2hex(this.positions[15 * i + j]) + 'h' : ''
      }
    }
    console.table(tmp)
  }

  /**
   * @method setPos Set the value of given position
   * @param {*} pos position to set the value
   * @param {*} value value to set
   */
  setPos (pos, value) {
    if (pos !== 120) { this._positions[pos] = value } else {
      this.controlregister = value
      if (Bitop.isOn(this.controlregister, 0)) {
        this._positions = []
      }
    }
    this.reportUpdate()
  }

  /**
   * @method reportUpdate Report the update of the screen
  */
  reportUpdate () {
    this.broadCast({ topic: 'updatedScreen' + this.name })
  }
}

export { Screen }
