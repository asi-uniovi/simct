'use strict'

/**
 * @module control/memory
 */
import { ObservableObserver } from '../lib/observer.js'
import { Uc } from './uc.js'
import { SignalManager } from './signalmanager.js'

/**
 * Emulates Memory component in a Computer
 */

/**
 * @class Memory
 * @extends ObservableObserver
 * @property { int } size Specifies in bytes de size of the addressable space
 * @property { int[] } positions Specifies in bytes de size of the addressable space
 * @property { int[] } moduletypes Specifies in Kb of available modules
 * @property { boolean } io I/O Devices manager. If false it means that there is no I/O Manager
 * @property { boolean } _readmode Puts memory in read mode
 * @property { int } _readstep Counts the steps since readMode was activated
 * @property { boolean } _writemode Puts memory in read mode
 * @property { int } _writestep Counts the steps since writeMode was activated
 * @property { Bus } sab Link to system address bus
 * @property { Bus } sdb Link to system data bus
 * @property { Object } labels Labels used by the device
 * @property { Object } error Errors used by the device
 * @property { Object } topic Topics used by the device
 * @property { Object } rmode Read mode
 * @property { Object } wmode Write mode
 *
 */
class Memory extends ObservableObserver {
  static labels = {
    IOlabel: 'labels.memory.IOlabel',
    empty: 'labels.memory.empty'
  }

  static error = {
    address_space: 'error.memory.address_space',
    module_size: 'error.memory.module_size',
    module_collision: 'error.memory.module_collision',
    module_nomodule: 'error.memory.module_nomodule',
    io_module_present: 'error.memory.io_module_present',
    nomodule_noes: 'error.memory.nomodule_noes',
    module_notvalid: 'error.memory.module_notvalid',
    mode_notsupported: 'error.memory.notsupported'
  }

  static topic = {
    reset: 'topic.memory.reset',
    module_add: 'topic.memory.module_add',
    module_rm: 'topic.memory.module_rm',
    edited_mem_pos: 'topic.memory.edited_mem_pos'
  }

  static rmode = {
    on: true, off: false
  }

  static wmode = {
    on: true, off: false
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    return JSON.stringify({
      size: this.size,
      positions: this.positions,
      modules: this.modules,
      moduletypes: this.moduletypes,
      _readmode: this._readmode,
      _readstep: this._readstep,
      _writemode: this._writemode,
      _writestep: this._writestep
    })
  }

  /**
   * @method restore Restore the device
   * @param {*} backup Backup of the device
   */
  restore (backup) {
    const b = JSON.parse(backup)
    this.size = b.size
    this.positions = b.positions
    this.modules = b.modules
    this.moduletypes = b.moduletypes
    this._readmode = b._readmode
    this._readstep = b._readstep
    this._writemode = b._writemode
    this._writestep = b._writestep
  }

  constructor (size, sab, sdb, moduletypes = [4, 8, 16, 32]) {
    super()

    // Size of addressable space
    this.size = size
    // Addressable space
    this.positions = []
    // Modules mapped to the addressable space
    this.modules = []
    // Module types available
    this.moduletypes = moduletypes

    // ES Devices manager. If false it means that there is no ES Manager
    this.io = false

    // Puts memory in read mode
    this._readmode = Memory.rmode.off
    // Counts the steps since readMode was activated
    this._readstep = 0

    // Puts memory in read mode
    this._writemode = Memory.wmode.off
    // Counts the steps since writeMode was activated
    this._writestep = 0

    // Link to system address bus
    this.sab = sab
    // Link to system data bus
    this.sdb = sdb

    // Initialize addresable space
    this.init()
  }

  /**
   * @method setIOManager Set the I/O Manager
   * @param {*} IOManager Link to IOManager
   */
  setIOManager (IOManager) {
    IOManager.linkMemory(this)
    this.io = IOManager
  }

  /**
   * @method isAvailable Checks if memory available
   * @description Checks if a block of a certain size is available, meaning that not a memory module nor a device is mapped in that block
   * @param { int } position first memory position to check
   * @param { int } size number of positions starting from position
   * @returns { boolean } True if space available False if not
   */
  isAvailable (position, size = 1) {
    const memmodules = this.modules.filter((item) => { return (!(position > item[2] || (position < item[0] && position + (size - 1) < item[0]))) }).length === 0
    // const devices = this.iomap.filter((item) => { return (!(position > item[2] || (position < item[0] && position + (size - 1) < item[0]))) }).length === 0
    if (this.io) return memmodules && this.io.checkNoDevices(position, size)
    else return memmodules
  }

  /**
 * @method init Init memory array
 * @description Sets every position to it's default value
 */
  init () {
    this.positions = Array.from({ length: this.size }, (_) => 'XXXX')
    for (let i = 0; i < this.modules.length; i++) {
      for (let j = this.modules[i][0]; j <= this.modules[i][2]; j++) {
        this.positions[j] = 0x0000
      }
    }
    this.readMode = Memory.rmode.off
    this.writeMode = Memory.wmode.off
  }

  /**
 * @method reset Reset memory
 * @description Resets memory to it's default values
 */
  reset () {
    this.init()
    this.broadCast({ topic: Memory.topic.reset })
  }

  /**
   * @method clockPulse Clock pulse
   * @description Clock pulse count. Each read/write operations takes two clock cycles to be executed. Cycles are taken into account only if the flag readMode or writeMode are active
   */
  clockPulse () {
    if (this._readmode) {
      if (this._readstep < 1) this._readstep++
      else this.read()
    }

    if (this._writemode) {
      if (this._writestep < 1) this._writestep++
      else this.write()
    }
  }

  /**
 * Add a memory module
 *
 * Tries to add a module of size @size in the position @address
 *
 * @param { int } address position of addressable space.
 * @param { int } size size in Kb of the module.
 * @throws { Memory.error.module_notvalid } Will throw an exception error when trying to use a no valid module
 * @throws { Memory.error.adress_space } Will throw an exception error when placing the module we would reach max address available
 * @throws { Memory.error.module_size } Will throw an exception error when we try to place the module in an @address not multiple of @size.
 * @throws { Memory.error.module_collision } Will throw an error when we try to place the module over another module.
 */

  /**
   * @method addModule Add a memory module
   * @description Tries to add a module of size @size in the position @address
   * @param { int } address position of addressable space.
   * @param { int } size size in Kb of the module.
   * @throws { Memory.error.module_notvalid } Will throw an exception error when trying to use a no valid module
   * @throws { Memory.error.adress_space } Will throw an exception error when placing the module we would reach max address available
   * @throws { Memory.error.module_size } Will throw an exception error when we try to place the module in an @address not multiple of @size.
   * @throws { Memory.error.module_collision } Will throw an error when we try to place the module over another module.
   * @throws { Memory.error.io_module_present } Will throw an error when we try to place the module over a device.
   */
  addModule (address, size) {
    if (!this.moduletypes.includes(size)) throw new Error(Memory.error.module_notvalid)
    if (address + (size * 1024) > this.size) throw new Error(Memory.error.address_space)
    if (address % (size * 1024) !== 0) throw new Error(Memory.error.module_size)
    // if (this.modules.filter((item) => { return (item[0] >= address && item[0] <= (address + size * 1024) - 1) || (address >= item[0] && address <= item[2]) }).length > 0) { throw new Error(Memory.error.module_collision) }
    if (!this.isAvailable(address, size * 1024)) {
      if (this.io) {
        if (!this.io.checkNoDevices(address, size)) throw new Error(Memory.error.io_module_present)
      }
      throw new Error(Memory.error.module_collision)
    }

    this.modules.push([address, size, (address + size * 1024) - 1])

    for (let i = address; i <= (address + size * 1024) - 1; i++) {
      this.positions[i] = 0x0000
    }

    this.broadCast({ topic: Memory.topic.module_add })
  }

  /**
   * @method removeModule Removes module at provided starting address
   *
   * @param { int } address Position where the module to remove is mapped
   * @throws { Memory.error.module_nomodule } Will throw an error when there is no module to remove
   */
  removeModule (address) {
    const index = this.modules.findIndex((item) => { return item[0] === address })

    if (!(index >= 0)) throw new Error(Memory.error.module_nomodule)

    const addressLimits = [this.modules[index][0], this.modules[index][2]]
    this.modules.splice(index, 1)

    for (let i = addressLimits[0]; i <= addressLimits[1]; i++) {
      this.positions[i] = 'XXXX'
    }

    this.broadCast({ topic: Memory.topic.module_rm })
  }

  /**
 * @method isDevice Check if an address is mapped to a device
 * @param { int } address address to check
 */
  isDevice (address) {
    return this.io.isDevice(address)
  }

  /**
   * @method isMemModule Check for memory module mapped in address
   * @description Whether a memory module object if there is a Device mapped on the provided address or false in any other case
   * @param { int } address memory position to look for a Module
   */
  isMemModule (address) {
    const module = this.modules.filter((item) => { return address >= item[0] && address <= item[2] })
    if (module.length > 0) return module[0]
    return false
  }

  /**
 * @method readMode Gets the actual readMode
 * @returns { boolean } readMode
 */
  get readMode () {
    return this._readmode
  }

  /**
   * @method readMode Sets the readmode to whether on or off
   * @param { boolean } mode readMode
   * @throws { Memory.error.not_supported } when nor on nor off is provided as mode
   */
  set readMode (mode) {
    switch (mode) {
      case Memory.rmode.on:
        this._readmode = mode
        break
      case Memory.rmode.off:
        this._readmode = mode
        this._readstep = 0
        break
      default: {
        throw new Error(Memory.error.mode_notsupported)
      }
    }
  }

  /**
   * @method read Executes a memory reading operation
   * @description Puts in the data bus the value stored in the address position provided by address bus
   */
  read () {
    const address = this.sab.value

    const data = this.getPos(address)
    this.sdb.value = data
    this.readMode = Memory.rmode.off
  }

  /**
   * @method writeMode Gets the actual writeMode
   */
  get writeMode () {
    return this._writemode
  }

  /**
   * @method writeMode Sets the writemode to whether on or off
   * @param { boolean } mode writeMode
   * @throws { Memory.error.not_supported } when nor on nor off is provided as mode
   */
  set writeMode (mode) {
    switch (mode) {
      case Memory.wmode.on:
        this._writemode = mode
        break
      case Memory.wmode.off:
        this._writemode = mode
        this._writestep = 0
        break
      default: throw new Error(Memory.error.mode_notsupported)
    }
  }

  /**
   * @method write Executes a memory writing operation
   * @description Gets the data bus value and stores it in the address position provided by address bus
   */
  write () {
    const address = this.sab.value
    this.setPos(address, this.sdb.value)
    this.writeMode = Memory.wmode.off
  }

  /**
   * Get value stored in a memory position
   * @param { int } address memory position to get the value from
   * @returns the value stored in the memory module or device mapped in the specified address
   * @throws {Memory.error.nomodule_noes} When there is nothing mapped in the specified address
   */
  getPos (address) {
    if (this.isMemModule(address)) return this.positions[address]
    else {
      if (this.io) {
        const device = this.isDevice(address)
        if (device !== false) {
          return device[3].getPos(address - device[0])
        }
      }
    }
    throw new Error(Memory.error.nomodule_noes)
  }

  /**
   * @method peekPos Allows to peek a value in a memory position
   * @description Allows to peek the value stored in a position without triggering a reading operation
   * @param { int } address memory position to get the value from
   * @returns the value stored in the memory module or the literal Memory.literal.IOlabel if a device mapped in the specified address
   */
  peekPos (address) {
    if (this.isMemModule(address)) return this.getPos(address)
    else {
      if (this.io) {
        const device = this.isDevice(address)
        if (device !== false) {
          return Memory.labels.IOlabel
        }
      }
      return Memory.labels.empty
    }
  }

  /**
 * @method setPos Store a value in a memory position
 * @param { int } address Memory position to store the value
 * @param { int } value Value to store
 * @throws { Memory.error.nomodule_noes } When there is no module or device to write to
 */
  setPos (address, value) {
    if (this.isMemModule(address)) {
      this.positions[address] = value

      this.broadCast({ topic: Memory.topic.edited_mem_pos, value: { address, value } })
    } else {
      if (this.io) {
        const device = this.isDevice(address)
        if (device !== false) {
          device[3].setPos(address - device[0], value)
        } else {
          throw new Error(Memory.error.nomodule_noes)
        }
      } else {
        throw new Error(Memory.error.nomodule_noes)
      }
    }
  }

  /**
   * @method getMemModules Get the memory modules
   * @param {*} message Message received
   */
  listen (message) {
    switch (message.topic) {
      case Uc.topic.pulse:
        this.clockPulse()
        break
      case SignalManager.topic.mem_read:
        this.readMode = Memory.rmode.on
        break
      case SignalManager.topic.mem_write:
        this.writeMode = Memory.wmode.on
        break
    }
  }
}

export { Memory }
