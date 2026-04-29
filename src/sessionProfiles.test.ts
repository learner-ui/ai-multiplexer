import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOGIN_PROFILE_ID,
  getLoginProfileLabel,
  getLoginProfilesForModel,
  getPartitionForLoginProfile,
  getNextLoginProfileId,
  LOGIN_PROFILE_COUNT_STORAGE_KEY,
  LOGIN_PROFILE_STORAGE_KEY,
  loadLoginProfileCounts,
  loadLoginProfileChoices,
  saveLoginProfileCounts,
  saveLoginProfileChoices,
} from './sessionProfiles';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('session login profiles', () => {
  it('uses per-model partitions for account slots', () => {
    expect(getPartitionForLoginProfile('chatgpt', 'account-1')).toBe('persist:ai-multiplexer-chatgpt-account-1');
    expect(getPartitionForLoginProfile('gemini', 'account-1')).toBe('persist:ai-multiplexer-gemini-account-1');
  });

  it('builds account slots per model', () => {
    expect(DEFAULT_LOGIN_PROFILE_ID).toBe('account-1');
    expect(getLoginProfilesForModel('chatgpt', 3)).toEqual([
      { id: 'account-1', label: '账号 1' },
      { id: 'account-2', label: '账号 2' },
      { id: 'account-3', label: '账号 3' },
    ]);
    expect(getLoginProfileLabel('account-2')).toBe('账号 2');
    expect(getNextLoginProfileId(3)).toBe('account-4');
  });

  it('persists login profile choices', () => {
    const storage = new MemoryStorage();
    const choices = { gemini: 'account-2' as const, claude: 'account-1' as const };

    saveLoginProfileChoices(choices, storage);

    expect(JSON.parse(storage.getItem(LOGIN_PROFILE_STORAGE_KEY) ?? '{}')).toEqual(choices);
    expect(loadLoginProfileChoices(storage)).toEqual(choices);
  });

  it('migrates legacy shared account choices to numbered account slots', () => {
    const storage = new MemoryStorage();
    storage.setItem(LOGIN_PROFILE_STORAGE_KEY, JSON.stringify({
      chatgpt: 'shared-b',
      gemini: 'shared-c',
      claude: 'isolated',
    }));

    expect(loadLoginProfileChoices(storage)).toEqual({
      chatgpt: 'account-2',
      gemini: 'account-3',
      claude: 'account-1',
    });
  });

  it('persists per-model account counts', () => {
    const storage = new MemoryStorage();
    const counts = { chatgpt: 3, gemini: 2 };

    saveLoginProfileCounts(counts, storage);

    expect(JSON.parse(storage.getItem(LOGIN_PROFILE_COUNT_STORAGE_KEY) ?? '{}')).toEqual(counts);
    expect(loadLoginProfileCounts(storage)).toEqual(counts);
  });
});
