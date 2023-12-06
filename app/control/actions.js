'use strict'
/**
 * @module control/actions
 */
/* istanbul ignore file */
import { Observable } from '../lib/observer.js'
import { Computer } from './computer.js'

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

export { actions, Actions }
