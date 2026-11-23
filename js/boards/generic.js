/**
 * Any MicroPython board (Raspberry Pi Pico, ESP32, …): the general Python
 * categories, plus time and machine.Pin from MicroPython's standard modules.
 * No board import; pin numbers depend on the board.
 */
;(function () {
  const { sig, colour: C, define } = BlocklyMicroPythonBoards

  define('generic', {
    modules: {
      time: {
        sleep: sig(C.BOARD_BASIC, 'pause (s)', false),
        sleep_ms: sig(C.BOARD_BASIC, 'pause (ms)', false),
        ticks_ms: sig(C.BOARD_BASIC, 'time (ms)', true),
      },
      machine: {
        Pin: sig(C.BOARD_PINS, 'pin', true),
      },
    },
    imports: { time: 'import time', machine: 'import machine' },
    toolbox: [
      {
        name: 'Basic',
        colour: 'BOARD_BASIC',
        blocks: ['while True:\n    pass', 'time.sleep(1)', 'time.sleep_ms(500)', 'print(___)', 'time.ticks_ms()'],
      },
      {
        name: 'Pins',
        colour: 'BOARD_PINS',
        blocks: [
          'led = machine.Pin(2, machine.Pin.OUT)',
          'button = machine.Pin(0, machine.Pin.IN)',
          'led.value(1)',
          'button.value()',
        ],
      },
    ],
  })
})()
