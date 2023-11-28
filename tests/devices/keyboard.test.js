
import { beforeEach } from '@jest/globals'
import { Keyboard } from '../../app/control/devices/keyboard.js'
import { Bitop } from '../../app/lib/bits.js'
// import { Lights } from '../app/control/devices/lights.js'
// import { Screen } from '../app/control/devices/screen.js'
// import { baseConvert as bC } from '../app/lib/baseconvert.js'

let fakeSdb = { value: 0x0000 }
let cpuInt = false
const fakeCpu = {
  unSetInt: function () {
    cpuInt = false
  },
  setInt: function () {
    cpuInt = true
  }
}

beforeEach(() => {
  cpuInt = false
  fakeSdb = { value: 0x0000 }
})

test('Test keys pressed are correct', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, false)
  '1234567890'.split('').forEach((k) => {
    // Test each key against its charcode
    keyboard.pushMainKey(k)
    // console.log(k, Bitop.lsb(keyboard.getPos(0), 2), k.charCodeAt(0))
    expect(keyboard.getPos(0) & 0x00FF).toBe(k.charCodeAt(0))

    keyboard.pushNumKey(k)
    expect(keyboard.getPos(0) & 0x00FF).toBe(k.charCodeAt(0))
  })

  'qwertyuiopasdfghjklñzxcvbnm'.split('').forEach((k) => {
    keyboard.pushMainKey(k)
    expect(keyboard.getPos(0) & 0x00FF).toBe(k.charCodeAt(0))
  })
  keyboard.toggleCaps()

  'qwertyuiopasdfghjklñzxcvbnm'.split('').forEach((k) => {
    keyboard.pushMainKey(k)
    expect(keyboard.getPos(0) & 0x00FF).toBe(k.toUpperCase().charCodeAt(0))
  })
})

test('Test the key areas are correct', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true)
  for (let i = 0; i < keyboard.mainkeys.length; i++) {
    // We need to add # and blank space because they are in the mainkeys array (# is the caps key)
    expect('9876543210qwertyuiopasdfghjklñzxcvbnm# '.includes(keyboard.mainkeys[i].value.toLowerCase())).toBe(true)
  }

  for (let i = 0; i < keyboard.numkeys.length; i++) {
    expect('9876543210'.includes(keyboard.mainkeys[i].value.toLowerCase())).toBe(true)
  }
})

test('Test that caps is enabled', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true)
  keyboard.toggleCaps()
  const caps = keyboard.caps
  expect(caps).toBe(true)
})

test('Test that trying to read from empty buffer fails', () => {
  expect.assertions(1)
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true)

  try {
    keyboard.getPos(0)
  } catch (error) {
    expect(error.message).toBe(Keyboard.error.outofbounds)
  }
})
test('test that trying to push a key to a full buffer fails', () => {
  expect.assertions(1)
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, false)
  for (let i = 0; i < 16; i++) {
    keyboard.pushKey('a')
  }

  try {
    keyboard.pushKey('a')
  } catch (ex) {
    expect(ex.message).toBe(Keyboard.error.bufferfull)
  }
})

test('Test that interrupt vector is read ', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true, fakeSdb, fakeCpu)

  keyboard.pushKey('a')
  keyboard.pushKey('b')
  expect(cpuInt).toBe(true)
  keyboard.inta()
  keyboard.clockPulse()
  keyboard.clockPulse()
  expect(fakeSdb.value).toBe(0x0005)
})

test('Clockpulse has no effect in read steps', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true, fakeSdb, fakeCpu)
  keyboard.clockPulse()
  expect(keyboard.readStep).toBe(0)
})

test('Check if there is an interrupt when a key is pressed', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true, fakeSdb, fakeCpu)

  keyboard.pushKey('a')
  expect(keyboard.isInt()).toBe(true)
})

test('Test reading position out of bounds ', () => {
  expect.assertions(1)
  const fakeSdb = { value: 0x0000 }
  const fakeCpu = {
    unsetInt: function () {
      this.unsetInt = true
    }
  }
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true, fakeSdb, fakeCpu)
  try {
    keyboard.getPos(2)
  } catch (ex) {
    expect(ex.message).toBe(Keyboard.error.outofbounds)
  }
})

test('Testing the control register ', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true, fakeSdb, fakeCpu)

  expect(Bitop.isOn(keyboard.getPos(1), 8)).toBe(false)
  keyboard.pushKey('a')
  expect(Bitop.isOn(keyboard.getPos(1), 8)).toBe(true)

  keyboard.setPos(1, 0x0004)
  expect(Bitop.isOn(keyboard.getPos(1), 8)).toBe(false)
  keyboard.pushKey('a')
  keyboard.pushKey('b')
  keyboard.setPos(1, 0x0001)
  expect(Bitop.isOn(keyboard.getPos(1), 8)).toBe(true)
  expect(keyboard.getPos(0)).toBe(0x2362)

  keyboard.pushKey('a')
  keyboard.pushKey('b')
  keyboard.setPos(1, 0x0002)
  expect(Bitop.isOn(keyboard.getPos(1), 8)).toBe(true)
  expect(keyboard.getPos(0)).toBe(0x1461)

  keyboard.pushKey('a')
  keyboard.pushKey('b')
  keyboard.setPos(1, 0x0004)
  expect(Bitop.isOn(keyboard.getPos(1), 8)).toBe(false)
})

test('Test no interrupt effect when int flag false ', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, false)
  keyboard.pushKey('a')
  keyboard.inta()
  expect(keyboard.readMode).toBe(false)
})

test('Test you cannot remove first or last character with empty buffer ', () => {
  expect.assertions(2)
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, false)

  try {
    keyboard.setPos(1, 0x0001)
  } catch (ex) {
    expect(ex.message).toBe(Keyboard.error.outofbounds)
  }

  try {
    keyboard.setPos(1, 0x0002)
  } catch (ex) {
    expect(ex.message).toBe(Keyboard.error.outofbounds)
  }
})

test('Test you cannot remove first or last character with empty buffer ', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, false)

  keyboard.setPos(1, 0x0008)
  expect(keyboard.int).toBe(true)
  keyboard.setPos(1, 0x0008)
  expect(keyboard.int).toBe(false)
})

test('Test you cannot write to another position than 1 ', () => {
  expect.assertions(1)
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, false)
  try {
    keyboard.setPos(0, 0x0008)
  } catch (ex) {
    expect(ex.message).toBe(Keyboard.error.writeonlyec)
  }
})

test('Test getPos with more chars in buffer ', () => {
  const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, false)
  keyboard.pushKey('a')
  keyboard.pushKey('b')
  keyboard.getPos(0)
  expect(Bitop.isOn(keyboard.getPos(1), 8)).toBe(true)
})
