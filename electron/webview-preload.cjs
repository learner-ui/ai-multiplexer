const { ipcRenderer } = require('electron');
const { injectPrompt } = require('./webviewPrompt.cjs');

globalThis.aiMultiplexerSetFileInputFiles = (token, paths) => (
  ipcRenderer.invoke('set-file-input-files', { token, paths })
);

ipcRenderer.on('inject-prompt', async (_event, message) => {
  try {
    const result = await injectPrompt(message, window.location.href, document);
    ipcRenderer.sendToHost('prompt-injection-result', result);
  } catch (error) {
    ipcRenderer.sendToHost('prompt-injection-result', {
      ok: false,
      provider: 'unknown',
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  }
});
