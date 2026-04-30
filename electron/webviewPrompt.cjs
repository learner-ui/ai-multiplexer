const PROVIDERS = {
  chatgpt: {
    hosts: ['chatgpt.com', 'chat.openai.com'],
    inputSelectors: [
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'textarea',
      'div[contenteditable="true"]',
    ],
    sendSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
    ],
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="Attach"]',
      'button[aria-label*="Upload"]',
      'button[aria-label*="Add"]',
    ],
    dropTargetSelectors: [
      '#prompt-textarea',
      'textarea',
      '[contenteditable="true"]',
      'body',
    ],
  },
  gemini: {
    hosts: ['gemini.google.com'],
    inputSelectors: [
      'rich-textarea .ql-editor',
      '.ql-editor[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea',
    ],
    sendSelectors: [
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Submit"]',
    ],
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="Upload"]',
      'button[aria-label*="file"]',
      'button[aria-label*="Attach"]',
      'button[aria-label*="Add"]',
      'button[aria-label*="添加"]',
    ],
    uploadButtonKeywords: [
      'upload',
      'attach',
      'add',
      'file',
      'files',
      '+',
      '上传',
      '附件',
      '文件',
      '添加',
      '插入',
    ],
    uploadMenuKeywords: [
      'upload',
      'device',
      'computer',
      'file',
      'files',
      '上传',
      '设备',
      '电脑',
      '文件',
      '本机',
      '从设备',
      '选择文件',
    ],
    dropTargetSelectors: [
      'rich-textarea',
      '.ql-editor',
      '[contenteditable="true"]',
      'body',
    ],
    requiresAttachmentEvidence: true,
    attachmentEvidenceTimeoutMs: 12000,
    dropTargetEvidenceTimeoutMs: 1800,
    directFileInputTimeoutMs: 1800,
    uploadMenuTimeoutMs: 5000,
    useNativeFileInput: true,
  },
  claude: {
    hosts: ['claude.ai'],
    inputSelectors: [
      '[data-testid="chat-input"][contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea',
    ],
    sendSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send Message"]',
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
    ],
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="Attach"]',
      'button[aria-label*="Upload"]',
      'button[aria-label*="Add"]',
    ],
    dropTargetSelectors: [
      '[data-testid="chat-input"]',
      '[contenteditable="true"]',
      'body',
    ],
  },
  deepseek: {
    hosts: ['chat.deepseek.com'],
    inputSelectors: [
      'textarea',
      'div[contenteditable="true"]',
    ],
    sendSelectors: [
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
    ],
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="Attach"]',
      'button[aria-label*="Upload"]',
      'button[aria-label*="上传"]',
    ],
    sendFallback: 'last-icon-button',
    sendFallbackEnabledTimeoutMs: 30000,
    requiresAttachmentEvidence: true,
    attachmentEvidenceTimeoutMs: 20000,
    attachmentReadyTimeoutMs: 45000,
    attachmentReadySettleMs: 900,
    attachmentProcessingKeywords: [
      '解析中',
      '上传中',
      '处理中',
      '读取中',
      '分析中',
      '正在解析',
      '正在上传',
      'processing',
      'uploading',
      'loading',
      'analyzing',
    ],
    dropTargetSelectors: [
      'textarea',
      '[contenteditable="true"]',
      'body',
    ],
  },
  glm: {
    hosts: ['chatglm.cn'],
    inputSelectors: [
      'textarea',
      'div[contenteditable="true"]',
    ],
    sendSelectors: [
      'button[aria-label="发送"]',
      'button[aria-label*="发送"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
    ],
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="上传"]',
      'button[aria-label*="附件"]',
      'button[aria-label*="Attach"]',
      'button[aria-label*="Upload"]',
    ],
    dropTargetSelectors: [
      'textarea',
      '[contenteditable="true"]',
      'body',
    ],
  },
  doubao: {
    hosts: ['doubao.com'],
    inputSelectors: [
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]',
      '[role="textbox"]',
    ],
    sendSelectors: [
      'button[aria-label="发送"]',
      'button[aria-label*="发送"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
    ],
    sendFallback: 'last-clickable-button',
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="上传"]',
      'button[aria-label*="附件"]',
      'button[aria-label*="Attach"]',
      'button[aria-label*="Upload"]',
    ],
    dropTargetSelectors: [
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]',
      '[role="textbox"]',
      'body',
    ],
  },
  grok: {
    hosts: ['grok.com', 'x.com'],
    inputSelectors: [
      '.ProseMirror[contenteditable="true"]',
      '.ProseMirror[contenteditable="plaintext-only"]',
      '[contenteditable]:not([contenteditable="false"])[data-placeholder*="问 Grok"]',
      'textarea[placeholder*="Grok"]',
      'textarea[aria-label*="Grok"]',
      '[contenteditable]:not([contenteditable="false"])[data-placeholder*="Grok"]',
      '[contenteditable]:not([contenteditable="false"])[aria-label*="Grok"]',
      '[role="textbox"][aria-label*="Grok"]',
      'textarea',
      '[contenteditable]:not([contenteditable="false"])',
      '[role="textbox"]',
    ],
    sendSelectors: [
      'button[aria-label="Send"]',
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
    ],
    sendFallback: 'last-clickable-button',
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="Attach"]',
      'button[aria-label*="Upload"]',
      'button[aria-label*="Add file"]',
    ],
    dropTargetSelectors: [
      'textarea',
      '[contenteditable]:not([contenteditable="false"])',
      '[role="textbox"]',
      'body',
    ],
  },
  qwen: {
    hosts: ['chat.qwen.ai'],
    inputSelectors: [
      '.ProseMirror[contenteditable="true"]',
      '.ProseMirror[contenteditable="plaintext-only"]',
      '[contenteditable]:not([contenteditable="false"])[data-placeholder*="Qwen"]',
      '[contenteditable]:not([contenteditable="false"])[aria-label*="Qwen"]',
      '[role="textbox"][aria-label*="Qwen"]',
      'textarea[placeholder*="Qwen"]',
      'textarea[aria-label*="Qwen"]',
      'textarea',
      '[contenteditable]:not([contenteditable="false"])',
      '[role="textbox"]',
    ],
    sendSelectors: [
      'button[aria-label="Send"]',
      'button[aria-label="Send message"]',
      'button[aria-label="发送"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="发送"]',
      'button[type="submit"]',
    ],
    sendFallback: 'last-icon-button',
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="Attach"]',
      'button[aria-label*="Upload"]',
      'button[aria-label*="Add file"]',
      'button[aria-label*="上传"]',
      'button[aria-label*="附件"]',
    ],
    dropTargetSelectors: [
      'textarea',
      '[contenteditable]:not([contenteditable="false"])',
      '[role="textbox"]',
      'body',
    ],
  },
  generic: {
    hosts: [],
    inputSelectors: [
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]',
      '[role="textbox"]',
    ],
    sendSelectors: [
      'button[aria-label="Send"]',
      'button[aria-label="发送"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="发送"]',
      'button[type="submit"]',
    ],
    fileInputSelectors: [
      'input[type="file"]',
    ],
    uploadButtonSelectors: [
      'button[aria-label*="Attach"]',
      'button[aria-label*="Upload"]',
      'button[aria-label*="Add file"]',
      'button[aria-label*="上传"]',
      'button[aria-label*="附件"]',
    ],
    dropTargetSelectors: [
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]',
      '[role="textbox"]',
      'body',
    ],
  },
};

function detectProvider(url) {
  let hostname = '';

  try {
    hostname = new URL(url).hostname;
  } catch {
    return 'unknown';
  }

  for (const [provider, config] of Object.entries(PROVIDERS)) {
    if (config.hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      return provider;
    }
  }

  return 'generic';
}

function getSearchRoots(root = document) {
  const roots = [];
  const queue = [];
  const seen = new Set();

  function addRoot(candidate) {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    roots.push(candidate);
    queue.push(candidate);
  }

  addRoot(root);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (!current.querySelectorAll) continue;

    let elements = [];
    try {
      elements = Array.from(current.querySelectorAll('*'));
    } catch {
      continue;
    }

    for (const element of elements) {
      if (element.shadowRoot) {
        addRoot(element.shadowRoot);
      }
    }
  }

  return roots;
}

function queryAll(selector, root = document) {
  return getSearchRoots(root).flatMap((searchRoot) => {
    try {
      return Array.from(searchRoot.querySelectorAll(selector));
    } catch {
      return [];
    }
  });
}

function queryFirst(selectors, root = document) {
  for (const selector of selectors) {
    const element = queryAll(selector, root)[0];
    if (element) return element;
  }

  return null;
}

function getElementSearchText(element) {
  return [
    element.getAttribute?.('aria-label'),
    element.getAttribute?.('title'),
    element.getAttribute?.('data-testid'),
    element.textContent,
    element.className,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function queryButtonByKeywords(keywords = [], root = document, excludedElements = new Set()) {
  if (keywords.length === 0) return null;

  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  const candidates = queryAll('button, [role="button"], [role="menuitem"]', root);

  return candidates.find((candidate) => {
    if (excludedElements.has(candidate)) return false;
    if (!isClickable(candidate)) return false;

    const searchText = getElementSearchText(candidate);
    return normalizedKeywords.some((keyword) => (
      keyword === '+'
        ? candidate.textContent?.trim() === '+'
        : searchText.includes(keyword)
    ));
  }) ?? null;
}

function waitForButtonByKeywords(keywords = [], root = document, timeoutMs = 3000, excludedElements = new Set()) {
  const existing = queryButtonByKeywords(keywords, root, excludedElements);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const button = queryButtonByKeywords(keywords, root, excludedElements);
      if (button || Date.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        resolve(button);
      }
    }, 100);
  });
}

function waitForElement(selectors, root = document, timeoutMs = 4000) {
  const existing = queryFirst(selectors, root);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const element = queryFirst(selectors, root);
      if (element || Date.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        resolve(element);
      }
    }, 100);
  });
}

function dispatchInputEvents(element, value = '') {
  if (typeof InputEvent === 'function') {
    try {
      element.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        data: value,
        inputType: 'insertText',
      }));
    } catch {
    }

    try {
      element.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        data: value,
        inputType: 'insertText',
      }));
    } catch {
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else {
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function dispatchTextEvents(element, value = '') {
  dispatchInputEvents(element, value);
}

function setNativeValue(element, value) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
}

function setEditableText(element, value, ownerDocument = document) {
  element.focus();

  const selection = ownerDocument.getSelection?.();
  if (selection && ownerDocument.createRange) {
    const range = ownerDocument.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const usedExecCommand = ownerDocument.execCommand?.('insertText', false, value);
  if (!usedExecCommand) {
    element.textContent = value;
  }

  dispatchTextEvents(element, value);
}

function fillInput(element, value, ownerDocument = document) {
  element.focus();

  if ('value' in element) {
    setNativeValue(element, value);
    dispatchTextEvents(element, value);
    return;
  }

  setEditableText(element, value, ownerDocument);
}

function waitForUiToSettle() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
      return;
    }

    setTimeout(resolve, 32);
  });
}

function isClickable(element) {
  return !element.disabled && element.getAttribute('aria-disabled') !== 'true';
}

async function findSendButton(selectors, root = document, enabledTimeoutMs = 1500) {
  const element = await waitForElement(selectors, root, 2500);
  if (!element) return null;

  if (isClickable(element)) return element;

  const enabled = await new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (isClickable(element) || Date.now() - startedAt >= enabledTimeoutMs) {
        clearInterval(interval);
        resolve(isClickable(element) ? element : null);
      }
    }, 100);
  });

  return enabled;
}

function findLastClickableButton(root = document) {
  const buttons = queryAll('button, [role="button"]', root);
  return buttons.reverse().find(isClickable) ?? null;
}

function isLikelySendIconButton(element) {
  if (!isClickable(element)) return false;

  const visibleText = (element.textContent ?? '').replace(/\s+/g, '').trim();
  const searchText = getElementSearchText(element);
  const utilityKeywords = [
    'attach',
    'upload',
    'file',
    'mic',
    'voice',
    'search',
    'deep',
    'reason',
    'settings',
    '附件',
    '上传',
    '文件',
    '麦克风',
    '语音',
    '深度',
    '思考',
    '智能搜索',
    '搜索',
  ];

  if (utilityKeywords.some((keyword) => searchText.includes(keyword))) {
    return false;
  }

  return visibleText.length === 0 ||
    searchText.includes('send') ||
    searchText.includes('submit') ||
    searchText.includes('发送') ||
    searchText.includes('arrow');
}

function findLastIconButton(root = document) {
  const buttons = queryAll('button, [role="button"]', root);
  return buttons.reverse().find(isLikelySendIconButton) ?? null;
}

function findFallbackButton(mode, root = document) {
  if (mode === 'last-icon-button') {
    return findLastIconButton(root);
  }

  return findLastClickableButton(root);
}

function getComposerScope(anchor, root = document) {
  if (!anchor) return null;

  let current = anchor.parentElement;
  while (current && current !== root.body && current !== root.documentElement) {
    const buttons = Array.from(current.querySelectorAll('button, [role="button"]'))
      .filter(isClickable);
    if (buttons.length > 0) return current;

    current = current.parentElement;
  }

  return null;
}

function waitForFallbackButton(mode, root = document, timeoutMs = 1500) {
  const existing = findFallbackButton(mode, root);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const button = findFallbackButton(mode, root);
      if (button || Date.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        resolve(button);
      }
    }, 100);
  });
}

function isBeforeElement(candidate, anchor) {
  if (!candidate || !anchor || typeof candidate.compareDocumentPosition !== 'function') {
    return false;
  }

  return Boolean(candidate.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING);
}

function isExplicitSendOrVoiceControl(element) {
  const searchText = getElementSearchText(element);
  return [
    'send',
    'submit',
    '发送',
    'mic',
    'voice',
    'microphone',
    '麦克风',
    '语音',
  ].some((keyword) => searchText.includes(keyword));
}

function findComposerUploadButton(config, root = document) {
  const anchor = queryFirst(config.inputSelectors ?? [], root);
  const composerScope = getComposerScope(anchor, root);
  if (!composerScope || !anchor) return null;

  const buttons = Array.from(composerScope.querySelectorAll('button, [role="button"]'))
    .filter(isClickable);
  const precedingButtons = buttons.filter((button) => isBeforeElement(button, anchor));
  const candidates = precedingButtons.length > 0 ? precedingButtons : buttons;

  return candidates.find((button) => !isExplicitSendOrVoiceControl(button)) ?? null;
}

async function waitForFallbackButtonNearAnchor(mode, anchor, root = document, timeoutMs = 1500) {
  const composerScope = getComposerScope(anchor, root);
  if (composerScope) {
    const scopedButton = await waitForFallbackButton(mode, composerScope, timeoutMs);
    if (scopedButton) return scopedButton;
  }

  return waitForFallbackButton(mode, root, timeoutMs);
}

function clickElement(element) {
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
    const EventConstructor = type.startsWith('pointer') && typeof PointerEvent === 'function'
      ? PointerEvent
      : MouseEvent;

    try {
      element.dispatchEvent(new EventConstructor(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
      }));
    } catch {
    }
  }

  element.click();
}

function pressEnter(element) {
  for (const type of ['keydown', 'keyup']) {
    element.dispatchEvent(
      new KeyboardEvent(type, {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
  }
}

function normalizePromptPayload(payload) {
  if (typeof payload === 'string') {
    return { message: payload, attachments: [] };
  }

  if (payload && typeof payload === 'object') {
    return {
      message: typeof payload.message === 'string' ? payload.message : '',
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    };
  }

  return { message: '', attachments: [] };
}

function getAttachmentBytes(attachment) {
  if (attachment.data instanceof ArrayBuffer) {
    return attachment.data;
  }

  if (ArrayBuffer.isView(attachment.data)) {
    return attachment.data.buffer.slice(
      attachment.data.byteOffset,
      attachment.data.byteOffset + attachment.data.byteLength,
    );
  }

  if (Array.isArray(attachment.data)) {
    return new Uint8Array(attachment.data).buffer;
  }

  return new Uint8Array().buffer;
}

function createFileFromAttachment(attachment) {
  return new File([getAttachmentBytes(attachment)], attachment.name, {
    type: attachment.type || 'application/octet-stream',
  });
}

function getAttachmentEvidenceTokens(attachment) {
  const name = String(attachment.name || '').trim();
  const extensionIndex = name.lastIndexOf('.');
  const baseName = extensionIndex > 0 ? name.slice(0, extensionIndex) : name;
  const tokens = [name, baseName]
    .filter(Boolean)
    .map((token) => (token.length > 10 ? token.slice(0, 10) : token));

  return [...new Set(tokens)];
}

function hasAttachmentEvidence(attachments, root = document) {
  const text = getDocumentText(root);
  return attachments.some((attachment) => (
    getAttachmentEvidenceTokens(attachment).some((token) => text.includes(token))
  ));
}

function getDocumentText(root = document) {
  return getSearchRoots(root)
    .map((searchRoot) => searchRoot.body?.textContent ?? searchRoot.textContent ?? '')
    .join(' ');
}

function waitForAttachmentEvidence(attachments, root = document, timeoutMs = 5000) {
  if (hasAttachmentEvidence(attachments, root)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const found = hasAttachmentEvidence(attachments, root);
      if (found || Date.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        resolve(found);
      }
    }, 150);
  });
}

function hasAttachmentProcessingIndicators(config, root = document) {
  const keywords = config.attachmentProcessingKeywords ?? [];
  if (keywords.length === 0) return false;

  const text = getDocumentText(root).toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function waitForAttachmentReady(config, root = document) {
  if (!config.attachmentReadyTimeoutMs) return Promise.resolve(false);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const settleUntil = startedAt + (config.attachmentReadySettleMs ?? 0);
    const interval = setInterval(() => {
      const timedOut = Date.now() - startedAt >= config.attachmentReadyTimeoutMs;
      const settled = Date.now() >= settleUntil;
      const processing = hasAttachmentProcessingIndicators(config, root);

      if ((settled && !processing) || timedOut) {
        clearInterval(interval);
        resolve(!processing);
      }
    }, 150);
  });
}

function getFileExtension(fileName) {
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index).toLowerCase() : '';
}

function attachmentMatchesAccept(attachment, acceptValue) {
  if (!acceptValue) return true;

  const tokens = acceptValue
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const type = String(attachment.type || '').toLowerCase();
  const extension = getFileExtension(attachment.name);

  return tokens.some((token) => {
    if (token === '*/*') return true;
    if (token.startsWith('.')) return token === extension;
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return token === type;
  });
}

function inputAcceptsAttachments(input, attachments) {
  return attachments.every((attachment) => attachmentMatchesAccept(attachment, input.accept || ''));
}

function assignFilesToInput(input, files) {
  if (typeof DataTransfer !== 'undefined') {
    const dataTransfer = new DataTransfer();

    for (const file of files) {
      dataTransfer.items.add(file);
    }

    input.files = dataTransfer.files;
  } else {
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: files,
    });
  }

  dispatchInputEvents(input);
}

function getAttachmentPaths(attachments) {
  return attachments
    .map((attachment) => (typeof attachment.path === 'string' ? attachment.path : ''))
    .filter(Boolean);
}

async function assignNativeFilesToInput(input, attachments) {
  if (typeof globalThis.aiMultiplexerSetFileInputFiles !== 'function') return false;

  const paths = getAttachmentPaths(attachments);
  if (paths.length !== attachments.length) return false;

  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  input.setAttribute('data-ai-multiplexer-file-input-token', token);

  const result = await globalThis.aiMultiplexerSetFileInputFiles(token, paths);
  if (!result?.ok) {
    input.removeAttribute('data-ai-multiplexer-file-input-token');
    return false;
  }

  dispatchInputEvents(input);
  return true;
}

function queryFileInput(selectors, attachments, root = document) {
  for (const selector of selectors) {
    const inputs = queryAll(selector, root);
    const matchingInput = inputs.find((input) => inputAcceptsAttachments(input, attachments));
    if (matchingInput) return matchingInput;
  }

  return null;
}

function waitForFileInput(selectors, attachments, root = document, timeoutMs = 2500) {
  const existing = queryFileInput(selectors, attachments, root);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const input = queryFileInput(selectors, attachments, root);
      if (input || Date.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        resolve(input);
      }
    }, 100);
  });
}

async function findFileInput(config, attachments, root = document) {
  const existingInput = queryFileInput(config.fileInputSelectors, attachments, root);
  if (existingInput) return existingInput;

  const uploadButton = queryFirst(config.uploadButtonSelectors, root) ||
    queryButtonByKeywords(config.uploadButtonKeywords, root) ||
    findComposerUploadButton(config, root);
  if (uploadButton) {
    uploadButton.click();
    const directInput = await waitForFileInput(
      config.fileInputSelectors,
      attachments,
      root,
      config.directFileInputTimeoutMs ?? 800,
    );
    if (directInput) return directInput;

    const menuItem = await waitForButtonByKeywords(
      config.uploadMenuKeywords,
      root,
      config.uploadMenuTimeoutMs ?? 3000,
      new Set([uploadButton]),
    );
    if (menuItem && menuItem !== uploadButton) {
      menuItem.click();
      return waitForFileInput(config.fileInputSelectors, attachments, root, 3000);
    }

    return waitForFileInput(config.fileInputSelectors, attachments, root, 2200);
  }

  return null;
}

function createDataTransfer(files) {
  if (typeof DataTransfer !== 'undefined') {
    const dataTransfer = new DataTransfer();
    for (const file of files) {
      dataTransfer.items.add(file);
    }

    return dataTransfer;
  }

  return {
    files,
    items: files,
    types: ['Files'],
  };
}

function dispatchFilesDropToTarget(target, files) {
  const dataTransfer = createDataTransfer(files);
  for (const type of ['dragenter', 'dragover', 'drop']) {
    let event;
    if (typeof DragEvent === 'function') {
      try {
        event = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
      } catch {
      }
    }

    if (!event) {
      event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', {
        configurable: true,
        value: dataTransfer,
      });
    }

    target.dispatchEvent(event);
  }

  return true;
}

function getDropTargets(config, root = document) {
  const targets = [];
  const seen = new Set();

  for (const selector of config.dropTargetSelectors) {
    for (const target of queryAll(selector, root)) {
      if (!target || seen.has(target)) continue;
      seen.add(target);
      targets.push(target);
    }
  }

  for (const fallbackTarget of [root.body, root.documentElement]) {
    if (!fallbackTarget || seen.has(fallbackTarget)) continue;
    seen.add(fallbackTarget);
    targets.push(fallbackTarget);
  }

  return targets;
}

function dispatchFilesDrop(files, config, root = document) {
  const target = getDropTargets(config, root)[0];
  if (!target) return false;

  return dispatchFilesDropToTarget(target, files);
}

async function dispatchFilesDropUntilConfirmed(files, attachments, config, root = document) {
  const targets = getDropTargets(config, root);
  for (const target of targets) {
    dispatchFilesDropToTarget(target, files);

    const confirmed = await waitForAttachmentEvidence(
      attachments,
      root,
      config.dropTargetEvidenceTimeoutMs ?? config.attachmentEvidenceTimeoutMs,
    );
    if (confirmed) {
      const ready = await waitForAttachmentReady(config, root);
      return {
        uploaded: files.length,
        method: 'drop',
        ...(ready ? { ready: true } : {}),
      };
    }
  }

  return { uploaded: 0, reason: 'attachment-upload-unconfirmed' };
}

async function uploadAttachments(attachments, config, root = document) {
  if (attachments.length === 0) return { uploaded: 0 };

  const files = attachments.map(createFileFromAttachment);
  const input = await findFileInput(config, attachments, root);
  if (!input) {
    if (config.requiresAttachmentEvidence) {
      return dispatchFilesDropUntilConfirmed(files, attachments, config, root);
    }

    if (dispatchFilesDrop(files, config, root)) {
      return { uploaded: files.length, method: 'drop' };
    }

    return { uploaded: 0, reason: 'file-input-not-found' };
  }

  const usedNativeFileInput = config.useNativeFileInput
    ? await assignNativeFilesToInput(input, attachments)
    : false;

  if (!usedNativeFileInput) {
    assignFilesToInput(input, files);
  }

  if (config.requiresAttachmentEvidence) {
    const confirmed = await waitForAttachmentEvidence(
      attachments,
      root,
      config.attachmentEvidenceTimeoutMs,
    );
    if (confirmed) {
      const ready = await waitForAttachmentReady(config, root);
      return {
        uploaded: files.length,
        ...(usedNativeFileInput ? { method: 'native-file-input' } : {}),
        ...(ready ? { ready: true } : {}),
      };
    }

    const dropResult = await dispatchFilesDropUntilConfirmed(files, attachments, config, root);
    if (dropResult.uploaded > 0) {
      return {
        ...dropResult,
        method: 'drop-after-input',
      };
    }

    return { uploaded: 0, reason: 'attachment-upload-unconfirmed' };
  }

  return { uploaded: files.length };
}

async function injectPrompt(payload, url = globalThis.location?.href ?? '', root = document) {
  const { message, attachments } = normalizePromptPayload(payload);
  const provider = detectProvider(url);
  const config = PROVIDERS[provider];
  const attachmentResult = await uploadAttachments(attachments, config, root);
  if (attachments.length > 0 && attachmentResult.uploaded === 0) {
    return {
      ok: false,
      provider,
      reason: 'attachment-upload-failed',
      attachments: attachmentResult,
    };
  }

  const trimmedMessage = message.trim();

  let input = null;
  if (trimmedMessage) {
    input = await waitForElement(config.inputSelectors, root);
    if (!input) {
      return { ok: false, provider, reason: 'input-not-found' };
    }

    fillInput(input, message, root);
    await waitForUiToSettle();
  }

  let button = await findSendButton(
    config.sendSelectors,
    root,
    attachments.length > 0 ? 8000 : 1500,
  );
  if (!button && config.sendFallback) {
    button = await waitForFallbackButtonNearAnchor(
      config.sendFallback,
      input,
      root,
      config.sendFallbackEnabledTimeoutMs ?? (attachments.length > 0 ? 8000 : 1500),
    );
  }
  if (button) {
    clickElement(button);
  } else if (input) {
    pressEnter(input);
  }

  const result = { ok: true, provider };
  if (attachments.length > 0) {
    result.attachments = attachmentResult;
  }

  return result;
}

module.exports = {
  detectProvider,
  fillInput,
  injectPrompt,
};
