/**
 * The block/text editor: BlockMirror with the Calliope toolbox, filling the
 * module, in the classroom's light or dark theme, with the view buttons in
 * the top bar. js/edrys.js uses window.BlocklyMicroPython for the program.
 */
;(function () {
  const container = document.getElementById('editor')
  const main = document.querySelector('main')

  // ---------------------------------------------------------------- errors

  function showError(message) {
    const item = document.createElement('div')
    item.textContent = message
    const box = document.getElementById('errors')
    box.appendChild(item)
    box.hidden = false
    window.dispatchEvent(new Event('blockly-micropython-error'))
  }

  // ---------------------------------------------------------------- editor

  let editor
  try {
    editor = new BlockMirror({
      container,
      blocklyMediaPath: 'vendor/blockly/media/',
      toolbox: 'calliope',
      viewMode: 'split',
      height: Math.max(main.clientHeight, 200),
      // rebuild the blocks 300 ms after the last key in the text view
      blockDelay: 300,
    })
  } catch (e) {
    console.error(e)
    document.getElementById('loading').textContent = ''
    showError('The block editor could not start: ' + (e.message || e))
    window.BlocklyMicroPython = null
    return
  }
  document.getElementById('loading').remove()

  const codeMirror = editor.textEditor.codeMirror
  const workspace = editor.blockEditor.workspace

  // ---------------------------------------------------------------- layout

  // BlockMirror sizes its views in pixels from configuration.height and lays
  // them out again in setMode; below 675 px it stacks the split view.
  function layout() {
    const height = Math.max(main.clientHeight, 200)
    editor.configuration.height = height
    editor.setMode(editor.getMode())
    editor.refresh()
  }
  new ResizeObserver(() => layout()).observe(main)

  // ---------------------------------------------------------------- views

  const modeButtons = document.querySelectorAll('.modes button')
  function setMode(mode) {
    if (!['split', 'block', 'text'].includes(mode)) mode = 'split'
    editor.setMode(mode)
    for (const button of modeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode))
    }
    layout()
  }
  for (const button of modeButtons) {
    button.addEventListener('click', () => setMode(button.dataset.mode))
  }

  // ---------------------------------------------------------------- theme

  // The workspace, toolbox and flyout in the classroom's colours; the block
  // colours stay the categories'. CodeMirror follows by itself through the
  // .cm-s-edrys rules in css/style.css.
  function applyTheme() {
    const css = getComputedStyle(document.documentElement)
    const color = (name) => css.getPropertyValue(name).trim()
    const theme = Blockly.Theme.defineTheme('edrys', {
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: color('--edrys-bg'),
        toolboxBackgroundColour: color('--edrys-footer'),
        toolboxForegroundColour: color('--edrys-text'),
        flyoutBackgroundColour: color('--edrys-footer'),
        flyoutForegroundColour: color('--edrys-text'),
        flyoutOpacity: 0.95,
        scrollbarColour: color('--edrys-scrollbar') || color('--edrys-muted'),
        scrollbarOpacity: 0.6,
        insertionMarkerColour: color('--edrys-heading'),
      },
      fontStyle: { family: color('--edrys-font') || undefined, size: 11 },
    })
    workspace.setTheme(theme)
  }
  codeMirror.setOption('theme', 'edrys')
  applyTheme()
  Edrys.onTheme?.(applyTheme)
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!document.documentElement.dataset.theme) applyTheme()
  })

  // ---------------------------------------------------------------- program

  // Changes the editor makes while applying a program from outside (the
  // room, the start program) are not the user's edits.
  let applying = false
  const listeners = []

  editor.addChangeListener(() => {
    if (applying) return
    const code = editor.getCode()
    for (const fn of listeners) fn(code)
  })

  /**
   * BlockMirror takes text edits over blockDelay ms after the last key; until
   * then editor.getCode() still has the previous program. Take a pending edit
   * over now, so the run button and the saves send what the user sees. (An
   * empty program is "\n" in CodeMirror and "" in BlockMirror.)
   */
  const same = (a, b) => a === b || (!a.trim() && !b.trim())
  const shownText = () => (editor.getMode() === 'block' ? editor.getCode() : codeMirror.getValue())

  function flush() {
    const text = shownText()
    if (same(text, editor.getCode())) return
    window.clearTimeout(editor.textEditor.updateTimer_)
    editor.blockEditor.setCode(text, true)
    editor.setCode(text, true)
  }

  function getCode() {
    flush()
    return editor.getCode()
  }

  // A program from outside that arrives while a block is dragged waits for
  // the drop: rebuilding the workspace under a drag breaks it.
  let pending = null
  workspace.addChangeListener((event) => {
    if (pending === null || event.type !== Blockly.Events.BLOCK_DRAG || event.isStart) return
    // after the drop's own events, which Blockly fires in the same batch
    window.setTimeout(() => pending !== null && setCode(pending))
  })

  /**
   * Show code without reporting it as an edit. A text edit not yet taken
   * over is dropped. The text cursor stays where it was, so a change from
   * another peer does not throw the user's cursor to the start while they type.
   */
  function setCode(code) {
    if (workspace.isDragging()) {
      pending = code
      return
    }
    pending = null
    if (code === editor.getCode() && same(shownText(), code)) return
    window.clearTimeout(editor.textEditor.updateTimer_)
    const focused = codeMirror.hasFocus()
    const cursor = codeMirror.getCursor()
    const scroll = codeMirror.getScrollInfo()
    applying = true
    try {
      editor.setCode(code)
    } finally {
      applying = false
    }
    if (focused) {
      codeMirror.setCursor(cursor)
      codeMirror.scrollTo(scroll.left, scroll.top)
    }
  }

  window.BlocklyMicroPython = {
    getCode,
    setCode,
    setMode,
    onChange: (fn) => listeners.push(fn),
    showError,
    editor,
  }
})()
