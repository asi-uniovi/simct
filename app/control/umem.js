'use strict'
/**
 * @fileoverview Umem class
 */

/**
 * @class Umem
 * @description Emulates a programmed Micro-memory where all possible instructions are stored
 * @param { boolean } debug - If true, the micro-memory will log its content to the console
 * @property { Array } instructions - Array of instructions to be stored in the micro-memory with all available instructions and their signals
 * @property { Object } addresses - Map each instruction OpCode with the first position of the steps for that instruction in the micro-memory
 * @property { Object } OpCodeMap - Stores the information
 *
 */
class Umem {
  constructor (instructions = []) {
    this.instructions = instructions

    this.addresses = {}

    this.OpCodeMap = {}

    // This signals are common at the begining of every instruction
    this.mem = [
      ['pc-ib', 'ib-mar', 'read', 'tmpe-clr', 'carry-in', 'add', 'alu-tmps'],
      ['tmps-ib', 'ib-pc'],
      ['mdr-ib', 'ib-ir']
    ]

    for (let i = 0; i < this.instructions.length; i++) {
      this.addInstruction(this.instructions[i])
    }

    // This address indicates the first position right after loading all the instructions from the library
    // We use it to mark where do the signals to be executed to process an interrupt start
    this.intAddress = this.mem.length

    // This block of signals is executed when an interrupt is detected
    this.mem = this.mem.concat([
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['sr-ib', 'ib-mdr'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write'],
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['pc-ib', 'ib-mdr'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write', 'inta'],
      [],
      ['mdr-ib', 'ib-mar', 'read'],
      [],
      ['mdr-ib', 'ib-pc', 'cli', 'fin']
    ])
  }

  /**
   * @method log
   * @param {boolean} log - If true, the micro-memory will log its content to the console
   */
  log (log = false) {
    if (log) {
      console.table(this.instructions)
      console.table(this.mem)
      console.table(this.addresses)
    }
  }

  /**
   * If set to true, the micro-memory will log its content to the console
   */
  set debug (value) {
    this._debugMode = value
  }

  /**
   * Returns debug mode
   */
  get debug () {
    return this._debugMode
  }

  /**
   * @method addInstruction Adds an instruction to the micro-memory
   * @description The structure of an instruction is:
   * {
   * OpCode: 'string',
   * mnemonic: 'string',
   * mnemonictpl: 'string',
   * regex: 'string',
   * ucode: [
   * ['signal1', 'signal2', ...],
   * ['signal1', 'signal2', ...],
   * ...
   * ]
   * }
   * @param { Object } instruction - Instruction to be added to the micro-memory
   * @param {*} instruction
   */
  addInstruction (instruction) {
    this.addresses[instruction.OpCode] = this.mem.length
    this.mem.push(...instruction.ucode)
  }
}

export { Umem }
