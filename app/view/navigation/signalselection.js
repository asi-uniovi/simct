'use strict'

/**
 * @module view/navigation/signalselection
 */

import { Forms } from '../../lib/forms.js'
import { _jsc, _jss } from '../../lib/jsnc.js'
import { _jStr } from '../../lib/jstr.js'
import { SignalMap, SignalSet } from '../../control/signalmanager.js'

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

export { SignalSelector }
