'use strict'
/**
 * @fileoverview SignalManager class
 */

import { Alu } from './alu.js'
import { Bitop } from '../lib/bits.js'
import { ObservableObserver } from '../lib/observer.js'

/**
 * @class SignalMap
 * @description Maps signals to groups
 * @returns { SignalMap } SignalMap instance
 */
class SignalMap {
  static instance = null
  static getGroup (signal) {
    const rx = signal.match(/r(?<register>[0-7])/)
    if (rx) return 'r' + rx.groups.register

    if (['sr-ib', 'ib-sr', 'alu-sr', 'cli', 'sti'].includes(signal)) return 'SR'
    if (['pc-ib', 'ib-pc'].includes(signal)) return 'PC'
    if (['ib-tmpe', 'tmpe-set', 'tmpe-clr'].includes(signal)) return 'TMPE'
    if (['tmps-ib', 'alu-tmps'].includes(signal)) return 'TMPS'
    if (['read', 'write'].includes(signal)) return 'MEMORY'
    if (signal === 'inta') return 'INT'
    if (signal === 'ib-mar') return 'MAR'
    if (['mdr-ib', 'ib-mdr'].includes(signal)) return 'MDR'
    if (['ib-ir', 'irl-ibh', 'irl-ibl', 'extirl-ib'].includes(signal)) return 'IR'
    if (['add', 'sub', 'or', 'and', 'xor', 'carry-in'].includes(signal)) return 'ALU'
    if (signal === 'fin') return 'FIN'
  }

  constructor () {
    const signalOrder = ['r0-ib', 'r1-ib', 'r2-ib', 'r3-ib', 'r4-ib', 'r5-ib', 'r6-ib', 'r7-ib', 'pc-ib', 'mdr-ib', 'tmps-ib', 'irl-ibh', 'irl-ibl', 'extirl-ib', 'sr-ib', 'ib-r0', 'ib-r1', 'ib-r2', 'ib-r3', 'ib-r4', 'ib-r5', 'ib-r6', 'ib-r7', 'ibh-rh', 'ibh-r0h', 'ibh-r1h', 'ibh-r2h', 'ibh-r3h', 'ibh-r4h', 'ibh-r5h', 'ibh-r6h', 'ibh-r7h', 'ibl-rl', 'ibl-r0l', 'ibl-r1l', 'ibl-r2l', 'ibl-r3l', 'ibl-r4l', 'ibl-r5l', 'ibl-r6l', 'ibl-r7l', 'ib-pc', 'ib-mdr', 'ib-mar', 'ib-tmpe', 'carry-in', 'tmpe-set', 'tmpe-clr', 'add', 'sub', 'or', 'and', 'xor', 'alu-sr', 'write', 'read', 'alu-tmps', 'int', 'inta', 'cli', 'sti', 'ib-sr', 'fin', 'ib-ir']

    if (!SignalMap.instance) {
      this.map = signalOrder.reduce(function (acc, curr, idx) {
        acc[curr] = {
          order: idx,
          group: SignalMap.getGroup(curr)
        }
        return acc
      }, {})

      SignalMap.instance = this
    }
    return SignalMap.instance
  }

  static getInstance () {
    return new SignalMap()
  }
}

/**
 * @class SignalSet
 * @description Represents a set of signals
 * @param { Computer } computer - Computer instance
 * @property { Array } signals - Array of signals
 * @property { Object } control - Control object
 * @property { Boolean } control.download - True if a download signal is present
 * @property { Object } control.upload - Object with the groups of upload signals
 * @property { Object } control.groups - Object with the groups of signals
 * @property { SignalMap } signalv - SignalMap instance
 * @property { Object } error - Error object
 *
 */
class SignalSet {
  static error = {
    multiple_download: 'error.signalset.multiple_download',
    same_group: 'error.signalset.same_group',
    read_ongoing: 'error.signalset.read_ongoing',
    write_ongoing: 'error.signalset.write_ongoing',
    badsignal: 'error.signalset.badsignal',
    multiple_upload_group: 'error.signalset.multiple_upload_group',
    inta_read: 'error.signalset.inta_read',
    bad_sr: 'error.signalset.bad_sr',
    signal_present: 'error.signalset.signal_present'
  }

  constructor (computer) {
    this.signalv = SignalMap.getInstance()
    this.computer = computer

    this.reset()
  }

  /**
   * @method reset Resets the signal set
   */
  reset () {
    this._signals = []

    this.control = {
      download: false,
      upload: {},
      groups: {}
    }
  }

  /**
   * @method validateSignalSet Validates a signal set
   * @param {SignalSet} set Signal set
   * @param {Computer} ct Computer instance
   */
  static validateSignalSet (set, ct) {
    const signalv = SignalMap.getInstance()
    const signalMap = signalv.map
    const control = {
      download: false,
      upload: {},
      groups: {}
    }
    try {
    // Check if all signals are valid
      set.forEach(signal => {
        if (!signalMap[signal]) throw new Error(SignalSet.error.badsignal)
        if (set.filter((item) => item === signal).length > 1) throw new Error(SignalSet.error.signal_present)

        const group = signalMap[signal].group

        // An inta signal cannot be executed with a read signal or during an ongoing read
        if (['read', 'inta'].includes(signal)) {
          if (signal === 'inta' && (set.includes('read') || ct.mem.readMode)) throw new Error(SignalSet.error.inta_read)
        }

        // Multiple download signals are not allowed at the same time
        const download = /-ib.?$/.test(signal)
        if (download && control.download) {
          throw new Error(SignalSet.error.multiple_download)
        }

        // Multiple upload signals over the same register are not allowed
        const upload = /ib.?-.+$/.test(signal)
        if (upload && control.upload[group]) {
          throw new Error(SignalSet.error.multiple_upload_group)
        }

        // A read or write signal cannot be executed during an ongoing read or write
        // ib-mar is not allowed during a read or write operation
        // ib-mdr is not allowed during a write operation
        if (group === 'MEMORY' || ['ib-mar', 'ib-mdr'].includes(signal)) {
          if (ct.mem.readMode || ct.mem.writeMode) {
            if (ct.mem.readMode && signal !== 'ib-mdr') throw new Error(SignalSet.error.read_ongoing)
            else throw new Error(SignalSet.error.write_ongoing)
          }
        }

        // In SR group only ib-sr and sr-ib are allowed
        if (group === 'SR' && control.groups[group] && !((signal === 'ib-sr' && set.includes('sr-ib')) || (signal === 'sr-ib' && set.includes('ib-sr')))) throw new Error(SignalSet.error.bad_sr)

        // A signal cannot be added if it belongs to the same group as another signal
        // except for the following cases:
        // - ib-sr, sr-ib
        // general purpose register cases are covered by the first if in this function
        if (control.groups[group] && ['IR', 'TMPE', 'TMPS', 'MEMORY'].includes(group)) {
          throw new Error(SignalSet.error.same_group)
        }

        if (group === 'ALU' && control.groups[group]) {
          if (!(set.includes('carry-in') || signal === 'carry-in')) throw new Error(SignalSet.error.same_group)
        }

        if (upload) control.upload[group] = true

        if (download) control.download = true

        control.groups[group] = true
      })
    } catch (e) {
      throw new Error(e.message)
    }
  }

  /**
   * @method setSignals Sets the signal set
   * @param {SignalSet} set Signal set
   */
  setSignals (set) {
    try {
      this.validateSignalSet(set, this.computer)
      this._signals = set
    } catch (e) {
      throw new Error(e.message)
    }
  }

  /**
   * @method addSignal Adds a signal to the signal set
   * @param {string} signal Signal to add
   * @param {boolean} force Force the addition of the signal with no validation
   */
  addSignal (signal, force = false) {
    const ct = this.computer

    if (!force) SignalSet.validateSignalSet([...this._signals, signal], ct)

    this._signals.push(signal)
  }

  /**
   * @method removeSignal Removes a signal from the signal set
   * @param {String} signal Signal to remove
   */
  removeSignal (signal) {
    const signalMap = this.signalv.map
    const idx = this._signals.indexOf(signal)
    if (idx !== -1) {
      this._signals.splice(idx, 1)
      this.control.groups[signalMap[signal].group] = false
    }
    this.control.upload[signalMap[signal].group] = false
    if (this._signals.filter(s => /-ib.?$/.test(s)).length === 0) this.control.download = false
  }

  /**
   * @method get signals
   * @returns {Array} Array of signals sorted by the order provided in the signal map
   */
  get signals () {
    const signalMap = this.signalv.map
    return this._signals.sort((a, b) => signalMap[a].order - signalMap[b].order)
  }

  /**
   * @method toString Returns a string representation of the signal set
   * @returns {String} String representation of the signal set
   */
  toString () {
    return '[ ' + this.signals.join(' , ') + ' ]'
  }
}

/**
 * @class SignalManager
 * @description Manages the signals of the computer
 * @param { Computer } cpu - Computer instance
 * @property { Computer } cpu - Computer instance
 * @property { SignalSet } signalSet - SignalSet instance
 * @property { Object } topic - Object with the topics of the signals
 * @property { Object } error - Object with the error messages
 * @property { Object } signalv - SignalMap instance
 */
class SignalManager extends ObservableObserver {
  static topic = {
    mem_read: 'signal-mem-read',
    mem_write: 'signal-mem-write',
    fin: 'fin',
    empty: 'topic.signalmanager.empty'
  }

  static error = {
    regnotallowed: 'error.signalmanager.register_not_allowed'
  }

  constructor (cpu) {
    super()
    this.cpu = cpu
  }

  /**
   * @method signalEncode Encodes a signal
   * @description Encodes a signal with the dinamic values provided in the instruction code and broadcasts it
   * @param {String} signal Signal to encode
   * @param {*} value Value for encoding
   */
  signalEncode (signal, value = null) {
    this['sig_' + signal](value)

    let topic = signal.replace('_', '-')
    if (topic === 'read') {
      topic = SignalManager.topic.mem_read
    } else {
      if (topic === 'write') {
        topic = SignalManager.topic.mem_write
      } else {
        if (['add', 'sub', 'and', 'or', 'xor'].includes(topic)) {
          topic = 'alu-op'
        }
      }
    }
    const matches = topic.match(/.*(?<type>ri|rd|rs|rx).*?/)

    if (matches) {
      topic = topic.replace(matches.groups.type, 'r' + value)
    }

    this.broadCast({ topic, value: { value, step: this.cpu.uc.step } })
  }

  /**
   * @method run Runs a signal
   * @param {String} signal Signal to run
   * @returns {String} Signal to run
   */
  run (signal) {
    const rib = signal.match(/r(?<register>[0-7])-ib/)
    const ibr = signal.match(/ib-rd?(?<register>[0-7])/)
    const ibrh = signal.match(/ib[lh]-r(?<register>[0-7])[lh]/)

    if (ibrh) {
      return this.signalEncode(signal.replace(ibrh.groups.register, 'd').replace('-', '_'), (ibrh.groups.register))
    } else {
      if (rib) {
        return this.signalEncode('rs_ib', (rib.groups.register))
      } else {
        if (ibr) {
          return this.signalEncode('ib_rd', (ibr.groups.register))
        }
      }
    }

    return this.signalEncode(signal.replace('-', '_'))
  }

  /**
   * @method sig_ri_ib Sets the value of the IB bus to the value of the register provided
   * @param {*} rx Register number
   */
  sig_ri_ib (rx) {
    this.cpu.ib.value = this.cpu.reg[rx].value
  }

  // Ri Registers movements
  /**
   * @method sig_ib_ri Sets the value of the register provided to the value of the IB bus
   * @param {*} rx Register number
   */
  sig_rs_ib (rx) {
    // this.broadCast({ topic: 'r' + rx + '-ib' })
    this.cpu.ib.value = this.cpu.reg[rx].value
  }

  /**
   * @method sig_ib_rd Sets the value of the register provided to the value of the IB bus
   * @param {*} rx Register number
   */
  sig_ib_rd (rx) {
    this.cpu.reg[rx].value = this.cpu.ib.value
  }

  /**
 * @method sig_ib_rdl Sets the value of the lowest byte of the register provided to the value of the lowest byte of the IB bus
 * @param {*} rx Register number
 */
  sig_ibl_rdl (rx) {
    this.cpu.reg[rx].value = (this.cpu.reg[rx].value & 0xff00) | (this.cpu.ib.value & 0x00ff)
  }

  /**
   * @method sig_ibh_rdh Sets the value of the highest byte of the register provided to the value of the highest byte of the IB bus
   * @param {*} rx Register number
   */
  sig_ibh_rdh (rx) {
    this.cpu.reg[rx].value = (this.cpu.reg[rx].value & 0x00ff) | (this.cpu.ib.value & 0xff00)
  }

  /**
   * @method sig_ib_sr Sets the value of the SR register to the value of the IB bus
   */
  sig_ib_sr () {
    this.cpu.sr.value = this.cpu.ib.value & 0b11111
  }

  /**
   * @method sig_sr_ib Sets the value of the IB bus to the value of the SR register
   */
  sig_sr_ib () {
    this.cpu.ib.value = this.cpu.sr.value & 0b11111
  }

  /**
   * @method alu_sr Sets the value of the SR register to the value of the ALU temp SR register
   */
  sig_alu_sr () {
    const _if = this.cpu.sr.value & 0b1
    let tmp = 0x0000
    tmp = Bitop.set(tmp, 0, _if)
    tmp = Bitop.set(tmp, 1, this.cpu.alu.sf)
    tmp = Bitop.set(tmp, 2, this.cpu.alu.of)
    tmp = Bitop.set(tmp, 3, this.cpu.alu.cf)
    tmp = Bitop.set(tmp, 4, this.cpu.alu.zf)
    this.cpu.sr.value = tmp
  }

  /**
   * @method sig_cli Clears the interrupt flag
   */
  sig_cli () {
    this.cpu.sr.value = this.cpu.sr.value & 0b11110
  }

  /**
   * @method sig_sti Sets the interrupt flag
   */
  sig_sti () {
    this.cpu.sr.value = this.cpu.sr.value | 0b00001
  }

  /**
   * @method sig_ib_ir Sets the value of the IR register to the value of the IB bus
   */
  sig_ib_ir () {
    this.cpu.ir.value = this.cpu.ib.value
  }

  /**
   * @method sig_irl_ibl Sets the value of the lowest byte of the IB bus to the value of the lowest byte of the IR register
   */
  sig_irl_ibl () {
    this.cpu.ib.value = (this.cpu.ib.value & 0xff00) | (this.cpu.ir.value & 0x00ff)
  }

  /**
   * @method sig_irl_ibh Sets the value of the highest byte of the IB bus to the value of the lowest byte of the IR register
   */
  sig_irl_ibh () {
    this.cpu.ib.value = (this.cpu.ib.value & 0x00ff) | ((this.cpu.ir.value & 0x00ff) << 8)
  }

  /**
   * @method sig_extirl_ib Sets the value of the IB bus to the Ext8 value of the IR register
   */
  sig_extirl_ib () {
    this.cpu.ib.value = (this.cpu.ir.value & 0x00ff)
    // If the value of bit 8 of IR is 1 the first 8 bits will be 1 otherwise 0
    if (Bitop.isOn(this.cpu.ir.value, 7)) {
      this.cpu.ib.value = this.cpu.ib.value | (0xff00)
    }
  }

  /**
 * @method sig_pc_ib Sets the value of the IB bus to the value of the PC register
 */
  sig_pc_ib () {
    this.cpu.ib.value = this.cpu.pc.value
  }

  /**
   * @method sig_ib_pc Sets the value of the PC register to the value of the IB bus
   */
  sig_ib_pc () {
    this.cpu.pc.value = this.cpu.ib.value
  }

  /**
   * @method sig_add Adds the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_add () {
    this.cpu.alu.operate(Alu.operation.add)
  }

  /**
   * @method sig_sub Substracts the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_sub () {
    this.cpu.alu.operate(Alu.operation.sub)
  }

  /**
   * @method sig_or Performs a bitwise OR between the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_or () {
    this.cpu.alu.operate(Alu.operation.or)
  }

  /**
   * @method sig_and Performs a bitwise AND between the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_and () {
    this.cpu.alu.operate(Alu.operation.and)
  }

  /**
   * @method sig_xor Performs a bitwise XOR between the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_xor () {
    this.cpu.alu.operate(Alu.operation.xor)
  }

  /**
   * @method sig_carry_in Sets the carry in value of the ALU to 1
   */
  sig_carry_in () {
    this.cpu.alu.carry_in = 1
  }

  /**
   * @method sig_ib_mdr Sets the value of the MDR register to the value of the IB bus
   */
  sig_mdr_ib () {
    this.cpu.ib.value = this.cpu.mdr.value
  }

  /**
   * @method sig_ib_mdr Sets the value of the MDR register to the value of the IB bus
   */
  sig_ib_mdr () {
    this.cpu.mdr.value = this.cpu.ib.value
  }

  /**
   * @method sig_fin Broadcasts a fin signal
   */
  sig_fin () {
    this.broadCast({ topic: SignalManager.topic.fin })
  }

  /**
   * @method sig_inta Broadcasts an inta signal
   */
  sig_inta () {
    try {
      const current = this.cpu.computer.io.getNextInt()
      current.inta()
    } catch (e) {
      alert(e.message)
    }
  }

  /**
   * @method sig_ib_mar Sets the value of the MAR register to the value of the IB bus
   */
  sig_ib_mar () {
    this.cpu.mar.value = this.cpu.ib.value
  }

  /**
 * @method sig_read Broadcasts the order to perform a read operation, over the address stored in the MAR register
 */
  sig_read () {
    this.broadCast({ topic: SignalManager.topic.mem_read })
  }

  /**
 * @method sig_write Broadcasts the order to perform a write operation, over the address stored in the MAR register
 */
  sig_write () {
    this.broadCast({ topic: SignalManager.topic.mem_write })
  }

  /**
   * @method sig_alu_tmps Sets the value of the TMPS to the value of the ALU result register
   */
  sig_alu_tmps () {
    this.cpu.tmps.value = this.cpu.alu.result.value
  }

  /**
   * @method sig_tmps_ib Sets the value of the IB bus to the value of the TMPS register
   */
  sig_tmps_ib () {
    this.cpu.ib.value = this.cpu.tmps.value
  }

  /**
   * @method sig_tmpe_ib Sets the value of the tmpe register to the IB bus value
   */
  sig_ib_tmpe () {
    this.cpu.tmpe.value = this.cpu.ib.value
  }

  /**
 * @method sig_tmpe_set Sets the value of the tmpe register
 */
  sig_tmpe_set () {
    this.cpu.tmpe.value = 0xffff
  }

  /**
 * @method sig_tmpe_clr Clears the value of the tmpe register
 */
  sig_tmpe_clr () {
    this.cpu.tmpe.value = 0x0000
  }
}

export { SignalManager, SignalSet, SignalMap }
