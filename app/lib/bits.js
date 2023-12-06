class Bitop {
  static isOn (value, bit) {
    return (((value >> bit) % 2) !== 0)
  }

  static on (value, bit) {
    const mask = 1 << bit
    return value | mask
  }

  static off (value, bit) {
    const mask = 1 << bit
    return value & ~mask
  }

  static set (value, bit, state) {
    switch (state) {
      case 1: return Bitop.on(value, bit)
      case 0: return Bitop.off(value, bit)
    }
  }

  static lsb (value, bits) {
    return value & ((1 << bits) - 1)
  }

  static hsb (value, bits, size = 16) {
    return value >> (size - bits)
  }

  static toggle (value, bit) {
    return Bitop.isOn(value, bit) ? Bitop.off(value, bit) : Bitop.on(value, bit)
  }

  static msb (value, bitpos, bits, size = 16) {
    const valuetmp = value >> ((bitpos + 1) - bits)
    return Bitop.lsb(valuetmp, bits)
  }

  static two (num, size = 16) {
    if (Bitop.isOn(num, size - 1)) {
      return ((~num + 0b1 >>> 0) & ((1 << size) - 1)) * -1
    } else return num
  }
}

export { Bitop }
