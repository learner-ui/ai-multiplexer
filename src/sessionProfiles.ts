export type LoginProfileId = `account-${number}`;
export type LoginProfileChoices = Record<string, LoginProfileId>;
export type LoginProfileCounts = Record<string, number>;

export interface LoginProfile {
  id: LoginProfileId;
  label: string;
}

export const DEFAULT_LOGIN_PROFILE_ID: LoginProfileId = 'account-1';
export const ADD_LOGIN_PROFILE_VALUE = '__add-account__';
export const LOGIN_PROFILE_STORAGE_KEY = 'ai-multiplexer.loginProfiles.v1';
export const LOGIN_PROFILE_COUNT_STORAGE_KEY = 'ai-multiplexer.loginProfileCounts.v1';

const LEGACY_PROFILE_MIGRATIONS: Record<string, LoginProfileId> = {
  'shared-a': 'account-1',
  'shared-b': 'account-2',
  'shared-c': 'account-3',
  isolated: 'account-1',
};

function getStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function sanitizePartitionSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'model';
}

function getAccountNumber(profileId: LoginProfileId) {
  const value = Number.parseInt(profileId.replace('account-', ''), 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function normalizeProfileCount(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 1;
}

export function getPartitionForLoginProfile(modelId: string, profileId: LoginProfileId) {
  return `persist:ai-multiplexer-${sanitizePartitionSegment(modelId)}-${profileId}`;
}

export function getLoginProfileLabel(profileId: LoginProfileId) {
  return `账号 ${getAccountNumber(profileId)}`;
}

export function getLoginProfilesForModel(_modelId: string, count = 1): LoginProfile[] {
  return Array.from({ length: Math.max(1, count) }, (_item, index) => {
    const id = `account-${index + 1}` as LoginProfileId;
    return {
      id,
      label: getLoginProfileLabel(id),
    };
  });
}

export function getNextLoginProfileId(currentCount: number): LoginProfileId {
  return `account-${Math.max(1, currentCount) + 1}` as LoginProfileId;
}

export function getLoginProfileNumber(profileId: LoginProfileId) {
  return getAccountNumber(profileId);
}

function normalizeLoginProfileId(value: unknown): LoginProfileId | null {
  if (typeof value !== 'string') return null;
  if (/^account-[1-9]\d*$/.test(value)) return value as LoginProfileId;
  return LEGACY_PROFILE_MIGRATIONS[value] ?? null;
}

export function loadLoginProfileChoices(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return {};

  try {
    const rawValue = targetStorage.getItem(LOGIN_PROFILE_STORAGE_KEY);
    if (!rawValue) return {};

    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([modelId, profileId]) => [modelId, normalizeLoginProfileId(profileId)] as const)
        .filter((entry): entry is [string, LoginProfileId] => (
          typeof entry[0] === 'string' && Boolean(entry[1])
        )),
    );
  } catch {
    return {};
  }
}

export function saveLoginProfileChoices(
  choices: LoginProfileChoices,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return;

  targetStorage.setItem(LOGIN_PROFILE_STORAGE_KEY, JSON.stringify(choices));
}

export function loadLoginProfileCounts(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return {};

  try {
    const rawValue = targetStorage.getItem(LOGIN_PROFILE_COUNT_STORAGE_KEY);
    if (!rawValue) return {};

    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([modelId, count]) => [modelId, normalizeProfileCount(count)] as const)
        .filter(([modelId]) => typeof modelId === 'string'),
    );
  } catch {
    return {};
  }
}

export function saveLoginProfileCounts(
  counts: LoginProfileCounts,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return;

  targetStorage.setItem(LOGIN_PROFILE_COUNT_STORAGE_KEY, JSON.stringify(counts));
}
