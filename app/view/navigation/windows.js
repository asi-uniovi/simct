'use strict'

/**
 * @module view/navigation/windows
 */

import { _jsc } from '../../lib/jsnc.js'
import { localStorageEx as localSt } from '../../lib/localstorage.js'

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
      const position = { left: x - _this.lastPosition.offsetx + 'px', top: y - _this.lastPosition.offsety + 'px' }
      _this.w.style(position)
      localSt.set('w' + _this.title, position)
    }

    this.dom = _this.w

    const tmp = localSt.get('w' + this.title)
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

    localSt.set('windows', WindowManager.windows)

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
    return WindowManager.windows.length
  }
}

export { WindowManager }
