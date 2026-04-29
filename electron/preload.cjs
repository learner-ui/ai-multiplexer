const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { contextBridge, ipcRenderer, webUtils } = require('electron');

const webviewPreloadUrl = pathToFileURL(path.join(__dirname, 'webview-preload.cjs')).toString();

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getWebviewPreloadPath: () => webviewPreloadUrl,
  getPathForFile: (file) => webUtils.getPathForFile(file),
  broadcastPrompt: (message, targets, attachments) => ipcRenderer.invoke('broadcast-prompt', {
    message,
    targets,
    attachments,
  }),
  broadcastNewChat: (targets) => ipcRenderer.invoke('broadcast-new-chat', { targets }),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  stageAttachments: (attachments, baseDir) => ipcRenderer.invoke('stage-attachments', {
    attachments,
    baseDir,
  }),
  selectAttachmentFolder: () => ipcRenderer.invoke('select-attachment-folder'),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  startFileDrag: (paths) => ipcRenderer.send('start-file-drag', { paths }),
});
