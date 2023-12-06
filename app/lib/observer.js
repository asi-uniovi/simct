'use strict'

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

export { Observable, Observer, ObservableObserver }
