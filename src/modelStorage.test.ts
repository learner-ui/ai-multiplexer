import { describe, expect, it } from 'vitest';
import {
  CUSTOM_MODELS_STORAGE_KEY,
  createCustomModel,
  DEFAULT_MODELS,
  loadCustomModels,
  saveCustomModels,
} from './modelStorage';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('model storage', () => {
  it('includes DeepSeek, GLM, Doubao, and Grok in the built-in model list', () => {
    expect(DEFAULT_MODELS.map((model) => model.id)).toEqual(
      expect.arrayContaining(['deepseek', 'glm', 'doubao', 'grok']),
    );
  });

  it('creates a safe custom model from a name and URL', () => {
    const model = createCustomModel({
      name: ' Perplexity ',
      url: 'perplexity.ai',
      color: 'bg-cyan-600',
      supportsGlobalPrompt: true,
    });

    expect(model).toMatchObject({
      id: 'custom-perplexity-perplexity-ai',
      name: 'Perplexity',
      url: 'https://perplexity.ai',
      color: 'bg-cyan-600',
      custom: true,
      supportsGlobalPrompt: true,
    });
  });

  it('persists valid custom models and ignores malformed stored rows', () => {
    const storage = new MemoryStorage();
    const model = createCustomModel({
      name: 'Kimi',
      url: 'https://kimi.moonshot.cn',
      color: 'bg-sky-600',
      supportsGlobalPrompt: false,
    });

    storage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify([model, { id: 'bad' }]));

    expect(loadCustomModels(storage)).toEqual([model]);

    saveCustomModels([model], storage);
    expect(JSON.parse(storage.getItem(CUSTOM_MODELS_STORAGE_KEY) ?? '[]')).toEqual([model]);
  });
});
