const setMode = (mode) => {
    if (window.currentMode) { window.currentMode.stop() }
    window.currentMode = mode
    mode.start()
}