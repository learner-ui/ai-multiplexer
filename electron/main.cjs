const path = require('node:path');
const { app, BrowserWindow, dialog, ipcMain, nativeImage, shell, webContents } = require('electron');
const {
  isHttpUrl,
  matchesTarget,
  normalizeNewChatTargetsFromPayload,
  normalizePromptTargetsFromPayload,
} = require('./targetRouting.cjs');
const {
  getBrowserLikeUserAgent,
  getGeminiCompatibleUserAgent,
} = require('./userAgent.cjs');
const { setTaggedFileInputFiles } = require('./nativeFileInput.cjs');
const { stagePromptAttachments } = require('./attachmentStaging.cjs');

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const geminiCompatibleSessions = new WeakSet();

const DRAG_ICON_DATA_URL = 'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="#2563eb"/>
      <path d="M10 7h8l4 4v14H10z" fill="white"/>
      <path d="M18 7v5h5" fill="#bfdbfe"/>
    </svg>
  `.trim());

function isGeminiCompatibleUrl(url = '') {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'gemini.google.com' ||
      hostname.endsWith('.gemini.google.com') ||
      hostname.endsWith('.google.com') ||
      hostname.endsWith('.googleapis.com') ||
      hostname.endsWith('.googleusercontent.com') ||
      hostname.endsWith('.gstatic.com');
  } catch {
    return false;
  }
}

function ensureGeminiSessionCompatibility(targetSession) {
  if (!targetSession || geminiCompatibleSessions.has(targetSession)) return;
  geminiCompatibleSessions.add(targetSession);

  targetSession.webRequest.onCompleted({
    urls: [
      'https://gemini.google.com/*',
      'https://*.google.com/*',
      'https://*.googleapis.com/*',
      'https://*.googleusercontent.com/*',
      'https://*.gstatic.com/*',
    ],
  }, (details) => {
    if (!isGeminiCompatibleUrl(details.url)) return;
    if (details.statusCode < 400) return;

    console.warn('[gemini-network] request-completed-with-error-status', {
      method: details.method,
      statusCode: details.statusCode,
      url: details.url,
      resourceType: details.resourceType,
      fromCache: details.fromCache,
    });
  });

  targetSession.webRequest.onErrorOccurred({
    urls: [
      'https://gemini.google.com/*',
      'https://*.google.com/*',
      'https://*.googleapis.com/*',
      'https://*.googleusercontent.com/*',
      'https://*.gstatic.com/*',
    ],
  }, (details) => {
    if (!isGeminiCompatibleUrl(details.url)) return;

    console.error('[gemini-network] request-error', {
      method: details.method,
      error: details.error,
      url: details.url,
      resourceType: details.resourceType,
    });
  });
}

function registerGeminiWebviewCompatibility() {
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() !== 'webview') return;

    const applyGeminiCompatibility = (url) => {
      if (!isGeminiCompatibleUrl(url)) return;
      ensureGeminiSessionCompatibility(contents.session);
      contents.setUserAgent(
        getGeminiCompatibleUserAgent(
          typeof contents.getUserAgent === 'function' ? contents.getUserAgent() : app.userAgentFallback,
        ),
      );
    };

    contents.on('did-start-navigation', (_navigationEvent, url, _isInPlace, isMainFrame) => {
      if (!isMainFrame) return;
      applyGeminiCompatibility(url);
    });

    contents.on('dom-ready', () => {
      applyGeminiCompatibility(contents.getURL());
    });
  });
}

function getElectronFilePath(fileName) {
  return path.join(__dirname, fileName);
}

function getNativeDragIcon() {
  const icon = nativeImage.createFromDataURL(DRAG_ICON_DATA_URL);
  return icon.isEmpty() ? nativeImage.createEmpty() : icon;
}

function getDragFilePaths(payload) {
  if (!payload || !Array.isArray(payload.paths)) return [];

  return payload.paths.filter((filePath) => (
    typeof filePath === 'string' && path.isAbsolute(filePath) && filePath.length > 0
  ));
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'AI Multiplexer',
    backgroundColor: '#f3f4f6',
    webPreferences: {
      preload: getElectronFilePath('preload.cjs'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) {
      shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function getPromptFromPayload(payload) {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload.message === 'string') return payload.message;
  return '';
}

function getAttachmentsFromPayload(payload) {
  if (!payload || !Array.isArray(payload.attachments)) return [];

  return payload.attachments.filter((attachment) => (
    attachment &&
    typeof attachment.name === 'string' &&
    typeof attachment.type === 'string' &&
    typeof attachment.size === 'number' &&
    attachment.data
  )).map((attachment) => ({
    ...attachment,
    ...(typeof attachment.path === 'string' && attachment.path.length > 0 ? { path: attachment.path } : {}),
  }));
}

function getUserManagedAttachmentDir(payload) {
  const value = typeof payload?.baseDir === 'string' ? payload.baseDir.trim() : '';
  if (!value || !path.isAbsolute(value)) return null;
  return value;
}

function registerIpc() {
  ipcMain.handle('broadcast-prompt', (_event, payload) => {
    const message = getPromptFromPayload(payload).trim();
    const attachments = getAttachmentsFromPayload(payload);
    if (!message && attachments.length === 0) return { sent: 0 };

    const promptTargets = normalizePromptTargetsFromPayload(payload);
    const targetContents = webContents
      .getAllWebContents()
      .filter((contents) => {
        if (contents.isDestroyed() || contents.getType() !== 'webview') return false;
        return matchesTarget({ id: contents.id, url: contents.getURL() }, promptTargets);
      });

    for (const contents of targetContents) {
      contents.send('inject-prompt', { message, attachments });
    }

    return { sent: targetContents.length };
  });

  ipcMain.handle('broadcast-new-chat', (_event, payload) => {
    const targets = normalizeNewChatTargetsFromPayload(payload);
    if (targets.length === 0) return { sent: 0 };

    let sent = 0;
    const visited = new Set();

    for (const target of targets) {
      const matching = webContents.getAllWebContents().filter((contents) => {
        if (contents.isDestroyed() || contents.getType() !== 'webview') return false;
        if (visited.has(contents.id)) return false;
        return matchesTarget(
          { id: contents.id, url: contents.getURL() },
          [{ url: target.matchUrl, webContentsId: target.webContentsId }],
        );
      });

      for (const contents of matching) {
        visited.add(contents.id);
        contents.loadURL(target.newChatUrl).catch((error) => {
          console.error('Failed to navigate webview to new chat URL:', error);
        });
        sent += 1;
      }
    }

    return { sent };
  });

  ipcMain.handle('open-external', (_event, url) => {
    if (isHttpUrl(url)) {
      shell.openExternal(url);
    }
  });

  ipcMain.handle('stage-attachments', async (_event, payload) => {
    const attachments = getAttachmentsFromPayload(payload);
    if (attachments.length === 0) return [];
    const userManagedDir = getUserManagedAttachmentDir(payload);

    return stagePromptAttachments(attachments, {
      baseDir: userManagedDir || app.getPath('temp'),
      useBatchFolder: !userManagedDir,
    });
  });

  ipcMain.handle('select-attachment-folder', async (event) => {
    const ownerWindow = BrowserWindow.fromWebContents(event.sender) || undefined;
    const result = await dialog.showOpenDialog(ownerWindow, {
      title: '选择聊天文件夹',
      buttonLabel: '使用这个聊天文件夹',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled) return null;
    return result.filePaths[0] || null;
  });

  ipcMain.handle('show-item-in-folder', (_event, filePath) => {
    if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) return;
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle('set-file-input-files', (event, payload) => (
    setTaggedFileInputFiles(event.sender, payload?.token, payload?.paths)
  ));

  ipcMain.on('start-file-drag', (event, payload) => {
    const paths = getDragFilePaths(payload);
    if (paths.length === 0) return;

    event.sender.startDrag({
      file: paths[0],
      files: paths,
      icon: getNativeDragIcon(),
    });
  });
}

app.whenReady().then(() => {
  app.userAgentFallback = getBrowserLikeUserAgent(app.userAgentFallback);
  registerGeminiWebviewCompatibility();
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
