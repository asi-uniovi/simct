import { version } from './app/config/version.js';

/**
 * @module control/main
 */

import { Simulator } from './app/view/sim.js'
import { State } from './app/config/control.js'

// Set the document title dynamically
document.title = `SimCT ${version} - Theoretical Computer Simulator`;

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
