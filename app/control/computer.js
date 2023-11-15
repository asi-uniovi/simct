'use strict'

/**
 * @module control/computer
 */

import { Cpu } from './cpu.js'
import { Memory } from './memory.js'
import { IOManager } from './io.js'
import { instructions } from '../config/instructions.js'
import { baseConvert as bC } from '../lib/baseconvert.js'
import { Sab } from './sab.js'
import { Sdb } from './sdb.js'
import { Uc } from './uc.js'
import { SVGCable } from '../view/svg.js'

/**
 * @class Computer Simulates the Structure and Behavior of a 64Kb theoretical Computer
 * @property {Sab} sab Sab register
 * @property {Sdb} sdb Sdb register
 * @property {Memory} mem Memory
 * @property {IOManager} io IO Manager
 * @property {Cpu} cpu CPU
 * @property {boolean} debugMode Debug mode
 * @property {Object} mode Modes used by the device
 * @property {Object} error Errors used by the device
 * @property {Object} topic Topics used by the device
 *
 */
export class Computer {
  static mode = {
    normal: Uc.mode.normal.auto,
    manual: Uc.mode.manual
  }

  static error = {
    loading_program: 'error.computer.loading_program',
    loading_memory: 'error.computer.loading_memory',
    loading_signals_nomanual: 'error.computer.loading_signals_nomanual'
  }

  static topic = {
    loaded_program: 'loaded-program',
    loaded_memory: 'loaded-memory'
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    const backup = {
      sab: this.sab.value,
      sdb: this.sdb.value,
      mem: this.mem.backup(),
      cpu: this.cpu.backup()
    }
    return backup
  }

  /**
   * @method restore Restore the device
   * @param {*} backup Backup of the device
   */
  restore (backup) {
    this.sab.value = backup.sab
    this.sdb.value = backup.sdb
    this.mem.restore(backup.mem)
    this.cpu.restore(backup.cpu)
  }

  /**
   * @method constructor Constructor
   * @param {*} memsize Size of the memory
   */
  constructor (memsize = 65536) {
    this.sab = new Sab()
    this.sdb = new Sdb()

    this.mem = new Memory(memsize, this.sab, this.sdb)
    this.io = new IOManager()

    this.mem.setIOManager(this.io)

    this.cpu = new Cpu(instructions, this)

    this.cpu.uc.subscribe(this.mem, 0)
    this.cpu.uc.subscribe(this.io, 0)

    this.cpu.uc.signalmanager.subscribe(this.mem)

    this.cpu.mar.subscribe(this.sab)
    this.cpu.mdr.subscribe(this.sdb)
    this.sdb.subscribe(this.cpu.mdr)

    this.debugMode = false
  }

  /**
   * @method reset Reset the device
   */
  reset () {
    this.sab.reset()
    this.sdb.reset()

    this.mem.reset()
    // this.io.reset()
    this.cpu.reset()
    SVGCable.reset()
  }

  /**
   * @method loadProgram Load a program into the memory
   * @param {*} program Program to load
   * @throws {Error} if file is not a valid program file
   */
  loadProgram (program) {
    this.reset()

    if (!program.every(bC.is16bitHex)) {
      throw new Error(Computer.error.loading_program)
    } else {
      try {
        this.mem.getPos(bC.hex2dec(program[0]))
        this.mem.getPos(bC.hex2dec(program[1]))
      } catch (e) {
        throw new Error(Computer.error.loading_program)
      }
    }

    // First line always contains first address to start loading the program
    const start = bC.hex2dec(program[0])

    // Second contains address of the first instruction
    this.cpu.pc.value = bC.hex2dec(program[1])

    // Third contains the address of the stack pointer
    this.cpu.reg[7].value = bC.hex2dec(program[2])

    const programMap = {}
    try {
      // Rest of positions are loaded sequentially
      for (let i = 3; i < program.length; i++) {
        if (program[i] !== '') {
          this.mem.setPos(start + (i - 3), bC.hex2dec(program[i]))
          programMap[bC.dec2hex(start + (i - 3))] = program[i]
        }
      }
      if (this.debugMode) {
        console.log(Cpu.topic.loaded_program)
        console.table(programMap)
        console.log(program)
      }
    } catch (e) {
      throw new Error(Computer.error.loading_program)
    }
  }

  /**
   * @method loadMemory Load a memory into the memory
   * @param {*} memory memory positions as array
   * @param {*} starthex starting position of loading
   * @throws {Error} if file is not a valid memory file
   */
  loadMemory (memory, starthex) {
    if (!memory.every(bC.is16bitHex)) {
      throw new Error(Computer.error.loading_memory)
    }

    const memoryMap = {}
    const start = bC.hex2dec(starthex)
    try {
      for (let i = 0; i < memory.length; i++) {
        this.mem.setPos(start + i, bC.hex2dec(memory[i]))
        memoryMap[bC.dec2hex(start + i)] = memory[i]
      }
    } catch (e) {
      throw new Error(Computer.error.loading_memory)
    }

    console.log('Se ha cargado la memoria: ')
    console.table(memoryMap)
  }

  /**
   * @method loadSignals Load signals into the UC
   * @param {*} signals signal array
   */
  loadSignals (signals) {
    if (this.cpu.uc.mode !== Computer.mode.manual) throw new Error(Computer.error.loading_signals_nomanual)
    this.cpu.uc.loadSignals(signals)
  }

  /**
   * @method clock gets the clock instance of the CPU
   */
  get clock () {
    return this.cpu.clock
  }

  /**
   * @method startClock Start the clock
   * @param {*} pulses pulses to execute
   */
  startClock (pulses = 0) {
    this.clock.start(pulses)
  }

  /**
   * @method stopClock Stop the clock
   */
  stopClock () {
    this.clock.stop()
  }

  /**
   * @method run Run the computer in normal auto mode
   */
  run () {
    this.cpu.uc.runAuto()
    this.startClock()
  }

  /**
   * @method stop Stop the computer
   */
  stop () {
    this.stopClock()
  }

  /**
   * @method step Run a step
   */
  runStep () {
    this.startClock(1)
  }

  /**
   * @method runInstruction Run an instruction
   */
  runInstruction () {
    this.cpu.uc.runInstruction()
    this.startClock()
  }

  /**
   * @method runProgram Run a program
   */
  normalMode () {
    this.cpu.uc.mode = Computer.mode.normal
  }

  /**
   *  @method manualMode Run a program
   */
  manualMode () {
    this.cpu.uc.mode = Computer.mode.manual
  }

  /* istanbul ignore next */
  /**
   * @method state Show the state of the computer in the console
   */
  state () {
    console.log('UC step')
    console.log('R0-7')
    console.table([this.cpu.log[0]])
    console.log('CPU')
    console.table([this.cpu.log[2]])
    console.log('ALU')
    console.table([this.cpu.log[1]])
    console.log(this.cpu)
  }

  /**
 * @method mode Get the mode of the computer
 */
  get mode () {
    return this.cpu.uc.mode <= Uc.mode.normal.auto ? Computer.mode.normal : Computer.mode.manual
  }
}
