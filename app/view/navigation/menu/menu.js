'use strict'

/**
 * @module view/navigation/menu/menu
 */

import { NavMenu } from '../../../lib/navmenu.js'
import { actions } from '../../../control/actions.js'
import { vwactions } from '../viewactions.js'
import { Computer } from '../../../control/computer.js'

import { Clock } from '../../../control/clock.js'
import { Uc } from '../../../control/uc.js'
import { _jStr } from '../../../lib/jstr.js'
import { _jsc, _jss } from '../../../lib/jsnc.js'
import { Simulator } from '../../sim.js'
import { State } from '../../../config/control.js'
import { setCookie } from '../../../lib/cookies.js'

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
  menu_mode_label: 'labels.menu.menu_mode_label',
  menu_lang_confirm: 'labels.menu.menu_lang_confirm'
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
          if (computer.cpu.uc.mode === Uc.mode.manual) return '<span class="disabled">' + _jStr(menuOptions.menu_running_instruction).translate() + '</span>'
          return _jStr(menuOptions.menu_running_instruction).translate()
        },
        id: 'menu-instruction',
        action: function () {
          actions.runInstruction(computer)
        }
      },
      {
        title: function () {
          if (computer.cpu.uc.mode === Uc.mode.manual) return '<span class="disabled">' + _jStr(menuOptions.menu_running_run).translate() + '</span>'
          return (computer.cpu.uc.mode === Uc.mode.normal.auto && computer.clock.status === Clock.status.started) ? _jStr(menuOptions.menu_running_stop).translate() : _jStr(menuOptions.menu_running_run).translate()
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

export { Menu, LangMenu, RotateTheme, menuOptions }
