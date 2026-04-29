import { describe, expect, it } from 'vitest';
import routing from './targetRouting.cjs';

const { matchesTarget, normalizePromptTargetsFromPayload } = routing;

describe('Electron webview target routing', () => {
  it('matches a redirected webview by webContents id instead of hostname', () => {
    const targets = normalizePromptTargetsFromPayload({
      targets: [
        {
          url: 'https://x.com/i/grok',
          webContentsId: 42,
        },
      ],
    });

    expect(matchesTarget({ id: 42, url: 'https://grok.com/' }, targets)).toBe(true);
  });

  it('does not route to another webview when a target id is provided', () => {
    const targets = normalizePromptTargetsFromPayload({
      targets: [
        {
          url: 'https://x.com/i/grok',
          webContentsId: 42,
        },
      ],
    });

    expect(matchesTarget({ id: 99, url: 'https://grok.com/' }, targets)).toBe(false);
  });

  it('falls back to hostname matching for older target URL payloads', () => {
    const targets = normalizePromptTargetsFromPayload({
      targetUrls: ['https://chatgpt.com'],
    });

    expect(matchesTarget({ id: 7, url: 'https://chatgpt.com/c/123' }, targets)).toBe(true);
  });
});
