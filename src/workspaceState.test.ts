import { describe, expect, it } from 'vitest';
import { createCustomModel, DEFAULT_MODELS } from './modelStorage';
import {
  ACTIVE_MODEL_IDS_STORAGE_KEY,
  getPanelLayoutStorageKey,
  getStableWorkspaceRenderIds,
  loadActiveModels,
  loadPanelLayout,
  getWorkspaceGroupKey,
  saveActiveModels,
  savePanelLayout,
} from './workspaceState';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('workspace state storage', () => {
  it('uses ChatGPT and Gemini as the first-run active model layout', () => {
    const storage = new MemoryStorage();

    expect(loadActiveModels(DEFAULT_MODELS, storage).map((model) => model.id)).toEqual([
      'chatgpt',
      'gemini',
    ]);
  });

  it('restores the saved active models in order, including custom models', () => {
    const storage = new MemoryStorage();
    const grok = createCustomModel({
      name: 'Grok',
      url: 'https://grok.com',
      color: 'bg-cyan-600',
      supportsGlobalPrompt: true,
    });
    const allModels = [...DEFAULT_MODELS, grok];

    storage.setItem(
      ACTIVE_MODEL_IDS_STORAGE_KEY,
      JSON.stringify(['chatgpt', grok.id, 'chatgpt', 'missing-model']),
    );

    expect(loadActiveModels(allModels, storage).map((model) => model.id)).toEqual([
      'chatgpt',
      grok.id,
    ]);

    saveActiveModels([grok, DEFAULT_MODELS[0]], storage);
    expect(JSON.parse(storage.getItem(ACTIVE_MODEL_IDS_STORAGE_KEY) ?? '[]')).toEqual([
      grok.id,
      'chatgpt',
    ]);
  });

  it('keeps an intentionally empty workspace empty after restart', () => {
    const storage = new MemoryStorage();

    saveActiveModels([], storage);

    expect(loadActiveModels(DEFAULT_MODELS, storage)).toEqual([]);
  });

  it('persists panel widths for a specific active model order', () => {
    const storage = new MemoryStorage();
    const modelIds = ['chatgpt', 'custom-grok-grok-com'];
    const layout = {
      chatgpt: 42,
      'custom-grok-grok-com': 58,
    };

    savePanelLayout(modelIds, layout, storage);

    expect(JSON.parse(storage.getItem(getPanelLayoutStorageKey(modelIds)) ?? '{}')).toEqual(layout);
    expect(loadPanelLayout(modelIds, storage)).toEqual(layout);
    expect(loadPanelLayout(['custom-grok-grok-com', 'chatgpt'], storage)).toBeUndefined();
  });

  it('keeps the same workspace group key when only model order changes', () => {
    expect(getWorkspaceGroupKey(['gemini', 'custom-grok-grok-com'])).toBe(
      getWorkspaceGroupKey(['custom-grok-grok-com', 'gemini']),
    );
    expect(getWorkspaceGroupKey(['gemini', 'custom-grok-grok-com'])).not.toBe(
      getWorkspaceGroupKey(['gemini', 'chatgpt']),
    );
  });

  it('retains the previous render order for existing panes when only the visual order changes', () => {
    expect(getStableWorkspaceRenderIds(
      ['custom-grok-grok-com', 'gemini'],
      ['gemini', 'custom-grok-grok-com'],
    )).toEqual([
      'gemini',
      'custom-grok-grok-com',
    ]);
  });

  it('appends newly added panes without disturbing the existing render order', () => {
    expect(getStableWorkspaceRenderIds(
      ['custom-grok-grok-com', 'chatgpt', 'gemini'],
      ['gemini', 'custom-grok-grok-com'],
    )).toEqual([
      'gemini',
      'custom-grok-grok-com',
      'chatgpt',
    ]);
  });
});
