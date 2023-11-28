'use strict'
/**
 * @fileoverview RegisterSR class
 */
import { Register } from './register.js'
import { Bitop } from '../lib/bits.js'

/**
 * Emulates the State registry of a computer
 *
 * State registry has 5 bits, representing in order from msb to lsb
 *  -Zero flag (zf)
 *  -Carry flag ()
 *  -Overflow flag
 *  -Sign flag
 *  -Interrupt flag
 */

/**
 * @class RegisterSR
 * @extends Register
 * @description Emulates a Computer register, with 5 bits
 * representing the state of the computer, in order from msb to lsb:
 * -Zero flag (zf)
 * -Carry flag ()
 * -Overflow flag
 * -Sign flag
 * -Interrupt flag
 * @param { int } value - Register initial value
 *
 */
class RegisterSR extends Register {
  constructor (value = 0) {
    super('SR', value)
  }

  /**
   * Gets the value of the interrupt flag
   */
  get if () {
    return this.value & 0x1
  }

  /**
   * Sets the value of the interrupt flag
   */
  set if (value) {
    this.value = Bitop.set(this.value, 0, value)
  }

  /**
   * Gets the sign flag
   */
  get sf () {
    return (this.value & 0x2) >> 1
  }

  /**
   * Gets the overflow flag
   */
  get of () {
    return (this.value & 0x4) >> 2
  }

  /**
   * Gets the carry flag
   */
  get cf () {
    return (this.value & 0x8) >> 3
  }

  /**
   * Gets the zero flag
   */
  get zf () {
    return (this.value & 0x10) >> 4
  }

  /**
   * @method reset Sets the value of the sign flag
   */
  reset () {
    super.reset()
  }
}

export { RegisterSR }
