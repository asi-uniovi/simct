'use strict'
/**
 * @module devices/keyboard
 */
import { Queue } from '../../lib/queue.js'
import { InputDevice } from './input.js'

import { baseConvert as bC } from '../../lib/baseconvert.js'
import { Bitop } from '../../lib/bits.js'

/**
 * @class KeyBuffer
 * @extends Queue
 * @property {number} size Size of the buffer
 * @property {number} length Length of the buffer
 * @property {Array} buffer Array that contains the buffer
 * @property {Object} error Error messages
 * */
class KeyBuffer extends Queue {
  static error = {
    bufferfull: 'error.keyboard.buffer-full',
    outofbounds: 'error.keyboard.out-of-bounds'
  }

  /**
   * @method init Gets the buffer initialized with the given array
   * @param {*} arr Array to initialize the buffer
   */
  init (arr) {
    this.clear()
    arr.forEach((element) => {
      this.enqueue(element)
    })
  }

  constructor (size) {
    super()
    this.size = size
  }

  /**
   * @method enqueue Enqueues an element in the buffer
   * @param {*} element
   */
  enqueue (element) {
    if (this.length < this.size) {
      super.enqueue(element)
    } else throw new Error(KeyBuffer.error.bufferfull)
  }

  /**
   * @method dequeue Dequeues an element from the buffer
   * @returns {*} Dequeues an element from the buffer and returns it
   */
  dequeue () {
    if (this.length > 0) {
      return super.dequeue()
    } else throw new Error(KeyBuffer.error.outofbounds)
  }

  /**
   * @method removeFirst Removes the first element from the buffer
   * @throws {KeyBuffer.error.outofbounds} If the buffer is empty
   */
  removeFirst () {
    if (this.length > 0) {
      super.dequeue()
    } else throw new Error(KeyBuffer.error.outofbounds)
  }

  /**
   * @method removeLast Removes the last element from the buffer
   * @throws {KeyBuffer.error.outofbounds} If the buffer is empty
   * */
  removeLast () {
    if (this.length > 0) {
      super.removeTail()
    } else throw new Error(KeyBuffer.error.outofbounds)
  }

  /**
   * @method clear Clears the buffer
   */
  clear () {
    super.clear()
  }
}

/**
 * @class Key
 * @property {string} value Value of the key
 * @property {string} _scan Scan code of the key
 * @property {boolean} _caps Indicates if the caps key is active or not
 */
class Key {
  constructor (keyvalue, scan) {
    this._caps = false
    this.value = keyvalue
    this._scan = scan
  }

  /**
     * @param {boolean} capsvalue
     */
  set caps (capsvalue) {
    this._caps = capsvalue
  }

  /**
   * @returns {boolean} Indicates if the caps key is active or not
   */
  get caps () {
    return this._caps
  }

  /**
   * @returns {string} Returns the code of the key
   */
  get code () {
    return (this.scan + '' + this.hex).toUpperCase()
  }

  /**
   * @returns {string} Returns the scan code of the key
   */
  get scan () {
    return bC.dec2hex(this._scan, 2).toUpperCase()
  }

  /**
   * @returns {string} Returns the hex code of the key
   */
  get hex () {
    if (this.caps) return this.value.charCodeAt(0).toString(16)
    else return this.value.toLowerCase().charCodeAt(0).toString(16)
  }
}

/**
 * @class Keyboard
 * @extends InputDevice
 * @property {KeyBuffer} buffer Buffer of the keyboard
 * @property {boolean} _caps Indicates if the caps key is active or not
 * @property {Array} keys Array that contains the keys of the keyboard
 * @property {number} scanCounter Counter of the scan code
 * @property {Array} registers Array that contains the registers of the keyboard
 * @property {number} baseaddress Base address of the keyboard
 * @property {number} priority Priority of the keyboard
 * @property {number} vector Interrupt vector of the keyboard
 * @property {boolean} int Indicates if the keyboard generates interrupts
 */
class Keyboard extends InputDevice {
  static error = {
    bufferfull: KeyBuffer.error.bufferfull,
    outofbounds: KeyBuffer.error.outofbounds,
    writeonlyec: 'error.keyboard.write-only-ec'
  }

  static topics = {
    update: 'keyboard-update-'
  }

  static keyarea = {
    main: 0,
    num: 1
  }

  /**
   * @method restore Restores the keyboard
   * @param {*} backup Contains the backup of the keyboard
   */
  restore (backup) {
    this.name = backup.name
    this.registers = backup.registers
    this.buffer.init(backup.buffer)
    this._caps = backup.caps
    this.baseaddress = backup.address
    this.priority = backup.priority
    this.vector = backup.vector
    this.int = backup.int
    this.broadCast({ topic: Keyboard.topics.update + this.name })
  }

  /**
 * @method backup Returns the backup of the keyboard
 * @returns {*} Returns the backup of the keyboard
 */
  backup () {
    return {
      type: 'keyboard',
      name: this.name,
      registers: this.registers,
      buffer: this.buffer.asArray(),
      caps: this._caps,
      address: this.baseaddress,
      priority: this.priority,
      vector: this.vector,
      int: this.int
    }
  }

  constructor (name, baseaddress, vector, priority, int, sdb, cpu) {
    super(name, baseaddress, 2, vector, priority, int, sdb, cpu)

    this.buffer = new KeyBuffer(16)

    this.scanCounter = 0

    // 0 position is data register, 1 position ecresiter
    this.registers = [0x0, 0x0]

    this._caps = false

    this.keys = {}
    this.keys[Keyboard.keyarea.main] = []
    this.keys[Keyboard.keyarea.num] = []

    // let counter=0;
    '1234567890QWERTYUIOPASDFGHJKLÑ#ZXCVBNM'.split('').forEach((k) => {
      this.keys[Keyboard.keyarea.main].push(new Key(k, this.scanCounter++))
    })

    // We nead this leap of 2 to match the old simulator codes
    this.scanCounter = this.scanCounter + 2

    '7894560123'.split('').forEach((k) => {
      this.keys[Keyboard.keyarea.num].push(new Key(k, this.scanCounter++))
    })

    this.keys[Keyboard.keyarea.main].push(new Key(' ', this.scanCounter++))
  }

  /**
   * @returns {number} Returns the value of the control register
   */
  get ecregister () {
    return this.registers[1]
  }

  /**
 * @param {number} value Value to set in the control register
 */
  set ecregister (value) {
    this.registers[1] = value
  }

  /**
   * @returns {number} Returns the value of the data register
   * */
  get dataregister () {
    return this.registers[0]
  }

  /**
   * @param {number} value Value to set in the data register
   */
  set dataregister (value) {
    this.registers[0] = value
  }

  /**
   * @method pushKey Pushes a key into the buffer
   * @param {*} inputkey pushed key
   * @param {*} keyarea area of the key
   */
  pushKey (inputkey, keyarea = Keyboard.keyarea.main) {
    const key = this.keys[keyarea].filter(key => key.value === inputkey.toUpperCase())[0]
    key.caps = this.caps

    try {
      this.buffer.enqueue({ value: this.caps ? inputkey.toUpperCase() : inputkey.toLowerCase(), code: key.code, scan: key.scan, hex: key.hex })
      this.ecregister = this.ecregister | 0x0100

      // in case that Interrupts are enabled we have to report to the CPU de int signal
      if (this.int) {
        this.cpu.setInt()
        this.activeInt = true
      }
    } catch (ex) {
      throw new Error(ex.message)
    }
  }

  // resetReadMode () {
  //   super.resetReadMode()
  //   if (this.buffer.length > 0) this.readMode = false
  // }

  /**
   * @method reset Resets the keyboard
   */
  reset () {
    this.buffer.clear()
    this.registers = [0x0, 0x0]
    this.reportUpdate()
  }

  /**
   * @method pushNumKey Pushes a key into the numeric area of the keyboard
   * @param {*} inputkey
   */
  pushNumKey (inputkey) {
    this.pushKey(inputkey, Keyboard.keyarea.num)
  }

  /**
   * @method pushNumKey Pushes a key into the main area of the keyboard
   * @param {*} inputkey
   */
  pushMainKey (inputkey) {
    this.pushKey(inputkey, Keyboard.keyarea.main)
  }

  /**
   * @method toggleCaps Toggles the caps key
   */
  toggleCaps () {
    this._caps = !this._caps
  }

  /**
   * @method mainkeys Get the main keys of the keyboard
   */
  get mainkeys () {
    return this.keys[Keyboard.keyarea.main]
  }

  /**
   * @method numkeys Get the numeric keys of the keyboard
   */
  get numkeys () {
    return this.keys[Keyboard.keyarea.num]
  }

  /**
   * @param {boolean} caps True if the caps key is active, false otherwise
   */
  get caps () {
    return this._caps
  }

  /**
   * @method getPos Gets the value of the given position
   * @param {number} position
   * @throws {Keyboard.error.outofbounds} If we are trying to read when the buffer is empty
   */
  getPos (position) {
    if (position > 1) throw new Error(Keyboard.error.outofbounds)
    try {
      if (position === 0) {
        this.dataregister = bC.hex2dec(this.buffer.dequeue().code)

        // this.dataregister = this.dataregister & 0x00FF
        if (this.buffer.length === 0) this.ecregister = this.ecregister & 0x1011

        this.reportUpdate()
      }
      return this.registers[position]
    } catch (ex) {
      throw new Error(ex.message)
    }
  }

  /**
   * @method setPos Sets the value of the given position
   * @param {*} position position where to set the value
   * @param {*} value value to set
   */
  setPos (position, value) {
    if (position !== 1) { throw new Error(Keyboard.error.writeonlyec) }
    value = value & 0x000F
    this.ecregister = this.ecregister & 0xFFF0
    this.ecregister = this.ecregister | value

    if (Bitop.isOn(this.ecregister, 0)) { this.buffer.removeFirst() }
    if (Bitop.isOn(this.ecregister, 1)) { this.buffer.removeLast() }
    if (Bitop.isOn(this.ecregister, 2)) this.buffer.clear()
    if (Bitop.isOn(this.ecregister, 3)) this.int = !this.int
    else this.int = false

    if (this.buffer.length === 0) this.ecregister = this.ecregister & 0x1011
    this.reportUpdate()
  }

  /**
   * @method isInt Checks if the keyboard is in interrupt mode
   * @returns {boolean} Returns true if the keyboard is in interrupt mode, false otherwise
   */
  isInt () {
    return this.activeInt
  }

  /**
   * @method reportUpdate Reports the update of the keyboard
   */
  reportUpdate () {
    this.broadCast({ topic: Keyboard.topics.update + this.name })
  }
}

export { Keyboard }
