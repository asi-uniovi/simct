const version = 'v1.0.3'

/**
 * @module view/gridmanager
 */

/**
 * @class GridManager
 * @property {Number} gridSize Grid size
 */
class GridManager {
  constructor (gridSize) {
    this.gridSize = gridSize
  }

  set gridSize (size) {
    this._gridSize = size
  }

  get gridSize () {
    return this._gridSize
  }

  /**
   * @method gridTopx Convert grid units to pixels
   * @param {*} value Value to convert
   * @returns {Number} Converted value in pixels
   */
  gridTopx (value) {
    return value * this.gridSize
  }

  /**
   * @method pxTogrid Convert pixels to grid units
   * @param {*} value Value to convert
   * @returns {Number} Converted value in grid units
   */
  pxTogrid (value) {
    return value / this.gridSize
  }

  /**
   * @method gridtowh Convert grid units to width and height
   * @param {*} nw width in grid units
   * @param {*} nh height in grid units
   * @returns {Object} Object with width and height in pixels
   */
  gridtowh (nw, nh) {
    return [this.gridTopx(nw), this.gridTopx(nh)]
  }

  /**
   * @method gridtoxy Convert grid units to x and y
   * @param {*} nx x in grid units
   * @param {*} ny y in grid units
   * @returns {Object} Object with x and y in pixels
   */
  gridtoxy (nx, ny) {
    return [this.gridTopx(nx), this.gridTopx(ny)]
  }
}

const Unit = {
  px: 'px',
  grid: 'grid'
}

const gridSize = {
  default: 8
}

function measureSVGText (value, fontSize, op) {
  const defaults = { fontFamily: 'Arial' }; const options = { ...defaults, ...op }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')

  text.textContent = value

  svg.appendChild(text)
  document.body.appendChild(svg)

  text.style.fontSize = fontSize
  text.style.fontFamily = options.fontFamily

  const measures = text.getBBox()

  measures.heightAdjust = (measures.height + measures.y)

  text.remove()
  svg.remove()

  return measures
}

const gr = new GridManager(gridSize.default)

const listen = {
  /**
     * Reacts to a topic and message
     *
     * @param { String } topic   String that identifies the message nature
     * @param { * } message Variable that contains the information needed, if any
     */
  listen (topic, message = null) {
    throw new Error('Implement listen() in ' + this.constructor.name)
  }
}

class Observable {
  static transmit_mode = {
    on: true,
    off: false
  }

  backup () {
    return {
      subscribers: this.subscribers,
      _transmit: this._transmit
    }
  }

  restore (backup) {
    this.subscribers = backup.subscribers
    this._transmit = backup._transmit
  }

  constructor () {
    this.subscribers = []
    this._transmit = true
  }

  get transmit () {
    return this._transmit
  }

  set transmit (mode) {
    this._transmit = mode
  }

  /**
   * Adds an element to the observers array
   *
   * @param {Observer} o Object that needs to be notified about updates
   */
  subscribe (o, priority = 0) {
    this.subscribers.push({ priority, obj: o })
    this.subscribers = this.subscribers.sort(function (a, b) { return b.priority - a.priority })
  }

  /**
   * Remove an element to the observers array
   *
   * @param {Observer} o Object that needs to be unsubscribed
   */
  unsubscribe (o) {
    this.subscribers = this.subscribers.filter(subscriber => { return subscriber.obj !== o }).sort(function (a, b) { return b.priority - a.priority })
    // this.subscribers = this.subscribers
  }

  /**
   *
   * Notify to all subscribers
   *
   * @param { String } topic   String that identifies the message nature
   * @param { * } message Variable that contains the information needed to notify
   */
  broadCast (topic, message) {
    const _this = this

    if (this.transmit) {
      this.subscribers.forEach(sub => {
        sub.obj.listen(topic, message)
      })
    } else {
      // Prevent circular broadcast, if one of the subscribers has this instance as subscriber, don't broadcast
      this.subscribers.forEach(sub => {
        if (sub.obj.subscribers) {
          const subnocircular = sub.obj.subscribers.filter(subscriber => {
            return subscriber.obj.constructor.name === _this.constructor.name
          })
          if (subnocircular.length === 0) {
            sub.obj.listen(topic, message)
          }
        } else sub.obj.listen(topic, message)
      })
    }
  }
}

class Observer {
  constructor () {
    Object.assign(Observer.prototype, listen)
  }
}

class ObservableObserver extends Observable {
  constructor () {
    super()
    Object.assign(ObservableObserver.prototype, listen)
  }
}

class SVGBase extends Observer {
  constructor (type, _class = '', id = '') {
    super()
    this.svgNS = document.createElementNS('http://www.w3.org/2000/svg', type)
    this.id = id
    this.transformations = { map: {}, transformations: [] }
    if (_class) this.className = _class
    this.currentUnit = Unit.px
  }

  set id (value) {
    this.svg.setAttribute('id', value)
  }

  get id () {
    return this.svg.getAttribute('id')
  }

  get className () {
    return this.svg.className
  }

  set className (value) {
    this.addClass(value)
  }

  remove () {
    this.svg.remove()
  }

  addClass (value) {
    this.svg.classList.add(value)
    return this
  }

  toggleClass (value) {
    this.svg.classList.toggle(value)
    return this
  }

  removeClass (value) {
    this.svg.classList.remove(value)
    return this
  }

  parent () {
    return this.svg.parentNode
  }

  siblings () {
    return this.parent().children
  }

  /**
 * TODO: It's important to understand transformations in svg, for example rotate makes coord axis to rotate as well
 */

  transform (type, str) {
    if (!(this.transformations.map[type] >= 0)) {
      this.transformations.map[type] = this.transformations.transformations.length
    }

    this.transformations.transformations[this.transformations.map[type]] = str
    this.svg.setAttribute('transform', this.transformations.transformations.join(' '))
    return this
  }

  translate (x, y) {
    return this.transform('translate', 'translate(' + x + ',' + y + ')')
  }

  rotate (d, cx = 0, cy = 0) {
    return this.transform('rotate', 'rotate(' + d + ',' + cx + ',' + cy + ')')
  }

  scale (n) {
    return this.transform('translate', 'scale(' + n + ')')
  }

  get svg () {
    return this.svgNS
  }

  /**
 * Validate unit
 * @param {*} unit
 */

  setUnit (unit) {
    this.currentUnit = unit
    return this
  }

  UnitValue (v) {
    return this.currentUnit !== Unit.px ? gr.gridTopx(v) : v
  }
}

class SVGGroup extends SVGBase {
  constructor (_class = '', id = '') {
    super('g', _class, id)
  }

  append (svgObject) {
    this.svg.appendChild(svgObject.svg)
    return this
  }
}

class _jsDomElement extends ObservableObserver {
  constructor (element) {
    super()
    this.element = element
  }

  static parseStyle (dom, _style) {
    const style = Object.keys(_style)

    style.forEach((prop) => {
      const tmpProp = prop.replace(/-([a-z])/ig, function (all, letter) { return letter.toUpperCase() })
      if (tmpProp in dom.style) {
        dom.style[tmpProp] = _style[prop]
      } else throw new Error(_jscerror.bad_property)
    })
  }

  static parseAttr (dom, _attr) {
    const attr = Object.keys(_attr)

    attr.forEach((prop) => {
      dom.setAttribute(prop, _attr[prop])
    })
  }

  attr (_attr, _value = null) {
    if (_value === null && typeof _attr === 'string') return this.element.getAttribute(_attr)

    if (_value !== null && typeof _attr === 'string') return this.element.setAttribute(_attr, _value)
    else if (_value === null && typeof _attr === 'object') {
      _jsDomElement.parseAttr(this.element, _attr)
    } else throw new Error(_jscerror.bad_attribute)
  }

  append () {
    for (const newChild of arguments) {
      this.element.appendChild(newChild.element ? newChild.element : newChild)
    }
    return this
  }

  prepend () {
    for (const newChild of arguments) {
      this.element.prepend(newChild.element ? newChild.element : newChild)
    }
    return this
  }

  static fromNode (element) {
    const tmp = new _jsDomElement()
    tmp.element = element
    return tmp
  }

  hasClass (tgtClass) {
    const regex = new RegExp(tgtClass)
    let className = this.element.className
    if (Object.getPrototypeOf(this.element).prototype === Node.prototype) className = this.element.className.baseVal
    if (regex.test(className)) return true
    return false
  }

  addClass () {
    for (const newClass of arguments) {
      const regex = new RegExp(newClass)
      let className = this.element.className
      if (Object.getPrototypeOf(this.element).prototype === Node.prototype) className = this.element.className.baseVal
      if (!regex.test(className)) this.element.classList.add(newClass)
    }
    return this
  }

  remove () {
    this.element.remove()
  }

  removeClass (newClass) {
    const regex = new RegExp(newClass)
    // if (Object.getPrototypeOf(this.element).prototype === Node.prototype && regex.test(this.className.baseVal)) this.className.baseVal = this.className.baseVal.replace(newClass, '')
    if (regex.test(this.element.className.baseVal)) this.element.className.baseVal = this.element.className.baseVal.replace(newClass, '')
    else if (regex.test(this.element.className)) this.element.className = this.element.className.replace(newClass, '')
    return this
  }

  on (event, callable) {
    this.element.addEventListener(event, callable)
  }

  parent () {
    return this.element.parentNode
  }

  empty () {
    this.element.innerHTML = ''
    return this
  }

  text (text = null) {
    if (text) this.element.textContent = text
    return this.element.textContent
  }

  html (html = null) {
    if (html) this.element.innerHTML = html
    return this.element.innerHTML
  }

  find (selector) {
    return this.element.querySelector(selector)
  }

  style (_style = null) {
    if (!_style) return this.element.style
    _jsDomElement.parseStyle(this.element, _style)
  }
}
class _jsDomElementCollection {
  constructor (elements) {
    this.elements = []
    elements.forEach((element) => this.elements.push(new _jsDomElement(element)))
  }

  static fromNodeList (elements) {
    const tmp = new _jsDomElementCollection([])
    elements.forEach((element) => tmp.elements.push(_jsDomElement.fromNode(element)))
    return tmp
  }

  addClass (newClass) {
    this.elements.forEach((element) => element.addClass(newClass))
    return this
  }

  removeClass (newClass) {
    this.elements.forEach((element) => element.removeClass(newClass))
    return this
  }

  filter (callable) {
    return Array.from(this.elements).filter(callable)
  }

  on (event, callable) {
    this.elements.forEach((element) => element.on(event, callable))
    return this
  }
}

const _jss = function (selector) {
  let elements = []
  switch (typeof selector) {
    case 'string':
      elements = document.querySelectorAll(selector)
      if (elements.length > 1) return new _jsDomElementCollection(elements)
      return new _jsDomElement(elements[0])
    case 'object':
      if (Object.getPrototypeOf(selector) === NodeList.prototype) return _jsDomElementCollection.fromNodeList(selector)
      else return new _jsDomElement(selector)
  }
}

const _jscerror = {
  bad_property: 'error._jscerror.bad_property',
  bad_attribute: 'error._jscerror.bad_attr'
}

const _jsc = function ({ s, _id, _class, _style, _attr } = {}) {
  const tmpDom = document.createElement(s)
  if (_id) tmpDom.id = _id
  if (_class) tmpDom.className = Array.isArray(_class) === true ? _class.join(' ') : _class

  if (_style) {
    _jsDomElement.parseStyle(tmpDom, _style)
  }
  if (_attr) {
    _jsDomElement.parseAttr(tmpDom, _attr)
  }

  return _jss(tmpDom)
}

/**
 * @class State
 * @classdesc This class is used to store the state of the application.
 *
 */
class State {
  static config = {
    lang: 'es',
    memSize: 64 * 1024
  }
}

/**
 * @fileoverview Translation file for English.
 */
const GlobalConst$1 = {
  implement_this: 'error.global.implement_this'
}

const en = {

  // Memory
  'labels.memory.IOlabel': 'IOIO',
  'labels.memory.empty': 'XXXX',

  'labels.memcfg.header_left': '<p><strong>Current configuration </strong><br /><span style="font-size: 10px;">(Right click for module deletion)</span></p>',
  'labels.memcfg.header_right': '<p><strong>Available Modules </strong><br /><span style="font-size: 10px;">(Use drag and drop to add a module)</span></p>',

  'labels.memedit.hex_addr': 'Hex address',
  'labels.memedit.addr': 'Address',
  'labels.memedit.go': 'Go',
  'labels.memedit.load': 'Load',
  'labels.memedit.value': 'Value',

  // Menu
  'labels.menu.menu_file': 'File',
  'labels.menu.menu_file_open': 'Open eje file...',
  'labels.menu.system_config': 'Settings',
  'labels.menu.change_theme': 'Change theme',
  'labels.menu.menu_file_opensim': 'Open sim file...',
  'labels.menu.menu_file_savesim': 'Save sim file...',
  'labels.menu.menu_offline_version': 'Download offline version',
  'labels.menu.menu_running': 'Run',
  'labels.menu.menu_running_cycle': '[F7] Clock cycle (step)',
  'labels.menu.menu_running_instruction': '[F8] Instruction',
  'labels.menu.menu_running_run': '[F9] Run',
  'labels.menu.menu_running_stop': '[F9] Stop',
  'labels.menu.menu_running_signalselect': '[F6] Signal selector',
  'labels.menu.menu_running_mode_normal': '[F5] Change  mode',
  'labels.menu.menu_running_mode_manual': '[F5] Change mode',
  'labels.menu.menu_running_reset': '[Ctrl+F10] Reset',
  'labels.menu.menu_utils': 'Utils',
  'labels.menu.menu_utils_mem': 'Memory',
  'labels.menu.menu_utils_mem_config': 'Configure',
  'labels.menu.menu_utils_mem_edit': 'Edit',
  'labels.menu.menu_utils_io': 'I/O',
  'labels.menu.menu_utils_io_keyboard': 'Connect Keyboard',
  'labels.menu.menu_utils_io_screen': 'Connect Screen',
  'labels.menu.menu_utils_io_lights': 'Connect Lights',
  'labels.menu.menu_mode_label': 'MODE',
  'labels.menu.menu_lang_confirm': 'If you change the language now, you will lose your work, you can save the simulation if you wish and reload it in the new language',

  // Language Menu
  'labels.simulator.language_es': 'SP',
  'labels.simulator.language_en': 'EN',

  // Context menu memconfig
  'labels.memcfg.delete_module': 'Remove module',

  // Context menu I/O management
  'labels.ctio.connect_keyboard': 'Connect Keyboard',
  'labels.ctio.connect_screen': 'Connect Screen',
  'labels.ctio.connect_lights': 'Connect Lights',
  'labels.ctio.controllabel': 'I/O',

  // Context menu Memory management
  'labels.ctmemory.config': 'Configure',
  'labels.ctmemory.editor': 'Edit',
  'labels.ctmemory.controllabel': 'MEMORY',

  // Uc
  'labels.ctuc.controllabel': 'CU',
  'labels.ctuc.steplabel': 'STEP',

  // Buses
  'labels.bussdb.data_bus': 'Data bus (SDB)',
  'labels.bussab.address_bus': 'Address bus (SAB)',
  'labels.busscb.control_bus': 'Control bus (SCB)',

  // Simulator
  'labels.simulator.internal_bus': 'Internal bus (IB)',

  // Register value
  'labels.registervalue.bin': 'BIN: ',
  'labels.registervalue.dec': 'DEC: ',
  'labels.registervalue.dec_c2': 'DEC_2C: ',

  // View windows
  'labels.view.window_title_memedit': 'Memory editor',
  'labels.view.window_title_memcfg': 'Memory configuration',
  'labels.view.window_title_keyboard_data': 'Keyboard info',
  'labels.view.window_title_screen_data': 'Screen info',
  'labels.view.window_title_lights_data': 'Lights info',
  'labels.view.window_title_savesim': 'Save simulation',
  'labels.view.window_title_savesim_label': 'File name: ',
  'labels.view.window_title_savesim_button': 'Save',

  // Device data forms
  'labels.deviceform.form_name': 'Name',
  'labels.deviceform.form_address': 'Base addr.',
  'labels.deviceform.form_vector': 'Int. number (0-255)',
  'labels.deviceform.form_priority': 'Priority. (0-255)',
  'labels.deviceform.form_int': 'Generates int.',

  // Keyboard
  'labels.ctkeyboard.buffer': 'BUFFER',
  'labels.ctkeyboard.buffer_hex': 'HEX',
  'labels.ctkeyboard.buffer_char': 'CHAR',
  'labels.ctkeyboard.caps': 'Caps lock',
  'labels.ctkeyboard.address': 'Addr.',
  'labels.ctkeyboard.vector': 'Vec.',
  'labels.ctkeyboard.priority': 'Prio.',
  'labels.ctkeyboard.int': 'Int.',
  'labels.ctkeyboard.state': 'State',
  'errors.ctkeyboard.keyboard_must': 'The keyboard must be created before connecting it to the computer',

  // Lights device
  'labels.ctlights.address': 'Dir.',
  'labels.ctlights.vector': 'Vec.',
  'labels.ctlights.priority': 'Prio.',
  'labels.ctlights.int': 'Int.',
  'labels.ctlights.genint': 'Gen. int.',
  'labels.ctlights.group_lights': 'Lights/output',
  'labels.ctlights.group_switches': 'Switches/input',

  // Screen device
  'labels.ctscreen.address': 'Addr.',
  'labels.ctscreen.onoff': '',

  // Windows
  'labels.window.close': 'Close',

  // Signal selector
  'label.signalset.signal_selection_btok': 'Send to CU',
  'label.signalset.signal_selection_deactivate': 'Deactivate all',
  'label.signalset.signal_selection': 'Signal selection',

  // System configuration
  'label.sysconf.btok': 'Save',
  'label.sysconf.window_title': 'Settings',
  'labels.sysconf.language': 'Language: ',

  // Confirms
  'confirm.devices.remove_device': 'Are you sure you want to close the device: {0}?',

  // Errors
  'error.computer.loading_program': 'No program has been loaded',
  'error.computer.loading_memory': 'Memory has not been loaded',
  'error.computer.loading_signals_nomanual': 'You can use the signal selector in manual mode only',

  'error.IOManager.memorylink_missing': 'Memory has not been linked to the I/O manager',
  'error.IOManager.io_vectors': 'First 256 memory positions are reserved for the interrupt vector table',
  'error.IOManager.duplicate_name': 'A device with the same name already exists',

  'error.memory.address_space': 'The memory module goes out of the address space',
  'error.memory.module_size': 'A memory module can only be placed in an address multiple of the module size',
  'error.memory.module_notvalid': 'Given module is not valid',
  'error.memory.module_collision': 'There is a memory module in the given address',
  'error.memory.module_nomodule': 'There is no memory module in the given address',
  'error.memory.io_module_present': 'There is an I/O device in the given address',
  'error.memory.nomodule_noes': 'No memory module or I/O device exists at the specified address',

  'error.memory.notsupported': 'Memory doesn\'t support this operation mode',

  'error.signalset.multiple_download': 'You cannot select two download signals at the same time',
  'error.signalset.same_group': 'The selected signals from {0} group are incompatible',
  'error.signalset.read_ongoing': 'There is an ongoing read operation and the signal selection is not possible',
  'error.signalset.write_ongoing': 'There is an ongoing write operation and the signal selection is not possible',
  'error.signalset.badsignal': 'Invalid signal',
  'error.signalset.multiple_upload_group': 'Selected upload signals are not compatible',
  'error.signalset.inta_read': 'Selecting INTA is not possible with a read operation ongoing',
  'error.signalset.bad_sr': 'Selected SR signals are not compatible',
  'error.signalset.signal_present': 'Duplicate signal selection',

  'error.keyboard.buffer-full': 'Keyboard buffer is full',
  'error.keyboard.out-of-bounds': 'Address memory is out of bounds',
  'error.keyboard.write-only-ec': 'In the keyboard, you can only write on the status register, position 1',

  'error.lights.out-of-bounds': 'There is only one accesible position',
  'error._jscerror.bad_property': 'Invalid property',
  'error._jscerror.bad_attribute': 'Invalid attribute',

  'error.instructions.length_16': 'The instruction must be 16 bits long and can only consist of 0 and 1 characters',
  'error.instructions.badinstruction': 'Instruction {0} can\'t be located',
  'error.instructions.duplicated': 'Multiple coincidences have been found, please check the opcodes',
  'error.instructions.structure': 'Instruction has a bad structure',

  'error.forms.hex16': 'Value must be hexadecimal and 16 bit long',

  'errors.deviceform.input_device': 'Base address is required; in case of interrupt generation, interrupt vector and priority are required',
  'errors.deviceform.output_device': 'Base addres is required'
}

en[GlobalConst$1.implement_this] = 'This method must be implemented in the child class'

/**
 * @fileoverview Translation file for Spanish.
 */
const GlobalConst = {
  implement_this: 'error.global.implement_this'
}

const es = {

  // Memory
  'labels.memory.IOlabel': 'ESES',
  'labels.memory.empty': 'XXXX',

  'labels.memcfg.header_left': '<p><strong>Configuración actual </strong><br /><span style="font-size: 10px;">(para eliminar un módulo click derecho)</span></p>',
  'labels.memcfg.header_right': '<p><strong>Módulos disponibles </strong><br /><span style="font-size: 10px;">(para colocar arrastrar y soltar en un posición válida)</span></p>',

  'labels.memedit.hex_addr': 'Dirección (hex)',
  'labels.memedit.addr': 'Dirección',
  'labels.memedit.go': 'Ir',
  'labels.memedit.load': 'Cargar',
  'labels.memedit.value': 'Valor',

  // Menu
  'labels.menu.menu_file': 'Archivo',
  'labels.menu.menu_file_open': 'Abrir ejecutable...',
  'labels.menu.system_config': 'Configuración',
  'labels.menu.change_theme': 'Cambiar tema',
  'labels.menu.menu_file_opensim': 'Abrir simulación...',
  'labels.menu.menu_file_savesim': 'Guardar simulación...',
  'labels.menu.menu_offline_version': 'Descargar versión offline',
  'labels.menu.menu_running': 'Ejecución',
  'labels.menu.menu_running_cycle': '[F7] Ciclo de reloj',
  'labels.menu.menu_running_instruction': '[F8] Instrucción completa',
  'labels.menu.menu_running_run': '[F9] Ejecutar',
  'labels.menu.menu_running_stop': '[F9] Detener',
  'labels.menu.menu_running_signalselect': '[F6] Seleccionar señales',
  'labels.menu.menu_running_mode_normal': '[F5] Cambiar modo',
  'labels.menu.menu_running_mode_manual': '[F5] Cambiar modo',
  'labels.menu.menu_running_reset': '[Ctrl+F10] Reiniciar',
  'labels.menu.menu_utils': 'Utilidades',
  'labels.menu.menu_utils_mem': 'Memoria',
  'labels.menu.menu_utils_mem_config': 'Configurar',
  'labels.menu.menu_utils_mem_edit': 'Editar',
  'labels.menu.menu_utils_io': 'E/S',
  'labels.menu.menu_utils_io_keyboard': 'Conectar Teclado',
  'labels.menu.menu_utils_io_screen': 'Conectar Pantalla',
  'labels.menu.menu_utils_io_lights': 'Conectar Luces',
  'labels.menu.menu_mode_label': 'MODO',
  'labels.menu.menu_lang_confirm': 'Si usted cambia de idioma en este momento perderá su trabajo. Puede guardar la simulación si así lo desea y volver a cargarla en el nuevo idioma',

  // Language Menu
  'labels.simulator.language_es': 'ES',
  'labels.simulator.language_en': 'EN',

  // Context menu memconfig
  'labels.memcfg.delete_module': 'Eliminar módulo',

  // Context menu I/O management
  'labels.ctio.connect_keyboard': 'Conectar Teclado',
  'labels.ctio.connect_screen': 'Conectar Pantalla',
  'labels.ctio.connect_lights': 'Conectar Luces',
  'labels.ctio.controllabel': 'E/S',

  // Context menu Memory management
  'labels.ctmemory.config': 'Configurar',
  'labels.ctmemory.editor': 'Editar',
  'labels.ctmemory.controllabel': 'MEMORIA',

  // Uc
  'labels.ctuc.controllabel': 'UC',
  'labels.ctuc.steplabel': 'PASO',

  // Buses
  'labels.bussdb.data_bus': 'Bus de datos (SDB)',
  'labels.bussab.address_bus': 'Bus de direcciones (SAB)',
  'labels.busscb.control_bus': 'Bus de control (SCB)',

  // Simulator
  'labels.simulator.internal_bus': 'Bus interno (IB)',

  // Register value
  'labels.registervalue.bin': 'BIN: ',
  'labels.registervalue.dec': 'DEC: ',
  'labels.registervalue.dec_c2': 'DEC_C2: ',

  // View windows
  'labels.view.window_title_memedit': 'Editor de memoria',
  'labels.view.window_title_memcfg': 'Configurar memoria',
  'labels.view.window_title_keyboard_data': 'Datos Teclado',
  'labels.view.window_title_screen_data': 'Datos Pantalla',
  'labels.view.window_title_lights_data': 'Datos Luces',
  'labels.view.window_title_savesim': 'Guardar simulación',
  'labels.view.window_title_savesim_label': 'Nombre del archivo: ',
  'labels.view.window_title_savesim_button': 'Guardar',

  // Device data forms
  'labels.deviceform.form_name': 'Nombre',
  'labels.deviceform.form_address': 'Dir. base:',
  'labels.deviceform.form_vector': 'Num. interrupción (0-255):',
  'labels.deviceform.form_priority': 'Prioridad. (0-255)',
  'labels.deviceform.form_int': 'Genera int.',

  // Keyboard
  'labels.ctkeyboard.buffer': 'BUFFER',
  'labels.ctkeyboard.buffer_hex': 'HEX',
  'labels.ctkeyboard.buffer_char': 'CAR',
  'labels.ctkeyboard.caps': 'Bloq. May.',
  'labels.ctkeyboard.address': 'Dir.',
  'labels.ctkeyboard.vector': 'Num. int.',
  'labels.ctkeyboard.priority': 'Prio.',
  'labels.ctkeyboard.int': 'Int.',
  'labels.ctkeyboard.state': 'Estado',
  'errors.ctkeyboard.keyboard_must': 'Es necesario crear el teclado previamente',

  // Lights device
  'labels.ctlights.address': 'Dir.',
  'labels.ctlights.vector': 'Vec.',
  'labels.ctlights.priority': 'Prio.',
  'labels.ctlights.int': 'Int.',
  'labels.ctlights.genint': 'Gen. Int.',
  'labels.ctlights.group_lights': 'Luces/salida',
  'labels.ctlights.group_switches': 'Interruptores/entrada',

  // Screen device
  'labels.ctscreen.address': 'Dir.',
  'labels.ctscreen.onoff': '',

  // Windows
  'labels.window.close': 'Cerrar',

  // Signal selector
  'label.signalset.signal_selection_btok': 'Enviar a UC',
  'label.signalset.signal_selection_deactivate': 'Desactivar todas',
  'label.signalset.signal_selection': 'Selección de señales',

  // System configuration
  'label.sysconf.btok': 'Guardar',
  'label.sysconf.window_title': 'Configuración',
  'labels.sysconf.language': 'Idioma: ',

  // Confirms
  'confirm.devices.remove_device': '¿Está seguro de que desea eliminar el dispositivo: {0}?',

  // Errors
  'error.computer.loading_program': 'No se ha cargado ningún programa',
  'error.computer.loading_memory': 'No se ha cargado el archivo de memoria',
  'error.computer.loading_signals_nomanual': 'El selector de señales solo es posible ejecutarlo en modo manual',

  'error.IOManager.memorylink_missing': 'No se ha enlazado el gestor de memoria en el Gestor de I/O',
  'error.IOManager.io_vectors': 'Las 256 primeras posiciones de memoria se reservan para los vectores de interrupción',
  'error.IOManager.duplicate_name': 'Ya existe un dispositivo con el mismo nombre',

  'error.memory.address_space': 'El módulo de memoria se sale del espacio de direcciones',
  'error.memory.module_size': 'Un módulo solo puede colocarse a partir de posición de memoria que sea múltiplo de su tamaño',
  'error.memory.module_notvalid': 'El tamaño del módulo propuesto es incrorecto',
  'error.memory.module_collision': 'Existe otro módulo en la posición de memoria propuesta',
  'error.memory.module_nomodule': 'No existe módulo de memoria en la dirección propuesta',
  'error.memory.io_module_present': 'Hay un dispositivo i/o en la posición propuesta',
  'error.memory.nomodule_noes': 'No existe moódulo de memoria ni dispositivo mapeado en la dirección propuesta',

  'error.memory.notsupported': 'El modo indicado no está soportado por el módulo de memoria',

  'error.signalset.multiple_download': 'No es posible activar mas de una señal de descarga a la vez',
  'error.signalset.same_group': ' Las señales seleccionadas del grupo {0} no son compatibles',
  'error.signalset.read_ongoing': 'Existe una operación de lectura en curso y la selección de señales no es posible',
  'error.signalset.write_ongoing': 'Existe una operación de escritura en curso y la selección de señales no es posible',
  'error.signalset.badsignal': 'Señal no válida',
  'error.signalset.multiple_upload_group': 'Incompatibilidad de señales de subida',
  'error.signalset.inta_read': 'No es posible seleccionar INTA con operación de lectura en curso',
  'error.signalset.bad_sr': 'Señales SR no compatibles',
  'error.signalset.signal_present': 'Señal duplicada',

  'error.keyboard.buffer-full': 'El buffer del teclado está lleno',
  'error.keyboard.out-of-bounds': 'La dirección de memoria está fuera de rango',
  'error.keyboard.write-only-ec': 'Solo es posible escribir en el registro de estado, posición 1',

  'error.lights.out-of-bounds': 'El dispositivo de luces solo tiene una posición accesible',
  'error._jscerror.bad_property': 'Propiedad no válida',
  'error._jscerror.bad_attribute': 'Atributo no válido',

  'error.instructions.length_16': 'La instruccion ha de tener longitud 16 se admiten únicamente los caracteres 0 y 1',
  'error.instructions.badinstruction': 'No se ha localizado la instrucción {0}',
  'error.instructions.duplicated': 'Se han encontrado varias coincidencias, revise el código de las instrucciones porque no es una situación posible',
  'error.instructions.structure': 'La instrucción no tiene una estructura válida',

  'error.forms.hex16': 'El valor ha de ser un número hexadecimal de 16 bits',

  'errors.deviceform.input_device': 'Para un dispositivo de entrada es obligatoria la dirección base y, en caso de usar interrupciones, el número de interrupción y su prioridad también lo son',
  'errors.deviceform.output_device': 'Para un dispositivo de salida es obligatoria la dirección base'

}

es[GlobalConst.implement_this] = 'Es necesario implemenar este método en la clase hija'

const lang = { en, es }

function literals (literal) {
  return lang[State.config.lang][literal]
}

const _jStr = function (str) {
  const _str = function (str) {
    this.value = str
  }
  _str.prototype.left = function (n) { this.value = this.value.substring(0, n); return this }
  _str.prototype.right = function (n) { this.value = this.value.substring(this.value.length - n); return this }

  _str.prototype.format = function (n) {
    const args = Array.from(arguments)
    // const str = arguments[0]
    // args.shift()
    const tmp = this.value.replace(/{([0-9]+)}/g, function (match, index) {
    // check if the argument is present
      return typeof args[index] === 'undefined' ? match : args[index]
    })
    return tmp
  }

  /* istanbul ignore next */
  _str.prototype.translate = function (format = false) {
    // const prueba = import('../config/lang/' + State.config.lang + '.js')

    if (!format) return literals(this.value)
    return _jStr(literals(this.value)).format(...Array.from(arguments))
  }

  _str.prototype.toString = function () { return this.value }
  return new _str(str)
}

class Forms {
  static error = {
    hex16: 'error.forms.hex16'
  }

  static input (type, label, id) {
    const input = document.createElement('input')
    const inputlabel = document.createElement('label')
    input.type = type
    inputlabel.textContent = label
    inputlabel.for = id

    input.id = id
    input.name = id

    return { input, label: inputlabel }
  }

  static especialKeyEvents (key, event) {
    switch (key) {
      case 'Esc': return event.key === 'Esc' || event.keyCode === 27 || event.which === 27

      case 'Enter': return event.key === 'Enter' || event.keyCode === 13 || event.which === 13
      case 'CopyPaste': return event.ctrlKey && /[CV]$/.test(event.key.toUpperCase())
    }
  }

  static isNavKey (keycode) {
    // Enable Delete(46), Backspace(8),Home(35), End(36),cursor keys(37,38,39,40)
    return [46, 8, 35, 36, 37, 38, 39, 40].includes(keycode)
  }

  static isHexChar (value) {
    return /[0-9ABCDEF]$/.test(value.toUpperCase())
  }

  static isHexString (value, size = 4) {
    return value !== undefined && value.length <= 4 && /^[0-9ABCDEF]+$/.test(value.toUpperCase())
  }

  static isTextSelected (input) {
    if (typeof input.selectionStart === 'number') {
      return input.selectionEnd > input.selectionStart
    } else if (typeof document.selection !== 'undefined') {
      input.focus()

      return document.selection.createRange().text === input.value
    }
  }

  static hexInput (basedir, defaultValue = false) {
    let lastValue = ''

    basedir.input.style.textTransform = 'uppercase'
    basedir.input.addEventListener('keydown', (event) => {
      if (event.key) {
        lastValue = event.target.value
        const validChar = Forms.isHexChar(event.key.toUpperCase())
        const cursorKey = Forms.isNavKey(event.keyCode)
        const copyPaste = Forms.especialKeyEvents('CopyPaste', event)
        if (!Forms.isTextSelected(event.target) && event.target.value.length + 1 > 4 && !cursorKey && !copyPaste) {
          event.preventDefault()
          return false
        }
        if (!(validChar || cursorKey || copyPaste)) {
          event.preventDefault()
        }
      }
    })
    basedir.input.addEventListener('keyup', (event) => {
      if (Forms.especialKeyEvents('Esc', event)) {
        event.preventDefault()
        return false
      } else {
        if (Forms.especialKeyEvents('CopyPaste', event)) {
          if (!Forms.isHexString(event.target.value)) {
            alert(_jStr(Forms.error.hex16).translate())
            event.target.value = lastValue
          }
        }
      }
    })

    basedir.input.addEventListener('blur', function (event) {
      if (event.target.value === undefined || event.target.value === '') {
        if (defaultValue) event.target.value = defaultValue
      } else {
        event.target.value = baseConvert.dec2hex(baseConvert.hex2dec(event.target.value))
      }
    })
  }

  static decInput (basedir, min, max) {
    let lastValue = ''

    basedir.input.addEventListener('keydown', (event) => {
      if (event.key) {
        if (!(event.target.value <= 255 && event.target.value >= 0)) {
          event.preventDefault()
        } else {
          lastValue = event.target.value
        }
      }
    })

    basedir.input.addEventListener('keyup', (event) => {
      if (!(event.target.value <= 255 && event.target.value >= 0)) {
        event.target.value = lastValue
      }
    })
  }

  static editableTextInput (label, id, _class, target, position, value, callable, svg = false) {
    function confirmValue (callable, value) {
      if (value === '') value = '0'
      callable(value)
    }

    const input = _jsc({ s: 'input', _class })
    input.style({ 'text-transform': 'uppercase' })
    input.on('click', (e) => { e.stopPropagation() })
    const backupText = value
    if (!svg) {
      target.addClass('inputshadow')
      // backupText = target.element.textContent
      target.element.innerHTML = ''
      target.element.appendChild(input.element)
    } else {
      const wrap = _jsc({ s: 'div', _class: 'inputwrap' })
      wrap.append(input)
      _jss(document.body).append(wrap)
      // document.body.appendChild(input.element)
      wrap.addClass('inputshadow')
      wrap.style({
        position: 'absolute',
        top: position.y + 'px',
        left: position.x + 'px',
        width: position.width + 'px',
        height: position.height + 'px',
        backgroundColor: 'var(--secondary-background-color)',
        color: 'var(--secondary-text-color)',
        fontSize: gr.gridSize * 2 + 'px',
        fontFamily: 'monospace'
      })

      input.style({
        width: position.width - 5 + 'px',
        height: position.height + 'px',
        color: 'var(--secondary-text-color)',
        border: '0px',
        'text-align': 'center',
        'font-size': gr.gridSize * 2 + 'px',
        'font-family': 'monospace',
        'background-color': 'transparent'
      })
    }
    input.element.value = value

    input.element.focus()

    input.on('keyup', (event) => {
      if (Forms.especialKeyEvents('Esc', event)) {
        event.preventDefault()
        input.element.blur()
        return false
      } else if (Forms.especialKeyEvents('Enter', event)) {
        event.preventDefault()
        confirmValue(callable, event.target.value)
        input.element.blur()
        return false
      } else {
        if (Forms.especialKeyEvents('CopyPaste', event)) {
          if (!Forms.isHexString(event.target.value)) {
            alert(_jStr(Forms.error.hex16).translate())
            input.element.blur()
          }
        }
      }
    })

    input.on('keydown', (event) => {
      const validChar = Forms.isHexChar(event.key.toUpperCase())
      const cursorKey = Forms.isNavKey(event.keyCode)
      const copyPaste = Forms.especialKeyEvents('CopyPaste', event)
      if (!Forms.isTextSelected(event.target) && event.target.value.length + 1 > 4 && !cursorKey && !copyPaste) {
        event.preventDefault()
        return false
      }
      if (!(validChar || cursorKey || copyPaste)) {
        event.preventDefault()
      }
    })

    input.on('blur', function (event) {
      if (!svg) {
        target.text(backupText)
      }
      if (event.target) {
        if (svg) event.target.parentNode.remove()
        event.target.remove()
      }
    })
    input.on('focus', function () {
      input.style.border = '0px solid'
    })
  }

  static inputwlabel (type, label, id, labelx = 'right') {
    const div = document.createElement('div')
    const input = this.input(type, label, id)

    div.id = 'wrap-' + id

    div.appendChild(input.label)
    div.appendChild(input.input)

    if (labelx === 'left') div.insertBefore(input.input, input.label)

    return { dom: div, input: input.input }
  }

  static inputwlabel2 (type, label, id, labelx = 'right') {
    const labeldom = _jsc({ s: 'label', _id: 'wrap-' + id })
    labeldom.text(label)
    labeldom.attr('for', id)
    const input = _jsc({ s: 'input', _id: id })
    input.attr('type', 'checkbox')

    labeldom.prepend(input)

    return { dom: labeldom.element }
  }

  static button (label, id) {
    const button = document.createElement('button')
    button.textContent = label
    button.id = id
    button.name = id

    return { input: button }
  }
}

class baseConvert {
  static bin2dec (bin) {
    return parseInt(bin, 2)
  }

  static dec2bin (dec, bits = 16) {
    return dec.toString(2).padStart(bits, '0')
  }

  static dec2hex (dec, pad = 4) {
    return dec.toString(16).padStart(pad, '0')
  }

  static hex2dec (hex) {
    return parseInt(hex, 16)
  }

  static bin2hex (bin) {
    return baseConvert.dec2hex(baseConvert.bin2dec(bin))
  }

  static hex2bin (hex) {
    return baseConvert.dec2bin(baseConvert.hex2dec(hex))
  }

  static is16bitHex (hex) {
    return Forms.isHexString(hex) && baseConvert.hex2dec(hex) <= 0xffff && baseConvert.hex2dec(hex) >= 0
  }
}

class SVGPolygon extends SVGBase {
  constructor (pointsstr, _class = '', id = '') {
    super('polygon', _class, id)
    this.points = pointsstr
  }

  /**
     * Expects x,y point in px
     * @param {*} x
     * @param {*} y
     * @returns
     */
  addPoint (x, y) {
    const pointArray = this.pointsArr
    pointArray.push([x, y])
    this.pointsArr = pointArray
    return this
  }

  /**
     * Expects x increment and y increment in the unit provided by the property currentUnit in the base class SVGElement
     * @param {*} x
     * @param {*} y
     * @returns
     */
  go (x, y) {
    const npoints = this.pointsArr.length
    const lastpoint = this.pointsArr[npoints - 1]
    if (lastpoint) this.addPoint(lastpoint[0] + this.UnitValue(x), lastpoint[1] + this.UnitValue(y))
    else this.addPoint(this.UnitValue(x), this.UnitValue(y))
    return this
  }

  goRight (v) {
    return this.go(v, 0)
  }

  goLeft (v) {
    return this.go(-v, 0)
  }

  goUp (v) {
    return this.go(0, -v)
  }

  goDown (v) {
    return this.go(0, v)
  }

  set points (pointsstr) {
    this.svg.setAttribute('points', pointsstr)
  }

  get points () {
    return this.svg.getAttribute('points')
  }

  get pointsArr () {
    return this.points.trim() !== '' ? this.points.match(/[-0-9.]+[ ]+[-0-9.]+/gm).map(point => point.replace(/  +/g, ' ').split(' ').map(Number)) : []
  }

  set pointsArr (pointArray) {
    this.points = pointArray.map(point => point.join(' ')).join(' ')
  }
}

class SVGArrow extends SVGPolygon {
  constructor (id = '') {
    super('0 0 ' + (gr.gridSize / 2) + ' ' + (gr.gridSize / 2) + ' 0 ' + (gr.gridSize) + ' 0 0', 'arrow-bullet-inactive', id)
  }

  orientate (direction) {
    switch (direction) {
      case 'R': this.right()
        break
      case 'L': this.left()
        break
      case 'U': this.up()
        break
      case 'D': this.down()
        break
    }
  }

  left () {
    const x = this.svg.getBoundingClientRect().x; const y = this.svg.getBoundingClientRect().y
    // super.translate(x, y - gr.gridSize / 2);
    super.translate(x, y - gr.gridSize * 0.5)
    return this.rotate(180, gr.gridSize * 0.25, gr.gridSize * 0.5)
  }

  right () {
    const x = this.svg.getBoundingClientRect().x; const y = this.svg.getBoundingClientRect().y
    super.translate(x - gr.gridSize / 2, y - gr.gridSize / 2)
    return this.rotate(0, 0, 0)
  }

  up () {
    const x = this.svg.getBoundingClientRect().x; const y = this.svg.getBoundingClientRect().y
    super.translate(x, y)
    return this.rotate(270, 0, gr.gridSize * 0.5)
  }

  down () {
    const x = this.svg.getBoundingClientRect().x; const y = this.svg.getBoundingClientRect().y
    super.translate(x, y - gr.gridSize)
    return this.rotate(90, 0, gr.gridSize * 0.5)
  }
}

class SVGText extends SVGBase {
  constructor (x, y, text, fontsize = '8', _class = '', id = '', op = {}) {
    super('text', _class, id)

    const defaults = { fontFamily: 'Verdana' }; const options = { ...defaults, ...op }

    this.x = x
    this.y = y
    this.text = text
    this.fontSize = fontsize
    this.fontFamily = options.fontFamily
  }

  set text (value) {
    this.svg.textContent = value
  }

  set x (value) {
    this.svgNS.setAttribute('x', value)
  }

  set y (value) {
    this.svgNS.setAttribute('y', value)
  }

  get x () {
    return Number(this.svgNS.getAttribute('x'))
  }

  get y () {
    return Number(this.svgNS.getAttribute('y'))
  }

  set fontSize (value) {
    this.svg.style.fontSize = value + 'px'
  }

  /**
     * @param {string} value Indicates the font family
     */
  set fontFamily (value) {
    this.svg.style.fontFamily = value
  }

  get fontFamily () {
    return this.svg.style.fontFamily
  }

  get fontSize () {
    return Number(this.svg.style.fontSize.replace('px', ''))
  }

  get text () {
    return this.svg.textContent
  }
}

/**
 * @module control/anchor
 */

/**
 * @class Anchor
 * @property {String} id Anchor id
 * @property {Number} x Anchor x position
 * @property {Number} y Anchor y position
 * @property {Array} connections Connections
 *
 */
class Anchor {
  constructor (id, x, y, target = '') {
    this.id = id
    this.x = x
    this.y = y
    this.connections = []
  }
}

/**
 * @class AnchorFactory
 * @property {Object} anchors Anchors
 *
 */
class AnchorFactory {
  constructor () {
    this.anchors = {}
  }

  /**
   * @method anchor Create an anchor
   * @param {*} id id of the anchor
   * @param {*} x x position of the anchor
   * @param {*} y y position of the anchor
   * @param {*} target target of the anchor
   * @returns {Anchor} Anchor
   */
  anchor (id, x, y, target) {
    this.anchors[id] = new Anchor(id, x, y, target)
    return this.anchors[id]
  }

  /**
   * @method getAnchor Get an anchor
   * @param {*} id id of the anchor
   * @returns {Array} Anchor coordinates
   */
  getAnchor (id) {
    return [this.anchors[id].x, this.anchors[id].y]
  }

  /**
   * @method getAnchors Get all anchors
   * @returns {Array} Anchors array
   */
  getAnchors () {
    return this.anchors
  }
}

const anchors = new AnchorFactory()

/**
 * @class Bit16Val
 * @extends Observable
 * @property {string} _name Name of the value
 * @property {number} _value Value
 * @property {string} topic Topics used by the device
 * @property {string} error Errors used by the device
 * @property {string} hex Hexadecimal representation of the value
 * @property {string} hex8 Hexadecimal representation of the value (8 bits)
 * @property {string} bin Binary representation of the value
 * @property {number} value8 Value (8 bits)
 */
class Bit16Val extends Observable {
  static topic = {
    updated: 'updated-value',
    reset: 'reset-value'
  }

  static error = {
    type: 'error.Bit16Val.type',
    range: 'error.Bit16Val.range'
  }

  constructor (name, value) {
    super()

    this._name = name
    this._value = value
  }

  get name () {
    return this._name
  }

  get value () {
    return this._value
  }

  set value (newValue) {
    if (typeof newValue !== 'number') throw Error(Bit16Val.error.type)
    if (newValue > 0xFFFF) throw Error(Bit16Val.error.range)
    this._value = newValue
  }

  get value8 () {
    return this.value & 0xFF
  }

  get hex () {
    return baseConvert.dec2hex(this.value)
  }

  get hex8 () {
    return baseConvert.dec2hex(this.value8)
  }

  get bin () {
    return baseConvert.dec2bin(this.value)
  }

  set value8 (value) {
    this.value = value & 0xFF
  }

  set hex (value) {
    this.value = baseConvert.hex2dec(value)
  }

  set hex8 (value) {
    this.value = baseConvert.hex2dec(value) & 0xFF
  }

  set bin (value) {
    this.value = baseConvert.bin2dec(value)
  }
}

/**
 * @class Register
 * @extends Bit16Val
 * @description Emulates a Computer register
 * @param { string } name - Register name
 * @param { int } value - Register initial value
 *
 */
const Register$1 = class Register extends Bit16Val {
  constructor (name, value = 0) {
    super(name, value)
  }

  /**
   * @method get name
   * @returns { string } Register name
   */
  get value () {
    return super.value
  }

  /**
   * @method set name
   * @param { string } newname - Register name
   */
  set value (newvalue) {
    super.value = newvalue
    this.broadCast({ topic: this._name + '_' + Register.topic.updated, value: this.value })
  }

  /**
   * @method reset
   * @description Reset register value to 0
   *
   */
  reset () {
    super.value = 0
    this.broadCast({ topic: this._name + '_' + Register.topic.reset, value: this.value })
  }
}

/**
 * @function positive Check if a number is positive
 * @param {number} hex Number to check
 * @returns {boolean} True if the number is positive, false otherwise
 */
function positive (hex) {
  return (hex & 0x8000) === 0
}

/**
 * @class Alu
 * @extends ObservableObserver
 * @property {number} _a Internal A value
 * @property {number} _b Internal B value
 * @property {number} _carry_in Internal carry-in value
 * @property {number} op Operation to perform
 * @property {Register} result Result register
 * @property {number} zf Zero flag
 * @property {number} cf Carry flag
 * @property {number} of Overflow flag
 * @property {number} sf Sign flag
 * @property {Object} topic Topics used by the device
 * @property {Object} operation Operations used by the device
 *
 */
const Alu$1 = class Alu extends ObservableObserver {
  static topic = {
    updated: 'alu-updated-result',
    reset: 'alu-reset'
  }

  static operation = {
    add: 'add',
    sub: 'sub',
    or: 'or',
    xor: 'xor',
    and: 'and'
  }

  // istanbul ignore next
  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    const backup = {
      result: this.result.value,
      a: this._a,
      b: this._b,
      carry_in: this._carry_in,
      zf: this.zf,
      cf: this.cf,
      of: this.of,
      sf: this.sf
    }
    return backup
  }

  // istanbul ignore next
  /**
   * @method restore Restore the device
   * @param {*} backup Backup of the device
   */
  restore (backup) {
    this.result.value = backup.result
    this._a = backup.a
    this._b = backup.b
    this._carry_in = backup.carry_in
    this.zf = backup.zf
    this.cf = backup.cf
    this.of = backup.of
    this.sf = backup.sf
  }

  /**
   * @method reset Reset the device to its initial state
   */
  reset () {
    this.op = 'ADD'
    this._a = 0x0000
    this._b = 0x0000
    this._carry_in = 0

    this.result.value = 0x0000

    // Internal state flags ZCOS
    this.zf = 0
    this.cf = 0
    this.of = 0
    this.sf = 0
    this.broadCast({ topic: Alu.topic.reset, value: { op1: this.a, op2: this.b, result: this.result, op: this.op } })
  }

  constructor () {
    super()

    this.result = new Register$1()
    this.reset()
  }

  /**
   * @method a Get the operator A
   * @property {number} a A value
   */
  get a () {
    return this._a
  }

  /**
   * @method a Set the operator A
   * @property {number} a A value
   */
  set a (value) {
    this._a = value
  }

  /**
   * @method b Get the operator B
   * return {number} B value
   */
  get b () {
    return this._b
  }

  /**
   * @method b Set the operator B
   * @property {number} b B value
  */
  set b (value) {
    this._b = value
  }

  /**
   * @method carry_in Get the carry-in value
  */
  get carry_in () {
    return this._carry_in
  }

  /**
   * @method carry_in Set the carry-in value
   */
  set carry_in (value) {
    this._carry_in = value
  }

  /**
   * @method operate Perform an operation
   * @param {string} operation Operation to perform
   */
  operate (operation) {
    this.op = operation
    // const a = this.tmpe
    // const b = this.ib

    let tmpResult = 0

    switch (operation) {
      case Alu.operation.add:

        tmpResult = this.a + this.b + this.carry_in

        this.result.value = tmpResult & 0xFFFF

        if (tmpResult > 0xFFFF) this.cf = 1
        else this.cf = 0

        // if ((a > 0 && b > 0 && this.result.value < 0) || (a < 0 && b < 0 && this.result.value > 0)) this.of = 1
        // else this.of = 0
        if ((positive(this.a) && positive(this.b) && !positive(this.result.value)) || (!positive(this.a) && !positive(this.b) && positive(this.result.value))) this.of = 1
        else this.of = 0

        break
      case Alu.operation.sub:

        tmpResult = this.a + ((~this.b) & 0xFFFF) + 1

        this.result.value = tmpResult & 0xFFFF

        if (this.a >= this.b) this.cf = 0
        else this.cf = 1

        if ((positive(this.a) && !positive(this.b) && !positive(this.result.value)) || (!positive(this.a) && positive(this.b) && positive(this.result.value))) this.of = 1
        else this.of = 0

        break

      case Alu.operation.or:
        this.result.value = this.a | this.b
        break
      case Alu.operation.and:
        this.result.value = this.a & this.b
        break
      case Alu.operation.xor:
        this.result.value = this.a ^ this.b
        break
    }

    if (this.result.value === 0) this.zf = 1
    else this.zf = 0

    this.sf = (this.result.value & 0x8000) >> 15

    this.broadCast({ topic: Alu.topic.updated, value: { op1: this.a, op2: this.b, result: this.result, op: operation } })
  }

  defaultAdd () {
    this.operate(Alu.operation.add)
    this.broadCast({ topic: Alu.topic.updated, value: { op1: this.a, op2: this.b, result: this.result, op: 'FAKE' } })
  }

  /**
   * @method listen Listen to a message
   * @param {Object} message Message to listen
   */
  listen (message) {
    switch (message.topic) {
      case 'TMPE_' + Register$1.topic.updated: this.a = message.value; this.defaultAdd(); break
      case 'IB-bus_' + Register$1.topic.updated: this.b = message.value; this.defaultAdd(); break
    }
  }

  /**
   * @method log Get the log of the device
   */
  get log () {
    return { OP: this.op, A: baseConvert.dec2hex(this.a), B: baseConvert.dec2hex(this.b), RESULT: baseConvert.dec2hex(this.result.value), ZCOS: this.zf + '' + this.cf + '' + this.of + '' + this.sf }
  }
}

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

/**
 * @class SignalMap
 * @description Maps signals to groups
 * @returns { SignalMap } SignalMap instance
 */
class SignalMap {
  static instance = null
  static getGroup (signal) {
    const rx = signal.match(/r(?<register>[0-7])/)
    if (rx) return 'r' + rx.groups.register

    if (['sr-ib', 'ib-sr', 'alu-sr', 'cli', 'sti'].includes(signal)) return 'SR'
    if (['pc-ib', 'ib-pc'].includes(signal)) return 'PC'
    if (['ib-tmpe', 'tmpe-set', 'tmpe-clr'].includes(signal)) return 'TMPE'
    if (['tmps-ib', 'alu-tmps'].includes(signal)) return 'TMPS'
    if (['read', 'write'].includes(signal)) return 'MEMORY'
    if (signal === 'inta') return 'INT'
    if (signal === 'ib-mar') return 'MAR'
    if (['mdr-ib', 'ib-mdr'].includes(signal)) return 'MDR'
    if (['ib-ir', 'irl-ibh', 'irl-ibl', 'extirl-ib'].includes(signal)) return 'IR'
    if (['add', 'sub', 'or', 'and', 'xor', 'carry-in'].includes(signal)) return 'ALU'
    if (signal === 'fin') return 'FIN'
  }

  constructor () {
    const signalOrder = ['r0-ib', 'r1-ib', 'r2-ib', 'r3-ib', 'r4-ib', 'r5-ib', 'r6-ib', 'r7-ib', 'pc-ib', 'mdr-ib', 'tmps-ib', 'irl-ibh', 'irl-ibl', 'extirl-ib', 'sr-ib', 'ib-r0', 'ib-r1', 'ib-r2', 'ib-r3', 'ib-r4', 'ib-r5', 'ib-r6', 'ib-r7', 'ibh-rh', 'ibh-r0h', 'ibh-r1h', 'ibh-r2h', 'ibh-r3h', 'ibh-r4h', 'ibh-r5h', 'ibh-r6h', 'ibh-r7h', 'ibl-rl', 'ibl-r0l', 'ibl-r1l', 'ibl-r2l', 'ibl-r3l', 'ibl-r4l', 'ibl-r5l', 'ibl-r6l', 'ibl-r7l', 'ib-pc', 'ib-mdr', 'ib-mar', 'ib-tmpe', 'carry-in', 'tmpe-set', 'tmpe-clr', 'add', 'sub', 'or', 'and', 'xor', 'alu-sr', 'write', 'read', 'alu-tmps', 'int', 'inta', 'cli', 'sti', 'ib-sr', 'fin', 'ib-ir']

    if (!SignalMap.instance) {
      this.map = signalOrder.reduce(function (acc, curr, idx) {
        acc[curr] = {
          order: idx,
          group: SignalMap.getGroup(curr)
        }
        return acc
      }, {})

      SignalMap.instance = this
    }
    return SignalMap.instance
  }

  static getInstance () {
    return new SignalMap()
  }
}

/**
 * @class SignalSet
 * @description Represents a set of signals
 * @param { Computer } computer - Computer instance
 * @property { Array } signals - Array of signals
 * @property { Object } control - Control object
 * @property { Boolean } control.download - True if a download signal is present
 * @property { Object } control.upload - Object with the groups of upload signals
 * @property { Object } control.groups - Object with the groups of signals
 * @property { SignalMap } signalv - SignalMap instance
 * @property { Object } error - Error object
 *
 */
class SignalSet {
  static error = {
    multiple_download: 'error.signalset.multiple_download',
    same_group: 'error.signalset.same_group',
    read_ongoing: 'error.signalset.read_ongoing',
    write_ongoing: 'error.signalset.write_ongoing',
    badsignal: 'error.signalset.badsignal',
    multiple_upload_group: 'error.signalset.multiple_upload_group',
    inta_read: 'error.signalset.inta_read',
    bad_sr: 'error.signalset.bad_sr',
    signal_present: 'error.signalset.signal_present'
  }

  constructor (computer) {
    this.signalv = SignalMap.getInstance()
    this.computer = computer

    this.reset()
  }

  /**
   * @method reset Resets the signal set
   */
  reset () {
    this._signals = []

    this.control = {
      download: false,
      upload: {},
      groups: {}
    }
  }

  /**
   * @method validateSignalSet Validates a signal set
   * @param {SignalSet} set Signal set
   * @param {Computer} ct Computer instance
   */
  static validateSignalSet (set, ct) {
    const signalv = SignalMap.getInstance()
    const signalMap = signalv.map
    const control = {
      download: false,
      upload: {},
      groups: {}
    }
    try {
    // Check if all signals are valid
      set.forEach(signal => {
        if (!signalMap[signal]) throw new Error(SignalSet.error.badsignal)
        if (set.filter((item) => item === signal).length > 1) throw new Error(SignalSet.error.signal_present)

        const group = signalMap[signal].group

        // An inta signal cannot be executed with a read signal or during an ongoing read
        if (['read', 'inta'].includes(signal)) {
          if (signal === 'inta' && (set.includes('read') || ct.mem.readMode)) throw new Error(SignalSet.error.inta_read)
        }

        // Multiple download signals are not allowed at the same time
        const download = /-ib.?$/.test(signal)
        if (download && control.download) {
          throw new Error(SignalSet.error.multiple_download)
        }

        // Multiple upload signals over the same register are not allowed
        const upload = /ib.?-.+$/.test(signal)
        if (upload && control.upload[group]) {
          throw new Error(SignalSet.error.multiple_upload_group)
        }

        // A read or write signal cannot be executed during an ongoing read or write
        // ib-mar is not allowed during a read or write operation
        // ib-mdr is not allowed during a write operation
        if (group === 'MEMORY' || ['ib-mar', 'ib-mdr'].includes(signal)) {
          if (ct.mem.readMode || ct.mem.writeMode) {
            if (ct.mem.readMode && signal !== 'ib-mdr') throw new Error(SignalSet.error.read_ongoing)
            else throw new Error(SignalSet.error.write_ongoing)
          }
        }

        // In SR group only ib-sr and sr-ib are allowed
        if (group === 'SR' && control.groups[group] && !((signal === 'ib-sr' && set.includes('sr-ib')) || (signal === 'sr-ib' && set.includes('ib-sr')))) throw new Error(SignalSet.error.bad_sr)

        // A signal cannot be added if it belongs to the same group as another signal
        // except for the following cases:
        // - ib-sr, sr-ib
        // general purpose register cases are covered by the first if in this function
        if (control.groups[group] && ['IR', 'TMPE', 'TMPS', 'MEMORY'].includes(group)) {
          throw new Error(SignalSet.error.same_group)
        }

        if (group === 'ALU' && control.groups[group]) {
          if (!(set.includes('carry-in') || signal === 'carry-in')) throw new Error(SignalSet.error.same_group)
        }

        if (upload) control.upload[group] = true

        if (download) control.download = true

        control.groups[group] = true
      })
    } catch (e) {
      throw new Error(e.message)
    }
  }

  /**
   * @method setSignals Sets the signal set
   * @param {SignalSet} set Signal set
   */
  setSignals (set) {
    try {
      this.validateSignalSet(set, this.computer)
      this._signals = set
    } catch (e) {
      throw new Error(e.message)
    }
  }

  /**
   * @method addSignal Adds a signal to the signal set
   * @param {string} signal Signal to add
   * @param {boolean} force Force the addition of the signal with no validation
   */
  addSignal (signal, force = false) {
    const ct = this.computer

    if (!force) SignalSet.validateSignalSet([...this._signals, signal], ct)

    this._signals.push(signal)
  }

  /**
   * @method removeSignal Removes a signal from the signal set
   * @param {String} signal Signal to remove
   */
  removeSignal (signal) {
    const signalMap = this.signalv.map
    const idx = this._signals.indexOf(signal)
    if (idx !== -1) {
      this._signals.splice(idx, 1)
      this.control.groups[signalMap[signal].group] = false
    }
    this.control.upload[signalMap[signal].group] = false
    if (this._signals.filter(s => /-ib.?$/.test(s)).length === 0) this.control.download = false
  }

  /**
   * @method get signals
   * @returns {Array} Array of signals sorted by the order provided in the signal map
   */
  get signals () {
    const signalMap = this.signalv.map
    return this._signals.sort((a, b) => signalMap[a].order - signalMap[b].order)
  }

  /**
   * @method toString Returns a string representation of the signal set
   * @returns {String} String representation of the signal set
   */
  toString () {
    return '[ ' + this.signals.join(' , ') + ' ]'
  }
}

/**
 * @class SignalManager
 * @description Manages the signals of the computer
 * @param { Computer } cpu - Computer instance
 * @property { Computer } cpu - Computer instance
 * @property { SignalSet } signalSet - SignalSet instance
 * @property { Object } topic - Object with the topics of the signals
 * @property { Object } error - Object with the error messages
 * @property { Object } signalv - SignalMap instance
 */
class SignalManager extends ObservableObserver {
  static topic = {
    mem_read: 'signal-mem-read',
    mem_write: 'signal-mem-write',
    fin: 'fin',
    empty: 'topic.signalmanager.empty'
  }

  static error = {
    regnotallowed: 'error.signalmanager.register_not_allowed'
  }

  constructor (cpu) {
    super()
    this.cpu = cpu
  }

  /**
   * @method signalEncode Encodes a signal
   * @description Encodes a signal with the dinamic values provided in the instruction code and broadcasts it
   * @param {String} signal Signal to encode
   * @param {*} value Value for encoding
   */
  signalEncode (signal, value = null) {
    this['sig_' + signal](value)

    let topic = signal.replace('_', '-')
    if (topic === 'read') {
      topic = SignalManager.topic.mem_read
    } else {
      if (topic === 'write') {
        topic = SignalManager.topic.mem_write
      } else {
        if (['add', 'sub', 'and', 'or', 'xor'].includes(topic)) {
          topic = 'alu-op'
        }
      }
    }
    const matches = topic.match(/.*(?<type>ri|rd|rs|rx).*?/)

    if (matches) {
      topic = topic.replace(matches.groups.type, 'r' + value)
    }

    this.broadCast({ topic, value: { value, step: this.cpu.uc.step } })
  }

  /**
   * @method run Runs a signal
   * @param {String} signal Signal to run
   * @returns {String} Signal to run
   */
  run (signal) {
    const rib = signal.match(/r(?<register>[0-7])-ib/)
    const ibr = signal.match(/ib-rd?(?<register>[0-7])/)
    const ibrh = signal.match(/ib[lh]-r(?<register>[0-7])[lh]/)

    if (ibrh) {
      return this.signalEncode(signal.replace(ibrh.groups.register, 'd').replace('-', '_'), (ibrh.groups.register))
    } else {
      if (rib) {
        return this.signalEncode('rs_ib', (rib.groups.register))
      } else {
        if (ibr) {
          return this.signalEncode('ib_rd', (ibr.groups.register))
        }
      }
    }

    return this.signalEncode(signal.replace('-', '_'))
  }

  /**
   * @method sig_ri_ib Sets the value of the IB bus to the value of the register provided
   * @param {*} rx Register number
   */
  sig_ri_ib (rx) {
    this.cpu.ib.value = this.cpu.reg[rx].value
  }

  // Ri Registers movements
  /**
   * @method sig_ib_ri Sets the value of the register provided to the value of the IB bus
   * @param {*} rx Register number
   */
  sig_rs_ib (rx) {
    // this.broadCast({ topic: 'r' + rx + '-ib' })
    this.cpu.ib.value = this.cpu.reg[rx].value
  }

  /**
   * @method sig_ib_rd Sets the value of the register provided to the value of the IB bus
   * @param {*} rx Register number
   */
  sig_ib_rd (rx) {
    this.cpu.reg[rx].value = this.cpu.ib.value
  }

  /**
 * @method sig_ib_rdl Sets the value of the lowest byte of the register provided to the value of the lowest byte of the IB bus
 * @param {*} rx Register number
 */
  sig_ibl_rdl (rx) {
    this.cpu.reg[rx].value = (this.cpu.reg[rx].value & 0xff00) | (this.cpu.ib.value & 0x00ff)
  }

  /**
   * @method sig_ibh_rdh Sets the value of the highest byte of the register provided to the value of the highest byte of the IB bus
   * @param {*} rx Register number
   */
  sig_ibh_rdh (rx) {
    this.cpu.reg[rx].value = (this.cpu.reg[rx].value & 0x00ff) | (this.cpu.ib.value & 0xff00)
  }

  /**
   * @method sig_ib_sr Sets the value of the SR register to the value of the IB bus
   */
  sig_ib_sr () {
    this.cpu.sr.value = this.cpu.ib.value & 0b11111
  }

  /**
   * @method sig_sr_ib Sets the value of the IB bus to the value of the SR register
   */
  sig_sr_ib () {
    this.cpu.ib.value = this.cpu.sr.value & 0b11111
  }

  /**
   * @method alu_sr Sets the value of the SR register to the value of the ALU temp SR register
   */
  sig_alu_sr () {
    const _if = this.cpu.sr.value & 0b1
    let tmp = 0x0000
    tmp = Bitop.set(tmp, 0, _if)
    tmp = Bitop.set(tmp, 1, this.cpu.alu.sf)
    tmp = Bitop.set(tmp, 2, this.cpu.alu.of)
    tmp = Bitop.set(tmp, 3, this.cpu.alu.cf)
    tmp = Bitop.set(tmp, 4, this.cpu.alu.zf)
    this.cpu.sr.value = tmp
  }

  /**
   * @method sig_cli Clears the interrupt flag
   */
  sig_cli () {
    this.cpu.sr.value = this.cpu.sr.value & 0b11110
  }

  /**
   * @method sig_sti Sets the interrupt flag
   */
  sig_sti () {
    this.cpu.sr.value = this.cpu.sr.value | 0b00001
  }

  /**
   * @method sig_ib_ir Sets the value of the IR register to the value of the IB bus
   */
  sig_ib_ir () {
    this.cpu.ir.value = this.cpu.ib.value
  }

  /**
   * @method sig_irl_ibl Sets the value of the lowest byte of the IB bus to the value of the lowest byte of the IR register
   */
  sig_irl_ibl () {
    this.cpu.ib.value = (this.cpu.ib.value & 0xff00) | (this.cpu.ir.value & 0x00ff)
  }

  /**
   * @method sig_irl_ibh Sets the value of the highest byte of the IB bus to the value of the lowest byte of the IR register
   */
  sig_irl_ibh () {
    this.cpu.ib.value = (this.cpu.ib.value & 0x00ff) | ((this.cpu.ir.value & 0x00ff) << 8)
  }

  /**
   * @method sig_extirl_ib Sets the value of the IB bus to the Ext8 value of the IR register
   */
  sig_extirl_ib () {
    this.cpu.ib.value = (this.cpu.ir.value & 0x00ff)
    // If the value of bit 8 of IR is 1 the first 8 bits will be 1 otherwise 0
    if (Bitop.isOn(this.cpu.ir.value, 7)) {
      this.cpu.ib.value = this.cpu.ib.value | (0xff00)
    }
  }

  /**
 * @method sig_pc_ib Sets the value of the IB bus to the value of the PC register
 */
  sig_pc_ib () {
    this.cpu.ib.value = this.cpu.pc.value
  }

  /**
   * @method sig_ib_pc Sets the value of the PC register to the value of the IB bus
   */
  sig_ib_pc () {
    this.cpu.pc.value = this.cpu.ib.value
  }

  /**
   * @method sig_add Adds the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_add () {
    this.cpu.alu.operate(Alu$1.operation.add)
  }

  /**
   * @method sig_sub Substracts the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_sub () {
    this.cpu.alu.operate(Alu$1.operation.sub)
  }

  /**
   * @method sig_or Performs a bitwise OR between the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_or () {
    this.cpu.alu.operate(Alu$1.operation.or)
  }

  /**
   * @method sig_and Performs a bitwise AND between the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_and () {
    this.cpu.alu.operate(Alu$1.operation.and)
  }

  /**
   * @method sig_xor Performs a bitwise XOR between the values of the IB bus and the ALU temp register and stores the result in the ALU temp register
   */
  sig_xor () {
    this.cpu.alu.operate(Alu$1.operation.xor)
  }

  /**
   * @method sig_carry_in Sets the carry in value of the ALU to 1
   */
  sig_carry_in () {
    this.cpu.alu.carry_in = 1
  }

  /**
   * @method sig_ib_mdr Sets the value of the MDR register to the value of the IB bus
   */
  sig_mdr_ib () {
    this.cpu.ib.value = this.cpu.mdr.value
  }

  /**
   * @method sig_ib_mdr Sets the value of the MDR register to the value of the IB bus
   */
  sig_ib_mdr () {
    this.cpu.mdr.value = this.cpu.ib.value
  }

  /**
   * @method sig_fin Broadcasts a fin signal
   */
  sig_fin () {
    this.broadCast({ topic: SignalManager.topic.fin })
  }

  /**
   * @method sig_inta Broadcasts an inta signal
   */
  sig_inta () {
    try {
      const current = this.cpu.computer.io.getNextInt()
      current.inta()
    } catch (e) {
      alert(e.message)
    }
  }

  /**
   * @method sig_ib_mar Sets the value of the MAR register to the value of the IB bus
   */
  sig_ib_mar () {
    this.cpu.mar.value = this.cpu.ib.value
  }

  /**
 * @method sig_read Broadcasts the order to perform a read operation, over the address stored in the MAR register
 */
  sig_read () {
    this.broadCast({ topic: SignalManager.topic.mem_read })
  }

  /**
 * @method sig_write Broadcasts the order to perform a write operation, over the address stored in the MAR register
 */
  sig_write () {
    this.broadCast({ topic: SignalManager.topic.mem_write })
  }

  /**
   * @method sig_alu_tmps Sets the value of the TMPS to the value of the ALU result register
   */
  sig_alu_tmps () {
    this.cpu.tmps.value = this.cpu.alu.result.value
  }

  /**
   * @method sig_tmps_ib Sets the value of the IB bus to the value of the TMPS register
   */
  sig_tmps_ib () {
    this.cpu.ib.value = this.cpu.tmps.value
  }

  /**
   * @method sig_tmpe_ib Sets the value of the tmpe register to the IB bus value
   */
  sig_ib_tmpe () {
    this.cpu.tmpe.value = this.cpu.ib.value
  }

  /**
 * @method sig_tmpe_set Sets the value of the tmpe register
 */
  sig_tmpe_set () {
    this.cpu.tmpe.value = 0xffff
  }

  /**
 * @method sig_tmpe_clr Clears the value of the tmpe register
 */
  sig_tmpe_clr () {
    this.cpu.tmpe.value = 0x0000
  }
}

/**
 * @class Clock
 * @extends Observable
 * @property {number} pulses Number of pulses
 * @property {number} frequency Frequency of the clock
 * @property {number} pulseInterval Interval of the clock
 * @property {number} _status Status of the clock
 * @property {Object} topic Topics used by the device
 * @property {Object} status Status used by the device
 *
*/
class Clock extends Observable {
  static status = {
    started: 1,
    stopped: 0
  }

  static topic = {
    pulse: 'topic.clock.pulse'
  }

  /**
   * @method reset Reset the clock
   * @param {*} pulses Number of pulses to execute
   */
  reset (pulses = 0) {
    if (this.pulseInterval) clearInterval(this.pulseInterval)
    this.pulses = 0
    const that = this
    this.pulseInterval = setInterval(() => {
      if (pulses === 0 || that.pulses < pulses) that.pulses++
      else {
        that.stop()
        return
      }
      this.pulse()
    }, this.frequency)
  }

  /**
   * @method start Start the clock
   * @param {*} pulses Execute a number of pulses
   */
  start (pulses = 0, callable = null) {
    this.reset(pulses)
    this.status = Clock.status.started
    this.callable = callable
  }

  /**
   * @method stop Stop the clock
   */
  stop () {
    if (this.pulseInterval) clearInterval(this.pulseInterval)
    this.status = Clock.status.stopped
  }

  /**
   * @method pulse Pulse the clock
   */
  pulse () {
    this.broadCast({ topic: Clock.topic.pulse, value: { pulses: this.pulses } })
  }

  /**
   * @method status Set the status of the clock
   */
  set status (status) {
    this._status = status
  }

  /**
   * @method status Get the status of the clock
   */
  get status () {
    return this._status
  }

  constructor (frequency = 1000) {
    super()
    this.pulses = 0
    this.frequency = frequency
    this.pulseInterval = null
    this._status = Clock.status.stopped
    this.callable = null
  }
}

const conditionals = []

conditionals[0b100] = 'Z'
conditionals[0b101] = 'NZ'
conditionals[0b000] = 'C'
conditionals[0b001] = 'NC'
conditionals[0b010] = 'O'
conditionals[0b011] = 'NO'
conditionals[0b110] = 'S'
conditionals[0b111] = 'NS'

const instructions = [
  {
    method: 'nop',
    mnemonic: 'NOP',
    mnemonictpl: 'NOP',
    OpCode: 0b00000,
    encode: function () { return 0b00000 << 11 },
    ucode: [
      ['fin']
    ]
  },
  {
    method: 'mov_rdrs',
    mnemonic: 'MOV Rd, Rs',
    mnemonictpl: 'MOV R$0, R$1',
    OpCode: 0b00001,
    regex: '00001([01]{3})([01]{3})00000',
    encode: function (rd, rs) {
      return (0b00001 << 11) | (rd << 8) | (rs << 5)
    },
    ucode: [
      ['rs-ib', 'ib-rd', 'fin']
    ]
  },
  {
    method: 'mov_rdri',
    mnemonic: 'MOV Rd, [Ri]',
    mnemonictpl: 'MOV R$0, [R$1]',
    OpCode: 0b00010,
    regex: '00010([01]{3})([01]{3})00000',
    encode: function (rd, ri) {
      return (0b00010 << 11) | (rd << 8) | (ri << 5)
    },
    ucode: [
      ['ri-ib', 'ib-mar', 'read'],
      [],
      ['mdr-ib', 'ib-rd', 'fin']
    ]
  },
  {
    method: 'mov_rirs',
    mnemonic: 'MOV [Ri], Rs',
    mnemonictpl: 'MOV [R$0], R$1',
    OpCode: 0b00011,
    regex: '00011([01]{3})([01]{3})00000',
    encode: function (ri, rs) {
      return (0b00011 << 11) | (ri << 8) | (rs << 5)
    },
    ucode: [
      ['ri-ib', 'ib-mar'],
      ['rs-ib', 'ib-mdr', 'write'],
      ['fin']
    ]
  },
  {
    method: 'movl_rdinm8',
    mnemonic: 'MOVL Rd, Inm8',
    mnemonictpl: 'MOVL R$0, #short1h',
    OpCode: 0b00100,
    regex: '00100([01]{3})([01]{8})',
    encode: function (rd, inm8) {
      return (0b00100 << 11) | (rd << 8) | inm8
    },
    ucode: [
      ['irl-ibl', 'ibl-rdl', 'fin']
    ]
  },
  {
    method: 'movh_rdinm8',
    mnemonic: 'MOVH Rd, Inm8',
    mnemonictpl: 'MOVH R$0, #short1h',
    OpCode: 0b00101,
    regex: '00101([01]{3})([01]{8})',
    encode: function (rd, inm8) {
      return (0b00101 << 11) | (rd << 8) | inm8
    },
    ucode: [
      ['irl-ibh', 'ibh-rdh', 'fin']
    ]
  },
  {
    method: 'push_rs',
    mnemonic: 'PUSH Rs',
    mnemonictpl: 'PUSH R$0',
    OpCode: 0b00110,
    regex: '00110([01]{3})00000000',
    encode: function (rs) {
      return (0b00110 << 11) | (rs << 8)
    },
    ucode: [
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['rs-ib', 'ib-mdr'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write'],
      ['fin']
    ]
  },
  {
    method: 'pop_rd',
    mnemonic: 'POP Rd',
    mnemonictpl: 'POP R$0',
    OpCode: 0b00111,
    regex: '00111([01]{3})00000000',
    encode: function (rd) {
      return (0b00111 << 11) | (rd << 8)
    },
    ucode: [
      ['r7-ib', 'tmpe-clr', 'carry-in', 'add', 'alu-tmps', 'ib-mar', 'read'],
      ['tmps-ib', 'ib-r7'],
      ['mdr-ib', 'ib-rd', 'fin']
    ]
  },
  {
    method: 'add_rdrs1rs2',
    mnemonic: 'ADD Rd, Rs1, Rs2',
    mnemonictpl: 'ADD R$0, R$1, R$2',
    OpCode: 0b01000,
    regex: '01000([01]{3})([01]{3})([01]{3})00',
    encode: function (rd, rs1, rs2) {
      return (0b01000 << 11) | (rd << 8) | (rs1 << 5) | (rs2 << 2)
    },
    ucode: [
      ['rs1-ib', 'ib-tmpe'],
      ['rs2-ib', 'add', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rd', 'fin']
    ]
  },
  {
    method: 'sub_rdrs1rs2',
    mnemonic: 'SUB Rd, Rs1, Rs2',
    mnemonictpl: 'SUB R$0, R$1, R$2',
    OpCode: 0b01001,
    regex: '01001([01]{3})([01]{3})([01]{3})00',
    encode: function (rd, rs1, rs2) {
      return (0b01001 << 11) | (rd << 8) | (rs1 << 5) | (rs2 << 2)
    },
    ucode: [
      ['rs1-ib', 'ib-tmpe'],
      ['rs2-ib', 'sub', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rd', 'fin']
    ]
  },
  {
    method: 'or_rdrs1rs2',
    mnemonic: 'OR Rd, Rs1, Rs2',
    mnemonictpl: 'OR R$0, R$1, R$2',
    OpCode: 0b01010,
    regex: '01010([01]{3})([01]{3})([01]{3})00',
    encode: function (rd, rs1, rs2) {
      return (0b01010 << 11) | (rd << 8) | (rs1 << 5) | (rs2 << 2)
    },
    ucode: [
      ['rs1-ib', 'ib-tmpe'],
      ['rs2-ib', 'or', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rd', 'fin']
    ]
  },
  {
    method: 'and_rdrs1rs2',
    mnemonic: 'AND Rd, Rs1, Rs2',
    mnemonictpl: 'AND R$0, R$1, R$2',
    OpCode: 0b01011,
    regex: '01011([01]{3})([01]{3})([01]{3})00',
    encode: function (rd, rs1, rs2) {
      return (0b01011 << 11) | (rd << 8) | (rs1 << 5) | (rs2 << 2)
    },
    ucode: [
      ['rs1-ib', 'ib-tmpe'],
      ['rs2-ib', 'and', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rd', 'fin']
    ]
  },
  {
    method: 'xor_rdrs1rs2',
    mnemonic: 'XOR Rd, Rs1, Rs2',
    mnemonictpl: 'XOR R$0, R$1, R$2',
    OpCode: 0b01100,
    regex: '01100([01]{3})([01]{3})([01]{3})00',
    encode: function (rd, rs1, rs2) {
      return (0b01100 << 11) | (rd << 8) | (rs1 << 5) | (rs2 << 2)
    },
    ucode: [
      ['rs1-ib', 'ib-tmpe'],
      ['rs2-ib', 'xor', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rd', 'fin']
    ]
  },
  {
    method: 'cmp_rs1rs2',
    mnemonic: 'CMP Rs1, Rs2',
    mnemonictpl: 'CMP R$0, R$1',
    OpCode: 0b01101,
    regex: '01101([01]{3})([01]{3})00000',
    encode: function (rs1, rs2) {
      return (0b01101 << 11) | (rs1 << 8) | (rs2 << 5)
    },
    ucode: [
      ['rs1-ib', 'ib-tmpe'],
      ['rs2-ib', 'sub', 'alu-sr', 'fin']
    ]
  },
  {
    method: 'not_rds',
    mnemonic: 'NOT Rd/s',
    mnemonictpl: 'NOT R$0',
    OpCode: 0b10000,
    regex: '10000([01]{3})00000000',
    encode: function (rd) {
      return (0b10000 << 11) | (rd << 8)
    },
    ucode: [
      ['rds-ib', 'tmpe-set', 'xor', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rds', 'fin']
    ]
  },
  {
    method: 'inc_rds',
    mnemonic: 'INC Rd/s',
    mnemonictpl: 'INC R$0',
    OpCode: 0b10001,
    regex: '10001([01]{3})00000000',
    encode: function (rd) {
      return (0b10001 << 11) | (rd << 8)
    },
    ucode: [
      ['rds-ib', 'tmpe-clr', 'carry-in', 'add', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rds', 'fin']
    ]
  },
  {
    method: 'dec_rds',
    mnemonic: 'DEC Rd/s',
    mnemonictpl: 'DEC R$0',
    OpCode: 0b10010,
    regex: '10010([01]{3})00000000',
    encode: function (rd) {
      return (0b10010 << 11) | (rd << 8)
    },
    ucode: [
      ['rds-ib', 'tmpe-set', 'add', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rds', 'fin']
    ]
  },
  {
    method: 'neg_rds',
    mnemonic: 'NEG Rd/s',
    mnemonictpl: 'NEG R$0',
    OpCode: 0b10011,
    regex: '10011([01]{3})00000000',
    encode: function (rd) {
      return (0b10011 << 11) | (rd << 8)
    },
    ucode: [
      ['rds-ib', 'tmpe-clr', 'sub', 'alu-sr', 'alu-tmps'],
      ['tmps-ib', 'ib-rds', 'fin']
    ]
  },
  {
    method: 'cli',
    mnemonic: 'CLI',
    mnemonictpl: 'CLI',
    OpCode: 0b10100,
    regex: '1010000000000000',
    encode: function () { return 0b10100 << 11 },
    ucode: [
      ['cli', 'fin']
    ]
  },
  {
    method: 'sti',
    mnemonic: 'STI',
    mnemonictpl: 'STI',
    OpCode: 0b10101,
    regex: '1010100000000000',
    encode: function () { return 0b10101 << 11 },
    ucode: [
      ['sti', 'fin']
    ]
  },
  {
    method: 'int_inm8',
    mnemonic: 'INT Inm8',
    mnemonictpl: 'INT #d0',
    OpCode: 0b10110,
    regex: '10110000([01]{8})',
    encode: function (inm8) {
      return (0b10110 << 11) | inm8
    },
    ucode: [
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['sr-ib', 'ib-mdr'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write'],
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['pc-ib', 'ib-mdr'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write'],
      [],
      ['extirl-ib', 'ib-mar', 'read'],
      [],
      ['mdr-ib', 'ib-pc', 'fin']
    ]
  },
  {
    method: 'iret',
    mnemonic: 'IRET',
    mnemonictpl: 'IRET',
    OpCode: 0b10111,
    regex: '1011100000000000',
    encode: function () { return 0b10111 << 11 },
    ucode: [
      ['r7-ib', 'tmpe-clr', 'carry-in', 'add', 'alu-tmps', 'ib-mar', 'read'],
      ['tmps-ib', 'ib-r7'],
      ['mdr-ib', 'ib-pc'],
      ['r7-ib', 'tmpe-clr', 'carry-in', 'add', 'alu-tmps', 'ib-mar', 'read'],
      ['tmps-ib', 'ib-r7'],
      ['mdr-ib', 'ib-sr', 'fin']
    ]
  },
  {
    method: 'jmp_inm8',
    mnemonic: 'JMP inm8',
    mnemonictpl: 'JMP #d0',
    OpCode: 0b11000,
    regex: '11000000([01]{8})',
    encode: function (inm8) {
      return (0b11000 << 11) | inm8
    },
    ucode: [
      ['pc-ib', 'ib-tmpe'],
      ['extirl-ib', 'add', 'alu-tmps'],
      ['tmps-ib', 'ib-pc', 'fin']
    ]
  },
  {
    method: 'jmp_rx',
    mnemonic: 'JMP Rx',
    mnemonictpl: 'JMP R$0',
    OpCode: 0b11001,
    regex: '11001([01]{3})00000000',
    encode: function (rx) {
      return (0b11001 << 11) | (rx << 8)
    },
    ucode: [
      ['rx-ib', 'ib-pc', 'fin']
    ]
  },
  {
    method: 'call_inm8',
    mnemonic: 'CALL Inm8',
    mnemonictpl: 'CALL #d0',
    OpCode: 0b11010,
    regex: '11010000([01]{8})',
    encode: function (inm8) {
      return (0b11010 << 11) | inm8
    },
    ucode: [
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['pc-ib', 'ib-mdr', 'ib-tmpe'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write'],
      ['extirl-ib', 'add', 'alu-tmps'],
      ['tmps-ib', 'ib-pc', 'fin']
    ]
  },
  {
    method: 'call_rx',
    mnemonic: 'CALL Rx',
    mnemonictpl: 'CALL R$0',
    OpCode: 0b11011,
    regex: '11011([01]{3})00000000',
    encode: function (rx) {
      return (0b11011 << 11) | (rx << 8)
    },
    ucode: [
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['pc-ib', 'ib-mdr'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write'],
      ['rx-ib', 'ib-pc', 'fin']
    ]
  },
  {
    method: 'ret',
    mnemonic: 'RET',
    mnemonictpl: 'RET',
    OpCode: 0b11100,
    regex: '1110000000000000',
    encode: function () { return 0b11100 << 11 },
    ucode: [
      ['r7-ib', 'tmpe-clr', 'carry-in', 'add', 'alu-tmps', 'ib-mar', 'read'],
      ['tmps-ib', 'ib-r7'],
      ['mdr-ib', 'ib-pc', 'fin']
    ]
  },
  {
    // When branching condition is true
    method: 'brcond_inm8',
    mnemonic: 'BRCond Inm8',
    mnemonictpl: 'BR@0 #d1',
    OpCode: 0b11110,
    regex: '11110([01]{3})([01]{8})',
    encode: function (cond, inm8) {
      return (0b11110 << 11) | (cond << 8) | inm8
    },
    ucode: [
      ['pc-ib', 'ib-tmpe'],
      ['extirl-ib', 'add', 'alu-tmps'],
      ['tmps-ib', 'ib-pc', 'fin']
    ]
  },
  {
    // This instruction doesn't exist, it is a HACK FOR BRANCH WHEN BRANCHING CONDITION IS FALSE
    method: 'brcond__inm8',
    mnemonic: 'BRCond Inm8',
    OpCode: 0b11111,
    regex: '11111([01]{3})([01]{8})',
    encode: function (cond, inm8) {
      return (0b11111 << 11) | (cond << 8) | inm8
    },
    ucode: [
      ['fin']
    ]
  }
]

const instructionErrors = {
  lenght_16: 'error.instructions.lenght_16',
  duplicated: 'error.instructions.duplicated',
  structure: 'error.instructions.structure'

}

function decodeInstruction (instruccion) {
  const opcode = _jStr(instruccion).left(5).toString()

  if (baseConvert.bin2dec(opcode) === 0) return 'NOP'

  if (instruccion.length !== 16 && !instruccion.match(/[0,1]{16}/)) throw new Error(instructionErrors.lenght_16)
  const tmpInstruccion = instructions.filter(item => (item.OpCode === baseConvert.bin2dec(opcode)) && item.OpCode !== 0b00000)

  if (tmpInstruccion.length === 0) throw new Error(instructionErrors.lenght_16)
  if (tmpInstruccion.length > 1) throw new Error(instructionErrors.duplicated)

  const regexMatch = instruccion.match(new RegExp(tmpInstruccion[0].regex))
  const result = {
    // metodo: 'todo',
    desc: tmpInstruccion[0].desc,
    params: []
  }

  if (regexMatch.length >= 1) result.params = regexMatch.slice(1, regexMatch.length)
  else throw new Error(instructionErrors.structure)

  let mnemonictpl = tmpInstruccion[0].mnemonictpl

  for (let i = 0; i < result.params.length; i++) {
    if (mnemonictpl) {
      mnemonictpl = mnemonictpl.replace('$' + i, baseConvert.bin2dec(result.params[i]))
      mnemonictpl = mnemonictpl.replace('#' + i, baseConvert.bin2hex(result.params[i]).toUpperCase())
      mnemonictpl = mnemonictpl.replace('#short' + i, _jStr(baseConvert.bin2hex(result.params[i]).toUpperCase()).right(2).toString())
      mnemonictpl = mnemonictpl.replace('#d' + i, Bitop.two(baseConvert.bin2dec(result.params[i]), 8))
      if (_jStr(opcode).left(4).toString() === '1111' && i === 0) {
        mnemonictpl = mnemonictpl.replace('@' + i, conditionals[baseConvert.bin2dec(result.params[i])])
      }
    }
  }

  return mnemonictpl
}

/**
 * @class Uc
 * @extends ObservableObserver
 * @description Emulates the control unit in a CPU
 * @param {Cpu} cpu - The cpu that this control unit belongs to
 * @property {int} step - The current step of the control unit
 * @property {Register} upc - The current value of the uPC
 * @property {int} mode - The current mode of the control unit
 * @property {int} int - The current state of the interrupt flag
 * @property {boolean} debugMode - The current state of the debug mode
 * @property {Array} signals - The current array of signals to execute
 * @property {SignalManager} signalmanager - The signal manager of the control unit
 * @property {Object} topic - The topics that this control unit can broadcast
 * @property {Object} state - The states that this control unit can have
 * @property {Object} mode - The modes that this control unit can have
 * @property {Object} run - The run modes that this control unit can have
 * @property {Object} currentInstruction - The current instruction being executed
 *
 */
const Uc$1 = class Uc extends ObservableObserver {
  static topic = {
    update: 'update-uc',
    signal: 'signal',
    pulse: Clock.topic.pulse,
    error: 'error-uc',
    int: 'int-uc',
    reset: 'reset-uc',
    newstep: 'new-step-uc'
  }

  static state = {
    active_int: true,
    inactive_int: false
  }

  static mode = {
    normal: {
      step: 1,
      instruction: 2,
      auto: 3
    },
    manual: 4
  }

  static run = {
    step: 1,
    instruction: 2,
    auto: 2
  }

  /**
   * @method backup
   * @returns {Object} A backup of the current state of the control unit
   */
  backup () {
    return {
      step: this.step,
      upc: this.upc.value,
      mode: this.mode,
      int: this._int,
      debugMode: this.debugMode,
      signals: this.signals
    }
  }

  /**
   * @method restore
   * @param {*} backup - A backup of the current state of the control unit
   */
  restore (backup) {
    this.step = backup.step
    this.upc.value = backup.upc
    this.mode = backup.mode
    this._int = backup.int
    this.debugMode = backup.debugMode
    this.signals = backup.signals
  }

  /**
   * @method reset
   * @description Resets the control unit to its initial state
   */
  reset () {
    this.step = 0
    this.upc.value = 0x0000
    this.mode = Uc.mode.normal.step
    this._int = Uc.state.inactive_int
    this.debugMode = false
    this.loadSignals([])
    this.broadCast({ topic: Uc.topic.reset })
  }

  constructor (cpu) {
    super()

    this.signalmanager = new SignalManager(cpu)
    this.cpu = cpu
    this.upc = new Register$1('uPC')
    this.reset()
  }

  /**
   * Activates or deactivates the interrupt flag
   */
  set int (value) {
    this._int = value
    if (this._int === Uc.state.active_int) this.broadCast({ topic: Uc.topic.int, value: this.int })
  }

  /**
   * Gets the value of the interrupt flag
   */
  get int () {
    return this._int
  }

  /**
   * @method condIsTrue Evaluates a jump condition
   * @param {int} condition 3 bits
   * @returns {boolean} true if condition is true following the theoretical computer guide
   */
  condIsTrue (condition) {
    switch (condition) {
      case 0b100: return this.cpu.sr.zf === 1
      case 0b101: return this.cpu.sr.zf === 0

      case 0b000: return this.cpu.sr.cf === 1
      case 0b001: return this.cpu.sr.cf === 0

      case 0b010: return this.cpu.sr.of === 1
      case 0b011: return this.cpu.sr.of === 0

      case 0b110: return this.cpu.sr.sf === 1
      case 0b111: return this.cpu.sr.sf === 0
    }

    return false
  }

  /**
   * @method loadSignals Loads an array of signals to execute in the next step
   * @param {Array} signals - The array of signals to load
   */
  loadSignals (signals) {
    this.signals = signals
    this.broadCast({ topic: Uc.topic.update, value: { step: this.step, signals, int: (this.upc.value >= this.cpu.umem.intAddress) } })
  }

  /**
   * @method runInstruction Changes the active runmode in order to execute all signals of the current instruction (till fin signal is reached)
   */
  runInstruction () {
    this.mode = Uc.mode.normal.instruction
  }

  /**
   * @method runAuto Changes the active runmode in order to execute steps in auto mode till a stop signal is received
   */
  runAuto () {
    this.mode = Uc.mode.normal.auto
  }

  /**
   * @method parseInstruction Parses an instruction and returns an object with its decoded value and its registers
   * @param {*} instruction - The instruction to parse
   * @returns {Object} An object with the decoded instruction and its registers
   */
  static parseInstruction (instruction) {
    const tmp = {}
    tmp.bin = baseConvert.dec2bin(instruction)
    tmp.decoded = decodeInstruction(baseConvert.dec2bin(instruction))
    tmp.regs = tmp.decoded.match(/ R[0-9]|Rs[0-9]|\[R[0-9]/g)
    tmp.op1 = Bitop.msb(instruction, 10, 3)
    tmp.op2 = Bitop.msb(instruction, 7, 3)
    tmp.op3 = Bitop.msb(instruction, 4, 3)
    tmp.ri = Bitop.msb(instruction, 15, 5) === 0b00010
    return tmp
  }

  /**
   * @method signalEncodeRegisters Encodes the registers of an instruction in the signals array
   * @param {Array} signalarr - The array of signals to encode
   * @param {Object} currentInstruction - The current instruction being executed
   * @returns {Array} The encoded array of signals
   */
  static signalEncodeRegisters (signalarr, currentInstruction) {
    let signals = signalarr.join(',')
    if (currentInstruction.regs.length === 3) {
      signals = signals.replace('-rd', '-r' + currentInstruction.op1)
      signals = signals.replace('rs1-', 'r' + currentInstruction.op2 + '-')
      signals = signals.replace('rs2-', 'r' + currentInstruction.op3 + '-')
    } else if (currentInstruction.regs.length === 2) {
      signals = signals.replace('rs1-', 'r' + currentInstruction.op1 + '-')
      signals = signals.replace('rs2-', 'r' + currentInstruction.op2 + '-')
      signals = signals.replace('-rd', '-r' + currentInstruction.op1)
      signals = signals.replace('ri-', 'r' + (currentInstruction.ri ? currentInstruction.op2 : currentInstruction.op1) + '-')
      signals = signals.replace('rs-', 'r' + currentInstruction.op2 + '-')
    } else if (currentInstruction.regs.length === 1) {
      signals = signals.replace('-rds', '-r' + currentInstruction.op1)
      signals = signals.replace('-rd', '-r' + currentInstruction.op1)
      signals = signals.replace('ri-', 'r' + currentInstruction.op1 + '-')
      signals = signals.replace('rds-', 'r' + currentInstruction.op1 + '-')
      signals = signals.replace('rs-', 'r' + currentInstruction.op1 + '-')
      signals = signals.replace('rx-', 'r' + currentInstruction.op1 + '-')
    }
    return signals === '' ? [] : signals.split(',')
  }

  /**
   * @method stepNbroadcast Increments the step and broadcasts the new step
   */
  stepNbroadcast () {
    this.step++
    this.broadCast({ topic: Uc.topic.newstep, value: { step: this.step, int: (this.upc.value >= this.cpu.umem.intAddress) } })
  }

  /**
   * @method runStep Executes a step of the control unit
   * @returns {boolean} true if the step was executed successfully
   */
  runStep () {
    // The values of carry_in and IB should not be kept between steps
    this.cpu.alu.carry_in = 0
    this.cpu.ib.value = 0

    if (this.mode === Uc.mode.manual) {
      try {
        SignalSet.validateSignalSet(this.signals, this.cpu.computer)
      } catch (e) {
        alert(e.message)
        return false
      }
    }

    if (this.mode <= Uc.mode.normal.auto) {
      let signalarray = this.cpu.umem.mem[this.upc.value]
      if (this.currentInstruction && this.currentInstruction.regs && signalarray.length !== 0) signalarray = Uc.signalEncodeRegisters(signalarray, this.currentInstruction)
      this.loadSignals(signalarray)
    }

    if (this.signals.length === 0) this.signalmanager.broadCast({ topic: SignalManager.topic.empty })

    for (const signal of this.signals) {
      this.signalmanager.run(signal)

      this.broadCast({ topic: Uc.topic.signal, value: { signal } })

      if (signal === 'fin' && (this.mode <= Uc.mode.normal.auto)) {
        this.stepNbroadcast()

        if (this.int && (this.cpu.sr.if === 1)) {
          this.upc.value = this.cpu.umem.intAddress
        } else {
          this.upc.value = 0
        }

        this.step = 0

        if (this.mode === Uc.mode.normal.instruction) {
          this.cpu.clock.stop()
        }

        return true
      }
    }

    this.stepNbroadcast()

    if (this.mode <= Uc.mode.normal.auto) {
      if (!this.signals.includes('ib-ir')) this.upc.value++
      else {
        let OpCode = (this.cpu.ir.value & 0xF800) >> 11

        if (OpCode === 0b11110 && !this.condIsTrue((this.cpu.ir.value & 0x0700) >> 8)) OpCode = 0b11111

        this.currentInstruction = Uc.parseInstruction(this.cpu.ir.value)

        if (this.debugMode) {
          console.log(this.currentInstruction)
        }
        this.upc.value = this.cpu.umem.addresses[OpCode]
      }
    }

    return true
  }

  /***
   * @method setMode Sets the current mode of the control unit
   */
  setMode (mode) {
    this.mode = mode
  }

  /**
   * @method listen Listens to messages from other components
   * @param {*} message message received
   */
  listen (message) {
    switch (message.topic) {
      case Clock.topic.pulse: {
        try {
          if (this.runStep()) this.broadCast({ topic: Uc.topic.pulse })
        } catch (e) {
          const translated = _jStr(e.message).translate()
          console.log('Exception running step: ' + e)
          if (translated) { alert(translated) } else { alert(e.message) }
          this.cpu.clock.stop()
        }
      }
    }
  }
}

const _cables = []

class SVGCable extends SVGBase {
  static get cables () { return _cables }

  static reset () { _cables.forEach(item => item.DeActivate()) }

  static getCable (label) { return _cables.filter(item => item.id === label)[0] }

  /**
   * Creates a new cable SVG element and adds it to the cables array.
   *
   * @param {SVGContainer} container - The SVG container to add the cable to.
   * @param {string} [id=''] - Optional ID for the cable.
   * @param {string} type - The type of cable (e.g. 'signal', 'int').
   * @param {string[]} [activators] - Activator topics that will activate the cable.
   * @returns {SVGCable} The newly created cable instance.
   */
  static new (container, id = '', cabletype, activators = null) {
    _cables.push(new this(container, id, cabletype, activators))
    return _cables[_cables.length - 1]
  }

  /**
   * Listens for messages and activates or deactivates the cable accordingly.
   *
   * Checks the message topic and cable type to determine if the cable should
   * be deactivated. Checks if the message topic matches any activator topics
   * to determine if the cable should be activated.
   *
   * @param {Object} message - The message object containing the topic.
   */
  listen (message) {
    if (message.topic === Uc$1.topic.update && this.cabletype !== 'int') this.DeActivate()
    if (this.cabletype === 'int' && message.topic === 'inta') this.DeActivate()

    // Activate cable if message topic matches any activator topics
    if (this.activators.length > 0 && this.activators.find(element => {
      const regex = new RegExp(element)
      return regex.test(message.topic)
    })) this.Activate()
  }

  /**
   * Constructor for Cable SVG element
   *
   * @param {SVGContainer} container - SVG container to append cable to.
   * @param {string} id - Optional ID for cable.
   * @param {string} type - Type of cable (e.g. 'signal', 'int').
   * @param {string[]} activators - Topics that activate cable on message.
   */
  constructor (container, id = '', type = 'signal', activators) {
    super('polyline', '', id)

    // this.direction = direction;

    this.activators = activators || []
    this.cabletype = type
    this.points = ''
    this.pointArray = []

    this.group = new SVGGroup('path', this.id)
    container.append(this.group)

    this.group.append(this)

    this.group.addClass(this.cabletype + '-inactive')

    // TODO: Validate direction format

    // this.lineText = new SVGText(x - 3, y - 1, '', gr.gridSize);
    // this.lineText.addClass('wire-text');
    // this.group.append(this.lineText);

    this.lineText = ''
    this.arrows = []
    // if (!this.direction.match("[URDL]{2}")) {
    //     alert ('El formato de entrada no es correcto '+this.direction+', solo se admiten los caracteres URDL');
    // }

    // if (this.direction['0'] != 'N') this.group.append(this.arrowStart);
    // if (this.direction['1'] != 'N') this.group.append(this.arrowEnd);

    // this.redrawArrows();
  }

  /**
   * Adds a new point to the points array.
   * Checks if the new point matches the previous point on x or y before adding.
   * Pushes the new x,y point to the array.
   * Returns the Cable object for chaining.
   * Expects x,y point in px.
   *
   * @param {number} x - The x coordinate of the new point in px
   * @param {number} y - The y coordinate of the new point in px
   * @param {string} [axis='x'] - The axis to match 'x' or 'y'
   * @param {string} [label=''] - Optional label for the new point
   * @returns {Cable} The Cable object
   */
  addPoint (x, y, axis = 'x', label = '') {
    const pointArray = this.pointsArr; const npoints = pointArray.length

    if (npoints > 0) {
      const lastpoint = this.pointsArr[npoints - 1]
      if (x !== lastpoint[0] && y !== lastpoint[1]) {
        if (axis === 'x') pointArray.push([x, lastpoint[1]])
        else pointArray.push([lastpoint[0], y])
      }
    }

    pointArray.push([x, y])

    // if (label !== '' && labeledPoints.filter(item => item.id == label).length() == 0) labeledPoints.push({ id: label, idobj: this.id, obj: this, index: pointArray.length() - 1 })

    this.pointsArr = pointArray

    return this
  }

  addAnchorX (anchorlabel) {
    return this.addPoint(anchors.getAnchor(anchorlabel)[0], this.pointsArr[this.pointsArr.length - 1][1])
  }

  addAnchorY (anchorlabel) {
    return this.addPoint(this.pointsArr[this.pointsArr.length - 1][0], anchors.getAnchor(anchorlabel)[1])
  }

  addAnchor (anchorlabel) {
    return this.addPoint(...anchors.getAnchor(anchorlabel))
  }

  addArrow (direction, pointIndex, label = '') {
    const arrow = new SVGArrow('arrow-end'); const pointArr = this.pointsArr
    this.group.append(arrow)
    const boundBox = arrow.svg.getBoundingClientRect()
    arrow.translate(pointArr[pointIndex][0], pointArr[pointIndex][1] - boundBox.top)// .orientate(direction)
    arrow.orientate(direction)
    return this
  }

  /**
   * Sets the label text, position and offset for the cable line.
   *
   * @param {string} label - The label text
   * @param {number} i - The point index to position the label at
   * @param {string} HV - The horizontal and vertical alignment ('L'eft/'R'ight/'M'iddle, 'U'p/'D'own/'M'iddle)
   * @param {number} oh - Horizontal offset
   * @param {number} ov - Vertical offset
   */
  setLabel (label, i = 0, HV = 'MM', oh = 0, ov = 0) {
    if (this.lineText === '' && label !== '') {
      this.lineText = new SVGText(0, 0, '', gr.gridSize)
      this.group.append(this.lineText)
    }

    this.lineText.text = label

    const point = this.pointsArr[i]

    switch (HV[0]) {
      case 'L': this.lineText.x = point[0] - this.lineText.svg.getBBox().width - 6 - oh
        break
      case 'R': this.lineText.x = point[0] + 4 + oh
        break
      case 'M': this.lineText.x = point[0] - this.lineText.svg.getBBox().width * 0.5 - 4 - oh
        break
    }

    switch (HV[1]) {
      case 'D': this.lineText.y = point[1] + this.lineText.svg.getBBox().height - 2 - ov
        break
      case 'U': this.lineText.y = point[1] - 2 - ov
        break
      case 'M': this.lineText.y = point[1] + this.lineText.svg.getBBox().height * 0.25 + ov
        break
    }

    return this
  }

  /**
   * Adds a point to the end of the cable by offsetting the last point.
   * Expects x increment and y increment in the unit provided by the property
   * currentUnit in the base class SVGElement.
   *
   * @param {number} x - Horizontal offset to add to last point x coordinate
   * @param {number} y - Vertical offset to add to last point y coordinate
   */
  go (x, y) {
    const npoints = this.pointsArr.length
    const lastpoint = this.pointsArr[npoints - 1]
    if (lastpoint) this.addPoint(lastpoint[0] + this.UnitValue(x), lastpoint[1] + this.UnitValue(y))
    else this.addPoint(this.UnitValue(x), this.UnitValue(y))
    return this
  }

  goRight (v) {
    return this.go(v, 0)
  }

  goLeft (v) {
    return this.go(-v, 0)
  }

  goUp (v) {
    return this.go(0, -v)
  }

  goDown (v) {
    return this.go(0, v)
  }

  set points (pointsstr) {
    this.svg.setAttribute('points', pointsstr)
  }

  get points () {
    return this.svg.getAttribute('points')
  }

  get pointsArr () {
    return this.points.trim() !== '' ? this.points.match(/[-0-9.]+[ ]+[-0-9.]+/gm).map(point => point.replace(/  +/g, ' ').split(' ').map(Number)) : []
  }

  set pointsArr (pointArray) {
    this.points = pointArray.map(point => point.join(' ')).join(' ')
  }

  Activate () {
    // Re-append the cable to the DOM so that it is visible above other cables
    this.group.svg.parentNode.append(this.group.svg)

    this.group.removeClass(this.cabletype + '-inactive').addClass(this.cabletype + '-active')
    return this
  }

  DeActivate () {
    this.group.removeClass(this.cabletype + '-active').addClass(this.cabletype + '-inactive')
    return this
  }
}

class SVGRect extends SVGBase {
  constructor (x, y, width, height, _class = '', id = '') {
    super('rect', _class, id)
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  get x () {
    return this.svgNS.getAttribute('x')
  }

  set x (value) {
    this.svgNS.setAttribute('x', value)
  }

  get y () {
    return this.svgNS.getAttribute('y')
  }

  set y (value) {
    this.svgNS.setAttribute('y', value)
  }

  set width (value) {
    this.svgNS.setAttribute('width', value)
  }

  set height (value) {
    this.svgNS.setAttribute('height', value)
  }

  get width () {
    return this.svgNS.getAttribute('width')
  }

  get height () {
    return this.svgNS.getAttribute('height')
  }
}

class SVGTextHex extends SVGText {
  constructor (x, y, text, size = '8', _class = '', id = '') {
    super(x, y, text, size, _class, id)
  }

  set text (value) {
    this.svg.textContent = baseConvert.dec2hex(value).toUpperCase()
  }

  get text () {
    return this.svg.textContent
  }
}

class SVGTspan extends SVGBase {
  constructor (x, dy, text, size = '8', _class = '', id = '') {
    super('tspan', _class, id)
    this.x = x
    this.dy = dy
    this.text = text
    this.fontSize = size
  }

  get text () {
    return this.svg.textContent
  }

  set text (value) {
    this.svg.textContent = value
  }

  get x () {
    return this.svgNS.getAttribute('x')
  }

  set x (value) {
    this.svgNS.setAttribute('x', value)
  }

  get dy () {
    return this.svgNS.getAttribute('dy')
  }

  set dy (value) {
    this.svgNS.setAttribute('dy', value)
  }

  get fontSize () {
    return this.svg.style.fontSize
  }

  set fontSize (value) {
    this.svg.style.fontSize = value + 'px'
  }
}

class SVGTextMulti extends SVGText {
  constructor (x, y, textArr, size = '8', _class = '', id = '') {
    super(x, y, textArr, size, _class, id)
  }

  clear () {
    this.svg.innerHTML = ''
  }

  get text () {
    return this.svg.innerHTML
  }

  set text (valueArr) {
    for (let i = 0; i < valueArr.length; i++) {
      const tmp = new SVGTspan(this.x, i === 0 ? gr.gridSize * 0.5 : gr.gridSize * 1.2, valueArr[i], this.fontSize)
      tmp.svg.setAttribute('overflow', 'scroll')
      this.svg.appendChild(tmp.svg)
    }
  }
}

class SVGTextMultiCaps extends SVGTextMulti {
  get text () {
    return super.text
  }

  set text (valueArr) {
    for (let i = 0; i < valueArr.length; i++) {
      const caps = valueArr[i].toUpperCase().replace(/L-/g, 'l-').replace(/H-/g, 'h-').replace(/L$/g, 'l').replace(/H$/g, 'h').replace(/EXT/g, 'Ext')
      const tmp = new SVGTspan(this.x, i === 0 ? gr.gridSize * 0.5 : gr.gridSize * 1.2, caps, this.fontSize)
      tmp.svg.setAttribute('overflow', 'scroll')
      this.svg.appendChild(tmp.svg)
    }
  }
}

class RectPoints {
  constructor (x1, y1, x2, y2) {
    this.m = (y2 - y1) / (x2 - x1)
    this.b = y2 - this.m * x2
  }

  getY (x) {
    return (this.m * x) + this.b
  }

  getX (y) {
    return (y - this.b) / this.m
  }
}

/**
 * @class CtElement
 * @extends Observer
 * @property {Object} anchors Anchors
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 * @property {Number} bbox.y Bounding box y
 * @property {Number} bbox.width Bounding box width
 * @property {Number} bbox.height Bounding box height
 */
class CtElement extends Observer {
  constructor () {
    super()
    this.anchors = {}
  }

  /**
   * @method addAnchors Add anchors to the element
   * @param {*} callable Callable to process the anchors
   */
  addAnchors (callable) {
    callable(this)
  }

  /**
   * @method addAnchor Add an anchor to the element
   * @param {*} id Name of the anchor
   * @param {*} x x position of the anchor
   * @param {*} y y position of the anchor
   */
  addAnchor (id, x, y) {
    this.anchors[id] = anchors.anchor(id, x, y, this)
  }

  /**
   * @method getAnchors Get the anchors of the element
   * @returns {Object} Anchors
   */
  getAnchors () {
    return this.anchors
  }

  /**
   * @method getBBox Get bounding box
   * @returns {Object} Bounding box
   */
  getBBox () {
    return this.bbox
  }
}

/**
 * @class RegisterValue
 * @extends CtElement
 * @property {SVGGroup} registervalue SVG group
 * @property {SVGRect} valueWrap SVG rect
 * @property {SVGTextHex} value SVG text
 * @property {Boolean} editable Editable
 * @property {String} id Register id
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 * @property {Number} bbox.y Bounding box y
 * @property {Number} bbox.width Bounding box width
 * @property {Number} bbox.height Bounding box height
 * @property {String} id Register id
 * @property {Object} anchors Register anchors
 */
class RegisterValue extends CtElement {
  static labels = {
    bin: 'labels.registervalue.bin',
    dec: 'labels.registervalue.dec',
    dec_c2: 'labels.registervalue.dec_c2'
  }

  constructor (container, x, y, editable = false, callable = null, checkEditable = null, showDec = true) {
    super()

    this.editable = editable
    this.showDec = showDec
    this.id = ''

    this.registervalue = new SVGGroup('', this.id)

    const valueBox = measureSVGText('0000', gr.gridSize * 2)
    const yValue = gr.gridSize * 2 - valueBox.heightAdjust
    const fontSize = gr.gridSize * 2

    const valueWrap = new SVGRect(...gr.gridtoxy(0, 0, gr.gridSize), ...gr.gridtowh(6, 2.2), 'register-sq-inner')
    this.value = new SVGTextHex(...gr.gridtoxy(0.8, 0.2 + gr.pxTogrid(yValue, gr.gridSize)), '0000', fontSize, 'register-value', '', true)

    const that = this

    if (this.editable) {
      this.value.svg.addEventListener('click', (event) => {
        if ((checkEditable === null || checkEditable())) {
          Forms.editableTextInput('Register value', 'register-value', 'register-value', event.target, event.target.parentNode.querySelector('.register-sq-inner').getBoundingClientRect(), that.value.svg.textContent, callable, true)
        }
      })
    }

    this.registervalue.svg.addEventListener('mousemove', (event) => {
      const mousebox = document.querySelector('#mousebox')
      mousebox.style.left = event.clientX + 10 + 'px'
      mousebox.style.top = event.clientY - 10 + 'px'
      mousebox.innerHTML = _jStr(RegisterValue.labels.bin).translate() + baseConvert.hex2bin(that.value.svg.textContent).replace(/([\S\s]{4})/g, '$1&nbsp;')
      if (this.showDec) {
        mousebox.innerHTML += '<br />' + _jStr(RegisterValue.labels.dec).translate() + baseConvert.hex2dec(that.value.svg.textContent) + '<br />' + _jStr(RegisterValue.labels.dec_c2).translate() + Bitop.two(baseConvert.hex2dec(that.value.svg.textContent))
      }
    })

    this.registervalue.svg.addEventListener('mouseleave', (event) => {
      const mousebox = document.querySelector('#mousebox')
      mousebox.style.display = 'none'
    })
    this.registervalue.svg.addEventListener('mouseenter', (event) => {
      let mousebox = document.querySelector('#mousebox')
      if (!mousebox) {
        mousebox = document.createElement('div')
        mousebox.id = 'mousebox'
        document.body.appendChild(mousebox)
      }
      // let mousebox = document.querySelector('#mousebox');
      mousebox.style.display = 'block'
    })

    container.append(this.registervalue)

    this.registervalue
      .append(valueWrap)
      .append(this.value)

    this.registervalue.translate(x, y)

    this.bbox = this.registervalue.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y
  }

  getBBox () {
    return this.bbox
  }

  translate (x, y) {
    this.bbox.x = x
    this.bbox.y = y
    this.registervalue.translate(x, y)
  }

  get text () {
    return this.value.text
  }

  set text (value) {
    this.value.text = value
  }
}

/**
 * @class Alu
 * @extends CtElement
 * @property {SVGGroup} alusvg SVG group
 * @property {SVGPolygon} keystone SVG polygon
 * @property {SVGText} Operation SVG text
 * @property {RegisterValue} Result Register value
 * @property {RegisterValue} Op1 Register value
 * @property {RegisterValue} Op2 Register value
 *
 */
class Alu extends CtElement {
  constructor (container, id, x, y) {
    super()

    const fontSize = gr.gridSize * 2.5

    this.id = id

    this.alusvg = new SVGGroup('', this.id)

    const opLabelSz = measureSVGText('OPR', fontSize)

    this.Operation = new SVGText(0, 0, 'ADD', gr.gridSize * 1.72, 'alu-text')

    this.keystone = new SVGPolygon('', 'alu-keystone')
    this.keystone.setUnit(Unit.grid).go(0, gr.gridSize).go(0.6 * gr.gridSize, -gr.gridSize).goRight(2 * gr.gridSize).go(0.6 * gr.gridSize, gr.gridSize).goLeft(1.4 * gr.gridSize).go(-0.2 * gr.gridSize, -0.3 * gr.gridSize).go(-0.2 * gr.gridSize, 0.3 * gr.gridSize)

    this.recLeft = new RectPoints(0, gr.gridTopx(gr.gridSize), gr.gridTopx(0.6 * gr.gridSize), 0)
    this.recRight = new RectPoints(gr.gridTopx(2.6 * gr.gridSize) + gr.gridSize / 2, 0, gr.gridTopx(3.20 * gr.gridSize) + gr.gridSize / 2, gr.gridTopx(gr.gridSize))

    const wrapOperation = new SVGPolygon('', 'alu-reg-operation')

    wrapOperation.setUnit(Unit.grid)
      .addPoint(this.recLeft.getX(gr.gridTopx(0.3 * gr.gridSize) - 3), gr.gridTopx(0.3 * gr.gridSize))
      .goRight(gr.pxTogrid(opLabelSz.width))
      .goDown(gr.pxTogrid(gr.gridSize * 2))
      .addPoint(this.recLeft.getX(gr.gridTopx(0.3 * gr.gridSize) - 3 + 2 * gr.gridSize), gr.gridTopx(0.3 * gr.gridSize) + 2 * gr.gridSize)

    this.Operation.x = this.recLeft.getX(gr.gridTopx(0.30 * gr.gridSize))
    this.Operation.y = gr.gridTopx(0.32 * gr.gridSize) + opLabelSz.height - 2 * opLabelSz.heightAdjust

    container.appendChild(this.alusvg.svg)

    this.alusvg.append(this.keystone)

    this.alusvg.translate(x, y)
    const label = new SVGText(0, 0, 'ALU', fontSize, 'component-label')
    this.alusvg
      .append(wrapOperation)
      .append(label)

    this.Result = new RegisterValue(this.alusvg, ...gr.gridtoxy(0, 0), false)
    this.Op1 = new RegisterValue(this.alusvg, ...gr.gridtoxy(0, 0), false)
    this.Op2 = new RegisterValue(this.alusvg, ...gr.gridtoxy(0, 0), false)

    this.Result.translate(gr.gridTopx(3.2 * gr.gridSize / 2) - (this.Result.getBBox().width / 2), 0)
    this.Op1.translate(this.Result.getBBox().x - this.Op1.getBBox().width - gr.gridTopx(0.2 * gr.gridSize), gr.gridTopx(gr.gridSize) - this.Op1.getBBox().height)
    this.Op2.translate(this.Result.getBBox().x + this.Result.getBBox().width + gr.gridTopx(0.2 * gr.gridSize), gr.gridTopx(gr.gridSize) - this.Op2.getBBox().height)

    label.x = gr.gridTopx(3.2 * gr.gridSize / 2) - measureSVGText('ALU', fontSize).width / 2
    label.y = fontSize + gr.gridTopx(0.30 * gr.gridSize)

    this.alusvg.append(this.Operation)

    this.bbox = { x, y, width: gr.gridTopx(3.20 * gr.gridSize), height: gr.gridTopx(gr.gridSize) }

    this.addAnchor('alu_sr_out', this.bbox.x + this.recLeft.getX(0.6 * gr.gridSize), this.bbox.y + 0.6 * gr.gridSize)
    this.addAnchor('alu_op_in', this.bbox.x + this.recLeft.getX(this.bbox.height * 0.4), this.bbox.y + this.bbox.height * 0.4)
    this.addAnchor('alu_carry_in', this.bbox.x + this.recLeft.getX(this.bbox.height * 0.8), this.bbox.y + this.bbox.height * 0.8)

    this.addAnchor('alu_carry_out', this.bbox.x + this.recLeft.getX(this.bbox.height * 0.8), this.bbox.y + this.bbox.height * 0.8)

    this.addAnchor('alu_tmps_out', this.bbox.x + this.recRight.getX(0) - 5, this.bbox.y)

    this.addAnchor('alu_ib_bus', this.bbox.x + this.bbox.width - gr.gridTopx(7), this.bbox.y + this.bbox.height)

    this.addAnchor('alu_orig_bottom', this.bbox.x, this.bbox.y + this.bbox.height)

    this.lastMessageStep = 0
  }

  /**
   * @method scale Scale the element
   * @param {Number} n Scale factor
   */
  scale (n) {
    this.keystone.scale(n)
  }

  /**
   * @method updateValue Update the value of the register
   * @param {*} value Value to update
   */
  updateValue (value) {
    this.Op1.text = value.op1
    this.Op2.text = value.op2

    this.Result.text = value.result.value
    if (value.op.toUpperCase() !== 'FAKE') this.Operation.text = value.op.toUpperCase()
  }

  /**
   * @method activate Activate the element
   */
  activate () {
    this.Result.value.addClass('active')
  }

  listen (message) {
    if (/.*-ib.*/.test(message.topic)) {
      this.Op1.value.removeClass('active')
      this.Op2.value.addClass('active')
      this.Result.value.addClass('active')
      this.Operation.removeClass('active')
      if (message.value && message.value.step) this.lastMessageStep = message.value.step
    } else {
      switch (message.topic) {
        case Alu$1.topic.reset:
          this.Result.value.removeClass('active')
          this.Operation.removeClass('active')
          this.Op1.value.removeClass('active')
          this.Op2.value.removeClass('active')
          this.updateValue(message.value)
          break
        case Alu$1.topic.updated:
          this.updateValue(message.value)
          break
        case 'alu-op':
          this.Result.value.addClass('active')
          this.Operation.addClass('active')
          if (message.value && message.value.step) this.lastMessageStep = message.value.step
          break
        case 'tmpe-set':
        case 'ib-tmpe':
          this.Op1.value.addClass('active')
          this.Op2.value.removeClass('active')
          this.Result.value.addClass('active')
          this.Operation.removeClass('active')
          if (message.value && message.value.step) this.lastMessageStep = message.value.step
          break
        case 'tmpe-clr':
          this.Op1.value.addClass('active')
          this.Operation.removeClass('active')
          if (message.value && message.value.step) this.lastMessageStep = message.value.step
          break
        default: {
          if ((message.value && message.value.step && this.lastMessageStep !== message.value.step) || (message.topic === SignalManager.topic.empty)) {
            this.Result.value.removeClass('active')
            this.Operation.removeClass('active')
            this.Op1.value.removeClass('active')
            this.Op2.value.removeClass('active')
          }
        }
      }
    }
  }
}

/**
 * @class Uc
 * @extends CtElement
 * @property {Object} labels Labels
 * @property {SVGText} step Step
 * @property {SVGTextMultiCaps} signalsBlock Signals block
 * @property {SVGRect} signalsBlockContainer Signals block container
 * @property {Function} sselector Signal selector
 *
 */
class Uc extends CtElement {
  static labels = {
    controllabel: 'labels.ctuc.controllabel',
    steplabel: 'labels.ctuc.steplabel'
  }

  constructor (container, id, x, y) {
    super()

    this.sselector = null
    this.id = id

    const group = new SVGGroup('', this.id)

    this.step = new SVGText(...gr.gridtoxy(12.5, 16), '0', 1.8 * gr.gridSize, 'register-value')
    this.signalsBlock = new SVGTextMultiCaps(...gr.gridtoxy(1, 2), [], 1.2 * gr.gridSize, 'register-value')
    this.signalsBlockContainer = new SVGRect(...gr.gridtoxy(0.5, 0.5), ...gr.gridtowh(8.5, 17), 'register-sq-inner')
    this.signalsBlock.svg.addEventListener('click', (e) => { if (this.sselector) this.sselector() })
    this.signalsBlockContainer.svg.addEventListener('click', () => { if (this.sselector) this.sselector() })

    container.appendChild(group.svg)

    const outerWrapper = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(17, 18), 'register-sq-outer')
    group.append(outerWrapper)
      .append(this.signalsBlockContainer)
      .append(this.signalsBlock)
      .append(new SVGRect(...gr.gridtoxy(9.5, 10.5), ...gr.gridtowh(7, 7), 'register-sq-step'))
      .append(new SVGText(...gr.gridtoxy(10.9, 6.5), _jStr(Uc.labels.controllabel).translate(), 2.5 * gr.gridSize, 'component-label'))
      .append(new SVGText(...gr.gridtoxy(10.8, 13), _jStr(Uc.labels.steplabel).translate(), 1.8 * gr.gridSize, 'register-value'))
      .append(this.step)

    group.translate(x, y)

    this.bbox = outerWrapper.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.addAnchor('ib_ir_out', this.bbox.x + this.bbox.width, this.bbox.y * 1.1)
    this.addAnchor('irl_ibh_out', this.bbox.x + this.bbox.width, this.bbox.y * 1.5)
    this.addAnchor('irl_ibl_out', this.bbox.x + this.bbox.width, this.bbox.y * 1.9)
    this.addAnchor('ExtIrl_ib_out', this.bbox.x + this.bbox.width, this.bbox.y * 2.3)

    this.addAnchor('ir_in_bus', this.bbox.x + this.bbox.width, this.bbox.y * 3.3)

    this.addAnchor('uc_out_left', this.bbox.x, this.bbox.y + this.bbox.height * 0.5)
    this.addAnchor('uc_in_left', this.bbox.x, this.bbox.y + this.bbox.height * 0.6)

    this.addAnchor('uc_in_clock', this.bbox.x, this.bbox.y + gr.gridTopx(2))

    this.addAnchor('uc_fin_out', this.bbox.x, this.bbox.y + this.bbox.height - gr.gridTopx(1))
    this.addAnchor('uc_fin_in', this.bbox.x, this.bbox.y + this.bbox.height - gr.gridTopx(2.5))

    this.addAnchor('uc_joint_up', this.bbox.x + this.bbox.width * 0.55, this.bbox.y)

    this.addAnchor('uc_down', this.bbox.x + gr.gridTopx(2), this.bbox.y + this.bbox.height)
  }

  updateValue (value) {
    this.step.text = (value.int ? 'I' : '') + '' + (value.step)
    this.signalsBlock.clear()
    this.signalsBlock.text = value.signals
  }

  /**
   * @method setSignalSelector Set signal selector
   * @param {*} selector Selector
   */
  setSignalSelector (selector) {
    this.sselector = selector
  }

  listen (message) {
    switch (message.topic) {
      case Uc$1.topic.newstep:
        this.step.text = (message.value.int ? 'I' : '') + '' + (message.value.step)
        break
      case Uc$1.topic.update: {
        this.updateValue(message.value)
      }
    }
  }
}

/**
 * @class Bus
 * @extends Bit16Val
 * @property {number} value Value of the bus
 * @property {string} _name Name of the bus
 */
const Bus$1 = class Bus extends Bit16Val {
  constructor (name, value) {
    super(name + '-bus', value)
  }

  /**
   * @method value Get the value of the bus
   * @return {number} Value of the bus
   */
  get value () {
    return super.value
  }

  /**
   * @method reset Reset the bus
   */
  reset () {
    super.value = 0x0000
    this.broadCast({ topic: this._name + '_' + Bus.topic.reset, value: this.value })
  }

  /**
   * @method value Set the value of the bus
   * @param { int } newvalue int of 16bit range
   */
  set value (newvalue) {
    super.value = newvalue
    this.broadCast({ topic: this._name + '_' + Bus.topic.updated, value: this.value })
  }
}

/**
 * @class Bus
 * @extends CtElement
 * @property {SVGGroup} bussvg SVG group
 * @property {SVGPolygon} polygon SVG polygon
 * @property {SVGText} Busname Bus name
 * @property {SVGTextHex} Busvalue Bus value
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 * @property {Number} bbox.y Bounding box y
 * @property {Number} bbox.width Bounding box width
 * @property {Number} bbox.height Bounding box height
 * @property {String} id Bus id
 *
 */
class Bus extends CtElement {
  constructor (container, id, x, y) {
    super()

    this.id = id

    this.bussvg = new SVGGroup('', this.id)

    this.polygon = new SVGPolygon('0 0 14 8 4 12 10 16 2 26 40 26 30 16 36 12 26 8 40 0', 'bus')

    container.appendChild(this.bussvg.svg)

    this.bussvg.append(this.polygon)
    this.bussvg.translate(x, y)

    this.Busname = new SVGText(gr.gridTopx(19), -3, 'BUS', gr.gridSize, 'wire-text')
    this.Busname.addClass('wire-text-inactive')

    this.Busvalue = new SVGTextHex(gr.gridTopx(21), gr.gridSize * 2, '0000', gr.gridSize * 2, 'register-value', '', true)

    this.bussvg.append(this.Busname)
    this.bussvg.append(this.Busvalue)

    this.bbox = this.polygon.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y
  }

  /**
   * @method  addClass Add a class to the bus dom element
   * @param {String} cssclass
   */
  addClass (cssclass) {
    this.polygon.addClass(cssclass)
  }

  /**
   * @method  scale Scale the bus dom element
   * @param {*} n Scale factor
   */
  scale (n) {
    this.bussvg.scale(n)
  }

  /**
   * @method  width Get the bus dom element width
   */
  get width () {
    return this.bbox.width
  }

  /**
   * @method  width Set the bus dom element width
   * @param {Number} px Width in pixels
   */
  set width (px) {
    const points = this.polygon.pointsArr
    for (let i = 5; i < points.length; i++) {
      points[i][0] = points[i][0] + (px - 40)
    }
    this.polygon.pointsArr = points
    this.bbox.width = px
  }

  /**
   * @method updateValue Update the bus value
   * @param {*} value Value to update
   */
  updateValue (value) {
    this.Busvalue.text = value
  }

  /**
   * @method activate Activate the bus
   * @param {*} value Value to update
   */
  activate () {
    this.bussvg.addClass('active')
  }

  /**
   * @method deactivate Deactivate the bus
   */
  deactivate () {
    this.bussvg.removeClass('active')
  }

  /**
   * @method listen Listen to the bus
   * @param {*} message Message received
   */
  listen (message) {
    switch (message.topic) {
      case this.id + '-bus_' + Bus$1.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case this.id + '-bus_' + Bus$1.topic.updated: {
        this.updateValue(message.value)
      }
    }
  }

  /**
   * @method setLabel Set the bus label
   * @param {*} text Text to set
   */
  setLabel (text) {
    this.Busname.text = text
  }
}

/**
 * @class BusSCB
 * @extends Bus
 * @property {Object} labels Labels
 */
class BusSCB extends Bus {
  static labels = {
    control_bus: 'labels.busscb.control_bus'
  }

  constructor (container, id, x, y) {
    super(container, id, x, y)

    this.width = gr.gridTopx(46)
    this.setLabel(_jStr(BusSCB.labels.control_bus).translate())

    this.Busvalue.remove()

    this.addAnchor('int_signal', this.bbox.x + gr.gridTopx(4), this.bbox.y)

    this.addAnchor('memory_write_read', this.bbox.x + gr.gridTopx(4), this.bbox.y + this.bbox.height)
    this.addAnchor('io_write_read', this.bbox.x + this.bbox.width - gr.gridTopx(4), this.bbox.y + this.bbox.height)

    this.addAnchor('io_inta', this.bbox.x + this.bbox.width, this.bbox.y)
    this.addAnchor('io_int', this.bbox.x + this.bbox.width - gr.gridTopx(0.4), this.bbox.y + gr.gridTopx(1.3))

    this.addAnchor('bus_scb_inta_in', this.bbox.x + this.bbox.width - gr.gridTopx(2), this.bbox.y)
    this.addAnchor('bus_scb_write_in', this.bbox.x + this.bbox.width - gr.gridTopx(4), this.bbox.y)
    this.addAnchor('bus_scb_read_in', this.bbox.x + this.bbox.width - gr.gridTopx(3), this.bbox.y)
  }
}

/**
 * @class BusSAB
 * @extends Bus
 * @property {Number} lastMessageStep Last message step
 * @property {Object} labels Labels
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 *
 *
 */
class BusSAB extends Bus {
  static labels = {
    address_bus: 'labels.bussab.address_bus'
  }

  constructor (container, id, x, y) {
    super(container, id, x, y)

    this.width = gr.gridTopx(46)
    this.setLabel(_jStr(BusSAB.labels.address_bus).translate())

    this.addAnchor('bus_sab_orig', this.bbox.x, this.bbox.y)
    this.addAnchor('bus_sab_orig_bottom', this.bbox.x, this.bbox.y + this.bbox.height)

    this.addAnchor('sab_io_bus', this.bbox.x + this.bbox.width - gr.gridTopx(4), this.bbox.y + this.bbox.height)

    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case 'ib-mar':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      case SignalManager.topic.empty:
        this.deactivate()
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

/**
 * Emulates Memory component in a Computer
 */

/**
 * @class Memory
 * @extends ObservableObserver
 * @property { int } size Specifies in bytes the size of the addressable space
 * @property { int[] } positions Specifies in bytes the size of the addressable space
 * @property { int[] } moduletypes Specifies the sizes of available modules in KBs
 * @property { boolean } io I/O Devices manager. If false it means that there is no I/O Manager
 * @property { boolean } _readmode Puts memory in read mode
 * @property { int } _readstep Counts the steps since readMode was activated
 * @property { boolean } _writemode Puts memory in read mode
 * @property { int } _writestep Counts the steps since writeMode was activated
 * @property { Bus } sab Link to system address bus
 * @property { Bus } sdb Link to system data bus
 * @property { Object } labels Labels used by the device
 * @property { Object } error Errors used by the device
 * @property { Object } topic Topics used by the device
 * @property { Object } rmode Read mode
 * @property { Object } wmode Write mode
 *
 */
class Memory extends ObservableObserver {
  static labels = {
    IOlabel: 'labels.memory.IOlabel',
    empty: 'labels.memory.empty'
  }

  static error = {
    address_space: 'error.memory.address_space',
    module_size: 'error.memory.module_size',
    module_collision: 'error.memory.module_collision',
    module_nomodule: 'error.memory.module_nomodule',
    io_module_present: 'error.memory.io_module_present',
    nomodule_noes: 'error.memory.nomodule_noes',
    module_notvalid: 'error.memory.module_notvalid',
    mode_notsupported: 'error.memory.notsupported'
  }

  static topic = {
    reset: 'topic.memory.reset',
    module_add: 'topic.memory.module_add',
    module_rm: 'topic.memory.module_rm',
    edited_mem_pos: 'topic.memory.edited_mem_pos',
    mem_sdb: 'topic.memory.mem_sdb'
  }

  static rmode = {
    on: true, off: false
  }

  static wmode = {
    on: true, off: false
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    return JSON.stringify({
      size: this.size,
      positions: this.positions,
      modules: this.modules,
      moduletypes: this.moduletypes,
      _readmode: this._readmode,
      _readstep: this._readstep,
      _writemode: this._writemode,
      _writestep: this._writestep
    })
  }

  /**
   * @method restore Restore the device
   * @param {*} backup Backup of the device
   */
  restore (backup) {
    const b = JSON.parse(backup)
    this.size = b.size
    this.positions = b.positions
    this.modules = b.modules
    this.moduletypes = b.moduletypes
    this._readmode = b._readmode
    this._readstep = b._readstep
    this._writemode = b._writemode
    this._writestep = b._writestep
  }

  /**
   * @method constructor Constructor
   * @param { int } size Specifies in bytes the size of the addressable space
   * @param { Bus } sab Link to system address bus
   * @param { Bus } sdb Link to system data bus
   * @param { int[] } moduletypes Specifies sizes of available modules in KBs
   */
  constructor (size, sab, sdb, moduletypes = [4, 8, 16, 32]) {
    super()

    // Size of addressable space
    this.size = size
    // Addressable space
    this.positions = []
    // Modules mapped to the addressable space
    this.modules = []
    // Module types available
    this.moduletypes = moduletypes

    // ES Devices manager. If false it means that there is no ES Manager
    this.io = false

    // Puts memory in read mode
    this._readmode = Memory.rmode.off
    // Counts the steps since readMode was activated
    this._readstep = 0

    // Puts memory in read mode
    this._writemode = Memory.wmode.off
    // Counts the steps since writeMode was activated
    this._writestep = 0

    // Link to system address bus
    this.sab = sab
    // Link to system data bus
    this.sdb = sdb

    // Initialize addresable space
    this.init()
  }

  /**
   * @method setIOManager Set the I/O Manager
   * @param {*} IOManager Link to IOManager
   */
  setIOManager (IOManager) {
    IOManager.linkMemory(this)
    this.io = IOManager
  }

  /**
   * @method isAvailable Checks if memory available
   * @description Checks if a block of a certain size is available, meaning that not a memory module nor a device is mapped in that block
   * @param { int } position first memory position to check
   * @param { int } size number of positions starting from position
   * @returns { boolean } True if space available False if not
   */
  isAvailable (position, size = 1) {
    const memmodules = this.modules.filter((item) => { return (!(position > item[2] || (position < item[0] && position + (size - 1) < item[0]))) }).length === 0
    // const devices = this.iomap.filter((item) => { return (!(position > item[2] || (position < item[0] && position + (size - 1) < item[0]))) }).length === 0
    if (this.io) return memmodules && this.io.checkNoDevices(position, size)
    else return memmodules
  }

  /**
 * @method init Init memory array
 * @description Sets every position to it's default value
 */
  init () {
    this.positions = Array.from({ length: this.size }, (_) => 'XXXX')
    for (let i = 0; i < this.modules.length; i++) {
      for (let j = this.modules[i][0]; j <= this.modules[i][2]; j++) {
        this.positions[j] = 0x0000
      }
    }
    this.readMode = Memory.rmode.off
    this.writeMode = Memory.wmode.off
  }

  /**
 * @method reset Reset memory
 * @description Resets memory to it's default values
 */
  reset () {
    this.init()
    this.broadCast({ topic: Memory.topic.reset })
  }

  /**
   * @method clockPulse Clock pulse
   * @description Clock pulse count. Each read/write operations takes two clock cycles to be executed. Cycles are taken into account only if the flag readMode or writeMode are active
   */
  clockPulse () {
    if (this._readmode) {
      if (this._readstep < 1) this._readstep++
      else this.read()
    }

    if (this._writemode) {
      if (this._writestep < 1) this._writestep++
      else this.write()
    }
  }

  /**
 * Add a memory module
 *
 * Tries to add a module of size @size in the position @address
 *
 * @param { int } address position of addressable space.
 * @param { int } size size in Kb of the module.
 * @throws { Memory.error.module_notvalid } Will throw an exception error when trying to use a no valid module
 * @throws { Memory.error.adress_space } Will throw an exception error when placing the module we would reach max address available
 * @throws { Memory.error.module_size } Will throw an exception error when we try to place the module in an @address not multiple of @size.
 * @throws { Memory.error.module_collision } Will throw an error when we try to place the module over another module.
 */

  /**
   * @method addModule Add a memory module
   * @description Tries to add a module of size @size in the position @address
   * @param { int } address position of addressable space.
   * @param { int } size size in Kb of the module.
   * @throws { Memory.error.module_notvalid } Will throw an exception error when trying to use a no valid module
   * @throws { Memory.error.adress_space } Will throw an exception error when placing the module we would reach max address available
   * @throws { Memory.error.module_size } Will throw an exception error when we try to place the module in an @address not multiple of @size.
   * @throws { Memory.error.module_collision } Will throw an error when we try to place the module over another module.
   * @throws { Memory.error.io_module_present } Will throw an error when we try to place the module over a device.
   */
  addModule (address, size) {
    if (!this.moduletypes.includes(size)) throw new Error(Memory.error.module_notvalid)
    if (address + (size * 1024) > this.size) throw new Error(Memory.error.address_space)
    if (address % (size * 1024) !== 0) throw new Error(Memory.error.module_size)
    // if (this.modules.filter((item) => { return (item[0] >= address && item[0] <= (address + size * 1024) - 1) || (address >= item[0] && address <= item[2]) }).length > 0) { throw new Error(Memory.error.module_collision) }
    if (!this.isAvailable(address, size * 1024)) {
      if (this.io) {
        if (!this.io.checkNoDevices(address, size)) throw new Error(Memory.error.io_module_present)
      }
      throw new Error(Memory.error.module_collision)
    }

    this.modules.push([address, size, (address + size * 1024) - 1])

    for (let i = address; i <= (address + size * 1024) - 1; i++) {
      this.positions[i] = 0x0000
    }

    this.broadCast({ topic: Memory.topic.module_add })
  }

  /**
   * @method removeModule Removes module at provided starting address
   *
   * @param { int } address Position where the module to remove is mapped
   * @throws { Memory.error.module_nomodule } Will throw an error when there is no module to remove
   */
  removeModule (address) {
    const index = this.modules.findIndex((item) => { return item[0] === address })

    if (!(index >= 0)) throw new Error(Memory.error.module_nomodule)

    const addressLimits = [this.modules[index][0], this.modules[index][2]]
    this.modules.splice(index, 1)

    for (let i = addressLimits[0]; i <= addressLimits[1]; i++) {
      this.positions[i] = 'XXXX'
    }

    this.broadCast({ topic: Memory.topic.module_rm })
  }

  /**
 * @method isDevice Check if an address is mapped to a device
 * @param { int } address address to check
 */
  isDevice (address) {
    return this.io.isDevice(address)
  }

  /**
   * @method isMemModule Check for memory module mapped in address
   * @description Whether a memory module object if there is a Device mapped on the provided address or false in any other case
   * @param { int } address memory position to look for a Module
   */
  isMemModule (address) {
    const module = this.modules.filter((item) => { return address >= item[0] && address <= item[2] })
    if (module.length > 0) return module[0]
    return false
  }

  /**
 * @method readMode Gets the actual readMode
 * @returns { boolean } readMode
 */
  get readMode () {
    return this._readmode
  }

  /**
   * @method readMode Sets the readmode to whether on or off
   * @param { boolean } mode readMode
   * @throws { Memory.error.not_supported } when nor on nor off is provided as mode
   */
  set readMode (mode) {
    switch (mode) {
      case Memory.rmode.on:
        this._readmode = mode
        break
      case Memory.rmode.off:
        this._readmode = mode
        this._readstep = 0
        break
      default: {
        throw new Error(Memory.error.mode_notsupported)
      }
    }
  }

  /**
   * @method read Executes a memory reading operation
   * @description Puts in the data bus the value stored in the address position provided by address bus
   */
  read () {
    const address = this.sab.value

    const data = this.getPos(address)
    this.sdb.value = data
    this.readMode = Memory.rmode.off
    this.broadCast({ topic: Memory.topic.mem_sdb })
  }

  /**
   * @method writeMode Gets the actual writeMode
   */
  get writeMode () {
    return this._writemode
  }

  /**
   * @method writeMode Sets the writemode to whether on or off
   * @param { boolean } mode writeMode
   * @throws { Memory.error.not_supported } when nor on nor off is provided as mode
   */
  set writeMode (mode) {
    switch (mode) {
      case Memory.wmode.on:
        this._writemode = mode
        break
      case Memory.wmode.off:
        this._writemode = mode
        this._writestep = 0
        break
      default: throw new Error(Memory.error.mode_notsupported)
    }
  }

  /**
   * @method write Executes a memory writing operation
   * @description Gets the data bus value and stores it in the address position provided by address bus
   */
  write () {
    const address = this.sab.value
    this.setPos(address, this.sdb.value)
    this.writeMode = Memory.wmode.off
  }

  /**
   * Get value stored in a memory position
   * @param { int } address memory position to get the value from
   * @returns the value stored in the memory module or device mapped in the specified address
   * @throws {Memory.error.nomodule_noes} When there is nothing mapped in the specified address
   */
  getPos (address) {
    if (this.isMemModule(address)) return this.positions[address]
    else {
      if (this.io) {
        const device = this.isDevice(address)
        if (device !== false) {
          return device[3].getPos(address - device[0])
        }
      }
    }
    throw new Error(Memory.error.nomodule_noes)
  }

  /**
   * @method peekPos Allows to peek a value in a memory position
   * @description Allows to peek the value stored in a position without triggering a reading operation
   * @param { int } address memory position to get the value from
   * @returns the value stored in the memory module or the literal Memory.literal.IOlabel if a device mapped in the specified address
   */
  peekPos (address) {
    if (this.isMemModule(address)) return this.getPos(address)
    else {
      if (this.io) {
        const device = this.isDevice(address)
        if (device !== false) {
          return Memory.labels.IOlabel
        }
      }
      return Memory.labels.empty
    }
  }

  /**
 * @method setPos Store a value in a memory position
 * @param { int } address Memory position to store the value
 * @param { int } value Value to store
 * @throws { Memory.error.nomodule_noes } When there is no module or device to write to
 */
  setPos (address, value) {
    if (this.isMemModule(address)) {
      this.positions[address] = value

      this.broadCast({ topic: Memory.topic.edited_mem_pos, value: { address, value } })
    } else {
      if (this.io) {
        const device = this.isDevice(address)
        if (device !== false) {
          device[3].setPos(address - device[0], value)
        } else {
          throw new Error(Memory.error.nomodule_noes)
        }
      } else {
        throw new Error(Memory.error.nomodule_noes)
      }
    }
  }

  /**
   * @method getMemModules Get the memory modules
   * @param {*} message Message received
   */
  listen (message) {
    switch (message.topic) {
      case Uc$1.topic.pulse:
        this.clockPulse()
        break
      case SignalManager.topic.mem_read:
        this.readMode = Memory.rmode.on
        break
      case SignalManager.topic.mem_write:
        this.writeMode = Memory.wmode.on
        break
    }
  }
}

/**
 * @typedef {Object} withInt
 */
const withInt = {
  /**
   * @property {boolean} activeInt Indicates if the device is in interrupt mode
   */
  activeInt: false,
  /**
   * @method clockPulse When the clock pulse is received, the device checks if read operation must be executed
   */
  clockPulse () {
    if (this.readMode) {
      if (this.readStep < 1) this.readStep++
      else this.exeRead()
    }
  },
  /**
   * @method inta When the CPU sends an INTA signal, the device checks if it has to acknowledge it
   */
  inta () {
    if (this.int) {
      this.readMode = true
    }
  },
  /**
   * @method resetReadMode Reset the read mode
   */
  resetReadMode () {
    this.readMode = false
    this.readStep = 0
    this.activeInt = false
  },
  /**
   * @method exeRead Execute the read operation
   */
  exeRead () {
    this.sdb.value = this.vector
    this.resetReadMode()
    this.cpu.unSetInt()
    this.broadCast({ topic: Device.topic.dev_sdb })
  },
  /* istanbul ignore next */
  /**
   * @method isInt Check if the device is in interrupt mode
   */
  isInt () {
    throw new Error('Implement this!')
  }
}

/**
 * @class Device
 * @extends ObservableObserver
 * @abstract
 * @property {string} name Name of the device
 * @property {number} baseaddress Base address of the device
 * @property {number} memsize  Size that device needs in memory
 * @property {number} sdb SDB bus link
 * @property {number} cpu CPU link
 */
class Device extends ObservableObserver {
  static topic = {
    dev_sdb: 'dev-sdb'
  }

  constructor (name, baseaddress, mempositions, sdb, cpu) {
    super()
    this.sdb = sdb
    this.cpu = cpu
    this.name = name
    this.baseaddress = baseaddress
    this.memsize = mempositions
  }

  /* istanbul ignore next */
  /**
   * @method getPos Read the device position value
   */
  getPos () {
    throw new Error('Implement this!')
  }

  /* istanbul ignore next */
  /**
   * @method setPos Set the device position value
   */
  setPos () {
    throw new Error('Implement this!')
  }
}

/**
 * @class BusSDB
 * @extends Bus
 * @property {Number} lastMessageStep Last message step
 * @property {Object} labels Labels
 *
 */
class BusSDB extends Bus {
  static labels = {
    data_bus: 'labels.bussdb.data_bus'
  }

  reset () {
    this.updateValue(0x0000)
  }

  constructor (container, id, x, y) {
    super(container, id, x, y)

    this.width = gr.gridTopx(46)
    this.setLabel(_jStr(BusSDB.labels.data_bus).translate())

    this.addAnchor('bus_sdb_orig', this.bbox.x, this.bbox.y)
    this.addAnchor('bus_sdb_orig_bottom', this.bbox.x, this.bbox.y + this.bbox.height)

    this.addAnchor('sdb_io_bus', this.bbox.x + this.bbox.width - gr.gridTopx(4), this.bbox.y + this.bbox.height)

    this.lastMessageStep = 0
  }

  // activate () {
  //   this.bussvg.addClass('active')
  // }

  // deactivate () {
  //   this.bussvg.removeClass('active')
  // }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case this.id + '-bus_' + Bus$1.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case 'ib-mdr':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      case Memory.topic.mem_sdb:
      case Device.topic.dev_sdb:
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      case SignalManager.topic.empty:
        this.deactivate()
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

/**
 * @class Ir
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 * @property {Object} bbox Bounding box
 */
class Ir extends CtElement {
  constructor (container, id, x, y) {
    super()

    this.id = id

    const group = new SVGGroup('', this.id)

    container.appendChild(group.svg)

    const outerWrapper = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(18, 9.5), 'register-sq-outer')

    this.operationwrap = new SVGRect(...gr.gridtoxy(1, 3), ...gr.gridtowh(16, 2), 'register-sq-inner')
    this.operation = new SVGText(...gr.gridtoxy(1.1, 4.8), 'NOP', 1.8 * gr.gridSize, 'register-value')

    group.append(outerWrapper)
      .append(new SVGText(...gr.gridtoxy(7.5, 2), 'IR', 2 * gr.gridSize, 'component-label'))
      .append(this.operationwrap)
      .append(this.operation)

    this.value = new RegisterValue(group, ...gr.gridtoxy(5.8, 6), false, null, null, false)

    group.translate(x, y)

    this.bbox = outerWrapper.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.addAnchor('ib_ir_in', this.bbox.x, this.bbox.y * 1.1)
    this.addAnchor('irl_ibh_in', this.bbox.x, this.bbox.y * 1.5)
    this.addAnchor('irl_ibl_in', this.bbox.x, this.bbox.y * 1.9)
    this.addAnchor('ExtIrl_ib_in', this.bbox.x, this.bbox.y * 2.3)

    this.addAnchor('ir_bus_ib', this.bbox.x + this.bbox.width, (this.bbox.y + this.bbox.height * 0.5))

    this.addAnchor('uc_out_bus', this.bbox.x, this.bbox.y * 3.3)

    this.reDraw()

    this.lastMessageStep = 0
  }

  /**
   * @method reDraw Redraw the register dom element
   */
  reDraw () {
    const optext = measureSVGText(this.operation.text)

    this.operation.translate((optext.x + this.operationwrap.width * 0.5) - optext.width * 0.55, optext.y + optext.height - optext.heightAdjust - 2)
  }

  updateValue (value) {
    this.value.text = baseConvert.dec2hex(value)
    this.operation.text = decodeInstruction(baseConvert.dec2bin(value))
    this.reDraw()
  }

  activate () {
    this.value.value.addClass('active')
    this.operation.addClass('active')
  }

  deactivate () {
    this.value.value.removeClass('active')
    this.operation.removeClass('active')
  }

  listen (message) {
    switch (message.topic) {
      case this.id + '_' + Register$1.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case this.id + '_' + Register$1.topic.updated:
        this.updateValue(message.value)
        break
      case 'ib-ir':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default:
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
        break
    }
  }
}

/**
 * @class Register
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 * @property {Number} bbox.y Bounding box y
 * @property {Number} bbox.width Bounding box width
 * @property {Number} bbox.height Bounding box height
 * @property {String} id Register id
 * @property {Object} anchors Register anchors
 *
 */
class Register extends CtElement {
  static current = null
  constructor (container, id, x, y, readonly = true, callable = null, checkEditable) {
    super()

    this.anchors = {}

    this.id = id

    const register = new SVGGroup('', this.id)

    const labelBox = measureSVGText(id, gr.gridSize * 2)
    const yLabel = gr.gridSize * 2 - labelBox.heightAdjust
    const fontSize = gr.gridSize * 2

    const textLabel = new SVGText(...gr.gridtoxy(0.6, 1.1 + gr.pxTogrid(yLabel)), id, fontSize, 'component-label')

    container.appendChild(register.svg)

    const outWrap = new SVGRect(...gr.gridtoxy(0, 0, gr.gridSize), ...gr.gridtowh(0.6 + gr.pxTogrid(labelBox.width) + 0.8 + gr.pxTogrid(gr.gridSize * 7), 4), 'register-sq-outer')

    register.append(outWrap)
    register.append(textLabel)

    this.registerValue = new RegisterValue(register, ...gr.gridtoxy(0.6 + gr.pxTogrid(labelBox.width) + 0.8, 0.9, gr.gridSize), !readonly, callable, checkEditable)

    register.translate(x, y)

    this.bbox = register.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y
  }

  /**
   * @method getBBox Get bounding box
   * @returns {Object} Bounding box
   */
  getBBox () {
    return this.bbox
  }

  /**
   * @method updateValue Update register value
   * @param {*} value Value
   */
  updateValue (value) {
    this.registerValue.text = value
  }

  /**
   * @method activate Activate register
   * @returns {Boolean} True if activated
   */
  activate () {
    this.registerValue.value.addClass('active')
  }

  /**
   * @method deactivate Deactivate register
   * @returns {Boolean} True if deactivated
   */
  deactivate () {
    this.registerValue.value.removeClass('active')
  }

  /**
   * @method listen Listen to messages
   * @param {*} message Message
   */
  listen (message) {
    switch (message.topic) {
      case this.id + '_' + Register$1.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case SignalManager.topic.empty:
        this.deactivate()
        break
      case this.id + '_' + Register$1.topic.updated:
        this.updateValue(message.value)
        break
    }
  }
}

/**
 * @class RRegister
 * @extends Register
 * @property {Number} lastMessageStep Last message step
 * @property {Object} labels Labels
 *
 */
class RRegister extends Register {
  constructor (container, id, x, y, callable = null, checkEditable = null) {
    super(container, id, x, y, false, callable, checkEditable)

    this.addAnchor(this.id + '_ib', this.bbox.x + this.bbox.width, this.bbox.y)
    this.addAnchor('ib_' + this.id, this.bbox.x + this.bbox.width, this.bbox.y + gr.gridTopx(1.2))
    this.addAnchor('ibh_' + this.id + 'h', this.bbox.x + this.bbox.width, this.bbox.y + gr.gridTopx(2.4))
    this.addAnchor('ibl_' + this.id + 'l', this.bbox.x + this.bbox.width, this.bbox.y + gr.gridTopx(3.6))

    this.addAnchor('ibbus_' + this.id, this.bbox.x, this.bbox.y + this.bbox.height / 2)

    this.addAnchor('reg_orig_' + this.id, this.bbox.x, this.bbox.y)
    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)

    switch (message.topic) {
      case 'ibh-' + this.id.toLowerCase() + 'h':
      case 'ibl-' + this.id.toLowerCase() + 'l':
      case 'ib-' + this.id.toLowerCase():
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break

      default:

        if (message.value && message.value.step && this.lastMessageStep !== message.value.step && message.value.step) this.deactivate()
        break
    }
  }
}

/**
 * @class TmpeRegister
 * @extends Register
 * @property {Number} lastMessageStep Last message step
 * @property {Object} labels Labels
 *
 */
class TmpeRegister extends Register {
  constructor (container, id, x, y) {
    super(container, id, x, y)
    this.addAnchor('tmpe_ib_bus_tmpe', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.5)

    this.addAnchor('ib_tmpe_signal', this.bbox.x, this.bbox.y)

    this.addAnchor('tmpe_clr', this.bbox.x, this.bbox.y + this.bbox.height * 0.5)
    this.addAnchor('tmpe_set', this.bbox.x, this.bbox.y + this.bbox.height)

    this.addAnchor('tmpe_alu_bus', this.bbox.x + this.bbox.width * 0.5, this.bbox.y)

    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case 'ib-tmpe':
      case 'tmpe-set':
      case 'tmpe-clr':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

/**
 * @class TmpsRegister
 * @extends Register
 * @property {Number} lastMessageStep Last message step
 *
 */
class TmpsRegister extends Register {
  constructor (container, id, x, y) {
    super(container, id, x, y)
    this.addAnchor('tmps_bus_ib', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.5)
    this.addAnchor('alu_tmps_in', this.bbox.x, this.bbox.y)

    this.addAnchor('tmps_ib', this.bbox.x, this.bbox.y + this.bbox.height * 0.5)
    this.addAnchor('alu_tmps', this.bbox.x, this.bbox.y + this.bbox.height)

    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case 'alu-tmps':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

/**
 * @class PCRegister
 */
class PCRegister extends Register {
  constructor (container, id, x, y, callable = null, checkEditable = null) {
    super(container, id, x, y, false, callable, checkEditable)
    this.addAnchor('pc_bus_ib', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.5)

    this.addAnchor('pc_ib', this.bbox.x, this.bbox.y + this.bbox.height * 0.3)
    this.addAnchor('ib_pc', this.bbox.x, this.bbox.y + this.bbox.height * 0.7)

    this.lastMessageStep = 0

    this.registerValue.showDec = false
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case 'ib-pc':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

/**
 * @class MDRRegister
 */
class MDRRegister extends Register {
  /**
   * @method reset Reset the register
   */
  reset () {
    this.updateValue(0x0000)
  }

  constructor (container, id, x, y) {
    super(container, id, x, y)
    this.addAnchor('mdr_ib', this.bbox.x, this.bbox.y)
    this.addAnchor('ib_mdr', this.bbox.x, this.bbox.y + this.bbox.height * 0.5)

    this.addAnchor('mdr_ib_bus', this.bbox.x + this.bbox.width * 0.75, this.bbox.y)

    this.addAnchor('mdr_sdb', this.bbox.x + this.bbox.width * 0.5, this.bbox.y + this.bbox.height)

    this.addAnchor('mdr_ib_bus', this.bbox.x + this.bbox.width * 0.5, this.bbox.y)

    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case this.id + '_' + Register$1.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case 'ib-mdr':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      case Memory.topic.mem_sdb:
      case Device.topic.dev_sdb:
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

/**
 * @class MarRegister
 * @extends Register
 * @property {Number} lastMessageStep Last message step
 * @property {Object} labels Labels
 * @property {Object} bbox Bounding box
 */
class MarRegister extends Register {
  constructor (container, id, x, y) {
    super(container, id, x, y)
    this.addAnchor('ib_mar', this.bbox.x + this.bbox.width, this.bbox.y)
    this.addAnchor('mar_ib_bus', this.bbox.x + this.bbox.width * 0.25, this.bbox.y)

    this.addAnchor('mar_ib_bus', this.bbox.x + this.bbox.width * 0.5, this.bbox.y)
    this.addAnchor('mar_sab', this.bbox.x + this.bbox.width * 0.5, this.bbox.y + this.bbox.height)

    this.lastMessageStep = 0
  }

  listen (message) {
    super.listen(message)
    switch (message.topic) {
      case 'ib-mar':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default: {
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
      }
    }
  }
}

/**
 * @class IB
 * @extends Register
 * @property {Number} lastMessageStep Last message step
 * @property {Object} labels Labels
 *
 */
class IB extends Register {
  constructor (container, id, x, y) {
    super(container, id, x, y)

    this.addAnchor('tmpe_ib_bus_ib', this.bbox.x + this.bbox.width + 1, this.bbox.y + this.bbox.height)
    this.addAnchor('ib_registers', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height)
    this.lastMessageStep = 0
  }

  listen (message) {
    if (/.*-ib.*/.test(message.topic)) {
      this.activate()
      if (message.value && message.value.step) this.lastMessageStep = message.value.step
    } else {
      switch (message.topic) {
        case this.id + '-bus_' + Bus$1.topic.reset:
          this.updateValue(message.value)
          this.deactivate()
          break
        case this.id + '-bus_' + Register$1.topic.updated:
          this.updateValue(message.value)
          break
        default:
          if ((message.value && message.value.step && this.lastMessageStep !== message.value.step) || (message.topic === SignalManager.topic.empty)) this.deactivate()
          break
      }
    }
  }
}

/**
 * @class SmallRegister
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 * @property {Object} bbox Bounding box
 * @property {Number} bbox.x Bounding box x
 * @property {Number} bbox.y Bounding box y
 * @property {Number} bbox.width Bounding box width
 * @property {Number} bbox.height Bounding box height
 * @property {String} id Register id
 *
 */
class SmallRegister extends CtElement {
  constructor (container, x, y, id, text, value) {
    super()

    const registergroup = new SVGGroup('', id)

    this.value = new SVGText(...gr.gridtoxy(0.5, 1.9), value, 2 * gr.gridSize, 'register-value')
    const tmpText = new SVGText(...gr.gridtoxy(0.2, -0.4), text, 1.5 * gr.gridSize, 'register-value', id)
    registergroup
      .append(new SVGRect(0, 0, 2.3 * gr.gridSize, 2.3 * gr.gridSize, 'register-sq-inner'))
      .append(this.value)
      .append(tmpText)

    container.append(registergroup)

    registergroup.translate(x, y)
  }

  /**
   * @method updateValue Update the value of the register
   * @param {*} value Value to update
   */
  updateValue (value) {
    this.value.text = value
  }

  listen (message) {
    switch (message.topic) {
      case this.id + 'updatedValue': {
        this.updateValue(message.value)
      }
    }
  }
}

/**
 * @class RegisterSR
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 *
 */
const RegisterSR$1 = class RegisterSR extends CtElement {
  constructor (container, id, x, y) {
    super()

    this.id = id

    const register = new SVGGroup('', this.id)

    const tmpText = new SVGText(...gr.gridtoxy(0.7, 3.8), id, 2 * gr.gridSize, 'component-label')
    const tmpOuter = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(21.5, 6), 'register-sq-outer')

    container
      .appendChild(register.svg)
    register
      .append(tmpOuter)
      .append(tmpText)

    this.zfr = new SmallRegister(register, ...gr.gridtoxy(4.3, 2.7), 'zf', 'ZF', 0)
    this.cfr = new SmallRegister(register, ...gr.gridtoxy(7.8, 2.7), 'cf', 'CF', 0)
    this.ofr = new SmallRegister(register, ...gr.gridtoxy(11.3, 2.7), 'of', 'OF', 0)
    this.sfr = new SmallRegister(register, ...gr.gridtoxy(14.8, 2.7), 'sf', 'SF', 0)
    this.ifr = new SmallRegister(register, ...gr.gridtoxy(18.3, 2.7), 'if', 'IF', 0)

    register.translate(x, y)

    this.bbox = tmpOuter.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.addAnchor('sr_ib', this.bbox.x, this.bbox.y)
    this.addAnchor('ib_sr', this.bbox.x, this.bbox.y + gr.gridTopx(1.5))
    this.addAnchor('alu_sr', this.bbox.x, this.bbox.y + gr.gridTopx(3))
    this.addAnchor('cli', this.bbox.x, this.bbox.y + gr.gridTopx(4.5))
    this.addAnchor('sti', this.bbox.x, this.bbox.y + gr.gridTopx(6))

    this.addAnchor('alu_sr_in', this.bbox.x + gr.gridTopx(3), this.bbox.y + this.bbox.height)

    this.addAnchor('sr_bus_ib', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.5)

    this.addAnchor('sr_uc_up', this.bbox.x + gr.gridTopx(4), this.bbox.y)
    this.lastMessageStep = 0
  }

  updateValue (value) {
    this.zfr.updateValue((value & 0b10000) >> 4)
    this.cfr.updateValue((value & 0b01000) >> 3)
    this.ofr.updateValue((value & 0b00100) >> 2)
    this.sfr.updateValue((value & 0b00010) >> 1)
    this.ifr.updateValue((value & 0b00001))
  }

  activate () {
    this.zfr.value.addClass('active')
    this.cfr.value.addClass('active')
    this.ofr.value.addClass('active')
    this.sfr.value.addClass('active')
    this.ifr.value.addClass('active')
  }

  deactivate () {
    this.zfr.value.removeClass('active')
    this.cfr.value.removeClass('active')
    this.ofr.value.removeClass('active')
    this.sfr.value.removeClass('active')
    this.ifr.value.removeClass('active')
  }

  listen (message) {
    switch (message.topic) {
      case this.id + '_' + Register$1.topic.reset:
        this.updateValue(message.value)
        this.deactivate()
        break
      case this.id + '_' + Register$1.topic.updated:
        this.updateValue(message.value)
        break
      case 'sti':
      case 'cli':
      case 'alu-sr':
      case 'ib-sr':
        this.activate()
        if (message.value && message.value.step) this.lastMessageStep = message.value.step
        break
      default:
        if (message.value && message.value.step && this.lastMessageStep !== message.value.step) this.deactivate()
        break
    }
  }
}

class SVGPolyline extends SVGBase {
  /**
     *
     * @param {*} container
     * @param {*} id
     * @param {*} x
     * @param {*} y
     * @param {*} direction 2 characters first horizontal: (L)eft (R)ight, second vertical (U)p (D)own
     */
  constructor (id, x, y) {
    super('polyline', '', id)

    this.id = id
    this.pointArray = []
    this.points = ''

    this.addPoint(x, y)

    const group = new SVGGroup('', this.id)

    // container.appendChild(group.svg);
    group.append(this)
  }

  addPoint (x, y) {
    const pointArray = this.pointsArr
    pointArray.push([x, y])
    this.pointsArr = pointArray
    return this
  }

  /**
     * Expects x increment and y increment in the unit provided by the property currentUnit in the base class SVGElement
     * @param {*} x
     * @param {*} y
     * @returns
     */
  go (x, y) {
    const npoints = this.pointsArr.length
    const lastpoint = this.pointsArr[npoints - 1]
    if (lastpoint) this.addPoint(lastpoint[0] + this.UnitValue(x), lastpoint[1] + this.UnitValue(y))
    else this.addPoint(this.UnitValue(x), this.UnitValue(y))
    return this
  }

  goRight (v) {
    return this.go(v, 0)
  }

  goLeft (v) {
    return this.go(-v, 0)
  }

  goUp (v) {
    return this.go(0, -v)
  }

  goDown (v) {
    return this.go(0, v)
  }

  set points (pointsstr) {
    this.svg.setAttribute('points', pointsstr)
  }

  get points () {
    return this.svg.getAttribute('points')
  }

  get pointsArr () {
    return this.points.trim() !== '' ? this.points.match(/[-0-9.]+[ ]+[-0-9.]+/gm).map(point => point.replace(/  +/g, ' ').split(' ').map(Number)) : []
  }

  set pointsArr (pointArray) {
    this.points = pointArray.map(point => point.join(' ')).join(' ')
  }

  updateValue (value) {
    this.registerValue.text = value
  }

  listen (message) {
    switch (message.topic) {
      case this.id + 'updatedValue': {
        this.updateValue(message.value)
      }
    }
  }

  setColor (value) {
    this.arrowStart.svg.style.stroke = value
    this.arrowStart.svg.style.fill = value
    this.svg.style.stroke = value
  }
}

/**
 * @module view/navigation/contextmenu
 */

/**
 * @class ContextMenu
 * @property {HTMLElement} dom DOM
 * @property {Boolean} callOnSave Call on save
 * @property {Simulator} sim Simulator
 * @property {Object} labels Labels
 * @property {HTMLElement} content Content
 *
 */
class ContextMenu {
  static new (target, items) {
    return new ContextMenu(target, items)
  }

  constructor (target, items) {
    target.addEventListener('mousedown', function (e) {
      let isRightMB
      e = e || window.event

      // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
      if ('which' in e) {
        isRightMB = e.which === 3
      } else if ('button' in e) {
        isRightMB = e.button === 2
      }

      if (isRightMB) {
        let contextmenu = document.querySelector('#contextmenu')
        if (!contextmenu) {
          contextmenu = document.createElement('div')
          contextmenu.id = 'contextmenu'
          document.body.appendChild(contextmenu)
        }
        contextmenu.innerHTML = ''

        contextmenu.style.display = 'block'
        contextmenu.style.cursor = 'pointer'

        document.body.addEventListener('click', function () {
          contextmenu.style.display = 'none'
        })

        contextmenu.style.left = e.clientX + 10 + 'px'
        contextmenu.style.top = e.clientY - 10 + 'px'
        const ul = document.createElement('ul')
        contextmenu.appendChild(ul)
        for (let i = 0; i < items.length; i++) {
          const li = document.createElement('li')
          li.textContent = typeof items[i].label === 'function' ? items[i].label() : items[i].label
          li.addEventListener('click', items[i].callback)
          ul.appendChild(
            li
          )
        }
      }
    })
    target.addEventListener('contextmenu', function (e) {
      e.preventDefault()
    })
  }
}

/**
 * @fileoverview Umem class
 */

/**
 * @class Umem
 * @description Emulates a programmed Micro-memory where all possible instructions are stored
 * @param { boolean } debug - If true, the micro-memory will log its content to the console
 * @property { Array } instructions - Array of instructions to be stored in the micro-memory with all available instructions and their signals
 * @property { Object } addresses - Map each instruction OpCode with the first position of the steps for that instruction in the micro-memory
 * @property { Object } OpCodeMap - Stores the information
 *
 */
class Umem {
  constructor (instructions = []) {
    this.instructions = instructions

    this.addresses = {}

    this.OpCodeMap = {}

    // This signals are common at the begining of every instruction
    this.mem = [
      ['pc-ib', 'ib-mar', 'read', 'tmpe-clr', 'carry-in', 'add', 'alu-tmps'],
      ['tmps-ib', 'ib-pc'],
      ['mdr-ib', 'ib-ir']
    ]

    for (let i = 0; i < this.instructions.length; i++) {
      this.addInstruction(this.instructions[i])
    }

    // This address indicates the first position right after loading all the instructions from the library
    // We use it to mark where do the signals to be executed to process an interrupt start
    this.intAddress = this.mem.length

    // This block of signals is executed when an interrupt is detected
    this.mem = this.mem.concat([
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['sr-ib', 'ib-mdr'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write'],
      ['r7-ib', 'tmpe-set', 'add', 'alu-tmps'],
      ['pc-ib', 'ib-mdr'],
      ['tmps-ib', 'ib-r7', 'ib-mar', 'write', 'inta'],
      [],
      ['mdr-ib', 'ib-mar', 'read'],
      [],
      ['mdr-ib', 'ib-pc', 'cli', 'fin']
    ])
  }

  /**
   * @method log
   * @param {boolean} log - If true, the micro-memory will log its content to the console
   */
  log (log = false) {
    if (log) {
      console.table(this.instructions)
      console.table(this.mem)
      console.table(this.addresses)
    }
  }

  /**
   * If set to true, the micro-memory will log its content to the console
   */
  set debug (value) {
    this._debugMode = value
  }

  /**
   * Returns debug mode
   */
  get debug () {
    return this._debugMode
  }

  /**
   * @method addInstruction Adds an instruction to the micro-memory
   * @description The structure of an instruction is:
   * {
   * OpCode: 'string',
   * mnemonic: 'string',
   * mnemonictpl: 'string',
   * regex: 'string',
   * ucode: [
   * ['signal1', 'signal2', ...],
   * ['signal1', 'signal2', ...],
   * ...
   * ]
   * }
   * @param { Object } instruction - Instruction to be added to the micro-memory
   * @param {*} instruction
   */
  addInstruction (instruction) {
    this.addresses[instruction.OpCode] = this.mem.length
    this.mem.push(...instruction.ucode)
  }
}

/**
 * Emulates the State registry of a computer
 *
 * State registry has 5 bits, representing in order from msb to lsb
 *  -Zero flag (zf)
 *  -Carry flag ()
 *  -Overflow flag
 *  -Sign flag
 *  -Interrupt flag
 */

/**
 * @class RegisterSR
 * @extends Register
 * @description Emulates a Computer register, with 5 bits
 * representing the state of the computer, in order from msb to lsb:
 * -Zero flag (zf)
 * -Carry flag ()
 * -Overflow flag
 * -Sign flag
 * -Interrupt flag
 * @param { int } value - Register initial value
 *
 */
class RegisterSR extends Register$1 {
  constructor (value = 0) {
    super('SR', value)
  }

  /**
   * Gets the value of the interrupt flag
   */
  get if () {
    return this.value & 0x1
  }

  /**
   * Sets the value of the interrupt flag
   */
  set if (value) {
    this.value = Bitop.set(this.value, 0, value)
  }

  /**
   * Gets the sign flag
   */
  get sf () {
    return (this.value & 0x2) >> 1
  }

  /**
   * Gets the overflow flag
   */
  get of () {
    return (this.value & 0x4) >> 2
  }

  /**
   * Gets the carry flag
   */
  get cf () {
    return (this.value & 0x8) >> 3
  }

  /**
   * Gets the zero flag
   */
  get zf () {
    return (this.value & 0x10) >> 4
  }

  /**
   * @method reset Sets the value of the sign flag
   */
  reset () {
    super.reset()
  }
}

/**
 * @class Mdr
 * @extends Register
 * @property {Bit16Val} value Value of the register
 * @property {Observable.transmit_mode} transmit Transmission mode of the register
 */
class Mdr extends Register$1 {
  constructor (value = 0) {
    super('MDR', value)
  }

  listen (message) {
    switch (message.topic) {
      case 'SDB-bus_' + Bit16Val.topic.updated:
        this.transmit = Observable.transmit_mode.off
        this.value = message.value
        this.transmit = Observable.transmit_mode.on
        break
    }
  }
}

/**
 * @class Cpu
 * @extends ObservableObserver
 * @property {Array} reg Array of registers
 * @property {Register} pc Program counter
 * @property {Register} ir Instruction register
 * @property {Register} tmps Temporal output register
 * @property {Register} tmpe Temporal input register
 * @property {RegisterSR} sr Status register
 * @property {Bus} ib Internal bus
 * @property {Alu} alu Arithmetical and logical unit
 * @property {Umem} umem Micro-memory program manager
 * @property {Uc} uc Control unit
 * @property {Clock} clock System clock
 * @property {Object} mode Modes used by the device
 * @property {Object} topic Topics used by the device
 */
class Cpu extends ObservableObserver {
  static mode = {
    normal: 1,
    manual: 2
  }

  static topic = {
    set_carry: 'set-carry',
    loaded_program: 'loaded-program'

  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    const backup = {
      reg: this.reg.map(function (item) {
        return item.value
      }),
      pc: this.pc.value,
      ir: this.ir.value,
      tmps: this.tmps.value,
      tmpe: this.tmpe.value,
      sr: this.sr.value,
      alu: this.alu.backup(),
      uc: this.uc.backup()
    }
    return backup
  }

  /**
   * @method restore Restore the device
   * @param {*} backup  Backup of the device
   */
  restore (backup) {
    this.reg.forEach(function (item, index) {
      item.value = backup.reg[index]
    })
    this.pc.value = backup.pc
    this.ir.value = backup.ir
    this.tmps.value = backup.tmps
    this.tmpe.value = backup.tmpe
    this.sr.value = backup.sr
    this.alu.restore(backup.alu)
    this.uc.restore(backup.uc)
  }

  /**
   * @method reset Reset the device
   */
  reset () {
    this.clock.stop()
    this.reg.forEach(function (item) {
      // item.value = 0x0000
      item.reset()
    })
    this.pc.reset()
    this.pc.value = 0x0100

    this.ib.reset()
    this.mar.reset()
    this.mdr.reset()

    this.ir.reset()
    this.tmps.reset()
    this.tmpe.reset()

    this.sr.reset()
    this.alu.reset()

    this.uc.reset()
  }

  constructor (instructions, computer) {
    super()

    // Link to the computer
    this.computer = computer
    // R0-7 General purpose registers
    this.reg = Array.from({ length: 8 }, (v, i) => new Register$1('R' + i, 0x0000))
    // PC Register, always points to current memory position
    this.pc = new Register$1('PC', 0x0000)
    // IR Register contains current instruction
    this.ir = new Register$1('IR', 0x0000)

    // Alu temporal output register
    this.tmps = new Register$1('TMPS', 0x0000)

    // Alu temporal input register
    this.tmpe = new Register$1('TMPE', 0x0000)

    // Status register
    this.sr = new RegisterSR(0x0000)

    // Internal bus
    this.ib = new Bus$1('IB', 0x0000)

    // Arithmetic logic unit, performs arithmetic and logical operations
    this.alu = new Alu$1()
    this.tmpe.subscribe(this.alu)
    this.ib.subscribe(this.alu)

    this.subscribe(this.alu)

    // Memory data register
    this.mdr = new Mdr()

    // Memory address register
    this.mar = new Register$1('MAR')

    // Micro-memory program manager
    this.umem = new Umem(instructions)

    // Control Unit
    this.uc = new Uc$1(this)

    // System clock that generates the pulses of execution
    this.clock = new Clock(1)
    this.clock.subscribe(this.uc, 0)
    this.reset()
  }

  /**
   * @method setInt activetes de int state of the uc
   */
  setInt () {
    this.uc.int = Uc$1.state.active_int
  }

  /**
   * @method unSetInt deactivates de int state of the uc
   */
  unSetInt () {
    if (this.computer.io.getIntDevices().length === 0) { this.uc.int = Uc$1.state.inactive_int }
  }

  /**
   * @method setMode Set the mode of the CPU
   * @param {*} mode Mode to set
   */
  setMode (mode) {
    if (mode === Cpu.mode.normal) this.uc.setMode(Uc$1.mode.normal.auto)
    else this.uc.setMode(Uc$1.mode.manual)
  }

  /**
   * @method log Log the state of the device to the browser console
   */
  get log () {
    const tmp = {
      PC: baseConvert.dec2hex(this.pc.value),
      IB: baseConvert.dec2hex(this.ib.value),
      IR: baseConvert.dec2hex(this.ir.value),
      TMPE: baseConvert.dec2hex(this.tmpe.value),
      TMPS: baseConvert.dec2hex(this.tmps.value),
      upc: baseConvert.dec2hex(this.uc.upc.value),
      MAR: baseConvert.dec2hex(this.mar.value),
      MDR: baseConvert.dec2hex(this.mdr.value),
      SR: baseConvert.dec2bin(this.sr.value, 5)
    }

    const reg = {}
    for (let i = 0; i < 8; i++) { reg['R' + i] = baseConvert.dec2hex(this.reg[i].value) }

    const ALU = this.alu.log

    return [reg, ALU, tmp]
  }

  /**
   * @method lsiten Listen to possible notifications
   * @param {*} message Message to listen
   */
  listen (message) {
    switch (message.topic) {
      case SignalManager.topic.mem_read:
        this.broadCast({ topic: SignalManager.topic.mem_read, value: message.value })
    }
  }
}

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

/**
 * @class Sab
 * @extends Bus
 * @description Emulates a Computer Bus
 */
class Sab extends Bus$1 {
  constructor () {
    super('SAB', 0x0000)
  }

  listen (message) {
    switch (message.topic) {
      case 'MAR_' + Bit16Val.topic.updated:
        this.value = message.value
        break
    }
  }
}

/**
 * @class Sdb
 * @extends Bus
 * @description Emulates a Computer Bus
 */
class Sdb extends Bus$1 {
  constructor () {
    super('SDB', 0x0000)
  }

  listen (message) {
    switch (message.topic) {
      case 'MDR_' + Register$1.topic.updated:
        this.value = message.value
        break
    }
  }
}

/**
 * @class Computer Simulates the Structure and Behavior of a 64Kb theoretical Computer
 * @property {Sab} sab Sab register
 * @property {Sdb} sdb Sdb register
 * @property {Memory} mem Memory
 * @property {IOManager} io IO Manager
 * @property {Cpu} cpu CPU
 * @property {boolean} debugMode Debug mode
 * @property {Object} mode Modes used by the device
 * @property {Object} error Errors used by the device
 * @property {Object} topic Topics used by the device
 *
 */
class Computer {
  static mode = {
    normal: Uc$1.mode.normal.auto,
    manual: Uc$1.mode.manual
  }

  static error = {
    loading_program: 'error.computer.loading_program',
    loading_memory: 'error.computer.loading_memory',
    loading_signals_nomanual: 'error.computer.loading_signals_nomanual'
  }

  static topic = {
    loaded_program: 'loaded-program',
    loaded_memory: 'loaded-memory'
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    const backup = {
      sab: this.sab.value,
      sdb: this.sdb.value,
      mem: this.mem.backup(),
      cpu: this.cpu.backup()
    }
    return backup
  }

  /**
   * @method restore Restore the device
   * @param {*} backup Backup of the device
   */
  restore (backup) {
    this.sab.value = backup.sab
    this.sdb.value = backup.sdb
    this.mem.restore(backup.mem)
    this.cpu.restore(backup.cpu)
  }

  /**
   * @method constructor Constructor
   * @param {*} memsize Size of the memory
   */
  constructor (memsize = 65536) {
    this.sab = new Sab()
    this.sdb = new Sdb()

    this.mem = new Memory(memsize, this.sab, this.sdb)
    this.io = new IOManager()

    this.mem.setIOManager(this.io)

    this.cpu = new Cpu(instructions, this)

    this.cpu.uc.subscribe(this.mem, 0)
    this.cpu.uc.subscribe(this.io, 0)

    this.cpu.uc.signalmanager.subscribe(this.mem)

    this.cpu.mar.subscribe(this.sab)
    this.cpu.mdr.subscribe(this.sdb)
    this.sdb.subscribe(this.cpu.mdr)

    this.debugMode = false
  }

  /**
   * @method reset Reset the device
   */
  reset () {
    this.sab.reset()
    this.sdb.reset()

    this.mem.reset()
    // this.io.reset()
    this.cpu.reset()
    SVGCable.reset()
  }

  /**
   * @method loadProgram Load a program into the memory
   * @param {*} program Program to load
   * @throws {Error} if file is not a valid program file
   */
  loadProgram (program) {
    this.reset()

    if (!program.every(baseConvert.is16bitHex)) {
      throw new Error(Computer.error.loading_program)
    } else {
      try {
        this.mem.getPos(baseConvert.hex2dec(program[0]))
        this.mem.getPos(baseConvert.hex2dec(program[1]))
      } catch (e) {
        throw new Error(Computer.error.loading_program)
      }
    }

    // First line always contains first address to start loading the program
    const start = baseConvert.hex2dec(program[0])

    // Second contains address of the first instruction
    this.cpu.pc.value = baseConvert.hex2dec(program[1])

    // Third contains the address of the stack pointer
    this.cpu.reg[7].value = baseConvert.hex2dec(program[2])

    const programMap = {}
    try {
      // Rest of positions are loaded sequentially
      for (let i = 3; i < program.length; i++) {
        if (program[i] !== '') {
          this.mem.setPos(start + (i - 3), baseConvert.hex2dec(program[i]))
          programMap[baseConvert.dec2hex(start + (i - 3))] = program[i]
        }
      }
      if (this.debugMode) {
        console.log(Cpu.topic.loaded_program)
        console.table(programMap)
        console.log(program)
      }
    } catch (e) {
      throw new Error(Computer.error.loading_program)
    }
  }

  /**
   * @method loadMemory Load a memory into the memory
   * @param {*} memory memory positions as array
   * @param {*} starthex starting position of loading
   * @throws {Error} if file is not a valid memory file
   */
  loadMemory (memory, starthex) {
    if (!memory.every(baseConvert.is16bitHex)) {
      throw new Error(Computer.error.loading_memory)
    }

    const memoryMap = {}
    const start = baseConvert.hex2dec(starthex)
    try {
      for (let i = 0; i < memory.length; i++) {
        this.mem.setPos(start + i, baseConvert.hex2dec(memory[i]))
        memoryMap[baseConvert.dec2hex(start + i)] = memory[i]
      }
    } catch (e) {
      throw new Error(Computer.error.loading_memory)
    }

    console.log('Se ha cargado la memoria: ')
    console.table(memoryMap)
  }

  /**
   * @method loadSignals Load signals into the UC
   * @param {*} signals signal array
   */
  loadSignals (signals) {
    if (this.cpu.uc.mode !== Computer.mode.manual) throw new Error(Computer.error.loading_signals_nomanual)
    this.cpu.uc.loadSignals(signals)
  }

  /**
   * @method clock gets the clock instance of the CPU
   */
  get clock () {
    return this.cpu.clock
  }

  /**
   * @method startClock Start the clock
   * @param {*} pulses pulses to execute
   */
  startClock (pulses = 0) {
    this.clock.start(pulses)
  }

  /**
   * @method stopClock Stop the clock
   */
  stopClock () {
    this.clock.stop()
  }

  /**
   * @method run Run the computer in normal auto mode
   */
  run () {
    this.cpu.uc.runAuto()
    this.startClock()
  }

  /**
   * @method stop Stop the computer
   */
  stop () {
    this.stopClock()
  }

  /**
   * @method step Run a step
   */
  runStep () {
    this.startClock(1)
  }

  /**
   * @method runInstruction Run an instruction
   */
  runInstruction () {
    this.cpu.uc.runInstruction()
    this.startClock()
  }

  /**
   * @method runProgram Run a program
   */
  normalMode () {
    this.cpu.uc.mode = Computer.mode.normal
  }

  /**
   *  @method manualMode Run a program
   */
  manualMode () {
    this.cpu.uc.mode = Computer.mode.manual
  }

  /* istanbul ignore next */
  /**
   * @method state Show the state of the computer in the console
   */
  state () {
    console.log('UC step')
    console.log('R0-7')
    console.table([this.cpu.log[0]])
    console.log('CPU')
    console.table([this.cpu.log[2]])
    console.log('ALU')
    console.table([this.cpu.log[1]])
    console.log(this.cpu)
  }

  /**
 * @method mode Get the mode of the computer
 */
  get mode () {
    return this.cpu.uc.mode <= Uc$1.mode.normal.auto ? Computer.mode.normal : Computer.mode.manual
  }
}

/**
 * @class Actions
 * @extends Observable
 * @singleton
//  * @property {Actions} instance Singleton instance
 * @property {Object} topic Topics used by the device
 * @property {Object} subtopic Subtopics used by the device
 */
class Actions extends Observable {
  // static instance = null
  static topic = {
    update: 'update-actions'
  }

  static subtopic = {
    mode_change: 'mode-change',
    run_instruction: 'run-instruction',
    start_step: 'start-step',
    run_program: 'run-program',
    stop_program: 'stop-program'
  }

  // constructor () {
  //   if (Actions.instance) return Actions.instance
  //   else super()
  // }

  /* istanbul ignore next */
  /**
   * @method runStep Run a step of an instruction
   * @param {Computer} ct Computer
   */
  runStep (ct) {
    try {
      ct.startClock(1)
      this.broadCast({ topic: Actions.topic.update, value: Actions.subtopic.start_step })
    } catch (e) {
      alert(e.message)
      ct.stopClock()
    }
  }

  /* istanbul ignore next */
  /**
   * @method runInstruction Run an instruction
   * @param {Computer} ct Computer
   * */
  runInstruction (ct) {
    if (ct.mode === Computer.mode.manual) return
    try {
      ct.runInstruction()
      this.broadCast({ topic: Actions.topic.update, value: Actions.subtopic.run_instruction })
    } catch (e) {
      alert(e.message)
      ct.stopClock()
    }
  }

  /* istanbul ignore next */
  /**
 * @method runProgram Run a program
 * @param {Computer} ct Computer
 */
  runProgram (ct) {
    if (ct.mode === Computer.mode.manual) return
    try {
      ct.run()
      this.broadCast({ topic: Actions.topic.update, value: Actions.subtopic.run_program })
    } catch (e) {
      alert(e.message)
      ct.stopClock()
    }
  }

  /* istanbul ignore next */
  /**
   * @method stopProgram Stop a program
   * @param {Computer} ct Computer
   */
  stopProgram (ct) {
    ct.stop()
    this.broadCast({ topic: Actions.topic.update, value: Actions.subtopic.stop_program })
  }

  /**
   * @method changeMode Change the mode of the computer
   * @param {Computer} ct
   * @param {Simulator} sim
   */
  changeMode (ct, sim) {
    if (ct.mode === Computer.mode.normal) {
      ct.stop()
      ct.reset()
      ct.manualMode()
    } else {
      if (sim.signalSelectorWindow) {
        sim.signalSelectorWindow.close()
        sim.signalSelectorWindow = null
      }
      ct.normalMode()
    }

    this.broadCast({ topic: Actions.topic.update, value: Actions.subtopic.mode_change })
  }
}

const actions = new Actions()

/**
 * @class Trigger
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 *
 */
class Trigger extends CtElement {
  constructor (container, id, x, y, ct) {
    super()
    this.clicks = 0
    this.id = id

    const group = new SVGGroup('', this.id)
    container.appendChild(group.svg)

    const outerWrapper = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(4, 4), 'register-sq-outer')

    const triggerline = new SVGPolyline('triggerline', ...gr.gridtoxy(0.5, 2.8)).setUnit(Unit.grid).goRight(1.5).goUp(1.5).goRight(1.5)

    group.append(outerWrapper)
    group.append(triggerline)

    group.translate(x, y)

    this.bbox = outerWrapper.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.svg = group.svg
    const _this = this
    this.svg.addEventListener('click', function () {
      actions.runStep(ct)
      this.setAttribute('data-clicks', ++_this.clicks)
    })

    this.addAnchor('trigger_out_clock', this.bbox.x + this.bbox.width, this.bbox.y + gr.gridTopx(2))

    const items = [{
      label: 'Ejecutar instrucción',
      callback: function () {
        actions.runInstruction(ct)
      }
    }, {
      label: function () { return ct.cpu.clock.status === Computer.cpu.clock.status.started ? 'Stop' : 'Run' },
      callback: function (e) {
        if (ct.cpu.clock.status === Computer.cpu.clock.status.stopped) actions.runProgram(ct)
        else actions.stopProgram(ct)
      }
    }
    ]

    ContextMenu.new(group.svg, items)
  }
}

/* global DOMParser */

/**
 * @module view/navigation/icons
 */

// This SVG icons are defined here instead of in external files because if they
// are imported as external files, their color cannot be changed with CSS
// variables.
const svgBulb = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="256"
  height="256" viewBox="0 0 256 256" xml:space="preserve">

  <defs>
  </defs>
  <g style="fill: var(--stroke-color); stroke: none;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
    <path
      d="M 60.453 29.767 c -4.971 -4.454 -11.394 -6.499 -18.088 -5.76 c -11.024 1.218 -19.632 10.146 -20.469 21.229 c -0.504 6.674 1.879 13.233 6.537 17.996 c 2.02 2.065 3.132 4.903 3.132 7.991 v 15.05 c 0 2.055 1.672 3.727 3.727 3.727 h 19.415 c 2.055 0 3.727 -1.672 3.727 -3.727 V 70.989 c 0 -2.91 1.117 -5.713 3.066 -7.688 c 4.303 -4.363 6.672 -10.141 6.672 -16.268 C 68.172 40.453 65.358 34.16 60.453 29.767 z M 56.434 72.224 v 3.963 h -3.417 c -0.553 0 -1 0.447 -1 1 s 0.447 1 1 1 h 3.417 v 3.963 H 33.566 v -3.963 H 47.59 c 0.553 0 1 -0.447 1 -1 s -0.447 -1 -1 -1 H 33.566 v -3.963 H 56.434 z M 54.707 88 H 35.292 c -0.952 0 -1.727 -0.774 -1.727 -1.727 v -2.124 h 22.868 v 2.124 C 56.434 87.226 55.659 88 54.707 88 z M 60.076 61.896 c -2.141 2.171 -3.424 5.173 -3.606 8.327 H 33.52 c -0.22 -3.224 -1.492 -6.176 -3.657 -8.39 c -4.256 -4.352 -6.433 -10.346 -5.973 -16.447 c 0.764 -10.124 8.626 -18.279 18.694 -19.392 c 0.82 -0.091 1.636 -0.136 2.445 -0.136 c 5.225 0 10.155 1.874 14.089 5.397 c 4.482 4.014 7.053 9.764 7.053 15.776 C 66.172 52.632 64.007 57.91 60.076 61.896 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 57.777 45.543 c -0.553 0 -1 -0.448 -1 -1 c 0 -3.345 -1.43 -6.543 -3.924 -8.776 c -2.527 -2.264 -5.792 -3.303 -9.199 -2.927 c -0.538 0.059 -1.043 -0.334 -1.104 -0.884 c -0.061 -0.549 0.335 -1.043 0.884 -1.104 c 3.919 -0.43 7.839 0.815 10.753 3.425 c 2.916 2.612 4.589 6.354 4.589 10.267 C 58.777 45.095 58.33 45.543 57.777 45.543 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 45 18.487 c -0.552 0 -1 -0.448 -1 -1 V 1 c 0 -0.552 0.448 -1 1 -1 s 1 0.448 1 1 v 16.487 C 46 18.04 45.552 18.487 45 18.487 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 59.64 22.312 c -0.17 0 -0.342 -0.043 -0.499 -0.134 c -0.479 -0.276 -0.643 -0.888 -0.366 -1.366 l 8.194 -14.193 c 0.276 -0.479 0.889 -0.643 1.366 -0.366 c 0.479 0.276 0.643 0.888 0.366 1.366 l -8.194 14.193 C 60.321 22.133 59.985 22.312 59.64 22.312 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 30.36 22.312 c -0.346 0 -0.682 -0.179 -0.867 -0.5 L 21.299 7.619 c -0.276 -0.479 -0.112 -1.09 0.366 -1.366 c 0.479 -0.276 1.089 -0.112 1.366 0.366 l 8.194 14.193 c 0.276 0.479 0.112 1.09 -0.366 1.366 C 30.701 22.269 30.529 22.312 30.36 22.312 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 70.589 32.897 c -0.346 0 -0.682 -0.179 -0.867 -0.5 c -0.276 -0.479 -0.112 -1.09 0.366 -1.366 l 13.964 -8.062 c 0.476 -0.276 1.089 -0.113 1.366 0.366 c 0.276 0.479 0.112 1.09 -0.366 1.366 l -13.964 8.062 C 70.931 32.854 70.759 32.897 70.589 32.897 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 19.183 32.765 c -0.169 0 -0.341 -0.043 -0.499 -0.134 l -13.735 -7.93 c -0.479 -0.276 -0.642 -0.888 -0.366 -1.366 c 0.276 -0.479 0.886 -0.643 1.366 -0.366 l 13.735 7.93 c 0.479 0.276 0.642 0.888 0.366 1.366 C 19.864 32.586 19.528 32.765 19.183 32.765 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
  </g>
</svg>
`

const svgKeyboard = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="256"
  height="256" viewBox="0 0 256 256" xml:space="preserve">

  <defs>
  </defs>
  <g style="fill: var(--stroke-color); stroke: none;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
    <path
      d="M 14.483 47.981 H 7.757 c -0.552 0 -1 -0.447 -1 -1 v -6.726 c 0 -0.552 0.448 -1 1 -1 h 6.726 c 0.552 0 1 0.448 1 1 v 6.726 C 15.483 47.534 15.036 47.981 14.483 47.981 z M 8.757 45.981 h 4.726 v -4.726 H 8.757 V 45.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 28.035 47.981 h -6.726 c -0.552 0 -1 -0.447 -1 -1 v -6.726 c 0 -0.552 0.448 -1 1 -1 h 6.726 c 0.552 0 1 0.448 1 1 v 6.726 C 29.035 47.534 28.587 47.981 28.035 47.981 z M 22.309 45.981 h 4.726 v -4.726 h -4.726 V 45.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 41.587 47.981 h -6.726 c -0.552 0 -1 -0.447 -1 -1 v -6.726 c 0 -0.552 0.448 -1 1 -1 h 6.726 c 0.552 0 1 0.448 1 1 v 6.726 C 42.587 47.534 42.139 47.981 41.587 47.981 z M 35.861 45.981 h 4.726 v -4.726 h -4.726 V 45.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 55.139 47.981 h -6.726 c -0.553 0 -1 -0.447 -1 -1 v -6.726 c 0 -0.552 0.447 -1 1 -1 h 6.726 c 0.553 0 1 0.448 1 1 v 6.726 C 56.139 47.534 55.691 47.981 55.139 47.981 z M 49.413 45.981 h 4.726 v -4.726 h -4.726 V 45.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 68.69 47.981 h -6.726 c -0.553 0 -1 -0.447 -1 -1 v -6.726 c 0 -0.552 0.447 -1 1 -1 h 6.726 c 0.553 0 1 0.448 1 1 v 6.726 C 69.69 47.534 69.243 47.981 68.69 47.981 z M 62.965 45.981 h 4.726 v -4.726 h -4.726 V 45.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 82.243 47.981 h -6.727 c -0.553 0 -1 -0.447 -1 -1 v -6.726 c 0 -0.552 0.447 -1 1 -1 h 6.727 c 0.553 0 1 0.448 1 1 v 6.726 C 83.243 47.534 82.796 47.981 82.243 47.981 z M 76.517 45.981 h 4.727 v -4.726 h -4.727 V 45.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 14.483 59.981 H 7.757 c -0.552 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.448 -1 1 -1 h 6.726 c 0.552 0 1 0.447 1 1 v 6.727 C 15.483 59.534 15.036 59.981 14.483 59.981 z M 8.757 57.981 h 4.726 v -4.727 H 8.757 V 57.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 28.035 59.981 h -6.726 c -0.552 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.448 -1 1 -1 h 6.726 c 0.552 0 1 0.447 1 1 v 6.727 C 29.035 59.534 28.587 59.981 28.035 59.981 z M 22.309 57.981 h 4.726 v -4.727 h -4.726 V 57.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 41.587 59.981 h -6.726 c -0.552 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.448 -1 1 -1 h 6.726 c 0.552 0 1 0.447 1 1 v 6.727 C 42.587 59.534 42.139 59.981 41.587 59.981 z M 35.861 57.981 h 4.726 v -4.727 h -4.726 V 57.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 55.139 59.981 h -6.726 c -0.553 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.447 -1 1 -1 h 6.726 c 0.553 0 1 0.447 1 1 v 6.727 C 56.139 59.534 55.691 59.981 55.139 59.981 z M 49.413 57.981 h 4.726 v -4.727 h -4.726 V 57.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 68.69 59.981 h -6.726 c -0.553 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.447 -1 1 -1 h 6.726 c 0.553 0 1 0.447 1 1 v 6.727 C 69.69 59.534 69.243 59.981 68.69 59.981 z M 62.965 57.981 h 4.726 v -4.727 h -4.726 V 57.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 82.243 59.981 h -6.727 c -0.553 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.447 -1 1 -1 h 6.727 c 0.553 0 1 0.447 1 1 v 6.727 C 83.243 59.534 82.796 59.981 82.243 59.981 z M 76.517 57.981 h 4.727 v -4.727 h -4.727 V 57.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 14.483 71.981 H 7.757 c -0.552 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.448 -1 1 -1 h 6.726 c 0.552 0 1 0.447 1 1 v 6.727 C 15.483 71.534 15.036 71.981 14.483 71.981 z M 8.757 69.981 h 4.726 v -4.727 H 8.757 V 69.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 68.69 71.981 H 21.309 c -0.552 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.448 -1 1 -1 H 68.69 c 0.553 0 1 0.447 1 1 v 6.727 C 69.69 71.534 69.243 71.981 68.69 71.981 z M 22.309 69.981 H 67.69 v -4.727 H 22.309 V 69.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 82.243 71.981 h -6.727 c -0.553 0 -1 -0.447 -1 -1 v -6.727 c 0 -0.553 0.447 -1 1 -1 h 6.727 c 0.553 0 1 0.447 1 1 v 6.727 C 83.243 71.534 82.796 71.981 82.243 71.981 z M 76.517 69.981 h 4.727 v -4.727 h -4.727 V 69.981 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 86.86 32.935 H 45 v -3.101 c 0 -1.951 1.587 -3.538 3.538 -3.538 h 35.924 c 3.054 0 5.538 -2.484 5.538 -5.539 c 0 -3.054 -2.484 -5.538 -5.538 -5.538 H 31.501 c -0.458 -2.012 -2.253 -3.521 -4.401 -3.521 h -6.181 c -0.552 0 -1 0.448 -1 1 v 2.521 h -2.6 v 2 h 2.6 v 2.521 c 0 0.552 0.448 1 1 1 H 27.1 c 2.148 0 3.944 -1.509 4.401 -3.521 h 52.961 c 1.951 0 3.538 1.587 3.538 3.538 c 0 1.951 -1.587 3.539 -3.538 3.539 H 48.538 c -3.054 0 -5.538 2.484 -5.538 5.538 v 3.101 H 3.139 C 1.408 32.935 0 34.343 0 36.074 v 39.089 c 0 1.73 1.408 3.139 3.139 3.139 H 86.86 c 1.731 0 3.14 -1.408 3.14 -3.139 V 36.074 C 90 34.343 88.592 32.935 86.86 32.935 z M 27.1 18.74 h -5.181 v -5.042 H 27.1 c 1.39 0 2.521 1.131 2.521 2.521 S 28.49 18.74 27.1 18.74 z M 88 75.163 c 0 0.628 -0.512 1.139 -1.14 1.139 H 3.139 C 2.511 76.302 2 75.791 2 75.163 V 36.074 c 0 -0.628 0.511 -1.139 1.139 -1.139 H 86.86 c 0.628 0 1.14 0.511 1.14 1.139 V 75.163 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
  </g>
</svg>
`

const svgScreen = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="256"
  height="256" viewBox="0 0 256 256" xml:space="preserve">

  <defs>
  </defs>
  <g style="fill: var(--stroke-color); stroke: none;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
    <path
      d="M 56.301 86.083 H 33.699 c -2.503 0 -4.539 -2.036 -4.539 -4.539 v -0.891 c 0 -2.503 2.036 -4.54 4.539 -4.54 h 6.732 v -5.125 H 5.607 C 2.516 70.987 0 68.472 0 65.38 V 9.525 c 0 -3.092 2.516 -5.608 5.607 -5.608 h 78.785 C 87.484 3.917 90 6.433 90 9.525 V 65.38 c 0 3.092 -2.516 5.607 -5.608 5.607 H 49.569 v 5.125 h 6.732 c 2.503 0 4.539 2.037 4.539 4.54 v 0.891 C 60.841 84.047 58.805 86.083 56.301 86.083 z M 33.699 79.078 c -0.867 0 -1.572 0.706 -1.572 1.573 v 0.891 c 0 0.867 0.706 1.572 1.572 1.572 h 22.602 c 0.867 0 1.572 -0.705 1.572 -1.572 v -0.891 c 0 -0.867 -0.705 -1.573 -1.572 -1.573 h -9.699 V 68.02 h 37.79 c 1.456 0 2.641 -1.184 2.641 -2.64 V 9.525 c 0 -1.456 -1.184 -2.641 -2.641 -2.641 H 5.607 c -1.456 0 -2.64 1.185 -2.64 2.641 V 65.38 c 0 1.456 1.184 2.64 2.64 2.64 h 37.791 v 11.059 H 33.699 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    <path
      d="M 79.755 65.227 H 10.244 c -1.762 0 -3.194 -1.433 -3.194 -3.194 V 13.469 c 0 -1.762 1.433 -3.195 3.194 -3.195 h 69.511 c 1.762 0 3.195 1.433 3.195 3.195 v 48.565 C 82.95 63.794 81.517 65.227 79.755 65.227 z M 10.244 13.241 c -0.121 0 -0.227 0.107 -0.227 0.228 v 48.565 c 0 0.121 0.106 0.227 0.227 0.227 h 69.511 c 0.122 0 0.228 -0.106 0.228 -0.227 V 13.469 c 0 -0.121 -0.106 -0.228 -0.228 -0.228 H 10.244 z"
      transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
  </g>
</svg>
`

const svgMemory = `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 98.08"
    style="enable-background:new 0 0 122.88 98.08" xml:space="preserve">
    <g style="fill: var(--stroke-color); stroke: none;">
        <path
            d="M13.78,13.25V3.84C13.78,1.72,15.5,0,17.62,0s3.84,1.72,3.84,3.84v9.41h9.73V3.84c0-2.12,1.72-3.84,3.84-3.84 c2.12,0,3.84,1.72,3.84,3.84v9.41h9.73V3.84c0-2.12,1.72-3.84,3.84-3.84c2.12,0,3.84,1.72,3.84,3.84v9.41h9.73V3.84 c0-2.12,1.72-3.84,3.84-3.84c2.12,0,3.84,1.72,3.84,3.84v9.41h9.73V3.84c0-2.12,1.72-3.84,3.84-3.84c2.12,0,3.84,1.72,3.84,3.84 v9.41h9.73V3.84c0-2.12,1.72-3.84,3.84-3.84c2.12,0,3.84,1.72,3.84,3.84v9.41h8.6c1.59,0,3.03,0.65,4.07,1.69 c1.04,1.04,1.69,2.48,1.69,4.07v60.66c0,1.57-0.65,3.01-1.69,4.06l0.01,0.01c-1.04,1.04-2.48,1.69-4.07,1.69h-8.6v8.82 c0,2.12-1.72,3.84-3.84,3.84c-2.12,0-3.84-1.72-3.84-3.84v-8.82h-9.73v8.82c0,2.12-1.72,3.84-3.84,3.84 c-2.12,0-3.84-1.72-3.84-3.84v-8.82H73.7v8.82c0,2.12-1.72,3.84-3.84,3.84c-2.12,0-3.84-1.72-3.84-3.84v-8.82h-9.73v8.82 c0,2.12-1.72,3.84-3.84,3.84c-2.12,0-3.84-1.72-3.84-3.84v-8.82h-9.73v8.82c0,2.12-1.72,3.84-3.84,3.84 c-2.12,0-3.84-1.72-3.84-3.84v-8.82h-9.73v8.82c0,2.12-1.72,3.84-3.84,3.84s-3.84-1.72-3.84-3.84v-8.82H5.75 c-1.59,0-3.03-0.65-4.07-1.69C0.65,82.69,0,81.25,0,79.67V19.01c0-1.59,0.65-3.03,1.69-4.07c0.12-0.12,0.25-0.23,0.38-0.33 c1.01-0.84,2.29-1.35,3.69-1.35H13.78L13.78,13.25z M115.2,20.93H7.68v56.81H115.2V20.93L115.2,20.93z" />
    </g>
</svg>
`

/**
 * @class iconLib
 * @description Icon library
 */
class iconLib {
  static bulb (size = 32, fillVariable = '--stroke-color') {
    return this.icon(size, svgBulb, fillVariable)
  }

  static keyboard (size = 32, fillVariable = '--stroke-color') {
    return this.icon(size, svgKeyboard, fillVariable)
  }

  static screen (size = 32, fillVariable = '--stroke-color') {
    return this.icon(size, svgScreen, fillVariable)
  }

  static memory (size = 32, fillVariable = '--stroke-color') {
    return this.icon(size, svgMemory, fillVariable)
  }

  static icon (size, svgContent, fillVariable = '--stroke-color') {
    svgContent = svgContent.replace(/--stroke-color/g, fillVariable)
    const parser = new DOMParser()
    const svgElement = parser.parseFromString(svgContent, 'image/svg+xml').documentElement

    svgElement.setAttribute('width', size)
    svgElement.setAttribute('height', size)

    return svgElement
  }
}

/**
 * @class CTMemory
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 * @property {Object} labels Labels
 *
 */
class CTMemory extends CtElement {
  static labels = {
    config: 'labels.ctmemory.config',
    editor: 'labels.ctmemory.editor',
    controllabel: 'labels.ctmemory.controllabel'
  }

  constructor (container, id, x, y) {
    super()
    const _this = this
    this.id = id

    this._memoryEditor = null
    this._memoryConfig = null
    this._memoryLoader = null

    const group = new SVGGroup('', this.id)

    container.appendChild(group.svg)

    const outerWrapper = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(13, 18), 'register-sq-outer')

    outerWrapper.svg.setAttribute('fill', 'url(#dashedline_pattern1)')
    group.svg.style.cursor = 'pointer'
    group.append(outerWrapper)
      .append(new SVGText(...gr.gridtoxy(1, 8), _jStr(CTMemory.labels.controllabel).translate(), 2.3 * gr.gridSize, 'component-label'))

    const icongroup = new SVGGroup('icons-es', this.id)
    const memory = iconLib.memory()

    icongroup.svg.appendChild(memory)
    memory.setAttribute('x', 40)
    memory.setAttribute('y', 4)

    group.append(icongroup)

    icongroup.translate(...gr.gridtoxy(0.3, 10))

    group.translate(x, y)

    const items = [
      {
        label: _jStr(CTMemory.labels.config).translate(),
        callback: function () {
          if (_this._memoryConfig) _this._memoryConfig()
        }
      },
      {
        label: _jStr(CTMemory.labels.editor).translate(),
        callback: function () {
          if (_this._memoryEditor) {
            _this._memoryEditor()
          }
        }
      }]

    ContextMenu.new(group.svg, items)

    this.bbox = outerWrapper.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.addAnchor('mem_write_in', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.22)
    this.addAnchor('mem_read_in', this.bbox.x + this.bbox.width, this.bbox.y + this.bbox.height * 0.29)

    this.addAnchor('mem_rightside', this.bbox.x + this.bbox.width, this.bbox.y)
  }

  /**
   * @method memoryEditor Set the memory editor callback
   * @param {*} callback Callback to process the memory editor
   */
  memoryEditor (callback) {
    this._memoryEditor = callback
  }

  /**
   * @method memoryConfig Set the memory config callback
   * @param {*} callback Callback to process the memory config
   */
  memoryConfig (callback) {
    this._memoryConfig = callback
  }

  /**
   * @method memoryLoader Set the memory loader callback
   * @param {*} callback Callback to process the memory loader
   */
  memoryLoader (callback) {
    this._memoryLoader = callback
  }
}

/**
 * @class CTIO
 * @extends CtElement
 * @property {SVGGroup} registersvg SVG group
 * @property {SVGRect} outWrap SVG rect
 * @property {SVGText} textLabel SVG text
 * @property {RegisterValue} registerValue Register value
 *
 */
class CTIO extends CtElement {
  static labels = {
    connect_keyboard: 'labels.ctio.connect_keyboard',
    connect_screen: 'labels.ctio.connect_screen',
    connect_lights: 'labels.ctio.connect_lights',
    controllabel: 'labels.ctio.controllabel'
  }

  constructor (container, id, x, y) {
    super()

    const _this = this

    this.id = id

    this._addKeyboard = null
    this._addLights = null
    this._addScreen = null

    const group = new SVGGroup('', this.id)

    container.appendChild(group.svg)

    const outerWrapper = new SVGRect(...gr.gridtoxy(0, 0), ...gr.gridtowh(13, 18), 'register-sq-outer')
    group.svg.style.cursor = 'pointer'
    group.append(outerWrapper)
      .append(new SVGText(...gr.gridtoxy(4, 8), _jStr(CTIO.labels.controllabel).translate(), 2.5 * gr.gridSize, 'component-label'))

    const icongroup = new SVGGroup('icons-es', this.id)
    const keyboard = iconLib.keyboard()
    const screen = iconLib.screen()
    const bulb = iconLib.bulb()

    icongroup.svg.appendChild(keyboard)
    keyboard.setAttribute('y', 4)
    screen.setAttribute('x', 40)
    screen.setAttribute('y', 4)
    icongroup.svg.appendChild(screen)
    bulb.setAttribute('x', 76)
    icongroup.svg.appendChild(bulb)

    group.append(icongroup)

    icongroup.translate(...gr.gridtoxy(0.5, 10))

    group.translate(x, y)

    const items = [{
      label: _jStr(CTIO.labels.connect_keyboard).translate(),
      callback: function () {
        if (_this._addKeyboard) _this._addKeyboard()
      }
    },
    {
      label: _jStr(CTIO.labels.connect_screen).translate(),
      callback: function () {
        if (_this._addScreen) _this._addScreen()
      }
    },
    {
      label: _jStr(CTIO.labels.connect_lights).translate(),
      callback: function () {
        if (_this._addLights) _this._addLights()
      }
    }
    ]

    ContextMenu.new(group.svg, items)

    this.bbox = outerWrapper.svg.getBBox()
    this.bbox.x = x
    this.bbox.y = y

    this.addAnchor('io_write_in', this.bbox.x, this.bbox.y + this.bbox.height * 0.22)
    this.addAnchor('io_read_in', this.bbox.x, this.bbox.y + this.bbox.height * 0.29)

    this.addAnchor('io_inta_in', this.bbox.x, this.bbox.y)
    this.addAnchor('io_int_in', this.bbox.x, this.bbox.y + gr.gridTopx(1.3))

    this.addAnchor('io_leftside', this.bbox.x, this.bbox.y)
  }

  /**
   * @method addKeyboard Add a keyboard to the CTIO
   * @param {*} callback Callback to call after adding the keyboard
   */
  addKeyboard (callback) {
    this._addKeyboard = callback
  }

  /**
   * @method  addScreen Add a screen to the CTIO
   * @param {*} callback Callback to call after adding the screen
   */
  addScreen (callback) {
    this._addScreen = callback
  }

  /**
   * @method addLights Add lights to the CTIO
   * @param {*} callback Callback to call after adding the lights
   */
  addLights (callback) {
    this._addLights = callback
  }
}

/**
 * @class Signal
 * @property {HTMLElement} dom DOM
 * @property {String} label Label
 */
class Signal {
  constructor (label) {
    this.dom = Forms.inputwlabel2('checkbox', label, label.toLowerCase(), 'left').dom
  }

  static new (label) {
    return new Signal(label)
  }
}

/**
 * @class SignalGroup
 * @property {HTMLElement} dom DOM
 * @property {String} label Label
 * @property {Signal[]} signals Signals
 */
class SignalGroup {
  constructor (label) {
    const registersignals = _jsc({ s: 'div', _class: 'signalblock' })
    const registersignalslabel = _jsc({ s: 'label', _class: 'signalblock-label' })

    registersignalslabel.text(label)

    if (label !== '') registersignals.append(registersignalslabel)

    this.dom = registersignals.element
  }

  addClass (_class) {
    _jss(this.dom).addClass(_class)
  }

  static new (label) {
    return new SignalGroup(label)
  }

  addSignal (label) {
    _jss(this.dom).append(Signal.new(label).dom)
    return this
  }
}

/**
 * @class SignalSelector
 * @property {HTMLElement} dom DOM
 * @property {Boolean} callOnSave Call on save
 * @property {Simulator} sim Simulator
 * @property {Object} labels Labels
 *
 */
class SignalSelector {
  static labels = {
    btok: 'label.signalset.signal_selection_btok',
    deactivate: 'label.signalset.signal_selection_deactivate',
    window_title: 'label.signalset.signal_selection'
  }

  constructor (CT, sim) {
    const _this = this
    this.CT = CT

    this.sset = new SignalSet(CT)
    this.callOnSave = false
    this.sim = sim

    const wrap = _jsc({ s: 'div', _class: 'signal-panel-wrap' })
    const signalPanel = _jsc({ s: 'div', _class: 'signal-panel' })
    const layoutLeft = _jsc({ s: 'div', _class: 'signal-panel-left' })
    const layoutRight = _jsc({ s: 'div', _class: 'signal-panel-right' })
    const layoutRegisters = _jsc({ s: 'div', _class: 'signal-panel-registers' })

    wrap.append(signalPanel)
    signalPanel.append(layoutLeft)
    signalPanel.append(layoutRight)
    layoutLeft.append(layoutRegisters)

    const layoutSRPC = _jsc({ s: 'div', _class: 'signal-panel-srpc' })
    layoutLeft.append(layoutSRPC)

    const layoutDownLeft = _jsc({ s: 'div', _class: 'signal-panel-leftdown' })
    layoutLeft.append(layoutDownLeft)

    const layoutESMAR = _jsc({ s: 'div', _class: 'signal-panel-esmar' })

    const layoutIRALUF = _jsc({ s: 'div', _class: 'signal-panel-iraluf' })

    layoutRight.append(layoutIRALUF)

    for (let i = 0; i < 8; i++) {
      const registersignals = SignalGroup.new('R' + i)
        .addSignal('R' + i + '-IB')
        .addSignal('IB-R' + i)
        .addSignal('IBh-R' + i + 'h')
        .addSignal('IBl-R' + i + 'l')

      layoutRegisters.append(registersignals.dom)
    }

    const sr = SignalGroup.new('SR')
      .addSignal('IB-SR')
      .addSignal('SR-IB')
      .addSignal('ALU-SR')
      .addSignal('CLI')
      .addSignal('STI')

    layoutSRPC.append(sr.dom)

    const pc = SignalGroup.new('PC')
      .addSignal('PC-IB')
      .addSignal('IB-PC')

    pc.addClass('signal-group-pc')

    layoutSRPC.append(pc.dom)

    const tmpe = SignalGroup.new('TMPE')
      .addSignal('IB-TMPE')
      .addSignal('TMPE-SET')
      .addSignal('TMPE-CLR')

    layoutDownLeft.append(tmpe.dom)

    // LAYOUT: TMPE-TMPS-ES-MAR-MEMORY-MDR
    const tmps = SignalGroup.new('TMPS')
      .addSignal('TMPS-IB')
      .addSignal('ALU-TMPS')

    layoutDownLeft.append(tmps.dom)

    const memory = SignalGroup.new('MEMORY')
      .addSignal('WRITE')
      .addSignal('READ')

    layoutDownLeft.append(memory.dom)

    // LAYOUT: ES-MAR
    const io = SignalGroup.new('I/O')
      .addSignal('INTA')
    layoutESMAR.append(io.dom)

    const mar = SignalGroup.new('MAR')
      .addSignal('IB-MAR')
    layoutESMAR.append(mar.dom)

    layoutDownLeft.append(layoutESMAR)

    const mdr = SignalGroup.new('MDR')
      .addSignal('MDR-IB')
      .addSignal('IB-MDR')
    layoutDownLeft.append(mdr.dom)

    // LAYOUT: IR-ALU-FIN
    const ir = SignalGroup.new('IR')
      .addSignal('IB-IR')
      .addSignal('IRl-IBh')
      .addSignal('IRl-IBl')
      .addSignal('ExtIRl-IB')
    layoutIRALUF.append(ir.dom)

    const alu = SignalGroup.new('ALU')
      .addSignal('ADD')
      .addSignal('SUB')
      .addSignal('OR')
      .addSignal('AND')
      .addSignal('XOR')
      .addSignal('CARRY-IN')
    layoutIRALUF.append(alu.dom)

    const fin = SignalGroup.new('')
      .addSignal('FIN')
    layoutIRALUF.append(fin.dom)

    const actionbuttons = _jsc({ s: 'div', _class: 'signal-action-buttons' })
    const btok = Forms.button(_jStr(SignalSelector.labels.btok).translate(), 'signals-ok')
    const btdeactivate = Forms.button(_jStr(SignalSelector.labels.deactivate).translate(), 'signals-deactivate')

    actionbuttons.append(btok.input)
    actionbuttons.append(btdeactivate.input)

    signalPanel.append(actionbuttons)

    signalPanel.element.querySelectorAll('label[id^="wrap-"]').forEach((item) => {
      const input = item.querySelector('input')

      item.addEventListener('click', function (event) {
        event.preventDefault()
      })
      item.addEventListener('mousedown', function (event) {
        event.preventDefault()
      })
      item.addEventListener('mouseup', function (event) {
        event.preventDefault()
        try {
          if (input.checked) {
            _this.sset.removeSignal(input.id)
            input.checked = false
          } else {
            _this.sset.addSignal(input.id)
            input.checked = true
          }
        } catch (e) {
          input.checked = false

          alert(_jStr(e.message).translate(SignalMap.getGroup(input.id)))
        }
      })
    })

    if (this.sim.control.selectedSignals && this.sim.control.selectedSignals.length > 0) {
      const tmpsignals = Array.from(signalPanel.element.querySelectorAll('input[type="checkbox"]'))
      this.sim.control.selectedSignals.forEach((item) => {
        const tmpsignal = tmpsignals.filter((signal) => { return signal.id === item })
        if (tmpsignal.length === 1) {
          tmpsignal[0].checked = true
          try {
            this.sset.addSignal(item, true)
            tmpsignal[0].checked = true
          } catch (e) {
            tmpsignal[0].checked = false
            alert(e.message)
          }
        }
      })
    }

    btok.input.addEventListener('click', function (e) {
      try {
        SignalSet.validateSignalSet(_this.sset.signals, CT)
        _this._event_SaveSignals(e)

        // Clear selected signals once sent to the control unit
        // Needs refactoring: raise btdeactivate click event
        const tmpsignals = Array.from(signalPanel.element.querySelectorAll('input[type="checkbox"]'))
        tmpsignals.forEach((item) => {
          item.checked = false
        })
        _this.sset.reset()
      } catch (e) {
        alert(e.message)
      }
    })

    btdeactivate.input.addEventListener('click', function (e) {
      const tmpsignals = Array.from(signalPanel.element.querySelectorAll('input[type="checkbox"]'))
      tmpsignals.forEach((item) => {
        item.checked = false
      })
      _this.sset.reset()
    })

    // this.closeWindow=false;
    this.dom = wrap
  }

  static new (CT, sim) {
    return new SignalSelector(CT, sim)
  }

  _event_SaveSignals (e) {
    this.sim.control.selectedSignals = this.sset.signals
    if (this.callOnSave) this.callOnSave()
  }

  onSave (callable) {
    this.callOnSave = callable
  }
}

/**
 * @class Memoryedit
 * @property {HTMLElement} dom DOM
 * @property {HTMLElement} scrollable Scrollable
 * @property {HTMLElement} nodes Nodes
 * @property {Number} startNode Start node
 * @property {Memory} mem Memory object link
 * @property {Number} ct Current context
 * @property {String} lastValue Last value
 * @property {HTMLElement} scrollable Scrollable
 * @property {HTMLElement} nodes Nodes
 * @property {HTMLElement} dom_ DOM
 * @property {HTMLElement} scrollable Scrollable
 * @property {HTMLElement} nodes Nodes
 * @property {Number} startNode Start node
 * @property {Memory} mem Memory object link
 *
 */
class Memoryedit extends Observer {
  static labels = {
    hex_addr: 'labels.memedit.hex_addr',
    addr: 'labels.memedit.addr',
    go: 'labels.memedit.go',
    load: 'labels.memedit.load',
    value: 'labels.memedit.value'
  }

  /**
   * @method init Initialize memory editor
   * @param {*} wrap Content wrapper
   * @param {*} config Configuration
   * @param {*} itemCount Number  of items
   * @returns {Array} Array with scrollable and itemwrap
   */
  init (wrap, config, itemCount) {
    const scrollable = _jsc({ s: 'div', _id: 'vt-scroll', _style: { height: (config.itemHeight * config.itemVisible) + 'px', overflow: 'auto' } })
    const viewport = _jsc({ s: 'div', _id: 'viewport', _style: { height: (config.itemHeight * itemCount) + 'px', overflow: 'hidden', position: 'relative' } })
    const itemwrap = _jsc({ s: 'div', _id: 'items', _style: { 'will-change': 'transform', transform: 'translateY(0px)' } })

    wrap.append(scrollable)
    scrollable.append(viewport)
    viewport.append(itemwrap)

    return [scrollable, itemwrap]
  }

  /**
   * @method drawNode Draw a memory node
   * @param {*} nodeLabel Node label
   * @param {*} nodeValue Node value
   * @param {*} callable Callable to call when node is edited
   */
  drawNode (nodeLabel, nodeValue, callable) {
    const itemWrap = _jsc({ s: 'div', _class: 'vt-nodewrap' })

    const itemLabel = _jsc({ s: 'div', _class: 'vt-nodewrap-label' })

    itemLabel.text(baseConvert.dec2hex(nodeLabel).toUpperCase())
    itemWrap.append(itemLabel)

    const itemValue = _jsc({ s: 'div', _class: 'vt-nodewrap-value' })

    itemWrap.append(itemValue)
    if (nodeValue === Memory.labels.empty || nodeValue === Memory.labels.IOlabel) {
      itemValue.text(_jStr(nodeValue).translate() || 0)
    } else {
      itemValue.text(nodeValue.toUpperCase() || 0)
    }

    const itemDecoded = _jsc({ s: 'div', _class: 'vt-nodewrap-decoded' })
    itemWrap.append(itemDecoded)

    let decoded = ''

    try {
      if (nodeValue === Memory.labels.empty) {
        decoded = _jStr(Memory.labels.empty).translate()
      } else if (nodeValue === Memory.labels.IOlabel) {
        decoded = '----'
      } else {
        decoded = decodeInstruction(baseConvert.hex2bin(nodeValue))
      }
      // decoded = (nodeValue === Memory.labels.empty) ? _jStr(Memory.labels.empty).translate() : decodeInstruction(bc.hex2bin(nodeValue))
    } catch (e) {
      decoded = '----'
    }

    itemDecoded.text(decoded)

    if (nodeValue !== Memory.labels.empty && nodeValue !== Memory.labels.IOlabel) {
      itemValue.on('click', (event) => {
        event.stopPropagation()
        document.querySelectorAll('.inputmempos').forEach((item) => item.remove())
        Forms.editableTextInput('Memory value', 'inputmempos', 'inputmempos', itemValue, event.target.getBoundingClientRect(), itemValue.text(), callable)
      })
    }

    return itemWrap
  }

  /**
   * @method drawNodes Draw memory nodes
   * @param {*} parent Parent element
   * @param {*} startNode Start node
   */
  drawNodes (parent, startNode) {
    parent.empty()
    parent.style({ transform: 'translateY(' + (startNode * 30) + 'px)' })
    const _this = this
    for (let i = 0; i < 10; i++) {
      let mempos = 'XXXX'
      try {
        mempos = this.mem.peekPos(i + startNode)
        if (mempos !== 'XXXX' && mempos !== 'ESES') {
          mempos = baseConvert.dec2hex(mempos)
        }
      } catch (e) {
      }

      parent.append(this.drawNode(i + startNode, mempos,
        function (value) {
          _this.mem.setPos(i + startNode, baseConvert.hex2dec(value))
        }))
    }
  }

  /**
 * @method reDraw Redraw memory editor
 */
  reDraw () {
    this.scrollable.element.scroll({
      top: this.startNode * 30,
      left: 0,
      behavior: 'auto'
    })
  }

  constructor (mem, ct) {
    super()
    this.mem = mem
    this.ct = ct

    const wrap = _jsc({ s: 'div', _id: 'memeditor' })

    const addrFinder = _jsc({ s: 'div', _id: 'addrfinder' })

    wrap.append(addrFinder)

    const afInput = _jsc({ s: 'input', _id: 'position' })
    afInput.attr({ placeholder: _jStr(Memoryedit.labels.hex_addr).translate(), type: 'text' })
    const afButton = _jsc({ s: 'button', _id: 'gotopos' })
    afButton.text(_jStr(Memoryedit.labels.go).translate())
    const afButton2 = _jsc({ s: 'button', _id: 'loadpos' })
    afButton2.text(_jStr(Memoryedit.labels.load).translate())

    addrFinder.append(afInput)
    addrFinder.append(afButton)
    addrFinder.append(afButton2)

    const vtHeader = _jsc({ s: 'div' })
    wrap.append(vtHeader.element)
    const vtHeader1 = _jsc({ s: 'div', _class: 'vt-header' })
    const vtHeader2 = _jsc({ s: 'div', _class: 'vt-header' })

    vtHeader.append(vtHeader1)
    vtHeader.append(vtHeader2)

    vtHeader1.text(_jStr(Memoryedit.labels.addr).translate())
    vtHeader2.text(_jStr(Memoryedit.labels.value).translate())

    const tmp = this.init(wrap, {
      itemHeight: 30,
      itemVisible: 10
    }, this.mem.positions.length)

    this.nodes = tmp[1]

    this.dom_ = wrap
    const scrollable = tmp[0]

    this.scrollable = scrollable
    this.startNode = 0
    this.drawNodes(this.nodes, this.startNode)

    this.lastValue = ''

    const _this = this

    afInput.style({ 'text-transform': 'uppercase' })

    afInput.on('keydown', (event) => {
      _this.lastValue = event.target.value
      const validChar = Forms.isHexChar(event.key.toUpperCase())
      const cursorKey = Forms.isNavKey(event.keyCode)
      const copyPaste = Forms.especialKeyEvents('CopyPaste', event)
      if (!Forms.isTextSelected(event.target) && event.target.value.length + 1 > 4 && !cursorKey && !copyPaste) {
        event.preventDefault()
        return false
      }
      if (!(validChar || cursorKey || copyPaste)) {
        event.preventDefault()
      }
    })
    afInput.on('keyup', (event) => {
      if (Forms.especialKeyEvents('Esc', event)) {
        event.preventDefault()
        return false
      } else if (Forms.especialKeyEvents('Enter', event)) {
        event.preventDefault()
        if (event.target.value === undefined || event.target.value === '') {
          event.target.value = '0000'
        }
        event.target.value = baseConvert.dec2hex(baseConvert.hex2dec(event.target.value))

        afButton.element.click()

        return false
      } else {
        if (Forms.especialKeyEvents('CopyPaste', event)) {
          if (!Forms.isHexString(event.target.value)) {
            alert(_jStr(Forms.error.hex16).translate())
            event.target.value = _this.lastValue
          }
        }
      }
    })

    afButton.on('click', function (event) {
      scrollable.element.scroll({
        top: baseConvert.hex2dec(afInput.element.value) * 30,
        left: 0,
        behavior: 'auto'
      })
    })

    afButton2.on('click', function (event) {
      afInput.element.value = afInput.element.value ? afInput.element.value : baseConvert.dec2hex(that.startNode)
      vwactions.loadMemory(ct, afInput.element.value, function () { afButton.element.click() })
    })

    const that = this
    scrollable.on('scroll', () => {
      const scrolled = scrollable.element.scrollTop // reuse `scrollContent` innstead of querying the DOM again
      that.startNode = Math.floor(scrolled / 30)

      this.drawNodes(that.nodes, that.startNode)
    }, { passive: true })
  }

  listen (message) {
    if (message.topic === Memory.topic.edited_mem_pos || message.topic === Memory.topic.module_add || message.topic === Memory.topic.reset || message.topic === Memory.topic.module_rm) {
      this.drawNodes(this.nodes, this.startNode)
    }
  }

  get dom () {
    return this.dom_.element
  }
}

const contextMenuLabels = {
  delete_module: 'labels.memcfg.delete_module'
}

/**
 * @method module Create a memory module
 * @param {*} moduleinfo Memory module info
 * @param {Memory} mem Memory object link
 * @returns
 */
function module$1 (moduleinfo, mem) {
  const module = _jsc({ s: 'div', _class: 'mem-module' + moduleinfo[1], _style: { top: (moduleinfo[0] / 1024 / 4) * 29 + 'px' } })
  const moduletype = _jsc({ s: 'div', _class: 'moduletype', _style: { 'margin-top': Math.floor(moduleinfo[1] / 4 * 27 / 2) - 11 + 'px' } })
  const modulesize = _jsc({ s: 'div', _class: 'module-size' })

  const image = iconLib.memory(24, '--mem-manager-icon-color')

  modulesize.text(moduleinfo[1] + 'k')
  moduletype.append(modulesize)
  moduletype.append(image)
  module.append(moduletype)

  const items = [{
    label: _jStr(contextMenuLabels.delete_module).translate(),
    callback: function () {
      module.remove()
      mem.removeModule(moduleinfo[0])
    }
  }
  ]

  ContextMenu.new(module.element, items)

  return module
}

/**
 * @class MemoryCfg Memory configuration
 * @property {HTMLElement} wrap DOM
 * @property {HTMLElement} header Header
 * @property {HTMLElement} left Left header
 * @property {HTMLElement} right Right header
 * @property {HTMLElement} modules Modules
 * @property {HTMLElement} modulescfg Modules configuration
 * @property {HTMLElement} modulesLeft Modules left
 * @property {HTMLElement} modulesMiddle Modules middle
 * @property {HTMLElement} modulesRight Modules right
 * @property {HTMLElement} modulesRepo Modules repository
 * @property {HTMLElement} middleNav Middle navigation
 * @property {HTMLElement} moduledrag Module drag
 * @property {Number} moduledragSize Module drag size
 * @property {object} mem Memory object
 * @property {function} callOnSave Callback on save
 * @property {HTMLElement} bclose Close button
 * @property {HTMLElement} w Window
 * @property {Object} labels Labels
 *
 */
class MemoryCfg extends Observer {
  static labels = {
    header_left: 'labels.memcfg.header_left',
    header_right: 'labels.memcfg.header_right'
  }

  constructor (mem) {
    super()
    const that = this
    this.mem = mem
    this.callOnSave = false
    // const blocks = []
    // const filtered = mem.positions.filter((item, index, arr) => { if (item != 0) blocks.push(index); return item != 0 })
    this.header = _jsc({ s: 'div', _id: 'header' })
    this.left = _jsc({ s: 'div', _id: 'header-left' })
    this.right = _jsc({ s: 'div', _id: 'header-right' })
    this.header.append(this.left).append(this.right)

    this.left.html(_jStr(MemoryCfg.labels.header_left).translate())
    this.right.html(_jStr(MemoryCfg.labels.header_right).translate())

    this.wrap = _jsc({ s: 'div', _id: 'memmngr' })
    this.modules = _jsc({ s: 'div', _class: 'modules' })
    this.modulescfg = _jsc({ s: 'div', _class: 'modules-cfg' })
    this.modulesLeft = _jsc({ s: 'div', _class: 'modules-left' })
    this.modulesMiddle = _jsc({ s: 'div', _class: 'modules-middle' })
    this.modulesRight = _jsc({ s: 'div', _class: 'modules-right' })
    this.modulesRepo = _jsc({ s: 'div', _class: 'modules-repo' })

    this.modulescfg.append(this.modulesLeft)
    this.modulescfg.append(this.modulesMiddle)
    this.modulesMiddle.append(this.modules)
    this.modulescfg.append(this.modulesRight)
    this.wrap.append(this.header)
    this.wrap.append(this.modulescfg)
    this.wrap.append(this.modulesRepo)

    this.middleNav = _jsc({ s: 'div' })

    this.wrap.append(this.middleNav)

    this.modulesMiddle.on('mousemove', function (e) {
      if (that.moduledrag) {
        that.middleNav.addClass('middle-nav-active')
        that.middleNav.style({ position: 'absolute', left: that.modulesMiddle.element.offsetLeft - 5 + 'px' })
        const desp = Math.floor((e.pageY - that.modulesMiddle.element.getBoundingClientRect().y) / 29)
        const blocksmoduledrag = Math.floor(that.moduledrag.getBoundingClientRect().height / 29)
        that.middleNav.style({
          top: ((29 * (desp + blocksmoduledrag > 15 ? 15 - blocksmoduledrag + 1 : desp)) + that.modulesMiddle.element.offsetTop + 7) + 'px',
          height: that.moduledrag.offsetHeight + 'px',
          'background-color': (desp * 0x1000) % (that.moduledragSize * 1024) === 0 ? '#0f0' : '#f00'
        })
      }
    })

    const sizeLabels = _jsc({ s: 'ul' })
    const positionLabels = _jsc({ s: 'ul' })
    const sizeLabel = _jsc({ s: 'li' })
    const positionLabel = _jsc({ s: 'li' })
    sizeLabel.text('0k')
    sizeLabels.append(sizeLabel)

    positionLabel.text('0000h')
    positionLabels.append(positionLabel)

    for (let i = 4; i <= 64; i = i + 4) {
      const sizeLabel = _jsc({ s: 'li' })
      sizeLabel.text(i + 'k')
      sizeLabels.append(sizeLabel)

      const positionLabel = _jsc({ s: 'li' })
      positionLabel.text(baseConvert.dec2hex(i * 1024 - (i === 64 ? 1 : 0)).toUpperCase() + 'h')
      positionLabels.append(positionLabel)
    }

    this.modulesLeft.append(sizeLabels)
    this.modulesRight.append(positionLabels)

    const modules = [4, 8, 16, 32]

    for (let i = 0; i < modules.length; i++) {
      const module = _jsc({ s: 'div', _class: 'mem-module' + modules[i] })
      const moduletype = _jsc({ s: 'div', _class: 'moduletype', _style: { 'margin-top': Math.floor(modules[i] / 4 * 27 / 2) - 11 + 'px' } })
      const modulesize = _jsc({ s: 'div', _class: 'module-size' })

      const image = iconLib.memory(24, '--mem-manager-icon-color')
      modulesize.text(modules[i] + 'k')
      moduletype.append(modulesize)
      moduletype.append(image)
      module.append(moduletype)

      this.modulesRepo.append(module)

      module.on('mousedown', function (e) {
        e.preventDefault()
        that.moduledrag = this.cloneNode()
        that.moduledragSize = modules[i]
        document.body.append(that.moduledrag)
        that.moduledrag.style.position = 'absolute'
        that.moduledrag.style.opacity = '0.5'
        that.moduledrag.style.borderStyle = 'dashed'
        that.moduledrag.style.zIndex = '99999'

        that.moduledrag.style.left = e.pageX + 'px'
        that.moduledrag.style.top = e.pageY + 'px'
      })
    }
    document.body.addEventListener('mousemove', function (e) {
      if (that.moduledrag) {
        that.moduledrag.style.left = e.pageX + 5 + 'px'
        that.moduledrag.style.top = e.pageY + 5 + 'px'
      }
    })
    that.modulesMiddle.on('mouseup', function (e) {
      if (that.moduledrag) {
        that.moduledrag.remove()
        that.middleNav.removeClass('middle-nav-active')
        const desp = Math.floor((e.pageY - that.modulesMiddle.element.getBoundingClientRect().y) / 29)
        try {
          that.mem.addModule((desp * 0x1000), that.moduledragSize)
          that.moduledrag = null
          that.moduledragSize = null
          that.redrawMem()
        } catch (e) {
          console.log(e)
          alert(_jStr(e.message).translate() || 'Unexpected error in mouseup event in memorycfg.js')
        }
      }
    })

    document.body.addEventListener('mouseup', function (e) {
      if (that.moduledrag) {
        that.moduledrag.remove()
        that.moduledrag = null
        that.moduledragSize = null
      }
    })
    that.modulesMiddle.on('mouseleave', function (e) {
      if (that.moduledrag) {
        that.middleNav.removeClass('middle-nav-active')
      }
    })
    this.redrawMem()
  }

  redrawMem () {
    this.modules.empty()
    for (let i = 0; i < this.mem.modules.length; i++) {
      this.modules.append(module$1(this.mem.modules[i], this.mem))
    }
  }

  getDom () {
    return this.wrap
  }

  onSave (callable) {
    this.callOnSave = callable
  }

  listen (message) {
    if (message.topic === Memory.topic.edited_mem_pos || message.topic === Memory.topic.module_add || message.topic === Memory.topic.reset || message.topic === Memory.topic.module_rm) {
      this.redrawMem()
    }
  }
}

const deviceFormErrors = {
  input_device: 'errors.deviceform.input_device',
  output_device: 'errors.deviceform.output_device'
}

const deviceFormLabels = {
  form_name: 'labels.deviceform.form_name',
  form_address: 'labels.deviceform.form_address',
  form_vector: 'labels.deviceform.form_vector',
  form_priority: 'labels.deviceform.form_priority',
  form_int: 'labels.deviceform.form_int'
}

/**
 * @method OutputDeviceForm Creates a form for output devices
 * @param {*} callback Callable after OK button is pressed
 * @returns {HTMLElement} Form
 */
function OutputDeviceForm (callback) {
  const form = _jsc({ s: 'form', _class: 'device-form' })
  const name = Forms.inputwlabel('text', _jStr(deviceFormLabels.form_name).translate(), 'device-name')
  const basedir = Forms.inputwlabel('text', _jStr(deviceFormLabels.form_address).translate(), 'device-basedir')
  const btok = Forms.button('OK', 'btok')

  Forms.hexInput(basedir)

  form.append(name.dom)
  form.append(basedir.dom)

  form.append(document.createElement('br'))
  form.append(btok.input)

  btok.input.addEventListener('click', (event) => {
    event.preventDefault()
    const tmp = { name: name.input.value, basedir: basedir.input.value }
    if (basedir.input.value !== '') {
      callback(tmp)
    } else alert(_jStr(deviceFormErrors.output_device).translate())
  }
  )

  return form
}

/**
 * @method InputDeviceForm Creates a form for input devices
 * @param {*} callback Callable after OK button is pressed
 * @returns {HTMLElement} Form
 */
function InputDeviceForm (callback) {
  const form = _jsc({ s: 'form', _class: 'device-form' })
  const name = Forms.inputwlabel('text', _jStr(deviceFormLabels.form_name).translate(), 'device-name')
  const basedir = Forms.inputwlabel('text', _jStr(deviceFormLabels.form_address).translate(), 'device-basedir')
  const btok = Forms.button('OK', 'btok')
  const vector = Forms.inputwlabel('text', _jStr(deviceFormLabels.form_vector).translate(), 'kbvector')
  const priority = Forms.inputwlabel('text', _jStr(deviceFormLabels.form_priority).translate(), 'kbpriority')
  const int = Forms.input('checkbox', _jStr(deviceFormLabels.form_int).translate(), 'kbint')

  Forms.hexInput(basedir)
  Forms.decInput(vector, 0, 255)
  Forms.decInput(priority, 0, 255)

  form.append(name.dom)
  form.append(basedir.dom)
  const checkwrap = _jsc({ s: 'div', _class: 'checkwrap' })
  checkwrap.append(int.input)

  form.append(checkwrap.element)
  _jss(int.label).addClass('genintlabel')
  checkwrap.append(int.label)

  const genint = _jsc({ s: 'div', _class: 'genintwrap' })

  genint.append(vector.dom)
  genint.append(priority.dom)
  form.append(genint.element)

  form.append(document.createElement('br'))
  form.append(btok.input)

  _jss(int.input).on('mousedown', (event) => {
    event.preventDefault()
    event.stopPropagation()
  })
  _jss(int.input).on('mouseup', (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!event.target.checked) {
      genint.removeClass('genintwrap').addClass('genintwrap-active')
    } else {
      genint.removeClass('genintwrap-active').addClass('genintwrap')
    }
  })

  btok.input.addEventListener('click', (event) => {
    event.preventDefault()
    if (!int.input.checked) {
      vector.input.value = null
      priority.input.value = null
    }
    const tmp = { name: name.input.value, basedir: basedir.input.value, vector: vector.input.value, priority: priority.input.value, int: int.input.checked }
    if (basedir.input.value && (!int.input.checked || (int.input.checked && vector.input.value !== '' && vector.input.value !== undefined && priority.input.value !== '' && priority.input.value !== undefined))) {
      callback(tmp)
    } else alert(_jStr(deviceFormErrors.input_device).translate())
  })

  return form
}

/**
 * TODO how to document references to third party code
 * @source  https://www.javascripttutorial.net/javascript-queue/
 *
 */
class Queue {
  constructor () {
    this.elements = {}
    this.head = 0
    this.tail = 0
  }

  enqueue (element) {
    this.elements[this.tail] = element
    this.tail++
  }

  dequeue () {
    const item = this.elements[this.head]
    delete this.elements[this.head]
    this.head++
    return item
  }

  peek () {
    return this.elements[this.head]
  }

  removeTail () {
    delete this.elements[this.tail - 1]
    this.tail--
  }

  get length () {
    return this.tail - this.head
  }

  isEmpty () {
    return this.length === 0
  }

  asArray () {
    const keys = Object.keys(this.elements)
    const elements = []
    for (let i = 0; i < keys.length; i++) {
      elements.push(this.elements[keys[i]])
    }

    return elements
  }

  clear () {
    this.elements = {}
    this.head = 0
    this.tail = 0
  }
}

/**
 * @class InputDevice
 * @extends Device
 * @abstract
 * @property {number} vector Interuption Vector of the device
 * @property {number} priority Priority of the device
 * @property {boolean} int Indicates if the device generates interrupts
 * @property {number} readStep Indicates the current step of the read operation
 * @property {boolean} readMode Indicates if the device is in read mode
 *
 */
class InputDevice extends Device {
  constructor (name, baseaddress, memsize, vector, priority, int, sdb, cpu) {
    super(name, baseaddress, memsize, sdb, cpu)

    this.vector = vector
    this.priority = priority
    this.int = int
    this.readStep = 0

    //  State that indicates that the device is in read mode
    this.readMode = false

    Object.assign(InputDevice.prototype, withInt)
  }
}

/**
 * @class KeyBuffer
 * @extends Queue
 * @property {number} size Size of the buffer
 * @property {number} length Length of the buffer
 * @property {Array} buffer Array that contains the buffer
 * @property {Object} error Error messages
 * */
class KeyBuffer extends Queue {
  static error = {
    bufferfull: 'error.keyboard.buffer-full',
    outofbounds: 'error.keyboard.out-of-bounds'
  }

  /**
   * @method init Gets the buffer initialized with the given array
   * @param {*} arr Array to initialize the buffer
   */
  init (arr) {
    this.clear()
    arr.forEach((element) => {
      this.enqueue(element)
    })
  }

  constructor (size) {
    super()
    this.size = size
  }

  /**
   * @method enqueue Enqueues an element in the buffer
   * @param {*} element
   */
  enqueue (element) {
    if (this.length < this.size) {
      super.enqueue(element)
    } else throw new Error(KeyBuffer.error.bufferfull)
  }

  /**
   * @method dequeue Dequeues an element from the buffer
   * @returns {*} Dequeues an element from the buffer and returns it
   */
  dequeue () {
    if (this.length > 0) {
      return super.dequeue()
    } else throw new Error(KeyBuffer.error.outofbounds)
  }

  /**
   * @method removeFirst Removes the first element from the buffer
   * @throws {KeyBuffer.error.outofbounds} If the buffer is empty
   */
  removeFirst () {
    if (this.length > 0) {
      super.dequeue()
    } else throw new Error(KeyBuffer.error.outofbounds)
  }

  /**
   * @method removeLast Removes the last element from the buffer
   * @throws {KeyBuffer.error.outofbounds} If the buffer is empty
   * */
  removeLast () {
    if (this.length > 0) {
      super.removeTail()
    } else throw new Error(KeyBuffer.error.outofbounds)
  }

  /**
   * @method clear Clears the buffer
   */
  clear () {
    super.clear()
  }
}

/**
 * @class Key
 * @property {string} value Value of the key
 * @property {string} _scan Scan code of the key
 * @property {boolean} _caps Indicates if the caps key is active or not
 */
class Key {
  constructor (keyvalue, scan) {
    this._caps = false
    this.value = keyvalue
    this._scan = scan
  }

  /**
     * @param {boolean} capsvalue
     */
  set caps (capsvalue) {
    this._caps = capsvalue
  }

  /**
   * @returns {boolean} Indicates if the caps key is active or not
   */
  get caps () {
    return this._caps
  }

  /**
   * @returns {string} Returns the code of the key
   */
  get code () {
    return (this.scan + '' + this.hex).toUpperCase()
  }

  /**
   * @returns {string} Returns the scan code of the key
   */
  get scan () {
    return baseConvert.dec2hex(this._scan, 2).toUpperCase()
  }

  /**
   * @returns {string} Returns the hex code of the key
   */
  get hex () {
    if (this.caps) return this.value.charCodeAt(0).toString(16)
    else return this.value.toLowerCase().charCodeAt(0).toString(16)
  }
}

/**
 * @class Keyboard
 * @extends InputDevice
 * @property {KeyBuffer} buffer Buffer of the keyboard
 * @property {boolean} _caps Indicates if the caps key is active or not
 * @property {Array} keys Array that contains the keys of the keyboard
 * @property {number} scanCounter Counter of the scan code
 * @property {Array} registers Array that contains the registers of the keyboard
 * @property {number} baseaddress Base address of the keyboard
 * @property {number} priority Priority of the keyboard
 * @property {number} vector Interrupt vector of the keyboard
 * @property {boolean} int Indicates if the keyboard generates interrupts
 */
class Keyboard extends InputDevice {
  static error = {
    bufferfull: KeyBuffer.error.bufferfull,
    outofbounds: KeyBuffer.error.outofbounds,
    writeonlyec: 'error.keyboard.write-only-ec'
  }

  static topics = {
    update: 'keyboard-update-'
  }

  static keyarea = {
    main: 0,
    num: 1
  }

  /**
   * @method restore Restores the keyboard
   * @param {*} backup Contains the backup of the keyboard
   */
  restore (backup) {
    this.name = backup.name
    this.registers = backup.registers
    this.buffer.init(backup.buffer)
    this._caps = backup.caps
    this.baseaddress = backup.address
    this.priority = backup.priority
    this.vector = backup.vector
    this.int = backup.int
    this.broadCast({ topic: Keyboard.topics.update + this.name })
  }

  /**
 * @method backup Returns the backup of the keyboard
 * @returns {*} Returns the backup of the keyboard
 */
  backup () {
    return {
      type: 'keyboard',
      name: this.name,
      registers: this.registers,
      buffer: this.buffer.asArray(),
      caps: this._caps,
      address: this.baseaddress,
      priority: this.priority,
      vector: this.vector,
      int: this.int
    }
  }

  constructor (name, baseaddress, vector, priority, int, sdb, cpu) {
    super(name, baseaddress, 2, vector, priority, int, sdb, cpu)

    this.buffer = new KeyBuffer(16)

    this.scanCounter = 0

    // 0 position is data register, 1 position ecresiter
    this.registers = [0x0, 0x0]

    this._caps = false

    this.keys = {}
    this.keys[Keyboard.keyarea.main] = []
    this.keys[Keyboard.keyarea.num] = []

    // let counter=0;
    '1234567890QWERTYUIOPASDFGHJKLÑ#ZXCVBNM'.split('').forEach((k) => {
      this.keys[Keyboard.keyarea.main].push(new Key(k, this.scanCounter++))
    })

    // We nead this leap of 2 to match the old simulator codes
    this.scanCounter = this.scanCounter + 2

    '7894560123'.split('').forEach((k) => {
      this.keys[Keyboard.keyarea.num].push(new Key(k, this.scanCounter++))
    })

    this.keys[Keyboard.keyarea.main].push(new Key(' ', this.scanCounter++))
  }

  /**
   * @returns {number} Returns the value of the control register
   */
  get ecregister () {
    return this.registers[1]
  }

  /**
 * @param {number} value Value to set in the control register
 */
  set ecregister (value) {
    this.registers[1] = value
  }

  /**
   * @returns {number} Returns the value of the data register
   * */
  get dataregister () {
    return this.registers[0]
  }

  /**
   * @param {number} value Value to set in the data register
   */
  set dataregister (value) {
    this.registers[0] = value
  }

  /**
   * @method pushKey Pushes a key into the buffer
   * @param {*} inputkey pushed key
   * @param {*} keyarea area of the key
   */
  pushKey (inputkey, keyarea = Keyboard.keyarea.main) {
    const key = this.keys[keyarea].filter(key => key.value === inputkey.toUpperCase())[0]
    key.caps = this.caps

    try {
      this.buffer.enqueue({ value: this.caps ? inputkey.toUpperCase() : inputkey.toLowerCase(), code: key.code, scan: key.scan, hex: key.hex })
      this.ecregister = this.ecregister | 0x0100

      // in case that Interrupts are enabled we have to report to the CPU de int signal
      if (this.int) {
        this.cpu.setInt()
        this.activeInt = true
      }
    } catch (ex) {
      throw new Error(ex.message)
    }
  }

  // resetReadMode () {
  //   super.resetReadMode()
  //   if (this.buffer.length > 0) this.readMode = false
  // }

  /**
   * @method reset Resets the keyboard
   */
  reset () {
    this.buffer.clear()
    this.registers = [0x0, 0x0]
    this.reportUpdate()
  }

  /**
   * @method pushNumKey Pushes a key into the numeric area of the keyboard
   * @param {*} inputkey
   */
  pushNumKey (inputkey) {
    this.pushKey(inputkey, Keyboard.keyarea.num)
  }

  /**
   * @method pushNumKey Pushes a key into the main area of the keyboard
   * @param {*} inputkey
   */
  pushMainKey (inputkey) {
    this.pushKey(inputkey, Keyboard.keyarea.main)
  }

  /**
   * @method toggleCaps Toggles the caps key
   */
  toggleCaps () {
    this._caps = !this._caps
  }

  /**
   * @method mainkeys Get the main keys of the keyboard
   */
  get mainkeys () {
    return this.keys[Keyboard.keyarea.main]
  }

  /**
   * @method numkeys Get the numeric keys of the keyboard
   */
  get numkeys () {
    return this.keys[Keyboard.keyarea.num]
  }

  /**
   * @param {boolean} caps True if the caps key is active, false otherwise
   */
  get caps () {
    return this._caps
  }

  /**
   * @method getPos Gets the value of the given position
   * @param {number} position
   * @throws {Keyboard.error.outofbounds} If we are trying to read when the buffer is empty
   */
  getPos (position) {
    if (position > 1) throw new Error(Keyboard.error.outofbounds)
    try {
      if (position === 0) {
        this.dataregister = baseConvert.hex2dec(this.buffer.dequeue().code)

        // this.dataregister = this.dataregister & 0x00FF
        if (this.buffer.length === 0) this.ecregister = this.ecregister & 0x1011

        this.reportUpdate()
      }
      return this.registers[position]
    } catch (ex) {
      throw new Error(ex.message)
    }
  }

  /**
   * @method setPos Sets the value of the given position
   * @param {*} position position where to set the value
   * @param {*} value value to set
   */
  setPos (position, value) {
    if (position !== 1) { throw new Error(Keyboard.error.writeonlyec) }
    value = value & 0x000F
    this.ecregister = this.ecregister & 0xFFF0
    this.ecregister = this.ecregister | value

    if (Bitop.isOn(this.ecregister, 0)) { this.buffer.removeFirst() }
    if (Bitop.isOn(this.ecregister, 1)) { this.buffer.removeLast() }
    if (Bitop.isOn(this.ecregister, 2)) this.buffer.clear()
    if (Bitop.isOn(this.ecregister, 3)) this.int = !this.int
    else this.int = false

    if (this.buffer.length === 0) this.ecregister = this.ecregister & 0x1011
    this.reportUpdate()
  }

  /**
   * @method isInt Checks if the keyboard is in interrupt mode
   * @returns {boolean} Returns true if the keyboard is in interrupt mode, false otherwise
   */
  isInt () {
    return this.activeInt
  }

  /**
   * @method reportUpdate Reports the update of the keyboard
   */
  reportUpdate () {
    this.broadCast({ topic: Keyboard.topics.update + this.name })
  }
}

/**
 * @class CTKeyboard
 * @extends Observer
 * @property {String} name Name
 * @property {HTMLElement} content Content
 * @property {Keyboard} control Control
 * @property {Object} error Errors
 * @property {Object} labels Labels
 *
 */
class CTKeyboard extends Observer {
  static error = {
    keyboard_must: 'errors.ctkeyboard.keyboard_must'
  }

  static labels = {
    buffer: 'labels.ctkeyboard.buffer',
    buffer_hex: 'labels.ctkeyboard.buffer_hex',
    buffer_char: 'labels.ctkeyboard.buffer_char',
    caps: 'labels.ctkeyboard.caps',
    address: 'labels.ctkeyboard.address',
    vector: 'labels.ctkeyboard.vector',
    priority: 'labels.ctkeyboard.priority',
    int: 'labels.ctkeyboard.int',
    state: 'labels.ctkeyboard.state'
  }

  constructor (keyboard) {
    super()
    this.name = keyboard.name
    this.content = _jsc({ s: 'div', _class: 'keyboard' })
    this.control = keyboard
    this.control.subscribe(this)
    this.draw()
  }

  /**
   * @method drawBuffer Draws the keyboard buffer
   */
  drawBuffer () {
    this.content.element.querySelector('.keyboard-body-right').innerHTML = ''
    const buffer = this.control.buffer.asArray()

    const title = _jsc({ s: 'div' })
    const tableheader = _jsc({ s: 'table', _class: 'keyboard-buffer' })
    const head = _jsc({ s: 'thead' })
    const headtr = _jsc({ s: 'tr' })

    const table = _jsc({ s: 'table', _class: 'keyboard-buffer' })
    const body = _jsc({ s: 'tbody' })
    const hex = _jsc({ s: 'th', _class: 'keyboard-buffer-hex' })
    const car = _jsc({ s: 'th', _class: 'keyboard-buffer-car' })

    title.addClass('title')
    title.text(_jStr(CTKeyboard.labels.buffer).translate())
    tableheader.append(head)
    head.append(headtr)
    headtr.append(hex)
    headtr.append(car)
    table.append(body)

    hex.text(_jStr(CTKeyboard.labels.buffer_hex).translate())
    car.text(_jStr(CTKeyboard.labels.buffer_char).translate())

    for (let i = 0; i < buffer.length; i++) {
      const tr = _jsc({ s: 'tr' })
      const hextd = _jsc({ s: 'td', _class: 'keyboard-buffer-hex' })
      const cartd = _jsc({ s: 'td', _class: 'keyboard-buffer-car' })

      tr.append(hextd)
      tr.append(cartd)

      hextd.text(buffer[i].code)
      cartd.text(buffer[i].value)

      body.append(tr)
    }

    this.content.element.querySelector('.keyboard-body-right').append(title.element)
    this.content.element.querySelector('.keyboard-body-right').append(tableheader.element)
    this.content.element.querySelector('.keyboard-body-right').append(table.element)
  }

  /**
   * @method addButton Adds a button to the keyboard
   * @param {*} buttonline Represents a line of buttons
   * @param {*} value Value of the button
   * @param {*} area Area of the button
   */
  addButton (buttonline, value, area) {
    const _this = this
    const button = _jsc({ s: 'button' })
    button.addClass('keyboard-button')
    button.text(value)

    switch (value) {
      case ' ':button.addClass('keyboard-button-space')

        break
      case '#': button.addClass('keyboard-button-caps')
        break
    }

    button.on('click', function () {
      if (value !== '#') {
        try {
          if (area === 'num') _this.control.pushNumKey(value)
          else _this.control.pushMainKey(value)

          _this.drawBuffer()
          _this.drawHead()
        } catch (e) {
          alert(Keyboard.error.bufferfull)
        }
      } else _this.toggleCaps()
    })

    buttonline.append(button)
  }

  /**
   * @method createKbLine Creates a line of buttons
   * @param {*} doc Kbline dom elemeent
   * @param {*} buttonlines Array of button lines
   * @param {*} keys Array of keys
   * @param {*} area Area of the line
   */
  createKbLine (doc, buttonlines, keys, area) {
    if (!this.control) throw new Error(CTKeyboard.error.keyboard_must)

    buttonlines.push(_jsc({ s: 'div' }))

    doc.append(buttonlines[buttonlines.length - 1])

    buttonlines[buttonlines.length - 1].addClass('keyboard-button-line')

    const currentLine = buttonlines.length - 1

    keys.forEach((v) => {
      this.addButton(buttonlines[currentLine], v.value, area)
    })
  }

  /**
   * @method createMain Creates the main area of the keyboard
   * @param {*} doc Main area dom element
   */
  createMain (doc) {
    if (!this.control) throw new Error(CTKeyboard.error.keyboard_must)

    doc.style({ display: 'inline-block', padding: '3px', float: 'left' })

    const buttonlines = []

    // Starting index of each keyboard line
    const keyboardLinesStart = [0, 10, 20, 30, 38]
    keyboardLinesStart.forEach((i, index) => {
      this.createKbLine(doc, buttonlines, this.control.mainkeys.slice(i, keyboardLinesStart[index + 1]), 'main')
    })
  }

  /**
   * @method createCapsRadio Creates the caps radio button
   * @param {*} doc Caps radio dom element
   */
  createCapsRadio (doc) {
    const capslock = _jsc({ s: 'div' })
    const radio = _jsc({ s: 'div' })
    const radiolabel = _jsc({ s: 'label' })

    capslock.addClass('caps-lock')

    radiolabel.text(_jStr(CTKeyboard.labels.caps).translate())

    radio.addClass('caps-radio')
    radio.addClass('caps-radio-inactive')
    capslock.append(radio)
    capslock.append(radiolabel)
    doc.append(capslock)
  }

  /**
   *  @method createNumeric Creates the numeric area of the keyboard
   * @param {*} doc  Numeric area dom element
   */
  createNumeric (doc) {
    const wraplines = _jsc({ s: 'div' })
    wraplines.addClass('keyboard-lines')
    doc.append(wraplines)

    wraplines.style.display = 'inline-block'

    wraplines.style.padding = '3px'

    const buttonlines = []

    const keyboardLinesStart = [0, 3, 6]
    keyboardLinesStart.forEach((i, index) => {
      this.createKbLine(wraplines, buttonlines, this.control.numkeys.slice(i, keyboardLinesStart[index + 1]), 'num')
    })
  }

  /**
   * @method drawHead Draws the keyboard head
   * @param {*} doc Head dom element
   */
  drawHead () {
    this.head.empty()

    this.head.style.display = 'block'
    this.head.style.margin = '5px'
    this.head.style.padding = '3px'

    this.head.style.width = 'auto'

    const dir = _jsc({ s: 'div' })
    const vec = _jsc({ s: 'div' })
    const prior = _jsc({ s: 'div' })
    const state = _jsc({ s: 'div' })

    dir.html(_jStr(CTKeyboard.labels.address).translate() + ': <strong>' + baseConvert.dec2hex(this.control.baseaddress).toUpperCase() + 'h</strong>')
    vec.html(_jStr(CTKeyboard.labels.vector).translate() + ': <strong>' + baseConvert.dec2hex(this.control.vector).toUpperCase() + 'h</strong>')
    prior.html(_jStr(CTKeyboard.labels.priority).translate() + ': <strong>' + this.control.priority + '</strong>')
    state.html(_jStr(CTKeyboard.labels.state).translate() + ': <strong>' + baseConvert.dec2hex(this.control.ecregister).toUpperCase() + 'h</strong>')

    this.head.append(dir)
    this.head.append(state)
    if (this.control.int) this.head.append(vec)
    if (this.control.int) this.head.append(prior)
  }

  /**
   * @method draw Draws the keyboard
   * @returns {HTMLElement} Keyboard
   * @throws {Error} Keyboard must be defined
   * @throws {Error} Keyboard buffer full
   */
  draw () {
    this.content.element.innerHTML = ''
    if (!this.control) throw new Error(Keyboard.error.keyboard_must)

    this.head = _jsc({ s: 'div' })
    this.body = _jsc({ s: 'div', _class: 'keyboard-body' })
    const mainkeyboard = _jsc({ s: 'div' })
    const numkeyboard = _jsc({ s: 'div' })
    const left = _jsc({ s: 'div' })
    const buffer = _jsc({ s: 'div' })

    this.head.addClass('keyboard-head')
    mainkeyboard.addClass('keyboard-main')
    numkeyboard.addClass('keyboard-num')
    left.addClass('keyboard-body-left')
    buffer.addClass('keyboard-body-right')

    this.content.append(this.head)
    this.content.append(this.body)
    this.body.append(left)

    left.append(mainkeyboard)
    left.append(numkeyboard)
    this.body.append(buffer)

    this.createMain(mainkeyboard)
    this.createCapsRadio(numkeyboard)
    this.createNumeric(numkeyboard)
    this.drawHead(this.head)
    this.drawBuffer()
  }

  /**
   * @method toggleCaps Toggles the caps lock
   */
  toggleCaps () {
    this.control.toggleCaps()
    const caps = _jss(this.content.element.querySelector('.caps-radio'))
    caps.removeClass('caps-radio-inactive')
    caps.removeClass('caps-radio-active')
    caps.addClass('caps-radio-' + (this.control.caps ? 'active' : 'inactive'))
  }

  listen (message) {
    switch (message.topic) {
      case Keyboard.topics.update + this.name:
        this.draw()
        break
    }
  }
}

/**
 * @class Lights
 * @extends InputDevice
 * @property {number} lights Lights value
 * @property {number} switches Switches value
 * @property {number} _lights Internal lights value
 * @property {number} _switches Internal switches value
 * @property {number} vector Interrupt vector
 * @property {number} priority Interrupt priority
 * @property {boolean} int Indicates if the device generates interrupts
 * @property {Object} error Error messages
 * @property {Object} topics Topics used by the device
 */
class Lights extends InputDevice {
  /**
   * @property {Object} error Error messages
   */
  static error = {
    outofbounds: 'error.lights.out-of-bounds'
  }

  /**
   * @property {Object} topics Topics used by the device
   */
  static topics = {
    update: 'lights-update-'
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    return {
      type: 'lights',
      name: this.name,
      lights: this.lights,
      switches: this.switches,
      address: this.baseaddress,
      priority: this.priority,
      vector: this.vector,
      int: this.int
    }
  }

  /**
   * @method reset Reset the device to its initial state
   */
  reset () {
    this._lights = 0x0000
    this._switches = 0x0000
    this.reportUpdate()
  }

  constructor (name, baseaddress, vector, priority, int, sdb, cpu) {
    super(name, baseaddress, 1, vector, priority, int, sdb, cpu)

    this.reset()

    // this.activeInt = false
  }

  /**
   * @method lights Get the lights value
   */
  get lights () {
    return this._lights
  }

  /**
   * @method lights Set the lights value
   * @param {number} value Value to set it has to be 16bit decimal value
   */
  set lights (value) {
    this._lights = value
  }

  /**
   * @method switches Get the switches value
   * @returns {number} value Value of the switches
   */
  get switches () {
    return this._switches
  }

  /**
   * @method switches Set the switches value
   * @param {number} value Value to set it has to be 16bit decimal value
   */
  set switches (value) {
    this._switches = value
  }

  /**
   * @method switchOn Switch on a switch
   * @param {*} _switch switch to switch on
   * @returns instance of the device
   */
  switchOn (_switch) {
    this.switches = Bitop.on(this.switches, _switch)
    return this
  }

  /**
   * @method switchOff Switch off a switch
   * @param {*} _switch switch to switch off
   * @returns instance of the device
   */
  switchOff (_switch) {
    this.switches = Bitop.off(this.switches, _switch)
    return this
  }

  /**
   * @method resetReadMode Reset the read mode
   */
  resetReadMode () {
    super.resetReadMode()
    this.readMode = false
  }

  /**
   * @method getPos Get the value of the given position
   * @param {*} position position to get the value from
   */
  getPos (position) {
    if (position !== 0) throw new Error(Lights.error.outofbounds)
    return this.switches
  }

  /**
   * @method setPos Set the value of the given position
   * @param {*} position position to set the value
   * @param {*} value value to set
   */
  setPos (position, value) {
    if (position !== 0) throw new Error(Lights.error.outofbounds)
    this.lights = value
    this.reportUpdate(value)
  }

  /**
   * @method setInt Set the interrupt flag
   */
  setInt () {
    this.cpu.setInt()
    this.activeInt = true
  }

  /**
   * @method isInt Check if the device is in interrupt mode
   * @returns {boolean} true if the device is in interrupt mode
   */
  isInt () {
    return this.activeInt
  }

  /**
   * @method reportUpdate Report an update
   * @param {*} value value to report
   */
  reportUpdate (value) {
    this.broadCast({ topic: Lights.topics.update + this.name, value })
  }
}

/**
 * @class CTLights
 * @extends Observer
 * @property {String} name Name
 * @property {HTMLElement} content Content
 * @property {Lights} control Control
 * @property {HTMLElement} head Head
 * @property {HTMLElement} lights Lights
 * @property {Object} labels Labels
 *
 */
class CTLights extends Observer {
  static labels = {
    address: 'labels.ctlights.address',
    vector: 'labels.ctlights.vector',
    priority: 'labels.ctlights.priority',
    int: 'labels.ctlights.int',
    genint: 'labels.ctlights.genint',
    group_lights: 'labels.ctlights.group_lights',
    group_switches: 'labels.ctlights.group_switches'
  }

  constructor (lights) {
    super()
    this.content = _jsc({ s: 'div' })
    this.name = lights.name
    this.control = lights
    this.control.subscribe(this)
    this.draw()
  }

  /**
   * @method drawHead Draws the head of the device
   */
  drawHead () {
    this.head.empty()

    const dir = _jsc({ s: 'div' })
    const vec = _jsc({ s: 'div' })
    const prior = _jsc({ s: 'div' })
    const state = _jsc({ s: 'div' })

    dir.html(_jStr(CTLights.labels.address).translate() + ': <strong>' + baseConvert.dec2hex(this.control.baseaddress).toUpperCase() + 'h</strong>')
    vec.html(_jStr(CTLights.labels.vector).translate() + ': <strong>' + baseConvert.dec2hex(this.control.vector).toUpperCase() + 'h</strong>')
    prior.html(_jStr(CTLights.labels.priority).translate() + ': <strong>' + this.control.priority + '</strong>')

    this.head.append(dir)
    if (this.control.int) this.head.append(vec)
    if (this.control.int) this.head.append(prior)
    this.head.append(state)

    if (this.control.int) {
      const btWrap = _jsc({ s: 'div' })
      const btINT = _jsc({ s: 'button', _id: 'genint' })
      const label = _jsc({ s: 'label' })

      btWrap.append(label)
      label.text(_jStr(CTLights.labels.genint).translate() + ': ')
      btWrap.append(btINT)
      btINT.text('INT')
      this.head.append(btWrap)

      const that = this
      btINT.on('click', function () { that.control.setInt() })
    }
  }

  /**
   * @method drawLight Draws a light
   * @param {*} i Light number
   * @param {*} value Light value
   * @returns {HTMLElement} Light
   */
  drawLight (i, value) {
    const wrap = _jsc({ s: 'div', _class: 'light-wrap' })
    const light = _jsc({ s: 'div', _class: 'light' })
    const label = _jsc({ s: 'label' })

    label.text(i.toString())
    light.addClass('light-' + (value.toString() === '0' ? 'in' : '') + 'active')

    wrap.append(label)
    wrap.append(light)

    return wrap
  }

  /**
   * @method addSwitch Adds a switch
   * @param {*} value Switch value
   * @returns {HTMLElement} Switch
   */
  addSwitch (value) {
    const wrap = _jsc({ s: 'div' })
    const _switch = _jsc({ s: 'label', _class: 'switch' })
    const _switchCheck = _jsc({ s: 'input', _attr: { type: 'checkbox' } })
    const _switchSpan = _jsc({ s: 'span' })
    const label = _jsc({ s: 'label' })

    label.text(value)

    wrap.addClass('switch-wrap')
    _switch.addClass('switch-inactive')

    _switchSpan.addClass('slider')
    wrap.append(label)
    wrap.append(_switch)

    _switch.append(_switchCheck)
    _switch.append(_switchSpan)

    const _this = this

    _switchCheck.on('change', function () {
      if (this.checked) _this.control.switchOn(value)
      else _this.control.switchOff(value)
    })

    return wrap
  }

  /**
   * @method drawLights Draws the lights
   *
   * @param {*} value Lights value
   */
  drawLights (value) {
    this.lights.empty()

    const label = _jsc({ s: 'label', _class: 'label-panel' })

    label.text(_jStr(CTLights.labels.group_lights).translate())

    this.lights.append(label)

    const lightString = baseConvert.dec2bin(value)

    for (let i = 15; i >= 0; i--) {
      this.lights.append(this.drawLight(i, lightString[15 - i]))
    }
  }

  /**
   * @method createSwitches Creates the switches
   * @param {*} dom DOM
   * @returns {HTMLElement} Switches
   * @throws {Error} If the device is not created
   *
   */
  createSwitches (dom) {
    const label = _jsc({ s: 'label', _class: 'label-panel' })

    label.text(_jStr(CTLights.labels.group_switches).translate())

    dom.append(label)

    for (let i = 15; i >= 0; i--) {
      dom.append(this.addSwitch(i.toString()))
    }
  }

  /**
   * @method draw Draws the device
   * @throws {Error} If the device is not created
   *
   */
  draw () {
    if (!this.control) throw new Error('Es necesario crear el dispositivo previamente')

    this.head = _jsc({ s: 'div', _class: 'lights-head' })
    const lightsIn = _jsc({ s: 'div', _class: 'lights-in' })
    this.lights = _jsc({ s: 'div', _class: 'lights-out' })

    this.content.append(this.head)
    this.content.append(this.lights)
    this.content.append(lightsIn)

    this.drawLights(this.control.lights)
    this.createSwitches(lightsIn)
    this.drawHead()
  }

  listen (message) {
    switch (message.topic) {
      case Lights.topics.update + this.name:
        this.drawLights(message.value)
        break
    }
  }
}

/**
 * @class Screen
 * @extends Device
 * @property {number} controlregister Control register
 * @property {Array} _positions Internal positions array of the screen
 * */
class Screen extends Device {
  /**
   * @property colors Colors of the screen
   */
  static colors = [
    { rbg: '#000000', label: 'Black' }, // Black
    { rbg: '#0000FF', label: 'Blue' }, // Blue
    { rbg: '#00FF00', label: 'Green' }, // Green
    { rbg: '#00FFFF', label: 'Cyan' }, // Cyan
    { rbg: '#FF0000', label: 'Red' }, // Red
    { rbg: '#FF00FF', label: 'Magenta' }, // Magenta
    { rbg: '#FFFF00', label: 'Yellow' }, // Yellow
    { rbg: '#FFFFFF', label: 'White' }// White
  ]

  /**
   * @property {Object} colorMap Map over the colors
   */
  static colorMap = {
    Black: 0,
    Blue: 1,
    Green: 2,
    Cyan: 3,
    Red: 4,
    Magenta: 5,
    Yellow: 6,
    White: 7
  }

  /**
   * @method reset Reset the device to its initial state
   */
  reset () {
    this._positions = []
    this.controlregister = 0x0002
    this.reportUpdate()
  }

  /**
   * @method backup Backup the device
   * @returns {Object} Backup of the device
   */
  backup () {
    return {
      type: 'screen',
      name: this.name,
      controlregister: this.controlregister,
      positions: this._positions,
      address: this.baseaddress
    }
  }

  constructor (name, baseaddress) {
    super(name, baseaddress, 128)
    this.reset()
  }

  /**
   * @method powerOn Turn on the device
   */
  powerOn () {
    this.setPos(120, Bitop.on(this.controlregister, 1))
    // this.reportUpdate()
  }

  /**
   * @method powerOff Turn off the device
   */
  powerOff () {
    this.setPos(120, Bitop.off(this.controlregister, 1))
  }

  /**
   * @method isOn Check if the device is on
   * @returns {boolean} True if the device is on
   */
  isOn () {
    return Bitop.isOn(this.controlregister, 1)
  }

  /**
   * @method getPos Get the value of given position
   * */
  getPos (position) {
    if (position > 120) throw new Error(Screen.error.outofbounds)
    if (position < 120) return this.positions[position]
    else return this.controlregister
  }

  /**
   * @method getPosInfo Get the information of given position
   * @param {*} position position to get the information
   * @returns {Object} Information of the position (character, foreground color, background color)
   */
  getPosInfo (position) {
    const hex = this.getPos(position)
    return {
      char: hex & 0x00FF,
      fg: (hex & 0x0700) >> 8,
      bg: (hex & 0x3800) >> 11
    }
  }

  /**
   * @method positions Get the positions of the screen as an array
   */
  get positions () {
    if (this.isOn()) return this._positions
    else return []
  }

  /**
   * @method matrix Print the screen as a matrix
   */
  matrix () {
    const tmp = []
    for (let i = 0; i < 8; i++) {
      tmp[i] = []
      for (let j = 0; j < 15; j++) {
        tmp[i][j] = this.positions[15 * i + j] ? baseConvert.dec2hex(this.positions[15 * i + j]) + 'h' : ''
      }
    }
    console.table(tmp)
  }

  /**
   * @method setPos Set the value of given position
   * @param {*} pos position to set the value
   * @param {*} value value to set
   */
  setPos (pos, value) {
    if (pos !== 120) { this._positions[pos] = value } else {
      this.controlregister = value
      if (Bitop.isOn(this.controlregister, 0)) {
        this._positions = []
      }
    }
    this.reportUpdate()
  }

  /**
   * @method reportUpdate Report the update of the screen
  */
  reportUpdate () {
    this.broadCast({ topic: 'updatedScreen' + this.name })
  }
}

/**
 * @class CTScreen
 * @extends Observer
 * @property {String} name Name
 * @property {HTMLElement} content Content
 * @property {Screen} control Control
 * @property {HTMLElement} screen Screen
 * @property {Object} labels Labels
 *
 */
class CTScreen extends Observer {
  static labels = {
    onoff: 'labels.ctscreen.onoff',
    address: 'labels.ctscreen.address'
  }

  constructor (screen) {
    super()
    this.name = screen.name
    this.control = screen
    this.control.subscribe(this)

    this.content = _jsc({ s: 'div' })
    this.draw()
  }

  /**
   * @method toggleOnOff Toggles the on/off state of the screen
   */
  toggleOnOff () {
    const onoff = _jss(this.content.querySelector('.caps-radio'))
    onoff.removeClass('radio-onoff-inactive')
    onoff.removeClass('radio-onoff-active')
    onoff.addClass('radio-onoff-' + (this.control.isOn() ? 'active' : 'inactive'))
  }

  /**
   * @method createOnOff Creates the on/off indicator
   * @param {*} dom Dom element to wrap the on/off indicator
   */
  createOnOff (dom) {
    const onoff = _jsc({ s: 'div', _class: 'radio-onoff-wrap' })
    const radio = _jsc({ s: 'div', _class: 'radio-onoff' })
    const radiolabel = _jsc({ s: 'label' })

    radiolabel.text(_jStr(CTScreen.labels.onoff).translate())

    radio.addClass('radio-onoff-' + (this.control.isOn() ? '' : 'in') + 'active')

    onoff.append(radio)
    onoff.append(radiolabel)
    dom.append(onoff)
  }

  /**
   * @method decode Decodes the screen character color
   * @param {*} hex Hexadecimal value
   */
  decode (hex) {
    const colors = {
      0x0: '#000000', // Black
      0x1: '#0000FF', // Blue
      0x2: '#00FF00', // Green
      0x3: '#00FFFF', // Cyan
      0x4: '#FF0000', // Red
      0x5: '#FF00FF', // Magenta
      0x6: '#FFFF00', // Yellow
      0x7: '#FFFFFF'// White
    }
    const character = +(hex & 0x00FF)
    const fgcolor = (hex & 0x0700) >> 8
    const bgcolor = (hex & 0x3800) >> 11

    let htmlChar = String.fromCharCode(character)
    if (htmlChar === ' ') {
      // This is a special case, because HTML does not show a space
      htmlChar = '&nbsp;'
    }

    return '<div style="color:' + colors[fgcolor] + ';background-color:' + colors[bgcolor] + '">' + htmlChar + '</div>'
  }

  /**
   * @method drawScreen Draws the screen
   */
  drawScreen () {
    this.screen = _jsc({ s: 'div', _class: this.control.isOn() ? 'screen-wrap' : 'screen-wrap-off' })

    this.content.append(this.screen)

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 15; j++) {
        const div = _jsc({ s: 'div', _class: 'screen-col' })

        this.screen.append(div)
        const position = this.control.positions[15 * i + j]
        if (this.control.isOn()) div.html(position ? this.decode(position) : this.decode(0x0))
        else div.html('<div style="background-color: #666666;"></div>')
      }

      const br = _jsc({ s: 'div', _class: 'screen-newrow' })
      this.screen.append(br)
    }
    const br = _jsc({ s: 'div', _class: 'screen-newrow' })

    this.screen.append(br)
  }

  /**
   * @method drawFoot Draws the footer of the screen window
   */
  drawFoot () {
    const footer = _jsc({ s: 'div', _class: 'screen-footer' })

    const label = _jsc({ s: 'div', _style: { 'text-align': 'center' } })

    label.html('<span>' + _jStr(CTScreen.labels.address).translate() + ': ' + baseConvert.dec2hex(this.control.baseaddress).toUpperCase() + 'h</span>')

    this.createOnOff(footer)
    footer.append(label)
    this.content.append(footer)
  }

  /**
   * @method draw Draws the screen
   */
  draw () {
    this.content.empty()
    this.drawScreen()
    this.drawFoot()
  }

  listen (message) {
    switch (message.topic) {
      case 'updatedScreen' + this.name:
        this.draw()
        break
    }
  }

  /**
 *  @method getSvg Gets the screen SVG
 * @returns {HTMLElement} Screen
 */
  getSvg () {
    return this.content
  }
}

class NavMenu extends Observer {
  dropNode (value, children, menutype = 'menu-h') {
    const nested = _jsc({ s: 'ul' })

    const span = _jsc({ s: 'span' })
    span.text(value)

    const i = _jsc({ s: 'i', _style: { 'margin-left': '4px' } })

    const li = _jsc({ s: 'li' })
    if (menutype === 'menu-v') {
      li.addClass('menu-v')
      i.addClass('chevron', 'chevron-right')
    } else {
      li.addClass('menu-h')
      i.addClass('chevron', 'chevron-down')
    }

    li.append(span, i, nested)

    li.addClass('drop')

    li.on('mouseenter', (event) => {
      event.preventDefault()
      const target = _jss(event.target)
      const ultarget = _jss(target.find('ul'))
      target.addClass('hover')
      ultarget.addClass('show')

      if (target.hasClass('menu-v')) {
        ultarget.style({ left: 3.5 + target.element.offsetLeft + target.element.offsetWidth + 'px', top: 9 + ultarget.element.offsetTop - target.element.offsetHeight + 'px' })
      }

      if (target.hasClass('menu-h')) {
        ultarget.style({ left: target.element.offsetLeft + 3 + 'px', top: target.element.offsetHeight - 1.5 + 'px' })
      }
    })

    li.on('mouseleave', (event) => {
      const target = _jss(event.target)
      const ultarget = _jss(event.target.querySelector('ul'))
      target.removeClass('hover')
      ultarget.removeClass('show')

      ultarget.style({ top: '' })
    })

    children.forEach(element => {
      if (element.children && element.children.length > 0) nested.append(this.dropNode(element.title, element.children, element.menutype))
      else {
        if (element.separator) nested.append(_jsc({ s: 'li', _class: 'separator' }))
        else nested.append(this.Node(element.title, element.id, element.action))
      }
    })

    return li
  }

  Node (title, id, action, menutype = '') {
    const li = _jsc({ s: 'li', _id: id })

    if (title instanceof Function) li.html(title())
    else li.html(title)

    if (menutype === 'widget') li.addClass('widget')

    li.on('mouseenter', (event) => {
      _jss(event.target).addClass('hover')
    })
    li.on('mouseleave', (event) => {
      _jss(event.target).removeClass('hover')
    })
    if (action) li.on('click', function (e) { action(e) })
    return li
  }

  redraw () {
    this.menujson.forEach(element => {
      if (element.children && element.children.length > 0) this._dom.append(this.dropNode(element.title, element.children, element.menutype))
      else {
        this._dom.append(this.Node(element.title, element.id, element.action, element.menutype))
      }
    })
  }

  constructor (menujson) {
    super()

    this._dom = _jsc({ s: 'ul' })
    // root.addClass('menu')
    this.menujson = menujson
    this.redraw()
  }

  get dom () {
    return this._dom.element
  }

  listen (event) {
    switch (event.topic) {
      case Actions.topic.update:
        this._dom.empty()
        this.redraw()
        break
    }
  }
}

/**
 * @author https://gist.github.com/cravindra
 */

/**
 * Returns a cookie value if a name is specified. Otherwise returns the entire cookies as an object
 * @param [name] - The name of the cookie to fetch the value for. Returns the entire map of cookies if not specified
 * @returns {string|Object} - The value of the cookie specified by `name` if specified. Otherwise returns a name value map of the available cookies
 */
function getCookie (name) {
  const cookies = document.cookie.split(';')
    .reduce((acc, cookieString) => {
      const [key, value] = cookieString.split('=').map(s => s.trim())
      if (key && value) {
        acc[key] = decodeURIComponent(value)
      }
      return acc
    }, {})
  return name ? cookies[name] || '' : cookies
}

/**
 *
 * @param name - The name of the cookie to be set
 * @param value - The value of the cookie
 * @param options - supports any cookie option like path, expires, maxAge and domain. [MDN Cookie Reference](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
 */
function setCookie (name, value, options = {}) {
  document.cookie = `${name}=${encodeURIComponent(value)}${
        Object.keys(options)
            .reduce((acc, key) => {
                return acc + `;${key.replace(/([A-Z])/g, $1 => '-' + $1.toLowerCase())}=${
                    options[key]}`
            }, '')
        }`
}

const menuOptions = {
  menu_file: 'labels.menu.menu_file',

  menu_file_open: 'labels.menu.menu_file_open',
  menu_system_config: 'labels.menu.system_config',
  menu_change_theme: 'labels.menu.change_theme',
  menu_file_opensim: 'labels.menu.menu_file_opensim',
  menu_file_savesim: 'labels.menu.menu_file_savesim',
  menu_offline_version: 'labels.menu.menu_offline_version',

  menu_running: 'labels.menu.menu_running',
  menu_running_cycle: 'labels.menu.menu_running_cycle',
  menu_running_instruction: 'labels.menu.menu_running_instruction',
  menu_running_run: 'labels.menu.menu_running_run',
  menu_running_stop: 'labels.menu.menu_running_stop',
  menu_running_signalselect: 'labels.menu.menu_running_signalselect',
  menu_running_mode_normal: 'labels.menu.menu_running_mode_normal',
  menu_running_mode_manual: 'labels.menu.menu_running_mode_manual',
  menu_running_reset: 'labels.menu.menu_running_reset',

  menu_utils: 'labels.menu.menu_utils',
  menu_utils_mem: 'labels.menu.menu_utils_mem',
  menu_utils_mem_config: 'labels.menu.menu_utils_mem_config',
  menu_utils_mem_edit: 'labels.menu.menu_utils_mem_edit',
  menu_utils_io: 'labels.menu.menu_utils_io',
  menu_utils_io_keyboard: 'labels.menu.menu_utils_io_keyboard',
  menu_utils_io_screen: 'labels.menu.menu_utils_io_screen',
  menu_utils_io_lights: 'labels.menu.menu_utils_io_lights',
  menu_mode_label: 'labels.menu.menu_mode_label'
}

/**
 * @method Menu Creates the menu
 * @param {Computer} computer Computer link
 * @param {Simulator} sim  Simulator link
 * @param {WindowManager} wm window manager link
 * @returns menu dom element
 */
function Menu (computer, sim, wm) {
  const menutmp = [
    {
      title: _jStr(menuOptions.menu_file).translate(),
      children: [{
        title: _jStr(menuOptions.menu_file_open).translate(),
        id: 'load-file',
        action: function () {
          vwactions.loadProgram(computer)
        }
      },
      { title: _jStr(menuOptions.menu_file_opensim).translate(), id: 'load-file', action: function () { vwactions.loadSim(sim) } },
      { title: _jStr(menuOptions.menu_file_savesim).translate(), id: 'load-file', action: function () { vwactions.saveSim(sim, wm) } },
      { separator: true },
      { title: _jStr(menuOptions.menu_system_config).translate(), id: 'sys-config', action: function () { vwactions.systemConfigurator(sim, wm) } },
      { title: _jStr(menuOptions.menu_change_theme).translate(), id: 'change-theme', action: function () { vwactions.changeTheme() } },
      { separator: true },
      { title: _jStr(menuOptions.menu_offline_version).translate(), id: 'offline-version', action: function () { vwactions.downloadZip(sim, wm) } }
      ]

    },
    {
      title: _jStr(menuOptions.menu_running).translate(),
      children: [{
        title: _jStr(menuOptions.menu_running_cycle).translate(),
        id: 'menu-trigger-cycle',
        action: function () {
          actions.runStep(computer)
        }
      },
      {
        title: function () {
          if (computer.cpu.uc.mode === Uc$1.mode.manual) return '<span class="disabled">' + _jStr(menuOptions.menu_running_instruction).translate() + '</span>'
          return _jStr(menuOptions.menu_running_instruction).translate()
        },
        id: 'menu-instruction',
        action: function () {
          actions.runInstruction(computer)
        }
      },
      {
        title: function () {
          if (computer.cpu.uc.mode === Uc$1.mode.manual) return '<span class="disabled">' + _jStr(menuOptions.menu_running_run).translate() + '</span>'
          return (computer.cpu.uc.mode === Uc$1.mode.normal.auto && computer.clock.status === Clock.status.started) ? _jStr(menuOptions.menu_running_stop).translate() : _jStr(menuOptions.menu_running_run).translate()
        },
        id: 'menu-run',
        action: function () {
          if (computer.clock.status === Clock.status.stopped) actions.runProgram(computer)
          else actions.stopProgram(computer)
        }
      },
      {
        title: function () {
          return computer.mode === Computer.mode.manual ? _jStr(menuOptions.menu_running_signalselect).translate() : '<span class="disabled">' + _jStr(menuOptions.menu_running_signalselect).translate() + '</span>'
        },
        id: 'menu-signalselect',
        action: function () {
          vwactions.signalSelector(computer, sim, wm)
        }
      },
      {
        title: function () {
          return computer.mode === Computer.mode.normal ? _jStr(menuOptions.menu_running_mode_normal).translate() : _jStr(menuOptions.menu_running_mode_manual).translate()
        },
        id: 'menu-modo',
        action: function () {
          actions.changeMode(computer, sim)
          vwactions.resetCables()
        }
      },
      {
        title: _jStr(menuOptions.menu_running_reset).translate(),
        id: 'menu-reset',
        action: function () {
          vwactions.reload()
        }
      }
      ]
    }, {
      title: _jStr(menuOptions.menu_utils).translate(),
      children: [{
        title: _jStr(menuOptions.menu_utils_mem).translate(),
        menutype: 'menu-v',
        children: [{
          title: _jStr(menuOptions.menu_utils_mem_config).translate(),
          id: 'memory-mng',
          action: function () {
            vwactions.memoryConfig(computer, wm)
          }
        },
        {
          title: _jStr(menuOptions.menu_utils_mem_edit).translate(),
          id: 'memory-edit',
          action: function () {
            vwactions.memoryEditor(computer, wm)
          }
        }]
      }, {

        title: _jStr(menuOptions.menu_utils_io).translate(),
        menutype: 'menu-v',
        children: [{
          title: _jStr(menuOptions.menu_utils_io_keyboard).translate(),
          id: 'connect-keyboard',
          action: function () {
            const sdbObservers = [sim.bus_sdb, sim.mdr, sim.busMdrSdb, sim.busSdbMem, sim.busSdbIo]
            vwactions.addKeyboard(computer, wm, sdbObservers)
          }
        }, {
          title: _jStr(menuOptions.menu_utils_io_screen).translate(),
          id: 'connect-screen',
          action: function () {
            vwactions.addScreen(computer, wm)
          }
        }, {
          title: _jStr(menuOptions.menu_utils_io_lights).translate(),
          id: 'connect-lights',
          action: function () {
            const sdbObservers = [sim.bus_sdb, sim.mdr, sim.busMdrSdb, sim.busSdbMem, sim.busSdbIo]
            vwactions.addLights(computer, wm, sdbObservers)
          }
        }]
      }]
    },
    {
      title: function () {
        return _jStr(menuOptions.menu_mode_label).translate() + ': <strong class="active">' + (computer.mode === Computer.mode.normal ? 'NORMAL' : 'MANUAL') + '</strong>'
      },
      menutype: 'widget'
    }

  ]

  const menu = new NavMenu(menutmp)
  actions.subscribe(menu)
  return menu
}

/**
 * @method LangMenu Creates the language menu
 * @param {*} sim Simulator link
 * @returns lang menu dom element
 */
function LangMenu (sim) {
  const langMenu = _jsc({ s: 'div', _class: 'lang-menu' })
  const langMenuUL = _jsc({ s: 'ul' })
  langMenu.append(langMenuUL.element)
  const langs = [
    { name: _jStr(Simulator.labels.language_en).translate(), code: 'en' },
    { name: _jStr(Simulator.labels.language_es).translate(), code: 'es' }
  ]

  langs.forEach((lang) => {
    const li = _jsc({ s: 'li' })
    const a = _jsc({ s: 'a', _class: 'lang-menu-item' })
    if (State.config.lang === lang.code) a.addClass('active')
    a.text(lang.name)
    a.attr('href', '#')
    a.on('click', (e) => {
      if (confirm(_jStr('labels.menu.menu_lang_confirm').translate())) {
        _jss('.lang-menu-item').removeClass('active')
        _jss(e.target).addClass('active')
        State.config.lang = lang.code
        setCookie('lang', State.config.lang, 7)
        sim.redraw()
      }
    })
    langMenuUL.append(li.append(a).element)
  })
  return langMenu
}

/**
 * @method getThemes Gets all the available theme names by parsing the
 * stylesheets.
 *
 * Loops through all stylesheets, gets the CSS rules, checks for :root
 * selectors, extracts the theme name after :root., and collects theme names in
 * an array.
 *
 * Handles cross-origin stylesheets and errors accessing stylesheets.
 *
 * @returns array of theme name strings.
*/
function getThemes () {
  // Get all the stylesheets
  let styleSheets = Array.from(document.styleSheets)

  // Filter out any stylesheets from other domains (cross-origin security)
  styleSheets = styleSheets.filter(sheet => sheet.href === null || sheet.href.startsWith(window.location.origin))

  // Initialize an array to hold the theme names
  const themes = []

  // Loop through the stylesheets
  styleSheets.forEach((styleSheet) => {
  // Use a try-catch block to handle any potential security errors
    try {
    // Loop through the CSS rules in the stylesheet
      Array.from(styleSheet.cssRules || []).forEach((rule) => {
        // Check if the rule is a style rule
        if (rule.constructor.name === 'CSSStyleRule') {
        // Split the selector by commas
          const selectors = rule.selectorText.split(',')
          // Check each selector individually
          selectors.forEach((selector) => {
          // Trim whitespace and check if the selector is a subclass of :root
            if (selector.trim().startsWith(':root.')) {
            // Extract the theme name and add it to the themes array
              const themeName = selector.trim().split('.').pop()
              themes.push(themeName)
            }
          })
        }
      })
    } catch (e) {
      console.error('Cannot access stylesheet: ', e)
    }
  })

  return themes
}

/**
 * @method RotateTheme Rotates the theme
 * @returns next theme
 **/
function RotateTheme () {
  const themes = getThemes()
  const currentTheme = localStorage.getItem('theme') || 'theme-dark'
  const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length]
  document.documentElement.className = nextTheme
  localStorage.setItem('theme', nextTheme)

  return nextTheme
}

/**
 * @class SystemConfigurator
 * @property {HTMLElement} dom DOM
 * @property {Boolean} callOnSave Call on save
 * @property {Simulator} sim Simulator
 * @property {Object} labels Labels
 * @property {HTMLElement} content Content
 */
class SystemConfigurator {
  static labels = {
    btok: 'label.sysconf.btok',
    window_title: 'label.sysconf.window_title',
    message: 'labels.sysconf.language'
  }

  constructor (CT, sim) {
    const _this = this
    this.CT = CT

    this.callOnSave = false
    this.sim = sim

    const wrap = _jsc({ s: 'div', _class: 'system-configuration' })

    const lang = LangMenu(sim)
    const langlabel = _jsc({ s: 'label', _class: 'lang-label' })
    langlabel.text(_jStr(SystemConfigurator.labels.message).translate())

    // lang.removeClass('lang-menu')
    wrap.append(langlabel)
    wrap.append(lang)

    const actionbuttons = _jsc({ s: 'div', _class: 'sysconfig-action-buttons' })
    const btok = Forms.button(_jStr(SystemConfigurator.labels.btok).translate(), 'sysconfig-ok')

    actionbuttons.append(btok.input)
    wrap.append(actionbuttons.element)

    btok.input.addEventListener('click', function (e) {
      try {
        _this._event_SaveConfig(e)
      } catch (e) {
        alert(e.message)
      }
    })

    // this.closeWindow=false;
    this.dom = wrap
  }

  static new (CT, sim) {
    return new SystemConfigurator(CT, sim)
  }

  /**
   * @method _event_SaveConfig Event handler for save config
   */
  _event_SaveConfig (e) {
    if (this.callOnSave) this.callOnSave()
  }

  /**
   * @method onSave Sets the callable to call on save
   * @param {*} callable Callable to call on save
   */
  onSave (callable) {
    this.callOnSave = callable
  }
}

class localStorageEx {
  static get (key) {
    const value = localStorage[key]
    if (value != null) {
      const model = JSON.parse(value)
      if (model.payload != null && model.expiry != null) {
        const now = new Date()
        if (now > Date.parse(model.expiry)) {
          localStorage.removeItem(key)
          return null
        }
      }
      return JSON.parse(value).payload
    }
    return null
  }

  static set (key, value, expirySeconds) {
    const expiryDate = new Date()
    expiryDate.setSeconds(expiryDate.getSeconds() + expirySeconds)
    localStorage[key] = JSON.stringify({
      payload: value,
      expiry: expiryDate
    })
  }

  static remove (key) {
    localStorage.removeItem(key)
  }
}

/**
 * @method download
 * @param {*} content Content to create the file
 * @param {*} fileName Name of the file
 * @param {*} contentType Content type
 */
function download (content, fileName, contentType) {
  const a = document.createElement('a')
  const file = new Blob([content], { type: contentType })
  a.href = URL.createObjectURL(file)
  a.download = fileName
  a.click()
}

/**
 * @class ViewActions
 * @extends Observable
 * @property {Object} error Errors
 * @property {Object} labels Labels
 * @property {Object} confirm Confirm
 * @property {Object} topic Topic
 * @property {Object} subtopic Subtopic
 * @property {ViewActions} instance Instance
 * @property {Computer} computer Computer
 * @property {Observable} observable Observable
 * @property {Object} observable.labels Labels
 */
class ViewActions extends Observable {
  static labels = {
    window_title_memedit: 'labels.view.window_title_memedit',
    window_title_memcfg: 'labels.view.window_title_memcfg',
    window_title_screen_data: 'labels.view.window_title_screen_data',
    window_title_keyboard_data: 'labels.view.window_title_keyboard_data',
    window_title_lights_data: 'labels.view.window_title_lights_data',
    window_title_sselection: 'labels.view.window_title_sselection',
    window_title_savesim: 'labels.view.window_title_savesim',
    window_title_savesim_label: 'labels.view.window_title_savesim_label',
    window_title_savesim_button: 'labels.view.window_title_savesim_button'
  }

  static confirm = {
    remove_device: 'confirm.devices.remove_device'
  }

  static instance = null
  static topic = {
    update: 'update-vwactions'
  }

  static subtopic = {
    reset_cables: 'reset_cables'
  }

  /* istanbul ignore next */
  /**
   * @method resetCables Resets all cables
   */
  resetCables (ct) {
    SVGCable.reset()
    this.broadCast({ topic: ViewActions.topic.update, value: ViewActions.subtopic.run_instruction })
  }

  /**
   * @method signalSelector Launches the signal selector
   * @param {Computer} ct Computer link
   * @param {Simulator} sim Simulator link
   * @param {WindowManager} wm window manager link
   */
  signalSelector (ct, sim, wm) {
    if (ct.mode === Computer.mode.manual) {
      const signalmng = SignalSelector.new(ct, sim)
      const w = wm.window(_jStr(SignalSelector.labels.window_title).translate(), true)
      w.content = signalmng.dom
      document.querySelector('#wmng').append(w.dom.element)
      signalmng.onSave(function () {
        ct.cpu.uc.loadSignals(sim.control.selectedSignals)
        // Do not close the signal selector on sending the signals to the control unit.
        // The user must click X to close. Uncomment next line to change this behavior.
        // wm.remove(w)
      })
      sim.signalSelectorWindow = w
    }
  }

  /**
 * @method systemConfigurator Launches the system configurator
 * @param {Simulator} sim Simulator link
 * @param {WindowManager} wm window manager link
 */
  systemConfigurator (sim, wm) {
    const sysconfig = SystemConfigurator.new(sim.ct, sim)
    const w = wm.window(_jStr(SystemConfigurator.labels.window_title).translate(), true)
    w.content = sysconfig.dom
    document.querySelector('#wmng').append(w.dom.element)
    sysconfig.onSave(function () {
      wm.remove(w)
    })
  }

  /**
 * @method changeTheme Changes to the next theme in the CSS themes
 */
  changeTheme () {
    RotateTheme()
  }

  /**
   * @method memoryEditor Launches the memory editor
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm window manager link
   */
  memoryEditor (ct, wm) {
    const memoryedit = new Memoryedit(ct.mem, ct)
    ct.mem.subscribe(memoryedit)
    const w = wm.window(_jStr(ViewActions.labels.window_title_memedit).translate(), true)
    w.onFocus(function () { memoryedit.reDraw() })
    w.content = memoryedit.dom
    document.querySelector('#wmng').append(w.dom.element)
  }

  /**
   * @method memoryConfig Launches the memory configurator
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm window manager link
   */
  memoryConfig (ct, wm) {
    const memoryconfig = new MemoryCfg(ct.mem)
    ct.mem.subscribe(memoryconfig)
    const w = wm.window(_jStr(ViewActions.labels.window_title_memcfg).translate(), true)
    w.content = memoryconfig.getDom()
    document.querySelector('#wmng').append(w.dom.element)
  }

  /**
   * @method loadProgram Loads a program
   * @param {Computer} ct Computer link
   */
  loadProgram (ct) {
    const input = document.createElement('input')

    input.setAttribute('type', 'file')
    input.setAttribute('accept', '.eje')

    input.addEventListener('change', function () {
      const fr = new FileReader()
      fr.onload = function () {
        try {
          ct.loadProgram(fr.result.replaceAll('\t', '\n').replaceAll(' ', '\n').replaceAll('\r', '').split('\n').filter((e) => e.trim() !== ''))
        } catch (e) {
          console.log(e)
          alert(_jStr(e.message).translate() || 'Unexpected error in ViewActions.loadProgram')
        }
      }
      fr.readAsText(this.files[0])
    })

    input.click()
  }

  /**
   * @method loadSim Loads a simulation
   * @param {*} sim Simulator link
   */
  loadSim (sim) {
    const input = document.createElement('input')

    input.setAttribute('type', 'file')
    input.setAttribute('accept', '.sim')

    input.addEventListener('change', function () {
      const fr = new FileReader()
      fr.onload = function () {
        sim.restore(fr.result)
      }
      fr.readAsText(this.files[0])
    })

    input.click()
  }

  /**
   * @method saveSim Saves a simulation
   * @param {Simulator} sim Simulator link
   * @param {WindowManager} wm WindowManager link
   */
  saveSim (sim, wm) {
    const w = wm.window(_jStr(ViewActions.labels.window_title_savesim).translate(), true)

    const input = Forms.input('text', _jStr(ViewActions.labels.window_title_savesim_label).translate(), 'filename')
    const button = Forms.button(_jStr(ViewActions.labels.window_title_savesim_button).translate(), 'save')
    const p = _jsc({ s: 'p', _class: 'save-sim' })
    const span = _jsc({ s: 'span', _class: 'save-sim-ext' })

    span.text('.sim')
    input.label.style.color = '#FFFFFF'
    input.input.style.textAlign = 'left'
    p.append(input.label)
    p.append(input.input)
    p.append(span)
    p.append(button.input)
    input.input.value = 'simulacion'

    input.input.addEventListener('keypress', function (event) {
      if (event.key === 'Enter' || event.keyCode === 13 || event.which === 13) {
        event.preventDefault()

        button.input.click()
        return false
      }
    })

    button.input.addEventListener('click', function () {
      download(sim.backup(), input.input.value + '.sim', 'text/plain')
      wm.remove(w)
    })

    w.onClose(function () {
      wm.remove(w)
    })

    w.content = p.element
    document.querySelector('#wmng').append(w.dom.element)
  }

  /**
   * @method loadMemory Loads a memory
   * @param {Computer} ct Computer link
   * @param {int} position Starting position
   * @param {Callable} callback callback after loading
   */
  loadMemory (ct, position, callback) {
    const input = document.createElement('input')

    input.setAttribute('type', 'file')
    input.setAttribute('accept', '.mem')

    input.addEventListener('change', function () {
      const fr = new FileReader()
      fr.onload = function () {
        try {
          ct.loadMemory(fr.result.replaceAll('\t', '\n').replaceAll(' ', '\n').replaceAll('\r', '').split('\n').filter((e) => e.trim() !== ''), position)
        } catch (e) {
          console.log(e)
          alert(_jStr(e.message).translate() || 'Unexpected error in ViewActions.loadMemory')
        }

        callback()
      }
      fr.readAsText(this.files[0])
    })

    input.click()
  }

  /**
   * @method screenVW Creates a screen view
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm WindowManager link
   * @param {Object} form Form data
   * @param {*} init if we want to initialize the screen, array of
   */
  screenVW (ct, wm, form, init = false) {
    const pantalla = new Screen(form.name, form.basedir)
    ct.io.addDevice(pantalla)

    if (init) {
      pantalla._positions = init.positions
    }
    const pantallaw = new CTScreen(pantalla)
    const w = wm.window(form.name, false)
    w.content = pantallaw.content
    w.onClose(function () {
      ct.io.removeDevice(pantalla)
      wm.remove(w)
    })
    w.closeConfirm(_jStr(ViewActions.confirm.remove_device).translate(form.name))
    document.querySelector('#wmng').append(w.dom.element)

    return pantalla
  }

  /**
   * @method addScreen Creates a screen
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm WindowManager link
   * @returns {Screen} Screen
   */
  addScreen (ct, wm) {
    const _this = this
    const wf = wm.window(_jStr(ViewActions.labels.window_title_screen_data).translate(), false)
    const pantallaForm = new OutputDeviceForm(function (form) {
      try {
        localStorageEx.remove('w' + form.name)
        _this.screenVW(ct, wm, { name: form.name, basedir: baseConvert.hex2dec(form.basedir) })
        wm.remove(wf)
      } catch (e) {
        console.log(e)
        alert(_jStr(e.message).translate() || 'Unexpected error in ViewActions.addScreen')
      }
    })

    wf.content = pantallaForm.element
    document.querySelector('#wmng').append(wf.dom.element)
  }

  /**
   * @method keyboardVW Creates a keyboard view
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm WindowManager link
   * @param {Array} sdbObservers SDB observers for getting the device number
   * @param {*} form Form data
   * @returns {Keyboard} Keyboard
   */
  keyboardVW (ct, wm, sdbObservers, form) {
    const DeviceControl = new Keyboard(form.name, form.basedir, form.vector * 1, form.priority * 1, form.int, ct.sdb, ct.cpu)
    ct.io.addDevice(DeviceControl)
    sdbObservers.forEach(element => {
      DeviceControl.subscribe(element)
    })

    const DeviceView = new CTKeyboard(DeviceControl)
    const w = wm.window(form.name, false)
    w.content = DeviceView.content
    w.onClose(function () {
      ct.io.removeDevice(DeviceControl)
      wm.remove(w)
    })
    w.closeConfirm(_jStr(ViewActions.confirm.remove_device).translate(form.name))
    document.querySelector('#wmng').append(w.dom.element)
    return DeviceControl
  }

  /**
   * @method addKeyboard Creates a keyboard
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm WIndowManager link
   * @returns {Keyboard} Keyboard
   */
  addKeyboard (ct, wm, sdbObservers) {
    const _this = this
    const wf = wm.window(_jStr(ViewActions.labels.window_title_keyboard_data).translate(), false)
    const DeviceForm = new InputDeviceForm(function (form) {
      try {
        localStorageEx.remove('w' + form.name)
        _this.keyboardVW(ct, wm, sdbObservers, { name: form.name, basedir: baseConvert.hex2dec(form.basedir), vector: form.vector * 1, priority: form.priority * 1, int: form.int })
        wm.remove(wf)
      } catch (e) {
        console.log(e)
        alert(_jStr(e.message).translate() || 'Unexpected error in ViewActions.addKeyboard')
      }
    })

    wf.content = DeviceForm.element
    document.querySelector('#wmng').append(wf.dom.element)
  }

  /**
   * @method lightsVW Creates a lights view
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm WindowManager link
   * @param {Array} sdbObservers SDB observers for getting the device number
   * @param {Forms} form Form data
   * @returns {Lights} Lights
   */
  lightsVW (ct, wm, sdbObservers, form) {
    const DeviceControl = new Lights(form.name, form.basedir, form.vector * 1, form.priority * 1, form.int, ct.sdb, ct.cpu)
    ct.io.addDevice(DeviceControl)
    sdbObservers.forEach(element => {
      DeviceControl.subscribe(element)
    })

    const DeviceView = new CTLights(DeviceControl)
    const w = wm.window(form.name, false)
    w.content = DeviceView.content
    w.onClose(function () {
      ct.io.removeDevice(DeviceControl)
      wm.remove(w)
    })

    w.closeConfirm(_jStr(ViewActions.confirm.remove_device).translate(form.name))
    document.querySelector('#wmng').append(w.dom.element)
    return DeviceControl
  }

  reload () {
    location.reload()
  }

  /**
   * @method addLights Creates a lights
   *
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm WindowManager link
   * @param {Array} sdbObservers SDB observers for getting the device number
   * @returns {Lights} Lights
   */
  addLights (ct, wm, sdbObservers) {
    const _this = this
    const wf = wm.window(_jStr(ViewActions.labels.window_title_lights_data).translate(), false)
    const DeviceForm = new InputDeviceForm(function (form) {
      try {
        localStorageEx.remove('w' + form.name)
        _this.lightsVW(ct, wm, sdbObservers, { name: form.name, basedir: baseConvert.hex2dec(form.basedir), vector: form.vector * 1, priority: form.priority * 1, int: form.int })
        wm.remove(wf)
      } catch (e) {
        console.log(e)
        alert(_jStr(e.message).translate() || 'Unexpected error in ViewActions.addLights')
      }
    })

    wf.content = DeviceForm.element
    document.querySelector('#wmng').append(wf.dom.element)
  }

  downloadZip () {
    const a = document.createElement('a')
    a.href = 'simct.zip'
    a.click()
  }

  Alert (ct, wm, form) {
    wm.Alert('prueba')
  }
}

const vwactions = new ViewActions()

/**
 * @method initKeys Initializes the key shortcuts
 * @param {Computer} ct COmputer link
 */
function initKeys (ct) {
  document.querySelector('body').addEventListener('keydown', function (e) {
    if ([116, 117, 118, 119, 120, 121].includes((e.which || e.keyCode)) || ['F5', 'F6', 'F7', 'F8', 'F9', 'F10'].includes(e.key)) {
      e.preventDefault()
      e.returnValue = false
    }

    const keyCode = e.keyCode || e.which

    if (keyCode >= 112 && keyCode <= 123) {
      switch (keyCode) {
        case 116:
          e.preventDefault()
          actions.changeMode(ct)
          break
        case 118:
          e.preventDefault()
          actions.runStep(ct)
          break
        case 119:
          e.preventDefault()
          actions.runInstruction(ct)
          break
        case 120:
          e.preventDefault()
          if (ct.cpu.clock.status === Clock.status.stopped) actions.runProgram(ct)
          else actions.stopProgram(ct)
          break
        case 121:
          e.preventDefault()
          if (e.ctrlKey) vwactions.reload()
          break
      }
    }
  })
}

/**
 * @class WindowTPL
 * @property {HTMLElement} dom DOM
 * @property {String} title Title
 * @property {HTMLElement} w Window
 * @property {HTMLElement} wbody Window body
 * @property {HTMLElement} wheader Window header
 */
class WindowTPL {
  static labels = {
    close: 'labels.window.close',
    close_confirm: 'labels.window.close-confirm',
    close_confirm_yes: 'labels.window.close-confirm-yes',
    close_confirm_no: 'labels.window.close-confirm-no'
  }

  constructor (wm, title, windex) {
    this.id = windex
    this.title = title
    this.wm = wm
    this._closeConfirm = false

    const _this = this

    this.w = _jsc({ s: 'div', _id: 'ctwindow' + (windex + '').padStart(2, '0'), _class: 'ctwindow' })

    const wtitle = _jsc({ s: 'span', _class: 'title' })
    wtitle.text(title)

    const wheader = _jsc({ s: 'div', _class: 'wheader' })

    wheader.append(wtitle)

    this.buttons = {}

    this.onCloseEvent = false

    this.bclose = this.addButton(wheader.element, WindowTPL.labels.close, '', function (e) {
      if (_this._closeConfirm) _this.closeAskConfirm()
      else _this.close()
    })

    this.bclose.addClass('close')

    this.wbody = _jsc({ s: 'div', _class: 'wbody' })

    this.w.append(wheader)
    this.w.append(this.wbody)

    wm.dom.append(this.w)

    wheader.on('mousedown', function (e) {
      e.preventDefault()
      _this.w.parent().append(_this.w.element)
      _this.lastPosition = { offsetx: e.clientX - _this.w.element.offsetLeft, offsety: e.clientY - _this.w.element.offsetTop }
      WindowManager.currentDraggedWindow = { w: _this.w, offsetx: e.clientX - _this.w.element.offsetLeft, offsety: e.clientY - _this.w.element.offsetTop, obj: _this }

      if (_this.onFocusEvent) _this.onFocusEvent(_this)
    }, false)

    _this.w.style({ left: _this.w.offsetWidth / 2, top: _this.w.offsetHeight / 2 + 20 })

    _this.w.style.boxShadow = '0px 0px 1px 1px var(--window-border-color)'

    _this.w.movetoXY = function (x, y) {
      let newLeft = x - _this.lastPosition.offsetx
      let newTop = y - _this.lastPosition.offsety
      const windowWidth = _this.w.element.offsetWidth
      const windowHeight = _this.w.element.offsetHeight
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Prevent the window from moving completely off the screen edges
      if (newTop < 0) {
        newTop = 0
      }
      if (newLeft < 0) {
        newLeft = 0
      }
      if (newLeft + windowWidth > viewportWidth) {
        newLeft = viewportWidth - windowWidth
      }
      if (newTop + windowHeight > viewportHeight) {
        newTop = viewportHeight - windowHeight
      }

      const position = { left: newLeft + 'px', top: newTop + 'px' }
      _this.w.style(position)
      localStorageEx.set('w' + _this.title, position)
    }

    this.dom = _this.w

    const tmp = localStorageEx.get('w' + this.title)
    if (tmp) {
      _this.w.style({ left: tmp.left, top: tmp.top })
    } else {
      const simObj = document.querySelector('#sim')
      if (simObj) {
        const simLocation = simObj.getBoundingClientRect()
        _this.w.style({ left: simLocation.x + 40 + 'px', top: simLocation.y + 40 + 'px' })
      }
    }
  }

  /**
   * @method addButton Adds a button to the window
   * @param {*} container Container to append the button
   * @param {*} alt Alt text
   * @param {*} icon Icon
   * @param {*} callback Callback on button action
   * @returns
   */
  addButton (container, alt, icon, callback) {
    const button = _jsc({ s: 'button', _class: 'btn' })
    button.html(icon)

    button.attr('alt', alt)

    button.on('mousedown', function (e) { e.stopPropagation() }, false)
    button.on('click', callback, false)

    container.append(button.element)
    return button
  }

  /**
   * @method close Closes the window
   */
  close () {
    if (this.onCloseEvent) this.onCloseEvent(this)
    else this.wm.remove(this)
  }

  /**
   * @method closeAskConfirm Ask for confirmation before closing
   */
  closeAskConfirm () {
    if (confirm(this.bclose.attr('alt'))) this.close()
  }

  /**
   * @method closeConfirm Sets the close confirmation
   */
  closeConfirm (message) {
    this._closeConfirm = true
    this.bclose.attr('alt', message)
  }

  /**
   * @method onClose Sets the callback on close
   * @param {*} callback Callable after close
   */
  onClose (callback) {
    this.onCloseEvent = callback
  }

  /**
   * @method Sets the callback on focus
   * @param {*} callback Callable on focus
   */
  onFocus (callback) {
    this.onFocusEvent = callback
  }

  set content (wbody) {
    this.wbody.empty()
    this.wbody.append(wbody)
  }

  get content () {
    return this.wbody
  }
}

/**
 * @class WindowManager
 * @property {HTMLElement} dom DOM
 * @property {WindowTPL[]} windows Windows
 * @property {WindowTPL} currentDraggedWindow Current dragged window
 */
class WindowManager {
  static windows = {}
  static currentDraggedWindow = null

  constructor () {
    const wm = _jsc({ s: 'div', _id: 'wmng' })
    wm.id = 'wmng'
    this.dom = wm

    document.addEventListener('mousemove', function (e) {
      if (WindowManager.currentDraggedWindow !== null) {
        e.preventDefault()
        WindowManager.currentDraggedWindow.w.movetoXY(e.clientX, e.clientY)
      }
    })

    document.addEventListener('mouseup', function (e) {
      if (WindowManager.currentDraggedWindow != null) {
        e.preventDefault()
        WindowManager.currentDraggedWindow = null
      }
    })
  }

  /**
   * @method closeAll Closes all windows
   * @param {*} force Force close
   */
  closeAll (force = false) {
    Object.values(WindowManager.windows).forEach(w => {
      if (!force) w.bclose.element.click()
      else w.close()
    })
  }

  /**
   * @method window Creates a new window
   * @param {*} title Title of the window
   * @param {*} exclusive There can be only one window with the same title
   * @returns
   */
  window (title, exclusive = false) {
    if (exclusive && Object.values(WindowManager.windows).filter((window) => {
      return window.title === title
    }).length > 0) return

    const windex = title.toLowerCase().replace(' ', '_')
    const w = new WindowTPL(this, title, windex)
    WindowManager.windows[windex] = w

    localStorageEx.set('windows', WindowManager.windows)

    return w
  }

  /**
   * @method remove Removes a window
   *
   * @param {WindowTPL} w window to remove
   */
  remove (w) {
    w.dom.element.remove()
    delete WindowManager.windows[w.id]
  }

  get activeWindows () {
    return Object.keys(WindowManager.windows).length
  }
}

/**
 * @class Simulator
 * @property {HTMLElement} dom DOM
 * @property {HTMLElement} svg SVG
 * @property {HTMLElement} sim Simulator
 * @property {HTMLElement} simpaths Simulator paths
 * @property {HTMLElement} w Window
 * @property {Object} labels Labels
 *
 *
 */
class Simulator {
  static labels = {
    data_bus: 'labels.simulator.data_bus',
    address_bus: 'labels.simulator.address_bus',
    control_bus: 'labels.simulator.control_bus',
    internal_bus: 'labels.simulator.internal_bus',
    language_es: 'labels.simulator.language_es',
    language_en: 'labels.simulator.language_en'
  }

  constructor (ct) {
    State.config.lang = getCookie('lang') ? getCookie('lang') : 'es'
    gr.gridSize = 9

    const currentTheme = localStorage.getItem('theme') || 'theme-dark'
    document.documentElement.className = currentTheme

    this.ct = new Computer()

    this.ct.mem.addModule(0x0000, 32)
    this.ct.mem.addModule(0x8000, 32)

    this.control = {
      selectedSignals: []
    }

    this.signalSelectorWindow = null

    initKeys(this.ct)

    this.draw()
  }

  /**
   * @method restore Restore simulator state
   * @param {*} info Info to restore
   */
  restore (info) {
    this.ct.reset()
    this.bus_sdb.reset()
    this.mdr.reset()
    const _this = this
    this.wm.closeAll(true)
    const restoreInfo = JSON.parse(info)
    this.control.selectedSignals = restoreInfo.signals
    this.ct.restore(restoreInfo.ct)
    for (let i = 0; i < restoreInfo.windows.length; i++) {
      localStorageEx.set('w' + restoreInfo.windows[i].title, restoreInfo.windows[i].position)
    }
    try {
      const sdbObservers = [this.bus_sdb, this.mdr, this.busMdrSdb, this.busSdbMem, this.busSdbIo]
      restoreInfo.io.devices.forEach(d => {
        switch (d.type) {
          case 'screen': vwactions.screenVW(_this.ct, _this.wm, { name: d.name, basedir: d.address })
            break
          case 'keyboard': vwactions.keyboardVW(_this.ct, _this.wm, sdbObservers, { name: d.name, basedir: d.address, vector: d.vector, priority: d.priority, int: d.int })
            break
          case 'lights': vwactions.lightsVW(_this.ct, _this.wm, sdbObservers, { name: d.name, basedir: d.address, vector: d.vector, priority: d.priority, int: d.int })
            break
        }
      })
    } catch (e) {
      console.log(e)
      alert(_jStr(e.message).translate() || 'Unexpected error in restore event in simulator.js')
    }
  }

  /**
   * @method backup Backup simulator state
   * @returns {String} Backup string
   */
  backup () {
    const windows = []
    Object.keys(WindowManager.windows).forEach(win => {
      windows.push({ title: WindowManager.windows[win].title, position: localStorageEx.get('w' + WindowManager.windows[win].title) })
    })

    return JSON.stringify({
      signals: this.control.selectedSignals,
      ct: this.ct.backup(),
      io: this.ct.io.backup(),
      windows
    })
  }

  /**
   * @method redraw Redraw simulator
   */
  redraw () {
    // actions.stopProgram(this.ct)
    this.sim.svg.remove()
    document.querySelector('#menu-main').innerHTML = ''
    this.wm.closeAll(true)

    for (let i = 0; i < 8; i++) {
      this.ct.cpu.reg[i].unsubscribe(this.registers[i])
      this.ct.cpu.uc.signalmanager.unsubscribe(this.registers[i])
    }

    this.ct.cpu.uc.unsubscribe(this.uc)
    this.ct.cpu.ir.unsubscribe(this.ir)
    this.ct.cpu.mar.unsubscribe(this.mar)
    this.ct.cpu.mdr.unsubscribe(this.mdr)
    this.ct.cpu.ib.unsubscribe(this.ib)
    this.ct.cpu.tmpe.unsubscribe(this.tmpe)
    this.ct.cpu.pc.unsubscribe(this.pc)
    this.ct.cpu.tmps.unsubscribe(this.tmps)
    this.ct.cpu.sr.unsubscribe(this.sr)

    this.ct.cpu.alu.unsubscribe(this.alu)

    this.ct.sab.unsubscribe(this.bus_sab)
    this.ct.sdb.unsubscribe(this.bus_sdb)

    this.ct.cpu.uc.signalmanager.unsubscribe(this.alu)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.tmpe)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.tmps)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.mar)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.mdr)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.sr)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.ib)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.ir)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.pc)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.bus_sab)
    this.ct.cpu.uc.signalmanager.unsubscribe(this.bus_sdb)

    this.ct.mem.unsubscribe(this.busMdrSdb)
    this.ct.mem.unsubscribe(this.busSdbMem)
    this.ct.mem.unsubscribe(this.busSdbIO)

    this.ct.mem.unsubscribe(this.bus_sdb)
    this.ct.mem.unsubscribe(this.mdr)

    const cables = SVGCable.cables
    for (let i = 0; i < cables.length; i++) {
      this.ct.cpu.uc.signalmanager.unsubscribe(cables[i])
      this.ct.cpu.uc.unsubscribe(cables[i])
    }

    this.draw()
  }

  draw () {
    const _this = this
    const x = gr.gridTopx(77); let y = gr.gridTopx(4)
    this.sim = new SVGGroup('', 'sim')
    this.svg = this.sim.svg
    this.registers = []

    const svgcontainer = document.querySelector('svg#ct')
    // const simpaths = new SVGGroup('', 'simpaths')

    svgcontainer.append(this.sim.svg)

    for (let i = 0; i < 8; i++) {
      this.registers[i] = new RRegister(this.svg, 'R' + i, x, y, function (value) { _this.ct.cpu.reg[i].value = baseConvert.hex2dec(value) })
      this.ct.cpu.reg[i].subscribe(this.registers[i])
      this.ct.cpu.uc.signalmanager.subscribe(this.registers[i])
      y = this.registers[i].getBBox().y + this.registers[i].getBBox().height + gr.gridTopx(2)
    }

    this.trigger = new Trigger(this.svg, 'TRIGGER', ...gr.gridtoxy(2, 4), this.ct)
    this.uc = new Uc(this.svg, 'uc', ...gr.gridtoxy(12, 4))
    this.ir = new Ir(this.svg, 'IR', ...gr.gridtoxy(50, 4))
    this.sr = new RegisterSR$1(this.svg, 'SR', ...gr.gridtoxy(10, 26))
    this.alu = new Alu(this.svg, 'alu', ...gr.gridtoxy(9, 34))
    this.tmpe = new TmpeRegister(this.svg, 'TMPE', ...gr.gridtoxy(10, 48))
    this.tmps = new TmpsRegister(this.svg, 'TMPS', ...gr.gridtoxy(50.20, 34))
    this.pc = new PCRegister(this.svg, 'PC', ...gr.gridtoxy(52.8, 39), function (value) {
      _this.ct.cpu.pc.value = baseConvert.hex2dec(value)
    })
    this.ib = new IB(this.svg, 'IB', ...gr.gridtoxy(63.7, 46))
    this.mdr = new MDRRegister(this.svg, 'MDR', ...gr.gridtoxy(32, 55))
    this.mar = new MarRegister(this.svg, 'MAR', ...gr.gridtoxy(52, 55))
    this.bus_scb = new BusSCB(this.svg, 'SCB', gr.gridTopx(25), gr.gridTopx(64))
    this.bus_sdb = new BusSDB(this.svg, 'SDB', gr.gridTopx(25), gr.gridTopx(70))
    this.bus_sab = new BusSAB(this.svg, 'SAB', gr.gridTopx(25), gr.gridTopx(76))
    this.memory = new CTMemory(this.svg, 'Memory', gr.gridTopx(7), gr.gridTopx(64))
    this.io = new CTIO(this.svg, 'ES', gr.gridTopx(30) + gr.gridTopx(50), gr.gridTopx(64), this.ct)

    this.ct.cpu.uc.subscribe(this.uc)
    this.ct.cpu.ir.subscribe(this.ir)
    this.ct.cpu.mar.subscribe(this.mar)
    this.ct.cpu.mdr.subscribe(this.mdr)
    this.ct.cpu.ib.subscribe(this.ib)
    this.ct.cpu.tmpe.subscribe(this.tmpe)
    this.ct.cpu.pc.subscribe(this.pc)
    this.ct.cpu.tmps.subscribe(this.tmps)
    this.ct.cpu.sr.subscribe(this.sr)

    this.ct.cpu.alu.subscribe(this.alu)

    this.ct.sab.subscribe(this.bus_sab)
    this.ct.sdb.subscribe(this.bus_sdb)

    this.ct.cpu.uc.signalmanager.subscribe(this.alu)
    this.ct.cpu.uc.signalmanager.subscribe(this.tmpe)
    this.ct.cpu.uc.signalmanager.subscribe(this.tmps)
    this.ct.cpu.uc.signalmanager.subscribe(this.mar)
    this.ct.cpu.uc.signalmanager.subscribe(this.mdr)
    this.ct.cpu.uc.signalmanager.subscribe(this.sr)
    this.ct.cpu.uc.signalmanager.subscribe(this.ib)
    this.ct.cpu.uc.signalmanager.subscribe(this.ir)
    this.ct.cpu.uc.signalmanager.subscribe(this.pc)
    this.ct.cpu.uc.signalmanager.subscribe(this.bus_sab)
    this.ct.cpu.uc.signalmanager.subscribe(this.bus_sdb)

    this.ct.mem.subscribe(this.bus_sdb)
    this.ct.mem.subscribe(this.mdr)

    // Cables
    this.simpaths = new SVGGroup('', 'simpaths')
    this.sim.svg.append(this.simpaths.svg)

    const tmpPoints = {
      uc_inputs_left: [anchors.getAnchor('uc_out_left')[0] - gr.gridTopx(10), anchors.getAnchor('uc_out_left')[1]],
      registersTop: [anchors.getAnchor('ibbus_R0')[0] + this.registers[0].getBBox().width + gr.gridTopx(0.20 * gr.gridSize), anchors.getAnchor('ibbus_R0')[1] - gr.gridTopx(4)],
      registerIbbus: [anchors.getAnchor('ib_registers')[0], this.registers[0].getBBox().y]
    }

    // UC: FIN
    SVGCable.new(this.simpaths, 'clock_uc', 'signal', ['fin']).addAnchor('uc_fin_out').goLeft(gr.gridTopx(2)).goUp(gr.gridTopx(1.5)).addAnchor('uc_fin_in').addArrow('R', 3).setLabel('FIN', 2, 'LD')

    // UC: TRIGGER
    SVGCable.new(this.simpaths, 'trigger_uc').addAnchor('trigger_out_clock').addAnchor('uc_in_clock').addArrow('R', 1).setLabel('CLK', 1, 'LU')

    // // 'Bus Interno (IB)', 0, 'RU', gr.gridTopx(20), 2
    SVGCable.new(this.simpaths, 'bus_ib', 'bus').addAnchor('tmpe_ib_bus_tmpe').addAnchor('tmpe_ib_bus_ib').setLabel(_jStr(Simulator.labels.internal_bus).translate(), 0, 'RU', gr.gridTopx(20), 2).addArrow('L', 0)
    SVGCable.new(this.simpaths, 'bus_ib2', 'bus', ['mdr-ib', '.*-ib.?']).addAnchor('tmpe_ib_bus_ib').addPoint(anchors.getAnchor('alu_ib_bus')[0], anchors.getAnchor('alu_ib_bus')[1])
    SVGCable.new(this.simpaths, 'bus_ib3', 'bus', ['ib-tmpe']).addAnchor('tmpe_ib_bus_tmpe').addPoint(anchors.getAnchor('alu_ib_bus')[0], anchors.getAnchor('tmpe_ib_bus_tmpe')[1]).addArrow('L', 0)
    // // IB-TMPE
    SVGCable.new(this.simpaths, 'ib_tmpe_signal', 'signal', ['ib-tmpe']).addAnchor('ib_tmpe_signal').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('IB-TMPE', 1, 'RU', 2).addArrow('R', 0)

    SVGCable.new(this.simpaths, 'tmpe_clr', 'signal', ['tmpe-clr']).addAnchor('tmpe_clr').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('TMPE-CLR', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'tmpe_set', 'signal', ['tmpe-set']).addAnchor('tmpe_set').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('TMPE-SET', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'bus_tmpe_alu', 'bus').addAnchor('tmpe_alu_bus').addPoint(anchors.getAnchor('tmpe_alu_bus')[0], anchors.getAnchor('alu_orig_bottom')[1]).addArrow('U', 1)

    SVGCable.new(this.simpaths, 'bus_tmps_ib', 'bus', ['tmps-ib']).addAnchor('tmps_bus_ib').addPoint(anchors.getAnchor('ib_registers')[0], anchors.getAnchor('tmps_bus_ib')[1]).addArrow('R', 1)
    SVGCable.new(this.simpaths, 'bus_pc_ib', 'bus', ['pc-ib', 'ib-pc']).addAnchor('pc_bus_ib').addPoint(anchors.getAnchor('ib_registers')[0], anchors.getAnchor('pc_bus_ib')[1]).addArrow('L', 0).addArrow('R', 1)
    SVGCable.new(this.simpaths, 'bus_pc_ib_2', 'bus', ['pc-ib', '.*-ib.?']).addPoint(...tmpPoints.registerIbbus).addAnchor('ib_registers')

    SVGCable.new(this.simpaths, 'tmps_ib', 'signal', ['tmps-ib']).addAnchor('tmps_ib').goLeft(gr.gridTopx(8)).setLabel('TMPS-IB', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'alu_tmps', 'signal', ['alu-tmps']).addAnchor('alu_tmps').goLeft(gr.gridTopx(8)).setLabel('ALU-TMPS', 1, 'RU').addArrow('R', 0)

    SVGCable.new(this.simpaths, 'bus_alu_tmps', 'bus', ['alu-tmps']).addAnchor('alu_tmps_out').addAnchor('alu_tmps_in').addArrow('R', 1)

    SVGCable.new(this.simpaths, 'pc_ib', 'signal', ['pc-ib']).addAnchor('pc_ib').goLeft(gr.gridTopx(6)).setLabel('PC-IB', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'ib_pc', 'signal', ['ib-pc']).addAnchor('ib_pc').goLeft(gr.gridTopx(6)).setLabel('IB-PC', 1, 'RU').addArrow('R', 0)

    for (let i = 0; i < 8; i++) {
      SVGCable.new(this.simpaths, 'r' + i + '_ib', 'signal', ['r' + i + '-ib']).addAnchor('R' + i + '_ib').addPoint(...tmpPoints.registersTop).addAnchor('uc_joint_up').addArrow('L', 0).setLabel('R' + i + '-IB', 1, 'RM')
      SVGCable.new(this.simpaths, 'ib_r' + i, 'signal', ['ib-r' + i]).addAnchor('ib_R' + i).addPoint(...tmpPoints.registersTop).addAnchor('uc_joint_up').addArrow('L', 0).setLabel('IB-R' + i, 1, 'RM')
      SVGCable.new(this.simpaths, 'ibh_r' + i + 'h', 'signal', ['ibh-r' + i + 'h']).addAnchor('ibh_R' + i + 'h').addPoint(...tmpPoints.registersTop).addAnchor('uc_joint_up').addArrow('L', 0).setLabel('IBh-R' + i + 'h', 1, 'RM')
      SVGCable.new(this.simpaths, 'ibl_r' + i + 'l', 'signal', ['ibl-r' + i + 'l']).addAnchor('ibl_R' + i + 'l').addPoint(...tmpPoints.registersTop).addAnchor('uc_joint_up').addArrow('L', 0).setLabel('IBl-R' + i + 'l', 1, 'RM')

      SVGCable.new(this.simpaths, 'bus_ib_' + i, 'bus', ['ibl-r' + i + 'l', 'ibh-r' + i + 'h', 'r' + i + '-ib', 'ib-r' + i]).addAnchor('ibbus_R' + i).addPoint(anchors.getAnchor('ib_registers')[0], anchors.getAnchor('ibbus_R' + i)[1]).addArrow('R', 0).addArrow('L', 1)
    }

    SVGCable.new(this.simpaths, 'ib_ir', 'signal', ['ib-ir']).addAnchor('ib_ir_out').addAnchor('ib_ir_in').setLabel('IB-IR', 0, 'RU').addArrow('R', 1)
    SVGCable.new(this.simpaths, 'irl_ibh', 'signal', ['irl-ibh']).addAnchor('irl_ibh_out').addAnchor('irl_ibh_in').setLabel('IRl-IBh', 0, 'RU').addArrow('R', 1)
    SVGCable.new(this.simpaths, 'irl_ibl', 'signal', ['irl-ibl']).addAnchor('irl_ibl_out').addAnchor('irl_ibl_in').setLabel('IRl-IBl', 0, 'RU').addArrow('R', 1)
    SVGCable.new(this.simpaths, 'ExtIrl_ib').addAnchor('ExtIrl_ib_out').addAnchor('ExtIrl_ib_in').setLabel('ExtIrl_IB', 0, 'RU').addArrow('R', 1)
    SVGCable.new(this.simpaths, 'bus_uc_ir', 'bus', ['ib-ir']).addAnchor('ir_in_bus').addAnchor('uc_out_bus').addArrow('L', 0)

    SVGCable.new(this.simpaths, 'bus_ir_ib', 'bus', ['ib-ir', 'ir.*']).addAnchor('ir_bus_ib').addPoint(anchors.getAnchor('ib_registers')[0], anchors.getAnchor('ir_bus_ib')[1]).addArrow('L', 0).addArrow('R', 1)

    SVGCable.new(this.simpaths, 'ib_mar', 'signal', ['ib-mar']).addAnchor('ib_mar').addPoint(...tmpPoints.registersTop).addAnchor('uc_joint_up').addArrow('L', 0).setLabel('IB-MAR', 1, 'RM')

    SVGCable.new(this.simpaths, 'uc_mdr_ib', 'signal', ['mdr-ib']).addAnchor('mdr_ib').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('MDR-IB', 0, 'LU', gr.gridTopx(1)).addArrow('R', 0)
    SVGCable.new(this.simpaths, 'uc_ib_mdr', 'signal', ['ib-mdr']).addAnchor('ib_mdr').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('IB-MDR', 0, 'LU', gr.gridTopx(1)).addArrow('R', 0)
    SVGCable.new(this.simpaths, 'bus_mdr_ib', 'bus', ['mdr-ib', 'ib-mdr']).addAnchor('mdr_ib_bus').addPoint(anchors.getAnchor('mdr_ib_bus')[0], anchors.getAnchor('tmpe_ib_bus_ib')[1]).addArrow('D', 0).addArrow('U', 1)
    this.busMdrSdb = SVGCable.new(this.simpaths, 'bus_mdr_sdb', 'bus', ['ib-mdr', Memory.topic.mem_sdb, Device.topic.dev_sdb]).addAnchor('mdr_sdb').addPoint(anchors.getAnchor('mdr_sdb')[0], anchors.getAnchor('bus_sdb_orig')[1]).addArrow('U', 0).addArrow('D', 1)
    this.ct.mem.subscribe(this.busMdrSdb)

    this.busSdbMem = SVGCable.new(this.simpaths, 'bus_sdb_mem', 'bus', ['ib-mdr', Memory.topic.mem_sdb, Device.topic.dev_sdb])
      .addPoint(anchors.getAnchor('mdr_sdb')[0], anchors.getAnchor('bus_sdb_orig_bottom')[1])
      .addPoint(anchors.getAnchor('mdr_sdb')[0], anchors.getAnchor('bus_sdb_orig_bottom')[1] + gr.gridTopx(2))
      .addPoint(anchors.getAnchor('mem_rightside')[0], anchors.getAnchor('bus_sdb_orig_bottom')[1] + gr.gridTopx(2)).addArrow('U', 0).addArrow('L', 2)
    this.ct.mem.subscribe(this.busSdbMem)

    this.busSdbIo = SVGCable.new(this.simpaths, 'bus_sdb_es', 'bus', ['ib-mdr', Memory.topic.mem_sdb, Device.topic.dev_sdb])
      .addAnchor('sdb_io_bus')
      .addPoint(anchors.getAnchor('io_leftside')[0], anchors.getAnchor('sdb_io_bus')[1] + gr.gridTopx(2), 'y').addArrow('U', 0).addArrow('R', 2)
    this.ct.mem.subscribe(this.busSdbIo)

    SVGCable.new(this.simpaths, 'bus_sab_mem', 'bus', ['read', 'write'])
      .addPoint(anchors.getAnchor('mdr_sdb')[0], anchors.getAnchor('bus_sab_orig_bottom')[1])
      .addPoint(anchors.getAnchor('mdr_sdb')[0], anchors.getAnchor('bus_sab_orig_bottom')[1] + gr.gridTopx(2))
      .addPoint(anchors.getAnchor('mem_rightside')[0], anchors.getAnchor('bus_sab_orig_bottom')[1] + gr.gridTopx(2)).addArrow('L', 2)

    SVGCable.new(this.simpaths, 'bus_sab_es', 'bus', ['read', 'write'])
      .addAnchor('sab_io_bus')
      .addPoint(anchors.getAnchor('io_leftside')[0], anchors.getAnchor('sab_io_bus')[1] + gr.gridTopx(2), 'y').addArrow('R', 2)

    SVGCable.new(this.simpaths, 'bus_mar_ib', 'bus', ['ib-mar'])
      .addAnchor('mar_ib_bus')
      .addPoint(anchors.getAnchor('mar_ib_bus')[0], anchors.getAnchor('tmpe_ib_bus_ib')[1]).addArrow('D', 0)

    SVGCable.new(this.simpaths, 'bus_mar_sab', 'bus', ['ib-mar'])
      .addAnchor('mar_sab')
      .addPoint(anchors.getAnchor('mar_sab')[0], anchors.getAnchor('bus_sab_orig')[1]).addArrow('D', 1)

    SVGCable.new(this.simpaths, 'sr_uc', 'signal', ['alu-sr']).addAnchor('sr_uc_up').addAnchor('uc_down').addArrow('U', 1)
    SVGCable.new(this.simpaths, 'sr_ib', 'signal', ['sr-ib']).addAnchor('sr_ib').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').addArrow('R', 0).setLabel('SR-IB', 1, 'RU')
    SVGCable.new(this.simpaths, 'ib_sr', 'signal', ['ib-sr']).addAnchor('ib_sr').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').addArrow('R', 0).setLabel('IB-SR', 1, 'RU')
    SVGCable.new(this.simpaths, 'alu_sr', 'signal', ['alu-sr']).addAnchor('alu_sr').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').addArrow('R', 0).setLabel('ALU-SR', 1, 'RU')
    SVGCable.new(this.simpaths, 'sti', 'signal', ['sti']).addAnchor('sti').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').addArrow('R', 0).setLabel('STI', 1, 'RU')
    SVGCable.new(this.simpaths, 'cli', 'signal', ['cli']).addAnchor('cli').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').addArrow('R', 0).setLabel('CLI', 1, 'RU')
    SVGCable.new(this.simpaths, 'alu_sr_in', 'signal', ['alu-sr']).addAnchor('alu_sr_out').addAnchor('alu_sr_in').addArrow('U', 2)

    SVGCable.new(this.simpaths, 'bus_sr_ib', 'bus', ['ib-sr', 'sr-ib']).addAnchor('sr_bus_ib').addPoint(anchors.getAnchor('ib_registers')[0], anchors.getAnchor('sr_bus_ib')[1]).addArrow('L', 0).addArrow('R', 1)

    SVGCable.new(this.simpaths, 'alu_op_in', 'signal', ['alu-op']).addAnchor('alu_op_in').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('ALU-OP', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'alu_carry_in', 'signal', ['carry-in']).addAnchor('alu_carry_in').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('CARRY-IN', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'bus_alu_ib', 'bus', ['ib-mar', '.*-ib.?']).addAnchor('alu_ib_bus').addPoint(anchors.getAnchor('alu_ib_bus')[0], anchors.getAnchor('tmpe_ib_bus_ib')[1]).addArrow('U', 0)

    SVGCable.new(this.simpaths, 'int_signal', 'int', ['int-uc']).addAnchor('int_signal').goUp(gr.gridTopx(5))
      .addPoint(tmpPoints.uc_inputs_left[0] - 10, anchors.getAnchor('uc_in_left')[1] - 32)
      .addPoint(anchors.getAnchor('uc_in_left')[0], anchors.getAnchor('uc_in_left')[1] - 32)
      .addArrow('R', 4)
      .setLabel('INT', 1, 'LU')

    SVGCable.new(this.simpaths, 'scb_mem_write', 'signal', [SignalManager.topic.mem_write]).addAnchor('memory_write_read').addAnchorY('mem_write_in').addAnchor('mem_write_in').setLabel('WRITE', 2, 'RU', gr.gridTopx(0.5)).addArrow('L', 2)
    SVGCable.new(this.simpaths, 'scb_mem_read', 'signal', [SignalManager.topic.mem_read]).addAnchor('memory_write_read').addAnchorY('mem_read_in').addAnchor('mem_read_in').setLabel('READ', 2, 'RU', gr.gridTopx(0.5)).addArrow('L', 2)

    SVGCable.new(this.simpaths, 'scb_io_write', 'signal', [SignalManager.topic.mem_write]).addAnchor('io_write_read').addAnchorY('io_write_in').addAnchor('io_write_in').setLabel('WRITE', 2, 'LU').addArrow('R', 2)

    SVGCable.new(this.simpaths, 'ib_pc', 'signal', ['ib-pc']).addAnchor('ib_pc').goLeft(gr.gridTopx(6)).setLabel('IB-PC', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'scb_io_read', 'signal', [SignalManager.topic.mem_read]).addAnchor('io_write_read').addAnchorY('io_read_in').addAnchor('io_read_in').setLabel('READ', 2, 'LU').addArrow('R', 2)

    SVGCable.new(this.simpaths, 'scb_io_inta', 'signal', ['inta']).addAnchor('io_inta').addAnchor('io_inta_in').setLabel('INTA', 1, 'LU').addArrow('R', 1)
    SVGCable.new(this.simpaths, 'scb_io_int', 'int', ['int-uc']).addAnchor('io_int').addAnchor('io_int_in').setLabel('INT', 1, 'LU').addArrow('L', 0)

    SVGCable.new(this.simpaths, 'scb_inta_in', 'signal', ['inta']).addAnchor('bus_scb_inta_in').goUp(gr.gridTopx(4)).addPoint(...tmpPoints.registersTop).addAnchor('uc_joint_up').setLabel('INTA', 2, 'RM').addArrow('D', 0)
    SVGCable.new(this.simpaths, 'scb_read_in', 'signal', [SignalManager.topic.mem_read]).addAnchor('bus_scb_read_in').goUp(gr.gridTopx(5)).addPoint(...tmpPoints.registersTop).setLabel('READ', 2, 'RM').addAnchor('uc_joint_up').addArrow('D', 0)
    SVGCable.new(this.simpaths, 'scb_write_in', 'signal', [SignalManager.topic.mem_write]).addAnchor('bus_scb_write_in').goUp(gr.gridTopx(6)).addPoint(...tmpPoints.registersTop).setLabel('WRITE', 2, 'RM').addAnchor('uc_joint_up').addArrow('D', 0)

    const cables = SVGCable.cables
    for (let i = 0; i < cables.length; i++) {
      this.ct.cpu.uc.signalmanager.subscribe(cables[i])
      this.ct.cpu.uc.subscribe(cables[i])
    }

    this.wm = new WindowManager()

    const menu = _jsc({ s: 'div', _class: 'menu' })
    menu.append(Menu(this.ct, this, this.wm).dom)

    document.querySelector('#menu-main').append(menu.element)

    const langMenu = LangMenu(this)
    document.querySelector('#menu-main').append(langMenu.element)

    // Create a container for the language menu
    const langContainer = document.createElement('div')
    langContainer.className = 'lang-container'

    // Move the language menu into this container
    const langMenuElement = document.querySelector('.lang-menu')
    langMenuElement.parentNode.insertBefore(langContainer, langMenuElement)
    langContainer.appendChild(langMenuElement)

    // Create the version indicator as a ul/li structure like the language menu
    const versionIndicator = document.createElement('ul')
    versionIndicator.className = 'version-menu'
    const versionLi = document.createElement('li')
    versionLi.textContent = version // Use the imported version
    versionIndicator.appendChild(versionLi)
    langContainer.insertBefore(versionIndicator, langMenuElement)

    const sim = this
    this.uc.setSignalSelector(function () {
      vwactions.signalSelector(_this.ct, sim, _this.wm)
    })

    this.memory.memoryConfig(function () { vwactions.memoryConfig(_this.ct, _this.wm) })
    this.memory.memoryEditor(function () { vwactions.memoryEditor(_this.ct, _this.wm) })

    this.io.addScreen(function () { vwactions.addScreen(_this.ct, _this.wm) })
    const sdbObservers = [this.bus_sdb, this.mdr, this.busMdrSdb, this.busSdbMem, this.busSdbIo]
    this.io.addKeyboard(function () { vwactions.addKeyboard(_this.ct, _this.wm, sdbObservers) })
    this.io.addLights(function () { vwactions.addLights(_this.ct, _this.wm, sdbObservers) })

    this.ct.reset()
  }
}

// Set the document title dynamically
document.title = `SimCT ${version} - Theoretical Computer Simulator`

try {
  const sim = new Simulator()
  window.sim = sim
  window.state = State
} catch (e) {
  console.error(e)

  // Show an error to user so that he knows that this is probably a bug and not
  // his fault
  alert('An unexpected error occurred: ' + e)
}
