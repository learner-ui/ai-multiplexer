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
  clearLoginProfileData: (partition) => ipcRenderer.invoke('clear-login-profile-data', { partition }),
  stageAttachments: (attachments) => ipcRenderer.invoke('stage-attachments', { attachments }),
});
