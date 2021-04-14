if (!window.dev_mode) window.onbeforeunload = event => {
  return false
}