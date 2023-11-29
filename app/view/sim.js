'use strict'

/**
 * @module view/simulator
 */

import { SVGGroup } from './svg/group.js'
import { baseConvert as bc } from '../lib/baseconvert.js'
import { SVGCable } from './svg.js'
import { CTMemory, CTIO, Trigger, PCRegister, IB, RRegister, TmpeRegister, TmpsRegister, MDRRegister, MarRegister, Alu, BusSAB, BusSDB, BusSCB, Ir, RegisterSR, Uc, anchors } from './ct.js'
import { gr } from './gridmanager.js'
import { initKeys } from './navigation/keys.js'
import { vwactions } from './navigation/viewactions.js'
import { WindowManager } from './navigation/windows.js'
import { LangMenu, Menu } from './navigation/menu/menu.js'
import { _jStr } from '../lib/jstr.js'
import { _jsc } from '../lib/jsnc.js'

import { localStorageEx } from '../lib/localstorage.js'
import { SignalManager } from '../control/signalmanager.js'
import { Computer } from '../control/computer.js'
import { State } from '../config/control.js'
import { getCookie } from '../lib/cookies.js'

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

    this.ct = new Computer()

    this.ct.mem.addModule(0x0000, 32)
    this.ct.mem.addModule(0x8000, 32)

    this.control = {
      selectedSignals: []
    }

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
      restoreInfo.io.devices.forEach(d => {
        switch (d.type) {
          case 'screen': vwactions.screenVW(_this.ct, _this.wm, { name: d.name, basedir: d.address })
            break
          case 'keyboard': vwactions.keyboardVW(_this.ct, _this.wm, { name: d.name, basedir: d.address, vector: d.vector, priority: d.vector, int: d.int })
            break
          case 'lights': vwactions.lightsVW(_this.ct, _this.wm, { name: d.name, basedir: d.address, vector: d.vector, priority: d.vector, int: d.int })
            break
        }
      })
    } catch (e) {
      alert(_jStr(e.message).translate())
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
      this.registers[i] = new RRegister(this.svg, 'R' + i, x, y, function (value) { _this.ct.cpu.reg[i].value = bc.hex2dec(value) })
      this.ct.cpu.reg[i].subscribe(this.registers[i])
      this.ct.cpu.uc.signalmanager.subscribe(this.registers[i])
      y = this.registers[i].getBBox().y + this.registers[i].getBBox().height + gr.gridTopx(2)
    }

    this.trigger = new Trigger(this.svg, 'TRIGGER', ...gr.gridtoxy(2, 4), this.ct)
    this.uc = new Uc(this.svg, 'uc', ...gr.gridtoxy(12, 4))
    this.ir = new Ir(this.svg, 'IR', ...gr.gridtoxy(50, 4))
    this.sr = new RegisterSR(this.svg, 'SR', ...gr.gridtoxy(10, 26))
    this.alu = new Alu(this.svg, 'alu', ...gr.gridtoxy(9, 34))
    this.tmpe = new TmpeRegister(this.svg, 'TMPE', ...gr.gridtoxy(10, 48))
    this.tmps = new TmpsRegister(this.svg, 'TMPS', ...gr.gridtoxy(50.20, 34))
    this.pc = new PCRegister(this.svg, 'PC', ...gr.gridtoxy(52.8, 39), function (value) {
      _this.ct.cpu.pc.value = bc.hex2dec(value)
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

    SVGCable.new(this.simpaths, 'bus_tmps_ib', 'bus', ['tmps-ib']).addAnchor('tmps_bus_ib').addPoint(anchors.getAnchor('ibbus_R0')[0] - gr.gridSize * 3, anchors.getAnchor('tmps_bus_ib')[1]).addArrow('R', 1)
    SVGCable.new(this.simpaths, 'bus_pc_ib', 'bus', ['pc-ib', 'ib-pc']).addAnchor('pc_bus_ib').addPoint(anchors.getAnchor('ibbus_R0')[0] - gr.gridSize * 3, anchors.getAnchor('pc_bus_ib')[1]).addArrow('L', 0).addArrow('R', 1)
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

    SVGCable.new(this.simpaths, 'bus_ir_ib', 'bus', ['ib-ir', 'ir.*']).addAnchor('ir_bus_ib').addPoint(anchors.getAnchor('ibbus_R0')[0] - gr.gridSize * 3, anchors.getAnchor('ir_bus_ib')[1]).addArrow('L', 0).addArrow('R', 1)

    SVGCable.new(this.simpaths, 'ib_mar', 'signal', ['ib-mar']).addAnchor('ib_mar').addPoint(...tmpPoints.registersTop).addAnchor('uc_joint_up').addArrow('L', 0).setLabel('IB-MAR', 1, 'RM')

    SVGCable.new(this.simpaths, 'uc_mdr_ib', 'signal', ['mdr-ib']).addAnchor('mdr_ib').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('MDR-IB', 0, 'LU', gr.gridTopx(1)).addArrow('R', 0)
    SVGCable.new(this.simpaths, 'uc_ib_mdr', 'signal', ['ib-mdr']).addAnchor('ib_mdr').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('IB-MDR', 0, 'LU', gr.gridTopx(1)).addArrow('R', 0)
    SVGCable.new(this.simpaths, 'bus_mdr_ib', 'bus', ['mdr-ib', 'ib-mdr']).addAnchor('mdr_ib_bus').addPoint(anchors.getAnchor('mdr_ib_bus')[0], anchors.getAnchor('tmpe_ib_bus_ib')[1]).addArrow('D', 0).addArrow('U', 1)
    SVGCable.new(this.simpaths, 'bus_mdr_sdb', 'bus', ['mdr-ib', 'ib-mdr']).addAnchor('mdr_sdb').addPoint(anchors.getAnchor('mdr_sdb')[0], anchors.getAnchor('bus_sdb_orig')[1]).addArrow('U', 0).addArrow('D', 1)

    SVGCable.new(this.simpaths, 'bus_sdb_mem', 'bus', ['write', 'mdr-ib'])
      .addPoint(anchors.getAnchor('mdr_sdb')[0], anchors.getAnchor('bus_sdb_orig_bottom')[1])
      .addPoint(anchors.getAnchor('mdr_sdb')[0], anchors.getAnchor('bus_sdb_orig_bottom')[1] + gr.gridTopx(2))
      .addPoint(anchors.getAnchor('mem_rightside')[0], anchors.getAnchor('bus_sdb_orig_bottom')[1] + gr.gridTopx(2)).addArrow('U', 0).addArrow('L', 2)

    SVGCable.new(this.simpaths, 'bus_sdb_es', 'bus', ['write', 'mdr-ib'])
      .addAnchor('sdb_io_bus')
      .addPoint(anchors.getAnchor('io_leftside')[0], anchors.getAnchor('sdb_io_bus')[1] + gr.gridTopx(2), 'y').addArrow('U', 0).addArrow('R', 2)

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

    SVGCable.new(this.simpaths, 'bus_sr_ib', 'bus', ['ib-sr', 'sr-ib']).addAnchor('sr_bus_ib').addPoint(anchors.getAnchor('ibbus_R0')[0] - gr.gridSize * 3, anchors.getAnchor('sr_bus_ib')[1]).addArrow('L', 0).addArrow('R', 1)

    SVGCable.new(this.simpaths, 'alu_op_in', 'signal', ['alu-op']).addAnchor('alu_op_in').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('ALU-OP', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'alu_carry_in', 'signal', ['carry-in']).addAnchor('alu_carry_in').addPoint(...tmpPoints.uc_inputs_left).addAnchor('uc_out_left').setLabel('CARRY-IN', 1, 'RU').addArrow('R', 0)
    SVGCable.new(this.simpaths, 'bus_alu_ib', 'bus', ['ib-mar', '.*-ib.?']).addAnchor('alu_ib_bus').addPoint(anchors.getAnchor('alu_ib_bus')[0], anchors.getAnchor('tmpe_ib_bus_ib')[1]).addArrow('U', 0)

    SVGCable.new(this.simpaths, 'int_signal', 'int', ['int-uc']).addAnchor('int_signal').goUp(gr.gridTopx(5)).addPoint(tmpPoints.uc_inputs_left[0], anchors.getAnchor('uc_in_left')[1]).addAnchor('uc_in_left').addArrow('R', 4).setLabel('INT', 1, 'LU')

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

    const sim = this
    this.uc.setSignalSelector(function () {
      vwactions.signalSelector(_this.ct, sim, _this.wm)
    })

    this.memory.memoryConfig(function () { vwactions.memoryConfig(_this.ct, _this.wm) })
    this.memory.memoryEditor(function () { vwactions.memoryEditor(_this.ct, _this.wm) })

    this.io.addScreen(function () { vwactions.addScreen(_this.ct, _this.wm) })
    this.io.addKeyboard(function () { vwactions.addKeyboard(_this.ct, _this.wm) })
    this.io.addLights(function () { vwactions.addLights(_this.ct, _this.wm) })

    this.ct.reset()
  }
}

export { Simulator }
