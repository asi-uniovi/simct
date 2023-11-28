'use strict'
/**
 * @module control/io
 */
import { Observer } from '../lib/observer.js'
import { Memory } from './memory.js'
import { Clock } from './clock.js'

/**
 * @class IOManager
 * @extends Observer
 * @property {Array} devices Array of devices available
 * @property {Memory} mem Link to memory manager
 * @property {Object} error Errors used by the device
*/
class IOManager extends Observer {
  static error = {
    memorylink_missing: 'error.IOManager.memorylink_missing',
    io_vectors: 'error.IOManager.io_vectors',
    duplicate_name: 'error.IOManager.duplicate_name'
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    const backup = {
      devices: this.devices.map((device) => {
        return device[3].backup()
      })
    }
    return backup
  }

  constructor () {
    super()
    // Array of devices available
    this.devices = []
    // Link to memory manager
    this.mem = false
    this.reset()
  }

  /**
   * Sets a link with memoryManager
   * @param {Memory} memory
   */
  linkMemory (memory) {
    this.mem = memory
  }

  /**
 * @method reset reset all devices
 */
  reset () {
    // this.devices = []
    this.devices.forEach((device) => { device[3].reset() })
  }

  /**
 * @method clockPulse clock pulse for all devices
 */
  clockPulse () {
    const devicesInInt = this.getIntDevices()

    for (const device of devicesInInt) {
      device[3].clockPulse()
    }
  }

  /**
   * @method getIntDevices Get devices with active Interrupt
   *
   * @returns {Array} Array of devices with active interrupt
   */
  getIntDevices () {
    const devicesInInt = this.devices.filter((item) => {
      if (item[3].int) return item[3].isInt()
      else return false
    })
    return devicesInInt
  }

  /**
   * @method checkNoDevices Check for collision
   * @param {int} address address to verify
   * @param {int} size positions from address to verify
   * @returns {Boolean} true if there is no collision with another device with a block starting in @address with @size size
   */
  checkNoDevices (address, size) {
    const devices = this.devices.filter((item) => { return (!(address > item[2] || (address < item[0] && address + (size - 1) < item[0]))) }).length === 0
    return devices
  }

  /**
 * @method getNextInt Get the next device with active interrupt
 * @returns {Device} Device with active interrupt with de highest priority
 */
  getNextInt () {
    const devicesInInt = this.getIntDevices()
    const min = devicesInInt.reduce((m, current) => { return current[3].priority < m.priority ? current[3] : m }, devicesInInt[0][3])
    return min
  }

  /**
   * @method isDevice Check if an address is mapped to a device
   *
   * @param {int} address address to check
   * @returns {Array|boolean} An array with the structure [initialAddress,size,lastAddres,Device]
   */
  isDevice (address) {
    const device = this.devices.filter((item) => { return address >= item[0] && address <= item[2] })
    if (device.length > 0) return device[0]
    return false
  }

  /**
   * @method addDevice Adds a device to the device collection
   * @param {Device} device Device to add
   * @throws {IOManager.error.duplicate_name} If there is a device with the same name
   * @throws {IOManager.error.memorylink_missing} if there is no link with the memory manager
   * @throws {IOManager.error.io_vectors} If the address to map the device is below 256, space reserved for interrupt vector table
   * @throws {Memory.error.io_module_present} If the address to map the device has a memory module present
   */
  addDevice (device) {
    if (this.devices.filter(element => element[3].name === device.name).length > 0) throw new Error(IOManager.error.duplicate_name)
    if (this.mem === false) throw new Error(IOManager.error.memorylink_missing)
    if (device.baseaddress <= 256) throw new Error(IOManager.error.io_vectors)
    if (this.mem.isAvailable(device.baseaddress, device.memsize)) {
      this.devices.push([device.baseaddress, device.memsize, (device.baseaddress + device.memsize) - 1, device])
    } else {
      if (this.isDevice(device.baseaddress)) throw new Error(Memory.error.io_module_present)
      throw new Error(Memory.error.module_collision)
    }
  }

  /**
   * @method removeDevice Removes a device from the device collection
   * @param {Device} device Device to remove
   */
  removeDevice (device) {
    const index = this.devices.findIndex((item) => { return item[0] === device.baseaddress })
    this.devices.splice(index, 1)
  }

  /**
   * @method listen Listen to possible notifications
   * @param {*} message Message received
   */
  listen (message) {
    switch (message.topic) {
      case Clock.topic.pulse: {
        this.clockPulse()
      }
    }
  }
}

export { IOManager }
