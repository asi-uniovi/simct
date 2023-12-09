/**
 * @fileoverview Translation file for Spanish.
 */
const GlobalConst = {
  implement_this: 'error.global.implement_this'
}

const es = {

  // Memory
  'labels.memory.IOlabel': 'ESES',
  'labels.memory.empty': 'XXXX',

  'labels.memcfg.header_left': '<p><strong>Configuración actual </strong><br /><span style="font-size: 10px;">(para eliminar un módulo click derecho)</span></p>',
  'labels.memcfg.header_right': '<p><strong>Módulos disponibles </strong><br /><span style="font-size: 10px;">(para colocar arrastrar y soltar en un posición válida)</span></p>',

  'labels.memedit.hex_addr': 'Dirección (hex)',
  'labels.memedit.addr': 'Dirección',
  'labels.memedit.go': 'Ir',
  'labels.memedit.load': 'Cargar',
  'labels.memedit.value': 'Valor',

  // Menu
  'labels.menu.menu_file': 'Archivo',
  'labels.menu.menu_file_open': 'Abrir ejecutable...',
  'labels.menu.system_config': 'Configuración',
  'labels.menu.change_theme': 'Cambiar tema',
  'labels.menu.menu_file_opensim': 'Abrir simulación...',
  'labels.menu.menu_file_savesim': 'Guardar simulación...',
  'labels.menu.menu_offline_version': 'Descargar versión offline',
  'labels.menu.menu_running': 'Ejecución',
  'labels.menu.menu_running_cycle': '[F7] Ciclo de reloj',
  'labels.menu.menu_running_instruction': '[F8] Instrucción completa',
  'labels.menu.menu_running_run': '[F9] Ejecutar',
  'labels.menu.menu_running_stop': '[F9] Detener',
  'labels.menu.menu_running_signalselect': '[F6] Seleccionar señales',
  'labels.menu.menu_running_mode_normal': '[F5] Cambiar modo',
  'labels.menu.menu_running_mode_manual': '[F5] Cambiar modo',
  'labels.menu.menu_running_reset': '[Ctrl+F10] Reiniciar',
  'labels.menu.menu_utils': 'Utilidades',
  'labels.menu.menu_utils_mem': 'Memoria',
  'labels.menu.menu_utils_mem_config': 'Configurar',
  'labels.menu.menu_utils_mem_edit': 'Editar',
  'labels.menu.menu_utils_io': 'E/S',
  'labels.menu.menu_utils_io_keyboard': 'Conectar Teclado',
  'labels.menu.menu_utils_io_screen': 'Conectar Pantalla',
  'labels.menu.menu_utils_io_lights': 'Conectar Luces',
  'labels.menu.menu_mode_label': 'MODO',
  'labels.menu.menu_lang_confirm': 'Si usted cambia de idioma en este momento perderá su trabajo. Puede guardar la simulación si así lo desea y volver a cargarla en el nuevo idioma',

  // Language Menu
  'labels.simulator.language_es': 'ES',
  'labels.simulator.language_en': 'EN',

  // Context menu memconfig
  'labels.memcfg.delete_module': 'Eliminar módulo',

  // Context menu I/O management
  'labels.ctio.connect_keyboard': 'Conectar Teclado',
  'labels.ctio.connect_screen': 'Conectar Pantalla',
  'labels.ctio.connect_lights': 'Conectar Luces',
  'labels.ctio.controllabel': 'E/S',

  // Context menu Memory management
  'labels.ctmemory.config': 'Configurar',
  'labels.ctmemory.editor': 'Editar',
  'labels.ctmemory.controllabel': 'MEMORIA',

  // Uc
  'labels.ctuc.controllabel': 'UC',
  'labels.ctuc.steplabel': 'PASO',

  // Buses
  'labels.bussdb.data_bus': 'Bus de datos (SDB)',
  'labels.bussab.address_bus': 'Bus de direcciones (SAB)',
  'labels.busscb.control_bus': 'Bus de control (SCB)',

  // Simulator
  'labels.simulator.internal_bus': 'Bus interno (IB)',

  // Register value
  'labels.registervalue.bin': 'BIN: ',
  'labels.registervalue.dec': 'DEC: ',
  'labels.registervalue.dec_c2': 'DEC_C2: ',

  // View windows
  'labels.view.window_title_memedit': 'Editor de memoria',
  'labels.view.window_title_memcfg': 'Configurar memoria',
  'labels.view.window_title_keyboard_data': 'Datos Teclado',
  'labels.view.window_title_screen_data': 'Datos Pantalla',
  'labels.view.window_title_lights_data': 'Datos Luces',
  'labels.view.window_title_savesim': 'Guardar simulación',
  'labels.view.window_title_savesim_label': 'Nombre del archivo: ',
  'labels.view.window_title_savesim_button': 'Guardar',

  // Device data forms
  'labels.deviceform.form_name': 'Nombre',
  'labels.deviceform.form_address': 'Dir. base:',
  'labels.deviceform.form_vector': 'Num. interrupción (0-255):',
  'labels.deviceform.form_priority': 'Prioridad. (0-255)',
  'labels.deviceform.form_int': 'Genera int.',

  // Keyboard
  'labels.ctkeyboard.buffer': 'BUFFER',
  'labels.ctkeyboard.buffer_hex': 'HEX',
  'labels.ctkeyboard.buffer_char': 'CAR',
  'labels.ctkeyboard.caps': 'Bloq. May.',
  'labels.ctkeyboard.address': 'Dir.',
  'labels.ctkeyboard.vector': 'Num. int.',
  'labels.ctkeyboard.priority': 'Prio.',
  'labels.ctkeyboard.int': 'Int.',
  'labels.ctkeyboard.state': 'Estado',
  'errors.ctkeyboard.keyboard_must': 'Es necesario crear el teclado previamente',

  // Lights device
  'labels.ctlights.address': 'Dir.',
  'labels.ctlights.vector': 'Vec.',
  'labels.ctlights.priority': 'Prio.',
  'labels.ctlights.int': 'Int.',
  'labels.ctlights.genint': 'Gen. Int.',
  'labels.ctlights.group_lights': 'Luces/salida',
  'labels.ctlights.group_switches': 'Interruptores/entrada',

  // Screen device
  'labels.ctscreen.address': 'Dir.',
  'labels.ctscreen.onoff': '',

  // Windows
  'labels.window.close': 'Cerrar',

  // Signal selector
  'label.signalset.signal_selection_btok': 'Enviar a UC',
  'label.signalset.signal_selection_deactivate': 'Desactivar todas',
  'label.signalset.signal_selection': 'Selección de señales',

  // System configuration
  'label.sysconf.btok': 'Guardar',
  'label.sysconf.window_title': 'Configuración',
  'labels.sysconf.language': 'Idioma: ',

  // Confirms
  'confirm.devices.remove_device': '¿Está seguro de que desea eliminar el dispositivo: {0}?',

  // Errors
  'error.computer.loading_program': 'No se ha cargado ningún programa',
  'error.computer.loading_memory': 'No se ha cargado el archivo de memoria',
  'error.computer.loading_signals_nomanual': 'El selector de señales solo es posible ejecutarlo en modo manual',

  'error.IOManager.memorylink_missing': 'No se ha enlazado el gestor de memoria en el Gestor de I/O',
  'error.IOManager.io_vectors': 'Las 256 primeras posiciones de memoria se reservan para los vectores de interrupción',
  'error.IOManager.duplicate_name': 'Ya existe un dispositivo con el mismo nombre',

  'error.memory.address_space': 'El módulo de memoria se sale del espacio de direcciones',
  'error.memory.module_size': 'Un módulo solo puede colocarse a partir de posición de memoria que sea múltiplo de su tamaño',
  'error.memory.module_notvalid': 'El tamaño del módulo propuesto es incrorecto',
  'error.memory.module_collision': 'Existe otro módulo en la posición de memoria propuesta',
  'error.memory.module_nomodule': 'No existe módulo de memoria en la dirección propuesta',
  'error.memory.io_module_present': 'Hay un dispositivo i/o en la posición propuesta',
  'error.memory.nomodule_noes': 'No existe moódulo de memoria ni dispositivo mapeado en la dirección propuesta',

  'error.memory.notsupported': 'El modo indicado no está soportado por el módulo de memoria',

  'error.signalset.multiple_download': 'No es posible activar mas de una señal de descarga a la vez',
  'error.signalset.same_group': ' Las señales seleccionadas del grupo {0} no son compatibles',
  'error.signalset.read_ongoing': 'Existe una operación de lectura en curso y la selección de señales no es posible',
  'error.signalset.write_ongoing': 'Existe una operación de escritura en curso y la selección de señales no es posible',
  'error.signalset.badsignal': 'Señal no válida',
  'error.signalset.multiple_upload_group': 'Incompatibilidad de señales de subida',
  'error.signalset.inta_read': 'No es posible seleccionar INTA con operación de lectura en curso',
  'error.signalset.bad_sr': 'Señales SR no compatibles',
  'error.signalset.signal_present': 'Señal duplicada',

  'error.keyboard.buffer-full': 'El buffer del teclado está lleno',
  'error.keyboard.out-of-bounds': 'La dirección de memoria está fuera de rango',
  'error.keyboard.write-only-ec': 'Solo es posible escribir en el registro de estado, posición 1',

  'error.lights.out-of-bounds': 'El dispositivo de luces solo tiene una posición accesible',
  'error._jscerror.bad_property': 'Propiedad no válida',
  'error._jscerror.bad_attribute': 'Atributo no válido',

  'error.instructions.length_16': 'La instruccion ha de tener longitud 16 se admiten únicamente los caracteres 0 y 1',
  'error.instructions.badinstruction': 'No se ha localizado la instrucción {0}',
  'error.instructions.duplicated': 'Se han encontrado varias coincidencias, revise el código de las instrucciones porque no es una situación posible',
  'error.instructions.structure': 'La instrucción no tiene una estructura válida',

  'error.forms.hex16': 'El valor ha de ser un número hexadecimal de 16 bits',

  'errors.deviceform.input_device': 'Para un dispositivo de entrada es obligatoria la dirección base y, en caso de usar interrupciones, el número de interrupción y su prioridad también lo son',
  'errors.deviceform.output_device': 'Para un dispositivo de salida es obligatoria la dirección base'

}

es[GlobalConst.implement_this] = 'Es necesario implemenar este método en la clase hija'

export { es }
