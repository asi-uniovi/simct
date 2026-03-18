import { jest } from '@jest/globals'
import { Screen } from '../../app/control/devices/screen.js'
import { Observer } from '../../app/lib/__mocks__/fakeobserver.js'

test('Get screen matrix, check console.table...', () => {
  const pantalla = new Screen('Pantalla 1', 0xF000)
  pantalla.setPos(0, 0x0061)
  console.table = jest.fn()
  pantalla.matrix()
  const table = console.table.mock.calls[0][0]
  expect(table[0][0]).toBe('0061h')
})

test('Turn the screen on/off', () => {
  const pantalla = new Screen('Pantalla 1', 0xF000)
  pantalla.powerOn()
  expect(pantalla.isOn()).toBe(true)
  pantalla.powerOff()
  expect(pantalla.isOn()).toBe(false)

  pantalla.setPos()
})

test('Write to the screen', () => {
  const pantalla = new Screen('Pantalla 1', 0xF000)
  pantalla.powerOn()
  'qwertyuiopasdfghjklñzxcvbnm012456789'.split('').forEach((k) => {
    const tmpchar = k.charCodeAt(0) & 0x00FF
    const tmpcharCaps = k.toUpperCase().charCodeAt(0) & 0x00FF
    for (let colorfg = 0; colorfg < Screen.colors.length; ++colorfg) {
      for (let colorbg = 0; colorbg < Screen.colors.length; ++colorbg) {
        const char = ((colorfg << 8) | (colorbg << 11)) | tmpchar
        pantalla.setPos(0, char)
        const charinfo = pantalla.getPosInfo(0)
        expect(char).toBe(pantalla.getPos(0))
        expect(charinfo.char).toBe(k.charCodeAt(0) & 0x00FF)
        expect(charinfo.fg).toBe(colorfg)
        expect(charinfo.bg).toBe(colorbg)

        const charCaps = ((colorfg << 8) | (colorbg << 11)) | tmpcharCaps
        pantalla.setPos(0, charCaps)
        const charCapsinfo = pantalla.getPosInfo(0)
        expect(charCaps).toBe(pantalla.getPos(0))
        expect(charCapsinfo.char).toBe(k.toUpperCase().charCodeAt(0) & 0x00FF)
        expect(charCapsinfo.fg).toBe(colorfg)
        expect(charCapsinfo.bg).toBe(colorbg)
      }
    }
  })
})

test('Test powered off no characters', () => {
  const pantalla = new Screen('Pantalla 1', 0xF000)
  pantalla.powerOn()
  const chars = 'qwerty'
  let i = 0
  chars.split('').forEach((k) => {
    const tmpchar = k.charCodeAt(0) & 0x00FF
    pantalla.setPos(i++, tmpchar)
  })
  pantalla.powerOff()
  expect(pantalla.positions.length).toBe(0)
  pantalla.powerOn()
  expect(pantalla.positions.length).toBe(chars.length)
  pantalla.setPos(120, 0x0001)
  expect(pantalla.isOn()).toBe(true)
  expect(pantalla.positions.length).toBe(0)
})

describe('Control register bit 0 (clear) and bit 1 (power off)', () => {
  const writeChars = (pantalla, chars) => {
    chars.split('').forEach((k, i) => {
      pantalla.setPos(i, k.charCodeAt(0) & 0x00FF)
    })
  }

  test('0x0000 - screen stays on, no clear', () => {
    const pantalla = new Screen('Pantalla 1', 0xF000)
    writeChars(pantalla, 'abc')
    pantalla.setPos(120, 0x0000)
    expect(pantalla.isOn()).toBe(true)
    expect(pantalla.positions.length).toBe(3)
  })

  test('0x0001 - screen stays on, clears content', () => {
    const pantalla = new Screen('Pantalla 1', 0xF000)
    writeChars(pantalla, 'abc')
    pantalla.setPos(120, 0x0001)
    expect(pantalla.isOn()).toBe(true)
    expect(pantalla.positions.length).toBe(0)
  })

  test('0x0002 - screen turns off, content preserved', () => {
    const pantalla = new Screen('Pantalla 1', 0xF000)
    writeChars(pantalla, 'abc')
    pantalla.setPos(120, 0x0002)
    expect(pantalla.isOn()).toBe(false)
    pantalla.setPos(120, 0x0000)
    expect(pantalla.isOn()).toBe(true)
    expect(pantalla.positions.length).toBe(3)
  })

  test('0x0003 - screen turns off, clears content', () => {
    const pantalla = new Screen('Pantalla 1', 0xF000)
    writeChars(pantalla, 'abc')
    pantalla.setPos(120, 0x0003)
    expect(pantalla.isOn()).toBe(false)
    expect(pantalla._positions.length).toBe(0)
  })

})

test('Test update notifications', () => {
  const pantalla = new Screen('Pantalla 1', 0xF000)
  const observer = new Observer()
  pantalla.subscribe(observer)
  pantalla.powerOn()
  const chars = 'qwerty'
  let i = 0
  chars.split('').forEach((k) => {
    const tmpchar = k.charCodeAt(0) & 0x00FF
    pantalla.setPos(i++, tmpchar)
    expect(observer.lastMessage.topic).toBe('updatedScreenPantalla 1')
  })

  observer.clear()
  pantalla.powerOff()
  expect(observer.lastMessage.topic).toBe('updatedScreenPantalla 1')
  expect(observer.messages.length).toBe(1)
})
