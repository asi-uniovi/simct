import { Computer } from '../app/control/computer.js'
import { Uc } from '../app/control/uc.js'
import { jest } from '@jest/globals'

describe('Micro programmed unit', function () {
  test('Test Conditional jumps ', () => {
    const computer = new Computer()
    const uc = computer.cpu.uc

    computer.cpu.sr.value = 0b10010
    expect(uc.condIsTrue(0b000)).toBe(false)
    expect(uc.condIsTrue(0b001)).toBe(true)
    expect(uc.condIsTrue(0b100)).toBe(true)
    expect(uc.condIsTrue(0b101)).toBe(false)
    expect(uc.condIsTrue(0b010)).toBe(false)
    expect(uc.condIsTrue(0b011)).toBe(true)
    expect(uc.condIsTrue(0b110)).toBe(true)
    expect(uc.condIsTrue(0b111)).toBe(false)

    computer.cpu.sr.value = 0b01100
    expect(uc.condIsTrue(0b000)).toBe(true)
    expect(uc.condIsTrue(0b001)).toBe(false)
    expect(uc.condIsTrue(0b100)).toBe(false)
    expect(uc.condIsTrue(0b101)).toBe(true)
    expect(uc.condIsTrue(0b010)).toBe(true)
    expect(uc.condIsTrue(0b011)).toBe(false)
    expect(uc.condIsTrue(0b110)).toBe(false)
    expect(uc.condIsTrue(0b111)).toBe(true)
    expect(uc.condIsTrue(465465)).toBe(false)
  })

  test('Run instruction mode', () => {
    const computer = new Computer()
    const uc = computer.cpu.uc

    uc.runInstruction()
    expect(uc.mode).toBe(Uc.mode.normal.instruction)
  })

  test('Interrupt management ', () => {
    // Covered by programs test
  })

  test('Execution modes ', () => {
    const computer = new Computer()
    const uc = computer.cpu.uc
    uc.debugMode = true
    console.log = jest.fn()
    computer.cpu.ir.value = 0b0000000000000000
    uc.runInstruction()
    uc.runStep()
    uc.runStep()
    uc.runStep()
    uc.runStep()
    expect(uc.mode).toBe(Uc.mode.normal.instruction)
  })

  test('Execution modes 2', () => {
    const computer = new Computer()
    const uc = computer.cpu.uc

    computer.cpu.ir.value = 0b1111000000000000
    uc.mode = 25
    uc.runStep()
    expect(uc.mode).toBe(25)
  })

  test('Execution Jump testing', () => {
    const computer = new Computer()
    const uc = computer.cpu.uc

    computer.cpu.sr.value = 0b01000
    uc.runStep()
    uc.runStep()
    computer.cpu.mdr.value = 0b1111000000000000
    uc.runStep()

    computer.reset()
    computer.cpu.sr.value = 0b00000
    uc.runStep()
    uc.runStep()
    computer.cpu.mdr.value = 0b1111000000000000
    uc.runStep()
  })
})
