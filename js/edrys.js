/**
 * The Edrys layer: the room's shared program (with config.synchronize) or
 * each peer's own copy, the status pill, the run button and Reset.
 * Loaded after js/editor.js.
 */
;(function () {
  const BM = window.BlocklyMicroPython

  // The run button sends the Python code with this subject, unless
  // config.runCommand names another.
  const DEFAULT_RUN_SUBJECT = 'execute'

  // Room state keys: the shared program and the config.code it started from
  const STATE_CODE = 'blocklyMicroPython.code'
  const STATE_SEED = 'blocklyMicroPython.seed'

  // Without synchronize: this peer's own program, kept in their browser (per
  // class and room, by Edrys.setItem) with the config.code it started from,
  // so a changed start program replaces it.
  const LOCAL_KEY = 'blocklyMicroPython.local'

  // A change is written to the room this long after the last edit. Short, as
  // a change from another peer replaces an edit not yet sent.
  const SEND_DELAY = 500

  // ---------------------------------------------------------------- status

  // connecting, sending, saved, local, unsaved, error
  const STATUS = {
    connecting: ['warn', 'Connecting…'],
    sending: ['warn', 'Sending…'],
    saved: ['ok', 'Saved'],
    local: ['', 'Local only'],
    unsaved: ['warn', 'Not saved in this browser'],
    error: ['error', 'Error'],
  }
  let status = 'connecting'
  function setStatus(state = status) {
    status = state
    const shown = document.getElementById('errors').hidden ? state : 'error'
    const [cls, text] = STATUS[shown]
    const pill = document.getElementById('status')
    pill.className = 'edrys-pill' + (cls ? ' ' + cls : '')
    pill.dataset.state = shown
    pill.textContent = text
  }
  window.addEventListener('blockly-micropython-error', () => setStatus())
  setStatus()

  if (!BM) return
  const { showError } = BM

  // ---------------------------------------------------------------- start

  Edrys.onReady(() => {
    let config = Edrys.module.config
    if (config && typeof config !== 'object') {
      showError('The module settings are not valid JSON/YAML; they were ignored.')
      config = {}
    }
    config = config || {}

    const startCode = typeof config.code === 'string' ? config.code : ''
    const runSubject = config.runCommand || DEFAULT_RUN_SUBJECT

    if (config.mode) {
      if (['split', 'block', 'text'].includes(config.mode)) BM.setMode(config.mode)
      else showError('Unknown mode "' + config.mode + '" in the module settings. Known modes: split, block, text.')
    }

    if (config.synchronize === true) startShared(startCode)
    else startLocal(startCode)

    const run = document.getElementById('run')
    run.disabled = false
    run.addEventListener('click', () => {
      try {
        Edrys.sendMessage(runSubject, BM.getCode())
      } catch (e) {
        showError('The code could not be sent: ' + e.message)
      }
    })

    document.getElementById('reset').disabled = false
  })

  // ---------------------------------------------------------------- shared

  /** With synchronize: one program for the room, in its state. */
  function startShared(startCode) {
    // Last code applied from or written to the room. Comparing against it
    // keeps a peer from writing back what it just received.
    let synced = ''

    const current = Edrys.getState(STATE_CODE, 'Value')

    // Start from config.code only if the room has no program yet, or the
    // teacher changed config.code (also to empty) since the program was started.
    if (current == null || Edrys.getState(STATE_SEED, 'Value') !== startCode) {
      synced = startCode
      BM.setCode(startCode)
      Edrys.updateState(() => {
        Edrys.getState(STATE_SEED, 'Value', startCode)
        Edrys.getState(STATE_CODE, 'Value', startCode)
      })
    } else {
      synced = current
      BM.setCode(current)
    }

    let timer = null
    function publish() {
      timer = null
      const code = BM.getCode()
      if (code !== synced) {
        synced = code
        Edrys.getState(STATE_CODE, 'Value', code)
      }
      setStatus('saved')
    }

    BM.onChange((code) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(publish, SEND_DELAY)
      if (code !== synced) setStatus('sending')
    })
    // a reload within the delay still sends the last edit
    window.addEventListener('pagehide', () => timer && publish())

    const room = Edrys.getState()
    room.observe((event) => {
      if (event.transaction.local || !event.keysChanged.has(STATE_CODE)) return
      const code = room.get(STATE_CODE)
      if (typeof code !== 'string' || code === synced) return
      // replaces a local edit not yet sent
      window.clearTimeout(timer)
      timer = null
      synced = code
      BM.setCode(code)
      setStatus('saved')
    })

    // Reset: back to the start program, for the whole room. Only teachers
    // and stations get the button (it hides it; it is no permission check).
    const reset = document.getElementById('reset')
    if (Edrys.role === 'student') reset.hidden = true
    reset.title = 'Back to the start program from the module settings, for everyone in the room'
    reset.addEventListener('click', () => {
      window.clearTimeout(timer)
      timer = null
      synced = startCode
      BM.setCode(startCode)
      Edrys.getState(STATE_CODE, 'Value', startCode)
      setStatus('saved')
    })

    setStatus('saved')
  }

  // ---------------------------------------------------------------- local

  /**
   * Without synchronize: this peer's own program, kept in their browser. The
   * saved copy is used only while config.code is still the one it started from.
   */
  function startLocal(startCode) {
    let saved = null
    try {
      saved = JSON.parse(Edrys.getItem(LOCAL_KEY))
    } catch (e) {
      console.warn('Could not restore the local copy:', e)
    }
    if (saved && saved.start === startCode && typeof saved.code === 'string') {
      BM.setCode(saved.code)
    } else {
      BM.setCode(startCode)
    }

    let timer = null
    function save() {
      window.clearTimeout(timer)
      timer = null
      try {
        Edrys.setItem(LOCAL_KEY, JSON.stringify({ start: startCode, code: BM.getCode() }))
        setStatus('local')
      } catch (e) {
        console.warn('Could not save the local copy:', e)
        setStatus('unsaved')
      }
    }
    BM.onChange(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(save, 500)
    })
    window.addEventListener('pagehide', () => timer && save())

    // Reset: back to the start program, for this peer only
    document.getElementById('reset').addEventListener('click', () => {
      BM.setCode(startCode)
      save()
    })

    setStatus('local')
  }
})()
