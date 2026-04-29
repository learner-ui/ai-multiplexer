import { describe, expect, it } from 'vitest';
import { createPromptBroadcastBatches } from './promptBroadcast';
import type { AIModel, PromptAttachment } from './types';

const chatgpt: AIModel = {
  id: 'chatgpt',
  name: 'ChatGPT',
  url: 'https://chatgpt.com',
  color: 'bg-green-600',
};

const gemini: AIModel = {
  id: 'gemini',
  name: 'Gemini',
  url: 'https://gemini.google.com',
  color: 'bg-blue-600',
};

const attachment: PromptAttachment = {
  id: 'paper',
  name: 'paper.pdf',
  type: 'application/pdf',
  size: 3,
  data: new Uint8Array([1, 2, 3]).buffer,
  path: '/private/tmp/paper.pdf',
};

describe('createPromptBroadcastBatches', () => {
  it('sends attachments to normal models and text-only payloads to manual handoff models', () => {
    const batches = createPromptBroadcastBatches({
      activeModels: [chatgpt, gemini],
      webviewTargetsByModel: {
        chatgpt: { url: 'https://chatgpt.com/', webContentsId: 10 },
        gemini: { url: 'https://gemini.google.com/app', webContentsId: 11 },
      },
      attachments: [attachment],
      skipAttachmentModelIds: ['gemini'],
    });

    expect(batches).toEqual([
      {
        targets: [{ url: 'https://chatgpt.com/', webContentsId: 10 }],
        attachments: [attachment],
      },
      {
        targets: [{ url: 'https://gemini.google.com/app', webContentsId: 11 }],
        attachments: [],
      },
    ]);
  });
});
