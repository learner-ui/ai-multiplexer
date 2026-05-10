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

  beforeEach(() => {
    // noop: localStorage not required for the current UI surface.
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

  it('stages attachments through Electron and previews them in the tray', async () => {
    const stageAttachments = vi.fn(async (attachments: PromptAttachment[]) => attachments.map((attachment) => ({
      ...attachment,
      path: '/private/tmp/ai-multiplexer-attachment-staging/batch/paper.pdf',
    })));

    window.electronAPI = {
      isElectron: true,
      getWebviewPreloadPath: () => '',
      getPathForFile: () => '/Users/example/Documents/paper.pdf',
      broadcastPrompt: vi.fn(),
      broadcastNewChat: vi.fn(),
      openExternal: vi.fn(),
      clearLoginProfileData: vi.fn(),
      stageAttachments,
    } satisfies ElectronAPI;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<GlobalInput onSend={() => undefined} onNewChat={() => undefined} activeCount={2} />);
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

    expect(stageAttachments).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'paper.pdf' })],
    );

    const trayItem = container.querySelector<HTMLElement>('[data-testid="attachment-tray-item"]');
    expect(trayItem).toBeTruthy();
    expect(trayItem?.textContent).toContain('paper.pdf');
  });

  it('broadcasts attachments to every provider (including Gemini) now that paste-first injection is available', async () => {
    const onSend = vi.fn();
    window.electronAPI = {
      isElectron: true,
      getWebviewPreloadPath: () => '',
      getPathForFile: () => '/Users/example/Documents/paper.pdf',
      broadcastPrompt: vi.fn(),
      broadcastNewChat: vi.fn(),
      openExternal: vi.fn(),
      clearLoginProfileData: vi.fn(),
      stageAttachments: vi.fn(async (attachments: PromptAttachment[]) => attachments.map((attachment) => ({
        ...attachment,
        path: '/private/tmp/ai-multiplexer-attachment-staging/batch/paper.pdf',
      }))),
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
      { skipAttachmentModelIds: [] },
    );
  });

  it('does not render the attachment folder button any more', async () => {
    window.electronAPI = {
      isElectron: true,
      getWebviewPreloadPath: () => '',
      getPathForFile: () => '/Users/example/Documents/paper.pdf',
      broadcastPrompt: vi.fn(),
      broadcastNewChat: vi.fn(),
      openExternal: vi.fn(),
      clearLoginProfileData: vi.fn(),
      stageAttachments: vi.fn(),
    } satisfies ElectronAPI;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<GlobalInput onSend={() => undefined} onNewChat={() => undefined} activeCount={2} />);
    });

    expect(container.querySelector('[data-testid="attachment-folder-button"]')).toBeNull();
  });
});
