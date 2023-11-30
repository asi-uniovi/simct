'use strict'

/**
 * @module view/navigation/configurator
 */

import { Forms } from '../../lib/forms.js'
import { _jsc } from '../../lib/jsnc.js'
import { _jStr } from '../../lib/jstr.js'
import { LangMenu } from './menu/menu.js'

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

export { SystemConfigurator }
