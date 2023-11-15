import { Computer } from '../app/control/computer.js'
import { jest } from '@jest/globals'

jest.useFakeTimers()
jest.spyOn(global, 'setInterval')

// Suma 2+3 ejemplos/suma2+3.eje
const basicprogram1 = ['0100', '0101', '0110', '0014', '2102', '2900', '2203', '2A00', '4028']

const basicprogramHex = [
    '050A', // Origin
    '050C', // Initial PC
    '050F', // Initial R7,
    '1A1A', // Dummy data in 050A
    'C0FE', // Dummy data IN 050B
    '2102', // MOVL R1, 02h
]

describe('Computer', function () {
  test('Test clock from Computer', async () => {
    const computer = new Computer()
    computer.startClock()
    jest.advanceTimersByTime(1)
    computer.stopClock()
    expect(computer.clock.pulses).toBe(1)
  })

  test('Running only one step ', async () => {
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)
    await computer.loadProgram(basicprogram1)
    computer.runStep()
    jest.advanceTimersByTime(1)
    expect(computer.cpu.uc.step).toBe(1)
    computer.runStep()
    jest.advanceTimersByTime(1)
    computer.runStep()
    jest.advanceTimersByTime(1)
    expect(computer.cpu.uc.step).toBe(3)
    expect(computer.cpu.ir.value).toBe(0x2102)
  })

  test('Running only one instruction ', async () => {
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)
    await computer.loadProgram(basicprogram1)
    computer.runInstruction()
    jest.advanceTimersByTime(100)

    expect(computer.cpu.ir.value).toBe(0x2102)
  })

  test('Auto/Manual mode', async () => {
    const computer = new Computer()

    computer.normalMode()
    expect(computer.cpu.uc.mode).toBe(Computer.mode.normal)

    computer.manualMode()
    expect(computer.cpu.uc.mode).toBe(Computer.mode.manual)
  })

  test('Manual mode execute Signals', async () => {
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)

    computer.normalMode()
    expect(computer.cpu.uc.mode).toBe(Computer.mode.normal)

    computer.manualMode()
    expect(computer.cpu.uc.mode).toBe(Computer.mode.manual)
    computer.cpu.reg[0].value = 0x0001
    computer.loadSignals(['r0-ib', 'ib-r1'])
    computer.cpu.uc.runStep()
    expect(computer.cpu.reg[1].value).toBe(0x0001)
  })

  test('Error loading signals in normal mode', async () => {
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)

    computer.normalMode()
    expect(computer.cpu.uc.mode).toBe(Computer.mode.normal)

    try {
      computer.loadSignals(['r0-ib', 'ib-r1'])
    } catch (e) {
      expect(e.message).toBe(Computer.error.loading_signals_nomanual)
    }
  })

  test('Running in auto mode sum 2+3', async () => {
    const computer = new Computer()
    computer.debugMode = true
    console.log = jest.fn()
    computer.mem.addModule(0x0000, 32)
    await computer.loadProgram(basicprogram1)
    computer.run()
    jest.advanceTimersByTime(50)
    computer.stop()
    expect(computer.cpu.reg[0].value).toBe(5)
  })

  test('Error loading a program', async () => {
    const computer = new Computer()
    try {
      await computer.loadProgram(basicprogram1)
    } catch (error) {
      expect(error.message).toBe(Computer.error.loading_program)
    }
  })

  test('Error loading memory', () => {
    expect.assertions(2)
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)
    computer.loadMemory(basicprogram1, 0x0000)
    expect(computer.mem.getPos(0x0002)).toBe(0x0110)
    computer.mem.removeModule(0x0000)
    try {
      computer.loadMemory(basicprogram1, '0000')
    } catch (error) {
      expect(error.message).toBe(Computer.error.loading_memory)
    }
  })

  test('Test That we can load a Program', async () => {
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)
    await computer.loadProgram(basicprogram1)
    expect(computer.cpu.pc.value).toBe(0x0101)
    expect(computer.cpu.reg[7].value).toBe(0x0110)
    expect(computer.mem.getPos(0x0100)).toBe(0x0014)
  })

  test('Test that we can load a program with hexadecimal values in the origin and PC', async () => {
    const computer = new Computer()
    computer.mem.addModule(0x0000, 32)
    await computer.loadProgram(basicprogramHex)
    expect(computer.cpu.pc.value).toBe(0x050C)
    expect(computer.cpu.reg[7].value).toBe(0x050F)
    expect(computer.mem.getPos(0x050C)).toBe(0x2102)
  })
})
