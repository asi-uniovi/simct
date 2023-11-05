/**
 * @fileoverview Translation file for English.
 */
const GlobalConst = {
  implement_this: 'error.global.implement_this'
}

const en = {

  // Memory
  'labels.memory.IOlabel': 'IOIO',
  'labels.memory.empty': 'XXXX',

  'labels.memcfg.header_left': '<p><strong>Current configuration </strong><br /><span style="font-size: 10px;">(Right click for module deletion)</span></p>',
  'labels.memcfg.header_right': '<p><strong>Available Modules </strong><br /><span style="font-size: 10px;">(Use drag and drop to add a module)</span></p>',

  // Menu
  'labels.menu.menu_file': 'File',
  'labels.menu.menu_file_open': 'Open eje file...',
  'labels.menu.system_config': 'System configuration',
  'labels.menu.menu_file_opensim': 'Open sim file...',
  'labels.menu.menu_file_savesim': 'Save sim file...',
  'labels.menu.menu_offline_version': 'Download offline version',
  'labels.menu.menu_running': 'Run',
  'labels.menu.menu_running_cycle': '[F7] Clock cycle (step)',
  'labels.menu.menu_running_instruction': '[F8] Instruction',
  'labels.menu.menu_running_run': '[F9] Run',
  'labels.menu.menu_running_stop': '[F9] Stop',
  'labels.menu.menu_running_signalselect': '[F6] Signal selector',
  'labels.menu.menu_running_mode_normal': '[F5] Change  mode',
  'labels.menu.menu_running_mode_manual': '[F5] Change mode',
  'labels.menu.menu_running_reset': '[Ctrl+F10] Reset',
  'labels.menu.menu_utils': 'Utils',
  'labels.menu.menu_utils_mem': 'Memory',
  'labels.menu.menu_utils_mem_config': 'Configure',
  'labels.menu.menu_utils_mem_edit': 'Hex editor',
  'labels.menu.menu_utils_io': 'I/O',
  'labels.menu.menu_utils_io_keyboard': 'Connect Keyboard',
  'labels.menu.menu_utils_io_screen': 'Connect Screen',
  'labels.menu.menu_utils_io_lights': 'Connect Lights',
  'labels.menu.menu_mode_label': 'MODE',
  'labels.menu.menu_lang_confirm': 'If you change the language now, you will lose your work, you can save the simulation if you wish and reload it in the new language',

  // Language Menu
  'labels.simulator.language_es': 'SP',
  'labels.simulator.language_en': 'EN',

  // Context menu memconfig
  'labels.memcfg.delete_module': 'Remove Module',

  // Context menu I/O management
  'labels.ctio.connect_keyboard': 'Connect Keyboard',
  'labels.ctio.connect_screen': 'Connect Screen',
  'labels.ctio.connect_lights': 'Connect Lights',
  'labels.ctio.controllabel': 'I/O',

  // Context menu Memory management
  'labels.ctmemory.config': 'Configure',
  'labels.ctmemory.editor': 'Editor',
  'labels.ctmemory.controllabel': 'MEMORY',

  // Uc
  'labels.ctuc.controllabel': 'CU',
  'labels.ctuc.steplabel': 'STEP',

  // Buses
  'labels.bussdb.data_bus': 'Data bus (SDB)',
  'labels.bussab.address_bus': 'Address bus (SAB)',
  'labels.busscb.control_bus': 'Control bus (SCB)',

  // Simulator
  'labels.simulator.internal_bus': 'Internal bus (IB)',

  // View windows
  'labels.view.window_title_memedit': 'Memory Editor',
  'labels.view.window_title_memcfg': 'Memory Configuration',
  'labels.view.window_title_keyboard_data': 'Keyboard info',
  'labels.view.window_title_screen_data': 'Keyboard info',
  'labels.view.window_title_lights_data': 'Lights info',
  'labels.view.window_title_savesim': 'Save simulation',
  'labels.view.window_title_savesim_label': 'File Name: ',
  'labels.view.window_title_savesim_button': 'Save',

  // Device data forms
  'labels.deviceform.form_name': 'Name',
  'labels.deviceform.form_address': 'Base Addr',
  'labels.deviceform.form_vector': 'Int. Number',
  'labels.deviceform.form_priority': 'Priority. (0-255)',
  'labels.deviceform.form_int': 'Generares int.',

  // Keyboard
  'labels.ctkeyboard.buffer': 'BUFFER',
  'labels.ctkeyboard.buffer_hex': 'HEX',
  'labels.ctkeyboard.buffer_car': 'CAR',
  'labels.ctkeyboard.caps': 'Caps Lock',
  'labels.ctkeyboard.address': 'Addr',
  'labels.ctkeyboard.vector': 'Vec',
  'labels.ctkeyboard.priority': 'Pri',
  'labels.ctkeyboard.int': 'Int',
  'labels.ctkeyboard.state': 'State',
  'errors.ctkeyboard.keyboard_must': 'Keyboard must be created before connecting it to the computer',

  // Lights device
  'labels.ctlights.address': 'Dir',
  'labels.ctlights.vector': 'Vec',
  'labels.ctlights.priority': 'Pri',
  'labels.ctlights.int': 'Int',
  'labels.ctlights.genint': 'Gen Int',
  'labels.ctlights.group_lights': 'Lights/output',
  'labels.ctlights.group_switches': 'Switches/input',

  // Screen device
  'labels.ctscreen.address': 'Addr.',
  'labels.ctscreen.onoff': '',

  // Windows
  'labels.window.close': 'Close',

  // Signal selector
  'label.signalset.signal_selection_btok': 'Save signals',
  'label.signalset.signal_selection_deactivate': 'Deactivate All',
  'label.signalset.signal_selection': 'Signal selection',

  // System configuration
  'label.sysconf.btok': 'Save',
  'label.sysconf.window_title': 'System configuration',

  // Confirms
  'confirm.devices.remove_device': 'Are you sure you want to close the device: {0}?',

  // Errors
  'error.computer.loading_program': 'No program has been loaded',
  'error.computer.loading_memory': 'Memory has not been loaded',
  'error.computer.loading_signals_nomanual': 'You only can use the signal selector in manual mode',

  'error.IOManager.memorylink_missing': 'Memory has not been linked to I/O manager',
  'error.IOManager.io_vectors': 'First 256 memory positions are reserved for Interruption vector use',
  'error.IOManager.duplicate_name': 'A device with the same name already exists',

  'error.memory.address_space': 'Given address {0} is out of directionable space {1}',
  'error.memory.module_size': 'A memory module can only be placed in an address multiple of the module size',
  'error.memory.module_notvalid': 'Given module is not valid',
  'error.memory.module_collision': 'There is a memory module in the given address',
  'error.memory.module_nomodule': 'There is no memory module in the given address',
  'error.memory.io_module_present': 'There is an I/O device in the given address',
  'error.memory.nomodule_noes': 'There is no memory module in the given address and no I/O device',

  'error.memory.notsupported': 'Memory doesn\'t support this operation mode',

  'error.signalset.multiple_download': 'You cannot select two download signals at the same time',
  'error.signalset.same_group': 'The selected signals from {0} group are incompatible',
  'error.signalset.read_ongoing': 'There is an ongoing read operation and the signal selection is not possible',
  'error.signalset.write_ongoing': 'There is an ongoing write operation and the signal selection is not possible',
  'error.signalset.badsignal': 'Signal is not valid',
  'error.signalset.multiple_upload_group': 'Selected upload signals are not compatible',
  'error.signalset.inta_read': 'Selecting INTA is not possible, with a read operation ongoing',
  'error.signalset.bad_sr': 'SR signals selected are not compatible',
  'error.signalset.signal_present': 'Duplicate signal selection',

  'error.keyboard.buffer-full': 'Keyboard buffer is full',
  'error.keyboard.out-of-bounds': 'Address memory is out of bounds',
  'error.keyboard.write-only-ec': 'In the keyboard you can only write on state registry, position 1',

  'error.lights.out-of-bounds': 'There is only one accesible position',
  'error._jscerror.bad_property': 'Not valid property',
  'error._jscerror.bad_attribute': 'Not valid attribute',

  'error.instructions.length_16': 'Only 0 and 1 characters are allowed and the instruction must be 16bit long',
  'error.instructions.badinstruction': 'Instruction {0} can\'t be located',
  'error.instructions.duplicated': 'Multiple coincidences have been found, please check the opcodes',
  'error.instructions.structure': 'Instruction has a bad structure',

  'error.forms.hex16': 'Value must be hexadecimal and 16 bit long',

  'errors.deviceform.input_device': 'Base address is required, in case of Interruption generation, Interruption vector and priority are required',
  'errors.deviceform.output_device': 'Base addres is required'
}

en[GlobalConst.implement_this] = 'This method must be implemented in the child class'

export { en }
