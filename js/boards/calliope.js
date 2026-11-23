/**
 * Calliope mini (the default board): the calliopemini API as blocks. See
 * common.js for the fields; js/boards/microbit.js builds on this one.
 *
 * Every name here was checked against the firmware of the Calliope
 * simulator (module-micropython-simulator); see README.md.
 */
;(function () {
  const { sig, colour: C, define } = BlocklyMicroPythonBoards

  // calliopemini objects: name as written in the code -> methods
  const modules = {
    display: {
      scroll: sig(C.BOARD_DISPLAY, 'scroll text', false),
      show: sig(C.BOARD_DISPLAY, 'show', false),
      clear: sig(C.BOARD_DISPLAY, 'clear display', false),
      set_pixel: sig(C.BOARD_DISPLAY, 'set LED', false),
      get_pixel: sig(C.BOARD_DISPLAY, 'LED brightness', true),
      read_light_level: sig(C.BOARD_SENSORS, 'light level', true),
    },
    accelerometer: {
      get_x: sig(C.BOARD_SENSORS, 'acceleration x', true),
      get_y: sig(C.BOARD_SENSORS, 'acceleration y', true),
      get_z: sig(C.BOARD_SENSORS, 'acceleration z', true),
      current_gesture: sig(C.BOARD_SENSORS, 'current gesture', true),
      was_gesture: sig(C.BOARD_SENSORS, 'was gesture', true),
    },
    compass: {
      heading: sig(C.BOARD_SENSORS, 'compass heading', true),
      calibrate: sig(C.BOARD_SENSORS, 'calibrate compass', false),
    },
    microphone: {
      sound_level: sig(C.BOARD_SENSORS, 'sound level', true),
    },
    music: {
      play: sig(C.BOARD_MUSIC, 'play melody', false),
      pitch: sig(C.BOARD_MUSIC, 'play tone', false),
      stop: sig(C.BOARD_MUSIC, 'stop music', false),
      set_tempo: sig(C.BOARD_MUSIC, 'set tempo', false),
    },
    neopixel: {
      NeoPixel: sig(C.BOARD_RGB, 'RGB LEDs on', true),
    },
  }
  for (const button of ['a', 'b']) {
    const label = 'button ' + button.toUpperCase()
    modules['button_' + button] = {
      is_pressed: sig(C.BOARD_INPUT, label + ' is pressed', true),
      was_pressed: sig(C.BOARD_INPUT, label + ' was pressed', true),
      get_presses: sig(C.BOARD_INPUT, label + ' presses', true),
    }
  }
  // the edge connector pins
  for (const pin of ['pin0', 'pin1', 'pin2', 'pin3']) {
    modules[pin] = {
      read_digital: sig(C.BOARD_PINS, 'read digital ' + pin, true),
      write_digital: sig(C.BOARD_PINS, 'write digital ' + pin, false),
      read_analog: sig(C.BOARD_PINS, 'read analog ' + pin, true),
      write_analog: sig(C.BOARD_PINS, 'write analog ' + pin, false),
    }
  }

  const functions = {
    sleep: sig(C.BOARD_BASIC, 'pause (ms)', false),
    temperature: sig(C.BOARD_SENSORS, 'temperature', true),
    running_time: sig(C.BOARD_BASIC, 'running time (ms)', true),
    // BlockMirror's own Image entry tries its image-upload block first and
    // logs an error each time it falls back to a call block
    Image: sig(C.BOARD_DISPLAY, 'Image', true),
  }

  const toolbox = [
    {
      name: 'Basic',
      colour: 'BOARD_BASIC',
      blocks: ['from calliopemini import *', 'while True:\n    pass', 'sleep(1000)', 'print(___)', 'running_time()'],
    },
    {
      name: 'Display',
      colour: 'BOARD_DISPLAY',
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
      colour: 'BOARD_INPUT',
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
      colour: 'BOARD_SENSORS',
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
      colour: 'BOARD_PINS',
      blocks: ['pin0.read_digital()', 'pin0.write_digital(1)', 'pin1.read_analog()', 'pin1.write_analog(512)'],
    },
    {
      name: 'RGB LEDs',
      colour: 'BOARD_RGB',
      blocks: ['rgb = neopixel.NeoPixel(pin_RGB, 3)', 'rgb[0] = (255, 0, 0)', 'rgb.show()', 'rgb.clear()'],
    },
    {
      name: 'Music',
      colour: 'BOARD_MUSIC',
      blocks: ['music.play(music.BA_DING)', 'music.pitch(440, 500)', 'music.stop()'],
    },
  ]

  define('calliope', {
    import: 'from calliopemini import *',
    modules,
    imports: { music: 'import music', neopixel: 'import neopixel' },
    functions,
    // NeoPixel(pin_RGB, …): the pin comes from calliopemini
    importModules: ['neopixel'],
    toolbox,
  })
})()
