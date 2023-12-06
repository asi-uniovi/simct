import { Observer } from '../../app/lib/observer'

describe('Test queue', function () {
  test('Test implemented method', () => {
    expect.assertions(1)
    const obs = new Observer()
    try {
      obs.listen('topic')
    } catch (e) {
      expect(e.message).toBe('Implement listen() in Observer')
    }
  })
})
