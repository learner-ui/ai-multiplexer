import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ElectronAPI } from '../electron';
import type { PromptAttachment } from '../types';
import GlobalInput from './GlobalInput';

(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}).IS_REACT_ACT_ENVIRONMENT = true;

function setFileInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: files,
  });
}

describe('GlobalInput', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  let localStorageValues: Map<string, string>;

  beforeEach(() => {
    localStorageValues = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => localStorageValues.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageValues.set(key, value);
        }),
        clear: vi.fn(() => {
          localStorageValues.clear();
        }),
      },
    });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    container?.remove();
    root = null;
    container = null;
    vi.restoreAllMocks();
    delete window.electronAPI;
  });

  it('stages attachment tray files and exposes Finder handoff actions', async () => {
    const startFileDrag = vi.fn();
    const showItemInFolder = vi.fn();
    const onSend = vi.fn();
    window.electronAPI = {
      isElectron: true,
      getWebviewPreloadPath: () => '',
      getPathForFile: () => '/Users/learner/Documents/paper.pdf',
      broadcastPrompt: vi.fn(),
      broadcastNewChat: vi.fn(),
      openExternal: vi.fn(),
      stageAttachments: vi.fn(async (attachments: PromptAttachment[]) => attachments.map((attachment) => ({
        ...attachment,
        originalPath: attachment.path,
        path: '/private/tmp/ai-multiplexer-attachment-tray/paper.pdf',
      }))),
      selectAttachmentFolder: vi.fn(),
      showItemInFolder,
      startFileDrag,
    } satisfies ElectronAPI;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<GlobalInput onSend={onSend} onNewChat={() => undefined} activeCount={2} />);
    });

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).toBeTruthy();
    if (!fileInput) return;

    setFileInputFiles(fileInput, [
      new File(['hello'], 'paper.pdf', { type: 'application/pdf' }),
    ]);

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const trayItem = container.querySelector<HTMLElement>('[data-testid="attachment-tray-item"]');
    expect(trayItem).toBeTruthy();
    expect(trayItem?.getAttribute('draggable')).toBe('true');

    const revealButton = container.querySelector<HTMLButtonElement>('[data-testid="attachment-reveal-button"]');
    expect(revealButton).toBeTruthy();

    act(() => {
      revealButton?.click();
    });

    expect(showItemInFolder).toHaveBeenCalledWith('/private/tmp/ai-multiplexer-attachment-tray/paper.pdf');

    const dragEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragEvent, 'dataTransfer', {
      configurable: true,
      value: {
        effectAllowed: '',
        setData: vi.fn(),
      },
    });

    act(() => {
      trayItem?.dispatchEvent(dragEvent);
    });

    expect(startFileDrag).toHaveBeenCalledWith(['/private/tmp/ai-multiplexer-attachment-tray/paper.pdf']);

    const textarea = container.querySelector<HTMLTextAreaElement>('textarea');
    expect(textarea).toBeTruthy();
    if (!textarea) return;

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      )?.set;
      valueSetter?.call(textarea, '解析这个论文');
      textarea.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        data: '解析这个论文',
        inputType: 'insertText',
      }));
    });

    await act(async () => {
      container?.querySelector<HTMLFormElement>('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
    });

    expect(onSend).toHaveBeenCalledWith(
      '解析这个论文',
      [expect.objectContaining({ name: 'paper.pdf' })],
      { skipAttachmentModelIds: ['gemini'] },
    );
  });

  it('always sends Gemini text-only when attachments are present', async () => {
    const onSend = vi.fn();
    window.electronAPI = {
      isElectron: true,
      getWebviewPreloadPath: () => '',
      getPathForFile: () => '/Users/learner/Documents/paper.pdf',
      broadcastPrompt: vi.fn(),
      broadcastNewChat: vi.fn(),
      openExternal: vi.fn(),
      stageAttachments: vi.fn(async (attachments: PromptAttachment[]) => attachments.map((attachment) => ({
        ...attachment,
        originalPath: attachment.path,
        path: '/Users/learner/AI Attachments/paper.pdf',
      }))),
      selectAttachmentFolder: vi.fn(),
      showItemInFolder: vi.fn(),
      startFileDrag: vi.fn(),
    } satisfies ElectronAPI;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<GlobalInput onSend={onSend} onNewChat={() => undefined} activeCount={2} />);
    });

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    const textarea = container.querySelector<HTMLTextAreaElement>('textarea');
    expect(fileInput).toBeTruthy();
    expect(textarea).toBeTruthy();
    if (!fileInput || !textarea) return;

    setFileInputFiles(fileInput, [
      new File(['hello'], 'paper.pdf', { type: 'application/pdf' }),
    ]);

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      )?.set;
      valueSetter?.call(textarea, '总结这个文件');
      textarea.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        data: '总结这个文件',
        inputType: 'insertText',
      }));
    });

    await act(async () => {
      container?.querySelector<HTMLFormElement>('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
    });

    expect(onSend).toHaveBeenCalledWith(
      '总结这个文件',
      [expect.objectContaining({ name: 'paper.pdf' })],
      { skipAttachmentModelIds: ['gemini'] },
    );
  });

  it('uses the selected user-managed tray folder for new attachments', async () => {
    const selectedFolder = '/Users/learner/AI Attachments';
    const stageAttachments = vi.fn(async (attachments: PromptAttachment[]) => attachments);
    const selectAttachmentFolder = vi.fn(async () => selectedFolder);

    window.electronAPI = {
      isElectron: true,
      getWebviewPreloadPath: () => '',
      getPathForFile: () => '/Users/learner/Documents/paper.pdf',
      broadcastPrompt: vi.fn(),
      broadcastNewChat: vi.fn(),
      openExternal: vi.fn(),
      stageAttachments,
      selectAttachmentFolder,
      showItemInFolder: vi.fn(),
      startFileDrag: vi.fn(),
    } satisfies ElectronAPI;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<GlobalInput onSend={() => undefined} onNewChat={() => undefined} activeCount={2} />);
    });

    const trayFolderButton = container.querySelector<HTMLButtonElement>('[data-testid="attachment-folder-button"]');
    expect(trayFolderButton).toBeTruthy();
    expect(trayFolderButton?.title).toContain('聊天文件夹');
    expect(trayFolderButton?.title).not.toContain('暂存');

    await act(async () => {
      trayFolderButton?.click();
    });

    expect(selectAttachmentFolder).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('ai-multiplexer.attachmentTrayFolder.v1')).toBe(
      JSON.stringify(selectedFolder),
    );

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).toBeTruthy();
    if (!fileInput) return;

    setFileInputFiles(fileInput, [
      new File(['hello'], 'paper.pdf', { type: 'application/pdf' }),
    ]);

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(stageAttachments).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'paper.pdf' })],
      selectedFolder,
    );
  });

  it('loads the persisted tray folder on startup', async () => {
    const selectedFolder = '/Users/learner/Persistent Attachments';
    const stageAttachments = vi.fn(async (attachments: PromptAttachment[]) => attachments);
    window.localStorage.setItem(
      'ai-multiplexer.attachmentTrayFolder.v1',
      JSON.stringify(selectedFolder),
    );

    window.electronAPI = {
      isElectron: true,
      getWebviewPreloadPath: () => '',
      getPathForFile: () => '/Users/learner/Documents/paper.pdf',
      broadcastPrompt: vi.fn(),
      broadcastNewChat: vi.fn(),
      openExternal: vi.fn(),
      stageAttachments,
      selectAttachmentFolder: vi.fn(),
      showItemInFolder: vi.fn(),
      startFileDrag: vi.fn(),
    } satisfies ElectronAPI;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<GlobalInput onSend={() => undefined} onNewChat={() => undefined} activeCount={2} />);
    });

    const trayFolderButton = container.querySelector<HTMLButtonElement>('[data-testid="attachment-folder-button"]');
    expect(trayFolderButton?.title).toContain(selectedFolder);
    expect(trayFolderButton?.title).toContain('聊天文件夹');
    expect(trayFolderButton?.title).not.toContain('暂存');

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).toBeTruthy();
    if (!fileInput) return;

    setFileInputFiles(fileInput, [
      new File(['hello'], 'paper.pdf', { type: 'application/pdf' }),
    ]);

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(stageAttachments).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'paper.pdf' })],
      selectedFolder,
    );
  });
});
