import { Computer } from '../app/control/computer.js'

import { Keyboard } from '../app/control/devices/keyboard.js'
import { Screen } from '../app/control/devices/screen.js'
import { Lights } from '../app/control/devices/lights.js'
import { Bitop } from '../app/lib/bits.js'

import { jest } from '@jest/globals'

jest.useFakeTimers()
jest.spyOn(global, 'setInterval')

// Suma 2+3 ejemplos/suma2+3.eje
const basicprogram1 = ['0100', '0101', '0110', '0014', '2102', '2900', '2203', '2A00', '4028']
const intprogram1 = ['1000', '1001', '1078', 'F100', '2105', '2900', '2221', '2A10', '1940', '2106', '2900', '220D', '2A10', '1940', 'A800', 'C0FF', '3400', '3500', '3600', '2400', '2CF2', '1580', '1CA0', '2400', '2CF1', '2678', '2E00', '4498', '2603', '2E00', '5DB8', '1CA0', '3E00', '3D00', '3C00', 'B800', '3000', '3100', '3200', '3300', '2000', '28F0', '2101', '29F0', '2200', '2A01', '1300', '3300', 'D009', '8F00', '1320', '5B68', 'F5F9', '3B00', '3A00', '3900', '3800', 'B800', '3600', '0EE0', '3000', '3100', '3200', '3300', '3400', '3500', '8E00', '8E00', '10C0', '2100', '2910', '2300', '2BF2', '2400', '2C07', '2800', '1560', '5DB0', '5014', '1220', '1A00', '8A00', '1940', '3D00', '3C00', '3B00', '3A00', '3900', '3800', '3E00', 'E000']
describe('Basic', () => {
  test('Test That we can Add 2 and 3', async () => {
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)
    await computer.loadProgram(basicprogram1)
    computer.startClock()
    jest.advanceTimersByTime(100)
    computer.stopClock()
    expect(computer.cpu.reg[0].value).toBe(5)
  })
})

describe('Interrupts', () => {
  test('Test Interrupts with 3 devices', async () => {
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)

    const keyboard = new Keyboard('keyboard 1', 0xF000, 0x0005, 1, true, computer.sdb, computer.cpu)
    const pantalla = new Screen('Pantalla 1', 0xF100)
    const lights = new Lights('Lights 1', 0xF200, 0x0006, 2, true, computer.sdb, computer.cpu)

    computer.io.addDevice(keyboard)
    computer.io.addDevice(pantalla)
    computer.io.addDevice(lights)

    await computer.loadProgram(intprogram1)

    keyboard.pushMainKey('z')
    keyboard.pushMainKey('a')

    lights.setPos(0, 0b0000_0101_0000_0000)

    computer.startClock()
    jest.advanceTimersByTime(500)

    expect(pantalla.getPos(0)).toBe(0x007a)
    expect(pantalla.getPos(1)).toBe(0x0061)

    expect(lights.getPos(0)).toBe(0)
    expect(lights.lights).toBe(0b0000_0101_0000_0000)

    lights.switchOn(8)
    expect(Bitop.isOn(lights.getPos(0), 8)).toBe(true)

    keyboard.pushMainKey('a')

    jest.advanceTimersByTime(250)
    computer.stopClock()
    expect(pantalla.getPos(2)).toBe(0x0161)
  })
})
