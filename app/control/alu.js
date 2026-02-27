'use strict'
/**
 * @module control/alu
 * */
import { ObservableObserver } from '../lib/observer.js'
import { Register } from './register.js'
import { baseConvert as bC } from '../lib/baseconvert.js'

/**
 * @function positive Check if a number is positive
 * @param {number} hex Number to check
 * @returns {boolean} True if the number is positive, false otherwise
 */
function positive (hex) {
  return (hex & 0x8000) === 0
}

/**
 * @class Alu
 * @extends ObservableObserver
 * @property {number} _a Internal A value
 * @property {number} _b Internal B value
 * @property {number} _carry_in Internal carry-in value
 * @property {number} op Operation to perform
 * @property {Register} result Result register
 * @property {number} zf Zero flag
 * @property {number} cf Carry flag
 * @property {number} of Overflow flag
 * @property {number} sf Sign flag
 * @property {Object} topic Topics used by the device
 * @property {Object} operation Operations used by the device
 *
 */
class Alu extends ObservableObserver {
  static topic = {
    updated: 'alu-updated-result',
    reset: 'alu-reset'
  }

  static operation = {
    add: 'add',
    sub: 'sub',
    or: 'or',
    xor: 'xor',
    and: 'and'
  }

  // istanbul ignore next
  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    const backup = {
      result: this.result.value,
      a: this._a,
      b: this._b,
      carry_in: this._carry_in,
      zf: this.zf,
      cf: this.cf,
      of: this.of,
      sf: this.sf
    }
    return backup
  }

  // istanbul ignore next
  /**
   * @method restore Restore the device
   * @param {*} backup Backup of the device
   */
  restore (backup) {
    this.result.value = backup.result
    this._a = backup.a
    this._b = backup.b
    this._carry_in = backup.carry_in
    this.zf = backup.zf
    this.cf = backup.cf
    this.of = backup.of
    this.sf = backup.sf
  }

  /**
   * @method reset Reset the device to its initial state
   */
  reset () {
    this.op = 'ADD'
    this._a = 0x0000
    this._b = 0x0000
    this._carry_in = 0

    this.result.value = 0x0000

    // Internal state flags ZCOS
    this.zf = 0
    this.cf = 0
    this.of = 0
    this.sf = 0
    this.broadCast({ topic: Alu.topic.reset, value: { op1: this.a, op2: this.b, result: this.result, op: this.op } })
  }

  constructor () {
    super()

    this.result = new Register()
    this.reset()
  }

  /**
   * @method a Get the operator A
   * @property {number} a A value
   */
  get a () {
    return this._a
  }

  /**
   * @method a Set the operator A
   * @property {number} a A value
   */
  set a (value) {
    this._a = value
  }

  /**
   * @method b Get the operator B
   * return {number} B value
   */
  get b () {
    return this._b
  }

  /**
   * @method b Set the operator B
   * @property {number} b B value
  */
  set b (value) {
    this._b = value
  }

  /**
   * @method carry_in Get the carry-in value
  */
  get carry_in () {
    return this._carry_in
  }

  /**
   * @method carry_in Set the carry-in value
   */
  set carry_in (value) {
    this._carry_in = value
  }

  /**
   * @method operate Perform an operation
   * @param {string} operation Operation to perform
   */
  operate (operation) {
    this.op = operation
    // const a = this.tmpe
    // const b = this.ib

    let tmpResult = 0

    switch (operation) {
      case Alu.operation.add:

        tmpResult = this.a + this.b + this.carry_in

        this.result.value = tmpResult & 0xFFFF

        if (tmpResult > 0xFFFF) this.cf = 1
        else this.cf = 0

        // if ((a > 0 && b > 0 && this.result.value < 0) || (a < 0 && b < 0 && this.result.value > 0)) this.of = 1
        // else this.of = 0
        if ((positive(this.a) && positive(this.b) && !positive(this.result.value)) || (!positive(this.a) && !positive(this.b) && positive(this.result.value))) this.of = 1
        else this.of = 0

        break
      case Alu.operation.sub:

        tmpResult = this.a + ((~this.b) & 0xFFFF) + 1

        this.result.value = tmpResult & 0xFFFF

        if (this.a >= this.b) this.cf = 0
        else this.cf = 1

        if ((positive(this.a) && !positive(this.b) && !positive(this.result.value)) || (!positive(this.a) && positive(this.b) && positive(this.result.value))) this.of = 1
        else this.of = 0

        break

      case Alu.operation.or:
        this.result.value = this.a | this.b
        break
      case Alu.operation.and:
        this.result.value = this.a & this.b
        break
      case Alu.operation.xor:
        this.result.value = this.a ^ this.b
        break
    }

    if (this.result.value === 0) this.zf = 1
    else this.zf = 0

    this.sf = (this.result.value & 0x8000) >> 15

    this.broadCast({ topic: Alu.topic.updated, value: { op1: this.a, op2: this.b, result: this.result, op: operation } })
  }

  defaultAdd () {
    this.operate(Alu.operation.add)
    this.broadCast({ topic: Alu.topic.updated, value: { op1: this.a, op2: this.b, result: this.result, op: 'FAKE' } })
  }

  /**
   * @method listen Listen to a message
   * @param {Object} message Message to listen
   */
  listen (message) {
    switch (message.topic) {
      case 'TMPE_' + Register.topic.updated: this.a = message.value; this.defaultAdd(); break
      case 'IB-bus_' + Register.topic.updated: this.b = message.value; this.defaultAdd(); break
    }
  }

  /**
   * @method log Get the log of the device
   */
  get log () {
    return { OP: this.op, A: bC.dec2hex(this.a), B: bC.dec2hex(this.b), RESULT: bC.dec2hex(this.result.value), ZCOS: this.zf + '' + this.cf + '' + this.of + '' + this.sf }
  }
}

export { Alu }
