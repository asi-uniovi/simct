'use strict'
/**
 * @fileoverview Uc class
 */
import { ObservableObserver } from '../lib/observer.js'
import { Register } from './register.js'
import { SignalManager, SignalSet } from './signalmanager.js'
import { Clock } from './clock.js'
import { decodeInstruction } from '../config/instructions.js'
import { baseConvert } from '../lib/baseconvert.js'
import { Bitop } from '../lib/bits.js'
import { _jStr } from '../lib/jstr.js'

/**
 * @class Uc
 * @extends ObservableObserver
 * @description Emulates the control unit in a CPU
 * @param {Cpu} cpu - The cpu that this control unit belongs to
 * @property {int} step - The current step of the control unit
 * @property {Register} upc - The current value of the uPC
 * @property {int} mode - The current mode of the control unit
 * @property {int} int - The current state of the interrupt flag
 * @property {boolean} debugMode - The current state of the debug mode
 * @property {Array} signals - The current array of signals to execute
 * @property {SignalManager} signalmanager - The signal manager of the control unit
 * @property {Object} topic - The topics that this control unit can broadcast
 * @property {Object} state - The states that this control unit can have
 * @property {Object} mode - The modes that this control unit can have
 * @property {Object} run - The run modes that this control unit can have
 * @property {Object} currentInstruction - The current instruction being executed
 *
 */
class Uc extends ObservableObserver {
  static topic = {
    update: 'update-uc',
    signal: 'signal',
    pulse: Clock.topic.pulse,
    error: 'error-uc',
    int: 'int-uc',
    reset: 'reset-uc',
    newstep: 'new-step-uc'
  }

  static state = {
    active_int: true,
    inactive_int: false
  }

  static mode = {
    normal: {
      step: 1,
      instruction: 2,
      auto: 3
    },
    manual: 4
  }

  static run = {
    step: 1,
    instruction: 2,
    auto: 2
  }

  /**
   * @method backup
   * @returns {Object} A backup of the current state of the control unit
   */
  backup () {
    return {
      step: this.step,
      upc: this.upc.value,
      mode: this.mode,
      int: this._int,
      debugMode: this.debugMode,
      signals: this.signals
    }
  }

  /**
   * @method restore
   * @param {*} backup - A backup of the current state of the control unit
   */
  restore (backup) {
    this.step = backup.step
    this.upc.value = backup.upc
    this.mode = backup.mode
    this._int = backup.int
    this.debugMode = backup.debugMode
    this.signals = backup.signals
  }

  /**
   * @method reset
   * @description Resets the control unit to its initial state
   */
  reset () {
    this.step = 0
    this.upc.value = 0x0000
    this.mode = Uc.mode.normal.step
    this._int = Uc.state.inactive_int
    this.debugMode = false
    this.loadSignals([])
    this.broadCast({ topic: Uc.topic.reset })
  }

  constructor (cpu) {
    super()

    this.signalmanager = new SignalManager(cpu)
    this.cpu = cpu
    this.upc = new Register('uPC')
    this.reset()
  }

  /**
   * Activates or deactivates the interrupt flag
   */
  set int (value) {
    this._int = value
    if (this._int === Uc.state.active_int) this.broadCast({ topic: Uc.topic.int, value: this.int })
  }

  /**
   * Gets the value of the interrupt flag
   */
  get int () {
    return this._int
  }

  /**
   * @method condIsTrue Evaluates a jump condition
   * @param {int} condition 3 bits
   * @returns {boolean} true if condition is true following the theoretical computer guide
   */
  condIsTrue (condition) {
    switch (condition) {
      case 0b100: return this.cpu.sr.zf === 1
      case 0b101: return this.cpu.sr.zf === 0

      case 0b000: return this.cpu.sr.cf === 1
      case 0b001: return this.cpu.sr.cf === 0

      case 0b010: return this.cpu.sr.of === 1
      case 0b011: return this.cpu.sr.of === 0

      case 0b110: return this.cpu.sr.sf === 1
      case 0b111: return this.cpu.sr.sf === 0
    }

    return false
  }

  /**
   * @method loadSignals Loads an array of signals to execute in the next step
   * @param {Array} signals - The array of signals to load
   */
  loadSignals (signals) {
    this.signals = signals
    this.broadCast({ topic: Uc.topic.update, value: { step: this.step, signals, int: (this.upc.value >= this.cpu.umem.intAddress) } })
  }

  /**
   * @method runInstruction Changes the active runmode in order to execute all signals of the current instruction (till fin signal is reached)
   */
  runInstruction () {
    this.mode = Uc.mode.normal.instruction
  }

  /**
   * @method runAuto Changes the active runmode in order to execute steps in auto mode till a stop signal is received
   */
  runAuto () {
    this.mode = Uc.mode.normal.auto
  }

  /**
   * @method parseInstruction Parses an instruction and returns an object with its decoded value and its registers
   * @param {*} instruction - The instruction to parse
   * @returns {Object} An object with the decoded instruction and its registers
   */
  static parseInstruction (instruction) {
    const tmp = {}
    tmp.bin = baseConvert.dec2bin(instruction)
    tmp.decoded = decodeInstruction(baseConvert.dec2bin(instruction))
    tmp.regs = tmp.decoded.match(/ R[0-9]|Rs[0-9]|\[R[0-9]/g)
    tmp.op1 = Bitop.msb(instruction, 10, 3)
    tmp.op2 = Bitop.msb(instruction, 7, 3)
    tmp.op3 = Bitop.msb(instruction, 4, 3)
    tmp.ri = Bitop.msb(instruction, 15, 5) === 0b00010
    return tmp
  }

  /**
   * @method signalEncodeRegisters Encodes the registers of an instruction in the signals array
   * @param {Array} signalarr - The array of signals to encode
   * @param {Object} currentInstruction - The current instruction being executed
   * @returns {Array} The encoded array of signals
   */
  static signalEncodeRegisters (signalarr, currentInstruction) {
    let signals = signalarr.join(',')
    if (currentInstruction.regs.length === 3) {
      signals = signals.replace('-rd', '-r' + currentInstruction.op1)
      signals = signals.replace('rs1-', 'r' + currentInstruction.op2 + '-')
      signals = signals.replace('rs2-', 'r' + currentInstruction.op3 + '-')
    } else if (currentInstruction.regs.length === 2) {
      signals = signals.replace('rs1-', 'r' + currentInstruction.op1 + '-')
      signals = signals.replace('rs2-', 'r' + currentInstruction.op2 + '-')
      signals = signals.replace('-rd', '-r' + currentInstruction.op1)
      signals = signals.replace('ri-', 'r' + (currentInstruction.ri ? currentInstruction.op2 : currentInstruction.op1) + '-')
      signals = signals.replace('rs-', 'r' + currentInstruction.op2 + '-')
    } else if (currentInstruction.regs.length === 1) {
      signals = signals.replace('-rds', '-r' + currentInstruction.op1)
      signals = signals.replace('-rd', '-r' + currentInstruction.op1)
      signals = signals.replace('ri-', 'r' + currentInstruction.op1 + '-')
      signals = signals.replace('rds-', 'r' + currentInstruction.op1 + '-')
      signals = signals.replace('rs-', 'r' + currentInstruction.op1 + '-')
      signals = signals.replace('rx-', 'r' + currentInstruction.op1 + '-')
    }
    return signals === '' ? [] : signals.split(',')
  }

  /**
   * @method stepNbroadcast Increments the step and broadcasts the new step
   */
  stepNbroadcast () {
    this.step++
    this.broadCast({ topic: Uc.topic.newstep, value: { step: this.step, int: (this.upc.value >= this.cpu.umem.intAddress) } })
  }

  /**
   * @method runStep Executes a step of the control unit
   * @returns {boolean} true if the step was executed successfully
   */
  runStep () {
    this.cpu.alu.carry_in = 0

    if (this.mode === Uc.mode.manual) {
      try {
        SignalSet.validateSignalSet(this.signals, this.cpu.computer)
      } catch (e) {
        alert(e.message)
        return false
      }
    }

    if (this.mode <= Uc.mode.normal.auto) {
      let signalarray = this.cpu.umem.mem[this.upc.value]
      if (this.currentInstruction && this.currentInstruction.regs && signalarray.length !== 0) signalarray = Uc.signalEncodeRegisters(signalarray, this.currentInstruction)
      this.loadSignals(signalarray)
    }

    if (this.signals.length === 0) this.signalmanager.broadCast({ topic: SignalManager.topic.empty })

    for (const signal of this.signals) {
      this.signalmanager.run(signal)

      this.broadCast({ topic: Uc.topic.signal, value: { signal } })

      if (signal === 'fin' && (this.mode <= Uc.mode.normal.auto)) {
        this.stepNbroadcast()

        if (this.int && (this.cpu.sr.if === 1)) {
          this.upc.value = this.cpu.umem.intAddress
        } else {
          this.upc.value = 0
        }

        this.step = 0

        if (this.mode === Uc.mode.normal.instruction) {
          this.cpu.clock.stop()
        }

        return true
      }
    }

    this.stepNbroadcast()

    if (this.mode <= Uc.mode.normal.auto) {
      if (!this.signals.includes('ib-ir')) this.upc.value++
      else {
        let OpCode = (this.cpu.ir.value & 0xF800) >> 11

        if (OpCode === 0b11110 && !this.condIsTrue((this.cpu.ir.value & 0x0700) >> 8)) OpCode = 0b11111

        this.currentInstruction = Uc.parseInstruction(this.cpu.ir.value)

        if (this.debugMode) {
          console.log(this.currentInstruction)
        }
        this.upc.value = this.cpu.umem.addresses[OpCode]
      }
    }

    return true
  }

  /***
   * @method setMode Sets the current mode of the control unit
   */
  setMode (mode) {
    this.mode = mode
  }

  /**
   * @method listen Listens to messages from other components
   * @param {*} message message received
   */
  listen (message) {
    switch (message.topic) {
      case Clock.topic.pulse: {
        try {
          if (this.runStep()) this.broadCast({ topic: Uc.topic.pulse })
        } catch (e) {
          const translated = _jStr(e.message).translate()
          console.log('Exception running step: ' + e)
          if (translated) { alert(translated) } else { alert(e.message) }
          this.cpu.clock.stop()
        }
      }
    }
  }
}

export { Uc }
