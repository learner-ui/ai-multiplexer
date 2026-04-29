import type { Layout } from 'react-resizable-panels';
import type { AIModel } from './types';

export const ACTIVE_MODEL_IDS_STORAGE_KEY = 'ai-multiplexer.activeModelIds.v1';
export const PANEL_LAYOUT_STORAGE_PREFIX = 'ai-multiplexer.panelLayout.v1';

const DEFAULT_ACTIVE_MODEL_IDS = ['chatgpt', 'gemini'];
const LEGACY_DEFAULT_ACTIVE_MODEL_IDS = ['chatgpt', 'gemini', 'claude'];

function getStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function getUniqueStringArray(value: unknown) {
  if (!Array.isArray(value)) return null;

  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || ids.includes(item)) continue;
    ids.push(item);
  }

  return ids;
}

function resolveModels(ids: string[], allModels: AIModel[]) {
  return ids
    .map((id) => allModels.find((model) => model.id === id))
    .filter((model): model is AIModel => Boolean(model));
}

function haveSameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function loadActiveModels(
  allModels: AIModel[],
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return resolveModels(DEFAULT_ACTIVE_MODEL_IDS, allModels);

  try {
    const rawValue = targetStorage.getItem(ACTIVE_MODEL_IDS_STORAGE_KEY);
    if (!rawValue) return resolveModels(DEFAULT_ACTIVE_MODEL_IDS, allModels);

    const parsed = JSON.parse(rawValue);
    const ids = getUniqueStringArray(parsed);
    if (!ids) return resolveModels(DEFAULT_ACTIVE_MODEL_IDS, allModels);
    if (haveSameIds(ids, LEGACY_DEFAULT_ACTIVE_MODEL_IDS)) {
      return resolveModels(DEFAULT_ACTIVE_MODEL_IDS, allModels);
    }

    return resolveModels(ids, allModels);
  } catch {
    return resolveModels(DEFAULT_ACTIVE_MODEL_IDS, allModels);
  }
}

export function saveActiveModels(
  models: AIModel[],
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return;

  targetStorage.setItem(
    ACTIVE_MODEL_IDS_STORAGE_KEY,
    JSON.stringify(models.map((model) => model.id)),
  );
}

export function getPanelLayoutStorageKey(modelIds: string[]) {
  return `${PANEL_LAYOUT_STORAGE_PREFIX}.${modelIds.join('|')}`;
}

export function getWorkspaceGroupKey(modelIds: string[]) {
  return [...new Set(modelIds)].sort().join('|');
}

export function getStableWorkspaceRenderIds(activeIds: string[], previousIds: string[] = []) {
  const uniqueActiveIds = getUniqueStringArray(activeIds) ?? [];
  if (previousIds.length === 0) return uniqueActiveIds;

  const activeIdSet = new Set(uniqueActiveIds);
  const retainedIds: string[] = [];

  for (const id of previousIds) {
    if (!activeIdSet.has(id) || retainedIds.includes(id)) continue;
    retainedIds.push(id);
  }

  for (const id of uniqueActiveIds) {
    if (retainedIds.includes(id)) continue;
    retainedIds.push(id);
  }

  return retainedIds;
}

function isValidPanelLayout(value: unknown, modelIds: string[]): value is Layout {
  if (!value || typeof value !== 'object') return false;

  const layout = value as Record<string, unknown>;
  return modelIds.every((id) => (
    typeof layout[id] === 'number' &&
    Number.isFinite(layout[id]) &&
    layout[id] >= 0
  ));
}

export function loadPanelLayout(
  modelIds: string[],
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage || modelIds.length === 0) return undefined;

  try {
    const rawValue = targetStorage.getItem(getPanelLayoutStorageKey(modelIds));
    if (!rawValue) return undefined;

    const parsed = JSON.parse(rawValue);
    return isValidPanelLayout(parsed, modelIds) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function savePanelLayout(
  modelIds: string[],
  layout: Layout,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage || modelIds.length === 0) return;

  targetStorage.setItem(getPanelLayoutStorageKey(modelIds), JSON.stringify(layout));
}
