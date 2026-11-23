/**
 * What every board shares, and the board selection. A board file in this
 * folder only declares data with BlocklyMicroPythonBoards.define(name, def):
 *
 *   import     the line the board's own names need, e.g. 'from calliopemini import *'
 *              (null: none)
 *   modules    objects as written in the code -> their methods' signatures:
 *              { display: { scroll: sig(colour, label, returnsValue) } }
 *   imports    modules with their own import line, e.g. { music: 'import music' };
 *              the other modules get `import`
 *   functions  plain functions that come with `import`: { sleep: sig(…) }
 *   importModules  modules whose calls also need `import` (e.g. neopixel, for the
 *              board's pins)
 *   toolbox    the board's categories in BlockMirror's format: blocks written as
 *              Python, "___" is an empty slot; the general Python categories
 *              follow for every board
 *
 * BlockMirror keeps signatures and imports in global tables keyed by module
 * name, so only the selected board is written into them: apply(name), once,
 * before the editor is created.
 *
 * Loaded after block_mirror.js, before the board files.
 */
;(function () {
  const TTB = BlockMirrorTextToBlocks

  // Category colours of the board blocks (Blockly hue 0-360), next to BlockMirror's own
  Object.assign(TTB.COLOR, {
    BOARD_BASIC: 200,
    BOARD_DISPLAY: 230,
    BOARD_INPUT: 290,
    BOARD_SENSORS: 160,
    BOARD_PINS: 0,
    BOARD_RGB: 330,
    BOARD_MUSIC: 260,
  })
  const C = TTB.COLOR

  /** A call's block: its colour, its label, and whether it returns a value (an expression block). */
  function sig(colour, message, returns) {
    return { colour, message, returns }
  }

  // The general Python categories, after the board's own
  const GENERAL_TOOLBOX = [
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
  // for random.randint of the Math category
  const GENERAL_MODULES = { random: { randint: sig(C.MATH, 'random number', true) } }
  const GENERAL_IMPORTS = { random: 'import random' }

  const boards = {}
  // the selected board's definition
  let board = null

  function define(name, def) {
    boards[name] = { import: null, modules: {}, imports: {}, functions: {}, importModules: [], ...def }
  }

  /** Write board `name` into BlockMirror's tables; its toolbox is then TOOLBOXES[name]. */
  function apply(name) {
    board = boards[name]
    const modules = { ...board.modules, ...GENERAL_MODULES }
    const imports = { ...board.imports, ...GENERAL_IMPORTS }
    for (const module of Object.keys(modules)) {
      TTB.prototype.MODULE_FUNCTION_SIGNATURES[module] = modules[module]
      // without an import (a board without `import`): left out by finish below
      TTB.prototype.MODULE_FUNCTION_IMPORTS[module] = imports[module] || board.import
    }
    Object.assign(TTB.prototype.FUNCTION_SIGNATURES, board.functions)
    BlockMirrorBlockEditor.prototype.TOOLBOXES[name] = board.toolbox.concat(GENERAL_TOOLBOX)
  }

  // ---------------------------------------------------------------- imports

  const generator = python.pythonGenerator
  const needsBoardImport = () => {
    if (board?.import) generator.definitions_.import_board = board.import
  }
  const isBoardFunction = (name) => !!board && Object.hasOwn(board.functions, name)

  // BlockMirror adds an import only for module calls (display.show(...)).
  // The board's plain functions (sleep(...)), their attributes (Image.HEART)
  // and the calls of importModules need the board's import as well.
  const generateCall = generator.forBlock.ast_Call
  generator.forBlock.ast_Call = function (block, gen) {
    const plain = !block.module_ && !block.isMethod_ && isBoardFunction(block.name_)
    if (plain || board?.importModules.includes(block.module_)) needsBoardImport()
    return generateCall.call(this, block, gen)
  }

  const generateAttribute = generator.forBlock.ast_Attribute
  generator.forBlock.ast_Attribute = function (block, gen) {
    const result = generateAttribute.call(this, block, gen)
    if (isBoardFunction(result[0].split('.')[0])) needsBoardImport()
    return result
  }

  // BlockMirror adds an import for every block that needs one, once per
  // module name, and also keeps the import blocks of the program: without
  // this, "from calliopemini import *" appears once per object used and
  // again from the program's own import block. Keep each import once, and
  // only when the program does not already contain it.
  const finish = generator.finish
  generator.finish = function (code) {
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

  window.BlocklyMicroPythonBoards = {
    sig,
    colour: C,
    define,
    apply,
    get: (name) => boards[name],
    names: () => Object.keys(boards),
  }
})()
