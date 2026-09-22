function needsMainWindow(mainWindow) {
  return !mainWindow || mainWindow.isDestroyed();
}

function shouldAllowPreventedUnload(response) {
  return response === 0;
}

module.exports = { needsMainWindow, shouldAllowPreventedUnload };
