const { ipcRenderer } = require('electron');
const { injectPrompt } = require('./webviewPrompt.cjs');
const { getExternalLinkFromClickEvent } = require('./webviewLinkInterceptor.cjs');

globalThis.aiMultiplexerSetFileInputFiles = (token, paths) => (
  ipcRenderer.invoke('set-file-input-files', { token, paths })
);

document.addEventListener('click', (event) => {
  const url = getExternalLinkFromClickEvent(event, window.location.href);
  if (!url) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  ipcRenderer.invoke('open-external', url).catch((error) => {
    ipcRenderer.sendToHost('external-link-open-error', {
      url,
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  });
}, true);

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
