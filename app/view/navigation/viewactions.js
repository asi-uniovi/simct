'use strict'

/**
 * @module view/navigation/viewactions
 */

import { Observable } from '../../lib/observer.js'
import { SVGCable } from '../svg.js'
import { SignalSelector } from './signalselection.js'
import { Computer } from '../../control/computer.js'
import { Memoryedit } from '../memoryedit.js'
import { MemoryCfg } from '../memorycfg.js'
import { InputDeviceForm, OutputDeviceForm } from '../ctperipherals/deviceforms.js'
import { baseConvert as bc } from '../../lib/baseconvert.js'
import { Keyboard } from '../../control/devices/keyboard.js'
import { CTKeyboard } from '../ctperipherals/keyboard.js'
import { Lights } from '../../control/devices/lights.js'
import { CTLights } from '../ctperipherals/lights.js'
import { Screen } from '../../control/devices/screen.js'
import { CTScreen } from '../ctperipherals/screen.js'
import { _jStr } from '../../lib/jstr.js'
import { Forms } from '../../lib/forms.js'
import { _jsc } from '../../lib/jsnc.js'
import { SystemConfigurator } from './configurator.js'
import { localStorageEx } from '../../lib/localstorage.js'
import { BusSDB } from '../ct.js'

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
          alert(_jStr(e.message).translate())
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
          alert(_jStr(e.message).translate())
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
        _this.screenVW(ct, wm, { name: form.name, basedir: bc.hex2dec(form.basedir) })
        wm.remove(wf)
      } catch (e) {
        alert(_jStr(e.message).translate())
      }
    })

    wf.content = pantallaForm.element
    document.querySelector('#wmng').append(wf.dom.element)
  }

  /**
   * @method keyboardVW Creates a keyboard view
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm WindowManager link
   * @param {BusSDB} busSdb BusSDB link
   * @param {*} form Form data
   * @returns {Keyboard} Keyboard
   */
  keyboardVW (ct, wm, busSdb, form) {
    const DeviceControl = new Keyboard(form.name, form.basedir, form.vector * 1, form.priority * 1, form.int, ct.sdb, ct.cpu)
    ct.io.addDevice(DeviceControl)
    DeviceControl.subscribe(busSdb)

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
   * @param {BusSDB} busSdb BusSDB link
   * @returns {Keyboard} Keyboard
   */
  addKeyboard (ct, wm, busSdb) {
    const _this = this
    const wf = wm.window(_jStr(ViewActions.labels.window_title_keyboard_data).translate(), false)
    const DeviceForm = new InputDeviceForm(function (form) {
      try {
        localStorageEx.remove('w' + form.name)
        _this.keyboardVW(ct, wm, busSdb, { name: form.name, basedir: bc.hex2dec(form.basedir), vector: form.vector * 1, priority: form.priority * 1, int: form.int })
        wm.remove(wf)
      } catch (e) {
        alert(_jStr(e.message).translate())
      }
    })

    wf.content = DeviceForm.element
    document.querySelector('#wmng').append(wf.dom.element)
  }

  /**
   * @method lightsVW Creates a lights view
   * @param {Computer} ct Computer link
   * @param {WindowManager} wm WindowManager link
   * @param {BusSDB} busSdb BusSDB link
   * @param {Forms} form Form data
   * @returns {Lights} Lights
   */
  lightsVW (ct, wm, busSdb, form) {
    const DeviceControl = new Lights(form.name, form.basedir, form.vector * 1, form.priority * 1, form.int, ct.sdb, ct.cpu)
    ct.io.addDevice(DeviceControl)
    DeviceControl.subscribe(busSdb)

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
   * @param {BusSDB} busSdb BusSDB link
   * @returns {Lights} Lights
   */
  addLights (ct, wm, busSdb) {
    const _this = this
    const wf = wm.window(_jStr(ViewActions.labels.window_title_lights_data).translate(), false)
    const DeviceForm = new InputDeviceForm(function (form) {
      try {
        localStorageEx.remove('w' + form.name)
        _this.lightsVW(ct, wm, busSdb, { name: form.name, basedir: bc.hex2dec(form.basedir), vector: form.vector * 1, priority: form.priority * 1, int: form.int })
        wm.remove(wf)
      } catch (e) {
        alert(_jStr(e.message).translate())
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

export { vwactions, ViewActions }
