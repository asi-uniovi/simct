import { Alu } from '../app/control/alu.js'
import { Register } from '../app/control/register.js'

describe('Arithmetic an Logic unit', function () {
  test('Test ADD simple operation 2+3, loading operators from broadcasting', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x0003 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0002 })

    alu.operate(Alu.operation.add)
    // Simple operation test
    expect(alu.result.value).toBe(0x0005)
  })

  test('Test ADD operation flags adding two positive to get one negative', () => {
    const alu = new Alu()

    alu.a = 0x7fff
    alu.b = 0x0001
    alu.operate(Alu.operation.add)

    // Simple operation test
    expect(alu.result.value).toBe(0x8000)
    expect(alu.cf).toBe(0x0)
    expect(alu.of).toBe(0x1)
    expect(alu.sf).toBe(0x1)
    expect(alu.zf).toBe(0x0)
  })

  test('Test ADD operation flags adding two negatives to get one positive', () => {
    const alu = new Alu()

    alu.a = 0x8001
    alu.b = 0x8001
    alu.operate(Alu.operation.add)

    // Simple operation test
    expect(alu.result.value).toBe(0x0002)
    expect(alu.cf).toBe(0x1)
    expect(alu.of).toBe(0x1)
    expect(alu.sf).toBe(0x0)
    expect(alu.zf).toBe(0x0)
  })

  test('Test ADD operation flags getting the zero flag', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0xffff })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0001 })

    alu.operate(Alu.operation.add)

    expect(alu.result.value).toBe(0x0000)
    expect(alu.cf).toBe(0x1)
    expect(alu.of).toBe(0x0)
    expect(alu.sf).toBe(0x0)
    expect(alu.zf).toBe(0x1)
  })

  test('Test simple SUB operation 3-2', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x0003 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0002 })

    alu.operate(Alu.operation.sub)

    expect(alu.result.value).toBe(0x0001)
  })
  test('Test SUB operation flags to get a negative 0-1', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x0000 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0001 })

    alu.operate(Alu.operation.sub)

    expect(alu.result.value).toBe(0xFFFF)
    expect(alu.cf).toBe(0x1)
    expect(alu.of).toBe(0x0)
    expect(alu.sf).toBe(0x1)
    expect(alu.zf).toBe(0x0)
  })

  test('Test SUB operation flags one negative and one positive get positive ', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x8000 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0001 })

    alu.operate(Alu.operation.sub)

    expect(alu.result.value).toBe(0x7FFF)
    expect(alu.cf).toBe(0x0)
    expect(alu.of).toBe(0x1)
    expect(alu.sf).toBe(0x0)
    expect(alu.zf).toBe(0x0)
  })

  test('Test SUB operation flags one positive and one negative get negative', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x0001 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x8000 })

    alu.operate(Alu.operation.sub)

    expect(alu.result.value).toBe(0x8001)
    expect(alu.cf).toBe(0x1)
    expect(alu.of).toBe(0x1)
    expect(alu.sf).toBe(0x1)
    expect(alu.zf).toBe(0x0)
  })

  test('Test CMP 0000h - 8000h (flags ZCOS=0111)', () => {
    const alu = new Alu()
    alu.a = 0x0000
    alu.b = 0x8000
    alu.operate(Alu.operation.sub)

    expect(alu.result.value).toBe(0x8000)
    expect(alu.zf).toBe(0)
    expect(alu.cf).toBe(1)
    expect(alu.of).toBe(1)
    expect(alu.sf).toBe(1)
  })

  test('Test CMP 0000h - 8001h (flags ZCOS=0100)', () => {
    const alu = new Alu()
    alu.a = 0x0000
    alu.b = 0x8001
    alu.operate(Alu.operation.sub)

    expect(alu.result.value).toBe(0x7FFF)
    expect(alu.zf).toBe(0)
    expect(alu.cf).toBe(1)
    expect(alu.of).toBe(0)
    expect(alu.sf).toBe(0)
  })

  test('Test CMP 8000h - 0000h (flags ZCOS=0001)', () => {
    const alu = new Alu()
    alu.a = 0x8000
    alu.b = 0x0000
    alu.operate(Alu.operation.sub)

    expect(alu.result.value).toBe(0x8000)
    expect(alu.zf).toBe(0)
    expect(alu.cf).toBe(0)
    expect(alu.of).toBe(0)
    expect(alu.sf).toBe(1)
  })

  test('Test CMP 8001h - 0000h (flags ZCOS=0001)', () => {
    const alu = new Alu()
    alu.a = 0x8001
    alu.b = 0x0000
    alu.operate(Alu.operation.sub)

    expect(alu.result.value).toBe(0x8001)
    expect(alu.zf).toBe(0)
    expect(alu.cf).toBe(0)
    expect(alu.of).toBe(0)
    expect(alu.sf).toBe(1)
  })

  test('Test OR operation', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x0010 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0000 })

    alu.operate(Alu.operation.or)

    expect(alu.result.value).toBe(0x0010)
  })

  test('Test AND operation', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x0010 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0100 })

    alu.operate(Alu.operation.and)

    expect(alu.result.value).toBe(0x0000)
  })

  test('Test XOR operation', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x0110 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0010 })

    alu.operate(Alu.operation.xor)

    expect(alu.result.value).toBe(0x0100)
  })

  test('Test that log works', () => {
    const alu = new Alu()

    alu.listen({ topic: 'TMPE_' + Register.topic.updated, value: 0x0110 })
    alu.listen({ topic: 'IB-bus_' + Register.topic.updated, value: 0x0010 })

    alu.operate(Alu.operation.xor)

    expect(alu.log.OP).toBe('xor')
    expect(alu.log.A).toBe('0110')
    expect(alu.log.B).toBe('0010')
    expect(alu.log.RESULT).toBe('0100')
    expect(alu.log.ZCOS).toBe('0000')
  })
})
