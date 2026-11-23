/**
 * BBC micro:bit (V2): the microbit API. It is the one the Calliope mini's
 * calliopemini follows, so this board reuses js/boards/calliope.js (loaded
 * before) with the microbit import and an external NeoPixel strip on pin0
 * instead of the Calliope's built-in RGB LEDs.
 *
 * Checked on the micro:bit V2 simulator of module-micropython-simulator.
 */
;(function () {
  const { define, get } = BlocklyMicroPythonBoards
  const calliope = get('calliope')
  const IMPORT = 'from microbit import *'

  const toolbox = calliope.toolbox.map((category) => ({
    ...category,
    name: category.name === 'RGB LEDs' ? 'NeoPixel' : category.name,
    blocks: category.blocks.map((block) =>
      block.replace('from calliopemini import *', IMPORT).replace('NeoPixel(pin_RGB, 3)', 'NeoPixel(pin0, 8)')
    ),
  }))

  define('microbit', { ...calliope, import: IMPORT, toolbox })
})()
