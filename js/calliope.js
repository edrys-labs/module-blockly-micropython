/**
 * The Calliope mini 3 toolbox for BlockMirror: categories, block labels and
 * colours for the calliopemini API, and the imports the blocks need.
 *
 * Toolbox blocks are written as Python; BlockMirror parses each snippet into
 * blocks. "___" is an empty slot. Labels, colours and whether a call is an
 * expression come from the signature tables: a call like display.scroll(...)
 * uses MODULE_FUNCTION_SIGNATURES.display.scroll, temperature() uses
 * FUNCTION_SIGNATURES.temperature. Calls without an entry still work, as a
 * generic call block.
 *
 * Every name here was checked against the firmware of the Calliope mini 3
 * simulator (module-micropython-simulator); see README.md.
 *
 * Loaded after block_mirror.js and before the editor is created.
 */
;(function () {
  const TTB = BlockMirrorTextToBlocks
  const IMPORT = 'from calliopemini import *'

  // Category colours (Blockly hue 0-360), next to BlockMirror's own
  Object.assign(TTB.COLOR, {
    CALLIOPE_BASIC: 200,
    CALLIOPE_DISPLAY: 230,
    CALLIOPE_INPUT: 290,
    CALLIOPE_SENSORS: 160,
    CALLIOPE_PINS: 0,
    CALLIOPE_RGB: 330,
    CALLIOPE_MUSIC: 260,
  })
  const C = TTB.COLOR

  function sig(colour, message, returns) {
    return { colour, message, returns }
  }

  // calliopemini objects: module name as written in the code -> methods
  const MODULES = {
    display: {
      scroll: sig(C.CALLIOPE_DISPLAY, 'scroll text', false),
      show: sig(C.CALLIOPE_DISPLAY, 'show', false),
      clear: sig(C.CALLIOPE_DISPLAY, 'clear display', false),
      set_pixel: sig(C.CALLIOPE_DISPLAY, 'set LED', false),
      get_pixel: sig(C.CALLIOPE_DISPLAY, 'LED brightness', true),
      read_light_level: sig(C.CALLIOPE_SENSORS, 'light level', true),
    },
    button_a: {
      is_pressed: sig(C.CALLIOPE_INPUT, 'button A is pressed', true),
      was_pressed: sig(C.CALLIOPE_INPUT, 'button A was pressed', true),
      get_presses: sig(C.CALLIOPE_INPUT, 'button A presses', true),
    },
    button_b: {
      is_pressed: sig(C.CALLIOPE_INPUT, 'button B is pressed', true),
      was_pressed: sig(C.CALLIOPE_INPUT, 'button B was pressed', true),
      get_presses: sig(C.CALLIOPE_INPUT, 'button B presses', true),
    },
    accelerometer: {
      get_x: sig(C.CALLIOPE_SENSORS, 'acceleration x', true),
      get_y: sig(C.CALLIOPE_SENSORS, 'acceleration y', true),
      get_z: sig(C.CALLIOPE_SENSORS, 'acceleration z', true),
      current_gesture: sig(C.CALLIOPE_SENSORS, 'current gesture', true),
      was_gesture: sig(C.CALLIOPE_SENSORS, 'was gesture', true),
    },
    compass: {
      heading: sig(C.CALLIOPE_SENSORS, 'compass heading', true),
      calibrate: sig(C.CALLIOPE_SENSORS, 'calibrate compass', false),
    },
    microphone: {
      sound_level: sig(C.CALLIOPE_SENSORS, 'sound level', true),
    },
    music: {
      play: sig(C.CALLIOPE_MUSIC, 'play melody', false),
      pitch: sig(C.CALLIOPE_MUSIC, 'play tone', false),
      stop: sig(C.CALLIOPE_MUSIC, 'stop music', false),
      set_tempo: sig(C.CALLIOPE_MUSIC, 'set tempo', false),
    },
    neopixel: {
      NeoPixel: sig(C.CALLIOPE_RGB, 'RGB LEDs on', true),
    },
    random: {
      randint: sig(C.MATH, 'random number', true),
    },
  }

  // Pins the blocks offer: the Calliope mini 3 edge connector pins
  const PINS = ['pin0', 'pin1', 'pin2', 'pin3']
  for (const pin of PINS) {
    MODULES[pin] = {
      read_digital: sig(C.CALLIOPE_PINS, 'read digital ' + pin, true),
      write_digital: sig(C.CALLIOPE_PINS, 'write digital ' + pin, false),
      read_analog: sig(C.CALLIOPE_PINS, 'read analog ' + pin, true),
      write_analog: sig(C.CALLIOPE_PINS, 'write analog ' + pin, false),
    }
  }

  // Imports a block adds to the program when dragged in. BlockMirror's
  // generator looks every module up here and fails on a missing one.
  const IMPORTS = { music: 'import music', neopixel: 'import neopixel', random: 'import random' }
  for (const name of Object.keys(MODULES)) {
    TTB.prototype.MODULE_FUNCTION_SIGNATURES[name] = MODULES[name]
    TTB.prototype.MODULE_FUNCTION_IMPORTS[name] = IMPORTS[name] || IMPORT
  }

  Object.assign(TTB.prototype.FUNCTION_SIGNATURES, {
    sleep: sig(C.CALLIOPE_BASIC, 'pause (ms)', false),
    temperature: sig(C.CALLIOPE_SENSORS, 'temperature', true),
    running_time: sig(C.CALLIOPE_BASIC, 'running time (ms)', true),
    // BlockMirror's own Image entry tries its image-upload block first and
    // logs an error each time it falls back to a call block
    Image: sig(C.CALLIOPE_DISPLAY, 'Image', true),
  })

  // Category definitions in BlockMirror's format
  const CALLIOPE_TOOLBOX = [
    {
      name: 'Basic',
      colour: 'CALLIOPE_BASIC',
      blocks: [
        'from calliopemini import *',
        'while True:\n    pass',
        'sleep(1000)',
        'print(___)',
        'running_time()',
      ],
    },
    {
      name: 'Display',
      colour: 'CALLIOPE_DISPLAY',
      blocks: [
        "display.scroll('Hello')",
        'display.show(Image.HEART)',
        'display.show(___)',
        'display.clear()',
        'display.set_pixel(2, 2, 9)',
        'display.get_pixel(2, 2)',
        'Image.HAPPY',
        "Image('09090:99999:99999:09990:00900')",
      ],
    },
    {
      name: 'Input',
      colour: 'CALLIOPE_INPUT',
      blocks: [
        'button_a.is_pressed()',
        'button_b.is_pressed()',
        'button_a.was_pressed()',
        'button_b.was_pressed()',
        'button_a.get_presses()',
      ],
    },
    {
      name: 'Sensors',
      colour: 'CALLIOPE_SENSORS',
      blocks: [
        'temperature()',
        'display.read_light_level()',
        'microphone.sound_level()',
        'accelerometer.get_x()',
        'accelerometer.get_y()',
        'accelerometer.get_z()',
        "accelerometer.was_gesture('shake')",
        'accelerometer.current_gesture()',
        'compass.heading()',
      ],
    },
    {
      name: 'Pins',
      colour: 'CALLIOPE_PINS',
      blocks: [
        'pin0.read_digital()',
        'pin0.write_digital(1)',
        'pin1.read_analog()',
        'pin1.write_analog(512)',
      ],
    },
    {
      name: 'RGB LEDs',
      colour: 'CALLIOPE_RGB',
      blocks: [
        'rgb = neopixel.NeoPixel(pin_RGB, 3)',
        'rgb[0] = (255, 0, 0)',
        'rgb.show()',
        'rgb.clear()',
      ],
    },
    {
      name: 'Music',
      colour: 'CALLIOPE_MUSIC',
      blocks: [
        'music.play(music.BA_DING)',
        'music.pitch(440, 500)',
        'music.stop()',
      ],
    },
    '<sep></sep>',
    TOOLBOX_CATEGORY.VARIABLES,
    {
      name: 'Logic',
      colour: 'LOGIC',
      blocks: [
        'if ___: pass',
        'if ___: pass\nelse: pass',
        '___ == ___',
        '___ < ___',
        '___ and ___',
        'not ___',
        'True',
      ],
    },
    {
      name: 'Loops',
      colour: 'CONTROL',
      blocks: ['for ___ in range(0, 10): pass', 'while ___: pass', 'break'],
    },
    {
      name: 'Math',
      colour: 'MATH',
      blocks: ['0', '___ + ___', 'round(___)', 'abs(___)', 'random.randint(0, 10)'],
    },
    {
      name: 'Text',
      colour: 'TEXT',
      blocks: ["''", 'str(___)', 'int(___)'],
    },
    {
      name: 'Lists',
      colour: 'LIST',
      blocks: ['[___, ___, ___]', '[]', '___.append(___)', 'len(___)'],
    },
    {
      name: 'Functions',
      colour: 'FUNCTIONS',
      blocks: ['def ___(___): pass', 'return ___'],
    },
  ]

  BlockMirrorBlockEditor.prototype.TOOLBOXES.calliope = CALLIOPE_TOOLBOX

  // BlockMirror adds an import only for module calls (display.show(...)).
  // These plain calls and Image.HEART come from calliopemini too, and
  // NeoPixel needs its pin_RGB: add the calliopemini import for them as well.
  const CALLIOPE_FUNCTIONS = new Set(['sleep', 'temperature', 'running_time', 'Image'])
  const forBlock = python.pythonGenerator.forBlock
  const needsCalliope = () => (python.pythonGenerator.definitions_.import_calliopemini = IMPORT)

  const generateCall = forBlock.ast_Call
  forBlock.ast_Call = function (block, generator) {
    const plain = !block.module_ && !block.isMethod_ && CALLIOPE_FUNCTIONS.has(block.name_)
    if (plain || block.module_ === 'neopixel') needsCalliope()
    return generateCall.call(this, block, generator)
  }

  const generateAttribute = forBlock.ast_Attribute
  forBlock.ast_Attribute = function (block, generator) {
    const result = generateAttribute.call(this, block, generator)
    if (result[0].startsWith('Image.')) needsCalliope()
    return result
  }

  // BlockMirror adds an import for every block that needs one, once per
  // module name, and also keeps the import blocks of the program: without
  // this, "from calliopemini import *" appears once per object used and
  // again from the program's own import block. Keep each import once, and
  // only when the program does not already contain it.
  const finish = python.pythonGenerator.finish
  python.pythonGenerator.finish = function (code) {
    const present = new Set(code.split('\n').map((line) => line.trim()))
    const wanted = new Set()
    for (const key of Object.keys(this.definitions_)) {
      const def = this.definitions_[key]
      if (typeof def !== 'string' || present.has(def.trim()) || wanted.has(def)) {
        delete this.definitions_[key]
      } else {
        wanted.add(def)
      }
    }
    const out = finish.call(this, code)
    // finish puts blank lines before the code even without imports
    return wanted.size ? out : out.replace(/^\n+/, '')
  }
})()
