'use strict'

import { Memory } from '../control/memory.js'
/**
 * @module view/memorycfg
 */

import { baseConvert as bc } from '../lib/baseconvert.js'
import { _jsc } from '../lib/jsnc.js'
import { _jStr } from '../lib/jstr.js'
import { Observer } from '../lib/observer.js'
import { ContextMenu } from './navigation/contextmenu.js'
import { iconLib } from './navigation/icons.js'

const contextMenuLabels = {
  delete_module: 'labels.memcfg.delete_module'
}

/**
 * @method module Create a memory module
 * @param {*} moduleinfo Memory module info
 * @param {Memory} mem Memory object link
 * @returns
 */
function module (moduleinfo, mem) {
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
      positionLabel.text(bc.dec2hex(i * 1024 - (i === 64 ? 1 : 0)).toUpperCase() + 'h')
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
          alert(_jStr(e.message).translate())
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
      this.modules.append(module(this.mem.modules[i], this.mem))
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

export { MemoryCfg }
