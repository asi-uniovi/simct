import { beforeEach } from '@jest/globals'
import { Lights } from '../../app/control/devices/lights.js'
import { Observer } from '../../app/lib/__mocks__/fakeobserver.js'

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

test('Test that we can only access the 0 position', () => {
  expect.assertions(2)
  const lights = new Lights('Lights 1', 0xF000, 0x0005, 1, true)

  try {
    lights.setPos(1, 0x0101)
  } catch (e) {
    expect(e.message).toBe(Lights.error.outofbounds)
  }

  try {
    lights.getPos(1, 0x0101)
  } catch (e) {
    expect(e.message).toBe(Lights.error.outofbounds)
  }
})

test('Test read/write and observer', () => {
  const lights = new Lights('Lights 1', 0xF000, 0x0005, 1, true)
  const observer = new Observer()
  lights.subscribe(observer)
  lights.setPos(0, 0x0101)
  expect(lights.lights).toBe(0x0101)
  expect(observer.lastMessage.topic).toBe(Lights.topics.update + 'Lights 1')

  lights.switchOn(0)
  lights.switchOn(1)
  lights.switchOn(2)
  lights.switchOn(15)
  expect(lights.getPos(0)).toBe(0x8007)
  lights.switchOff(1)
  expect(lights.getPos(0)).toBe(0x8005)
})

test('Test that interrupt vector is read ', () => {
  const lights = new Lights('Lights 1', 0xF000, 0x0008, 1, true, fakeSdb, fakeCpu)

  lights.setInt()
  expect(lights.isInt()).toBe(true)
  expect(cpuInt).toBe(true)
  lights.inta()
  lights.clockPulse()
  lights.clockPulse()
  expect(fakeSdb.value).toBe(0x0008)
})
