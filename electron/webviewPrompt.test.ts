import { beforeEach, describe, expect, it, vi } from 'vitest';
import promptModule from './webviewPrompt.cjs';

const { detectProvider, injectPrompt } = promptModule;

function makeAttachment(name = 'brief.pdf', type = 'application/pdf') {
  return {
    name,
    type,
    size: 3,
    data: new Uint8Array([1, 2, 3]).buffer,
  };
}

describe('webview prompt injection helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete globalThis.aiMultiplexerSetFileInputFiles;
    vi.restoreAllMocks();
  });

  it.each([
    ['https://chatgpt.com/', 'chatgpt'],
    ['https://chat.openai.com/', 'chatgpt'],
    ['https://gemini.google.com/app', 'gemini'],
    ['https://claude.ai/new', 'claude'],
    ['https://chat.deepseek.com/', 'deepseek'],
    ['https://chatglm.cn/main/guest', 'glm'],
    ['https://www.doubao.com/chat/', 'doubao'],
    ['https://grok.com/', 'grok'],
    ['https://x.com/i/grok', 'grok'],
    ['https://chat.qwen.ai/', 'qwen'],
    ['https://example.com/', 'generic'],
  ])('detects %s as %s', (url, expected) => {
    expect(detectProvider(url)).toBe(expected);
  });

  it('fills a ChatGPT textarea and clicks the send button', async () => {
    document.body.innerHTML = `
      <textarea id="prompt-textarea"></textarea>
      <button data-testid="send-button">Send</button>
    `;
    const clickSpy = vi.spyOn(document.querySelector('button')!, 'click');

    const result = await injectPrompt('hello from global input', 'https://chatgpt.com/');

    expect(result).toEqual({ ok: true, provider: 'chatgpt' });
    expect((document.querySelector('textarea') as HTMLTextAreaElement).value).toBe('hello from global input');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('fills a Gemini rich text composer and clicks the send button', async () => {
    document.body.innerHTML = `
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;
    const clickSpy = vi.spyOn(document.querySelector('button')!, 'click');

    const result = await injectPrompt('compare both answers', 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini' });
    expect(document.querySelector('[contenteditable="true"]')?.textContent).toBe('compare both answers');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('fills a Claude composer and clicks the send button', async () => {
    document.body.innerHTML = `
      <div data-testid="chat-input" contenteditable="true"></div>
      <button aria-label="Send Message">Send</button>
    `;
    const clickSpy = vi.spyOn(document.querySelector('button')!, 'click');

    const result = await injectPrompt('make this concise', 'https://claude.ai/new');

    expect(result).toEqual({ ok: true, provider: 'claude' });
    expect(document.querySelector('[contenteditable="true"]')?.textContent).toBe('make this concise');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('uses generic selectors for custom providers', async () => {
    document.body.innerHTML = `
      <textarea></textarea>
      <button aria-label="Send">Send</button>
    `;
    const clickSpy = vi.spyOn(document.querySelector('button')!, 'click');

    const result = await injectPrompt('hello custom provider', 'https://example.com/');

    expect(result).toEqual({ ok: true, provider: 'generic' });
    expect((document.querySelector('textarea') as HTMLTextAreaElement).value).toBe('hello custom provider');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('fills Grok using provider-specific detection', async () => {
    document.body.innerHTML = `
      <div contenteditable="plaintext-only" aria-label="Ask Grok"></div>
      <button aria-label="Send">Send</button>
    `;
    const clickSpy = vi.spyOn(document.querySelector('button')!, 'click');

    const result = await injectPrompt('introduce yourself', 'https://grok.com/');

    expect(result).toEqual({ ok: true, provider: 'grok' });
    expect(document.querySelector('[contenteditable]')?.textContent).toBe('introduce yourself');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('fills Grok ProseMirror composer and clicks the final send icon button', async () => {
    document.body.innerHTML = `
      <div class="query-bar">
        <div class="ProseMirror" contenteditable="true" data-placeholder="问 Grok">
          <p class="is-editor-empty"><br /></p>
        </div>
        <button aria-label="Attach file">Attach</button>
        <button aria-label="Start voice">Voice</button>
        <button class="send-icon"></button>
      </div>
    `;
    const sendButton = document.querySelector('.send-icon') as HTMLButtonElement;
    const clickSpy = vi.spyOn(sendButton, 'click');

    const result = await injectPrompt('介绍一下你自己', 'https://grok.com/');

    expect(result).toEqual({ ok: true, provider: 'grok' });
    expect(document.querySelector('.ProseMirror')?.textContent).toBe('介绍一下你自己');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('uploads attachments through a file input before sending', async () => {
    document.body.innerHTML = `
      <input type="file" multiple />
      <textarea></textarea>
      <button aria-label="Send">Send</button>
    `;
    const input = document.querySelector('input') as HTMLInputElement;
    const changeSpy = vi.fn();
    input.addEventListener('change', changeSpy);

    const result = await injectPrompt({
      message: 'please summarize',
      attachments: [makeAttachment('brief.pdf'), makeAttachment('table.csv', 'text/csv')],
    }, 'https://example.com/');

    expect(result).toEqual({ ok: true, provider: 'generic', attachments: { uploaded: 2 } });
    expect(input.files?.[0]?.name).toBe('brief.pdf');
    expect(input.files?.[1]?.name).toBe('table.csv');
    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect((document.querySelector('textarea') as HTMLTextAreaElement).value).toBe('please summarize');
  });

  it('clicks an upload button if the file input is created lazily', async () => {
    document.body.innerHTML = `
      <button aria-label="Attach file">Attach</button>
      <textarea></textarea>
      <button aria-label="Send">Send</button>
    `;

    document.querySelector('[aria-label="Attach file"]')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      document.body.append(input);
    });

    const result = await injectPrompt({
      message: 'read this',
      attachments: [makeAttachment('notes.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')],
    }, 'https://example.com/');

    expect(result).toEqual({ ok: true, provider: 'generic', attachments: { uploaded: 1 } });
    expect(document.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0]?.name).toBe('notes.docx');
  });

  it('skips image-only inputs and opens a Gemini document-capable uploader', async () => {
    document.body.innerHTML = `
      <input type="file" accept="image/*" />
      <button aria-label="Upload files">Upload</button>
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;

    document.querySelector('[aria-label="Upload files"]')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.docx,.txt,.csv,image/*';
      input.dataset.uploader = 'documents';
      input.addEventListener('change', () => {
        const chip = document.createElement('div');
        chip.textContent = input.files?.[0]?.name ?? '';
        chip.dataset.attachmentChip = 'true';
        document.body.append(chip);
      });
      document.body.append(input);
    });

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    const documentInput = document.querySelector<HTMLInputElement>('[data-uploader="documents"]');
    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1 } });
    expect(documentInput?.files?.[0]?.name).toBe('paper.pdf');
    expect(document.querySelector<HTMLInputElement>('input[accept="image/*"]')?.files?.length ?? 0).toBe(0);
  });

  it('does not send Gemini text when PDF upload cannot be confirmed', async () => {
    document.body.innerHTML = `
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;
    const clickSpy = vi.spyOn(document.querySelector('button')!, 'click');

    const result = await injectPrompt({
      message: 'use this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({
      ok: false,
      provider: 'gemini',
      reason: 'attachment-upload-failed',
      attachments: { uploaded: 0, reason: 'attachment-upload-unconfirmed' },
    });
    expect(clickSpy).not.toHaveBeenCalled();
  }, 15000);

  it('opens Gemini plus menu and chooses upload from device before sending', async () => {
    document.body.innerHTML = `
      <button class="plus-button">+</button>
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;

    document.querySelector('.plus-button')?.addEventListener('click', () => {
      const menuItem = document.createElement('button');
      menuItem.textContent = 'Upload from device';
      menuItem.setAttribute('role', 'menuitem');
      menuItem.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.docx,.txt,.csv,image/*';
        input.addEventListener('change', () => {
          const chip = document.createElement('div');
          chip.textContent = input.files?.[0]?.name ?? '';
          document.body.append(chip);
        });
        document.body.append(input);
      });
      document.body.append(menuItem);
    });

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1 } });
    expect(document.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0]?.name).toBe('paper.pdf');
  });

  it('opens Gemini unlabeled composer add button before uploading a document', async () => {
    document.body.innerHTML = `
      <div class="composer">
        <button class="leading-control"><svg aria-hidden="true"></svg></button>
        <rich-textarea>
          <div class="ql-editor" contenteditable="true"></div>
        </rich-textarea>
        <button aria-label="Send message">Send</button>
      </div>
    `;

    document.querySelector('.leading-control')?.addEventListener('click', () => {
      const menuItem = document.createElement('button');
      menuItem.textContent = 'Upload from device';
      menuItem.setAttribute('role', 'menuitem');
      menuItem.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.docx,.txt,.csv,image/*';
        input.addEventListener('change', () => {
          const chip = document.createElement('div');
          chip.textContent = input.files?.[0]?.name ?? '';
          document.body.append(chip);
        });
        document.body.append(input);
      });
      document.body.append(menuItem);
    });

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1 } });
    expect(document.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0]?.name).toBe('paper.pdf');
  });

  it('opens Gemini localized add menu before uploading a document', async () => {
    document.body.innerHTML = `
      <button aria-label="添加">+</button>
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;

    document.querySelector('[aria-label="添加"]')?.addEventListener('click', () => {
      const menuItem = document.createElement('button');
      menuItem.textContent = '从设备上传';
      menuItem.setAttribute('role', 'menuitem');
      menuItem.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.docx,.txt,.csv,image/*';
        input.addEventListener('change', () => {
          const chip = document.createElement('div');
          chip.textContent = input.files?.[0]?.name ?? '';
          document.body.append(chip);
        });
        document.body.append(input);
      });
      document.body.append(menuItem);
    });

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1 } });
    expect(document.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0]?.name).toBe('paper.pdf');
  });

  it('waits for Gemini upload menu items that render asynchronously', async () => {
    document.body.innerHTML = `
      <button aria-label="添加">+</button>
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;

    document.querySelector('[aria-label="添加"]')?.addEventListener('click', () => {
      setTimeout(() => {
        const menuItem = document.createElement('button');
        menuItem.textContent = '从设备上传';
        menuItem.setAttribute('role', 'menuitem');
        menuItem.addEventListener('click', () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf,.docx,.txt,.csv,image/*';
          input.addEventListener('change', () => {
            const chip = document.createElement('div');
            chip.textContent = input.files?.[0]?.name ?? '';
            document.body.append(chip);
          });
          document.body.append(input);
        });
        document.body.append(menuItem);
      }, 1200);
    });

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1 } });
    expect(document.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0]?.name).toBe('paper.pdf');
  }, 8000);

  it('falls back to dropping files when Gemini ignores file input assignment', async () => {
    document.body.innerHTML = `
      <input type="file" accept=".pdf,.docx,.txt,.csv,image/*" />
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;

    document.body.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;

      const chip = document.createElement('div');
      chip.textContent = file.name;
      document.body.append(chip);
    });

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1, method: 'drop-after-input' } });
  }, 15000);

  it('tries later Gemini drop targets when the first target does not accept files', async () => {
    document.body.innerHTML = `
      <rich-textarea>
        <div class="ql-editor" contenteditable="true"></div>
      </rich-textarea>
      <button aria-label="Send message">Send</button>
    `;

    document.body.addEventListener('drop', (event) => {
      if (event.target !== document.body) return;

      const file = event.dataTransfer?.files?.[0];
      if (!file) return;

      const chip = document.createElement('div');
      chip.textContent = file.name;
      document.body.append(chip);
    });

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1, method: 'drop' } });
  }, 15000);

  it('uses the native Electron file path setter for Gemini when paths are available', async () => {
    document.body.innerHTML = `
      <input type="file" accept=".pdf,.docx,.txt,.csv,image/*" />
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;

    const nativeSetter = vi.fn(async () => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const chip = document.createElement('div');
      chip.textContent = 'paper.pdf';
      document.body.append(chip);
      return { ok: true };
    });
    globalThis.aiMultiplexerSetFileInputFiles = nativeSetter;

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [{
        ...makeAttachment('paper.pdf'),
        path: '/Users/example/Documents/paper.pdf',
      }],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1, method: 'native-file-input' } });
    expect(nativeSetter).toHaveBeenCalledWith(
      expect.any(String),
      ['/Users/example/Documents/paper.pdf'],
    );
  });

  it('finds Gemini upload inputs inside open shadow roots', async () => {
    document.body.innerHTML = `
      <upload-widget></upload-widget>
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
    `;

    const host = document.querySelector('upload-widget') as HTMLElement;
    const shadow = host.attachShadow({ mode: 'open' });
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt,.csv,image/*';
    input.addEventListener('change', () => {
      const chip = document.createElement('div');
      chip.textContent = input.files?.[0]?.name ?? '';
      document.body.append(chip);
    });
    shadow.append(input);

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://gemini.google.com/app');

    expect(result).toEqual({ ok: true, provider: 'gemini', attachments: { uploaded: 1 } });
    expect(input.files?.[0]?.name).toBe('paper.pdf');
  });

  it('waits for DeepSeek send button to become enabled after upload', async () => {
    document.body.innerHTML = `
      <input type="file" multiple />
      <textarea placeholder="Message DeepSeek"></textarea>
      <button type="submit" disabled>Send</button>
    `;
    document.querySelector('input')?.addEventListener('change', () => {
      const chip = document.createElement('div');
      chip.textContent = 'paper.pdf PDF 2.09MB';
      document.body.append(chip);
    });
    const button = document.querySelector('button') as HTMLButtonElement;
    const clickSpy = vi.spyOn(button, 'click');
    setTimeout(() => {
      button.disabled = false;
    }, 2200);

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://chat.deepseek.com/');

    expect(result).toEqual({ ok: true, provider: 'deepseek', attachments: { uploaded: 1, ready: true } });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  }, 6000);

  it('waits for DeepSeek PDF processing text to disappear before sending', async () => {
    document.body.innerHTML = `
      <input type="file" multiple />
      <textarea placeholder="Message DeepSeek"></textarea>
      <div data-testid="attachment-card">paper.pdf 解析中</div>
      <button class="send-icon"></button>
    `;
    const sendButton = document.querySelector('.send-icon') as HTMLButtonElement;
    const attachmentCard = document.querySelector('[data-testid="attachment-card"]') as HTMLElement;
    const clickSpy = vi.spyOn(sendButton, 'click');

    setTimeout(() => {
      attachmentCard.textContent = 'paper.pdf PDF 2.09MB';
    }, 700);

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://chat.deepseek.com/');

    expect(result).toEqual({
      ok: true,
      provider: 'deepseek',
      attachments: { uploaded: 1, ready: true },
    });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  }, 5000);

  it('clicks DeepSeek final icon button when the send button has no label', async () => {
    document.body.innerHTML = `
      <input type="file" multiple />
      <textarea placeholder="Message DeepSeek"></textarea>
      <button>深度思考</button>
      <button>智能搜索</button>
      <button class="attach">📎</button>
      <button class="send-icon"></button>
    `;
    document.querySelector('input')?.addEventListener('change', () => {
      const chip = document.createElement('div');
      chip.textContent = 'paper.pdf PDF 2.09MB';
      document.body.append(chip);
    });
    const sendButton = document.querySelector('.send-icon') as HTMLButtonElement;
    const clickSpy = vi.spyOn(sendButton, 'click');

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://chat.deepseek.com/');

    expect(result).toEqual({ ok: true, provider: 'deepseek', attachments: { uploaded: 1, ready: true } });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('clicks the DeepSeek composer send icon instead of unrelated later icon buttons', async () => {
    document.body.innerHTML = `
      <input type="file" multiple />
      <div class="composer">
        <textarea placeholder="Message DeepSeek"></textarea>
        <button aria-label="Attach file">📎</button>
        <button class="send-icon"></button>
      </div>
      <button class="floating-more"></button>
    `;
    document.querySelector('input')?.addEventListener('change', () => {
      const chip = document.createElement('div');
      chip.textContent = 'paper.pdf PDF 2.09MB';
      document.body.append(chip);
    });

    const sendButton = document.querySelector('.send-icon') as HTMLButtonElement;
    const floatingButton = document.querySelector('.floating-more') as HTMLButtonElement;
    const sendClickSpy = vi.spyOn(sendButton, 'click');
    const floatingClickSpy = vi.spyOn(floatingButton, 'click');

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://chat.deepseek.com/');

    expect(result).toEqual({ ok: true, provider: 'deepseek', attachments: { uploaded: 1, ready: true } });
    expect(sendClickSpy).toHaveBeenCalledTimes(1);
    expect(floatingClickSpy).not.toHaveBeenCalled();
  });

  it('waits for DeepSeek final icon button instead of clicking mode controls after upload', async () => {
    document.body.innerHTML = `
      <input type="file" multiple />
      <textarea placeholder="Message DeepSeek"></textarea>
      <button>深度思考</button>
      <button>智能搜索</button>
      <button aria-label="Attach file">📎</button>
      <button class="send-icon" disabled></button>
    `;
    document.querySelector('input')?.addEventListener('change', () => {
      const chip = document.createElement('div');
      chip.textContent = 'paper.pdf PDF 2.09MB';
      document.body.append(chip);
    });

    const sendButton = document.querySelector('.send-icon') as HTMLButtonElement;
    const modeButton = Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent === '智能搜索') as HTMLButtonElement;
    const sendClickSpy = vi.spyOn(sendButton, 'click');
    const modeClickSpy = vi.spyOn(modeButton, 'click');
    setTimeout(() => {
      sendButton.disabled = false;
    }, 4200);

    const result = await injectPrompt({
      message: 'read this PDF',
      attachments: [makeAttachment('paper.pdf')],
    }, 'https://chat.deepseek.com/');

    expect(result).toEqual({ ok: true, provider: 'deepseek', attachments: { uploaded: 1, ready: true } });
    expect(modeClickSpy).not.toHaveBeenCalled();
    expect(sendClickSpy).toHaveBeenCalledTimes(1);
  }, 7000);

  it('fills DeepSeek using provider-specific detection', async () => {
    document.body.innerHTML = `
      <textarea placeholder="Message DeepSeek"></textarea>
      <button aria-label="Send message">Send</button>
    `;

    const result = await injectPrompt('explain this diff', 'https://chat.deepseek.com/');

    expect(result).toEqual({ ok: true, provider: 'deepseek' });
    expect((document.querySelector('textarea') as HTMLTextAreaElement).value).toBe('explain this diff');
  });

  it('fills GLM using provider-specific detection', async () => {
    document.body.innerHTML = `
      <div contenteditable="true"></div>
      <button aria-label="发送">Send</button>
    `;

    const result = await injectPrompt('总结这段话', 'https://chatglm.cn/main/guest');

    expect(result).toEqual({ ok: true, provider: 'glm' });
    expect(document.querySelector('[contenteditable="true"]')?.textContent).toBe('总结这段话');
  });

  it('fills Doubao using provider-specific detection', async () => {
    document.body.innerHTML = `
      <textarea placeholder="发消息给豆包"></textarea>
      <button aria-label="发送">Send</button>
    `;

    const result = await injectPrompt('介绍这篇论文', 'https://www.doubao.com/chat/');

    expect(result).toEqual({ ok: true, provider: 'doubao' });
    expect((document.querySelector('textarea') as HTMLTextAreaElement).value).toBe('介绍这篇论文');
  });

  it('fills Qwen using provider-specific detection', async () => {
    document.body.innerHTML = `
      <div class="ProseMirror" contenteditable="true"></div>
      <button aria-label="Send">Send</button>
    `;

    const result = await injectPrompt('解释这段代码', 'https://chat.qwen.ai/');

    expect(result).toEqual({ ok: true, provider: 'qwen' });
    expect(document.querySelector('.ProseMirror')?.textContent).toBe('解释这段代码');
  });
});
