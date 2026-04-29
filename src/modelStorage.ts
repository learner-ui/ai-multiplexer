import { AVAILABLE_MODELS } from './types';
import type { AIModel } from './types';

export const CUSTOM_MODELS_STORAGE_KEY = 'ai-multiplexer.customModels.v1';
export const DEFAULT_MODELS = AVAILABLE_MODELS;

export const CUSTOM_MODEL_COLORS = [
  'bg-cyan-600',
  'bg-pink-600',
  'bg-sky-600',
  'bg-lime-700',
  'bg-rose-600',
  'bg-violet-600',
] as const;

interface CustomModelInput {
  name: string;
  url: string;
  color: string;
  supportsGlobalPrompt: boolean;
  newChatUrl?: string;
}

function getStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function normalizeUrl(rawUrl: string) {
  const withProtocol = /^https?:\/\//i.test(rawUrl.trim())
    ? rawUrl.trim()
    : `https://${rawUrl.trim()}`;
  const url = new URL(withProtocol);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported.');
  }

  return url.toString().replace(/\/$/, '');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'model';
}

function isValidModel(value: unknown): value is AIModel {
  if (!value || typeof value !== 'object') return false;

  const model = value as Partial<AIModel>;
  return (
    typeof model.id === 'string' &&
    model.id.startsWith('custom-') &&
    typeof model.name === 'string' &&
    typeof model.url === 'string' &&
    typeof model.color === 'string' &&
    model.custom === true
  );
}

export function createCustomModel(input: CustomModelInput): AIModel {
  const name = normalizeName(input.name);
  const url = normalizeUrl(input.url);
  const trimmedNewChatUrl = input.newChatUrl?.trim() ?? '';
  const newChatUrl = trimmedNewChatUrl ? normalizeUrl(trimmedNewChatUrl) : undefined;

  if (!name) {
    throw new Error('Name is required.');
  }

  return {
    id: `custom-${slugify(name)}-${slugify(new URL(url).hostname)}`,
    name,
    url,
    color: input.color,
    custom: true,
    supportsGlobalPrompt: input.supportsGlobalPrompt,
    ...(newChatUrl ? { newChatUrl } : {}),
  };
}

export function loadCustomModels(storage?: Pick<Storage, 'getItem' | 'setItem'>): AIModel[] {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return [];

  try {
    const rawValue = targetStorage.getItem(CUSTOM_MODELS_STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidModel);
  } catch {
    return [];
  }
}

export function saveCustomModels(
  models: AIModel[],
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return;

  targetStorage.setItem(
    CUSTOM_MODELS_STORAGE_KEY,
    JSON.stringify(models.filter((model) => model.custom)),
  );
}
