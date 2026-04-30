import { describe, expect, it } from 'vitest';
import routing from './navigationRouting.cjs';

const { shouldKeepNavigationInWebview, shouldOpenInExternalBrowser } = routing;

describe('Electron webview navigation routing', () => {
  it('opens answer links to unrelated sites in the external browser', () => {
    expect(shouldOpenInExternalBrowser(
      'https://chatgpt.com/c/abc',
      'https://github.com/learner-ui/ai-multiplexer',
    )).toBe(true);

    expect(shouldOpenInExternalBrowser(
      'https://gemini.google.com/app',
      'https://arxiv.org/abs/2501.12345',
    )).toBe(true);
  });

  it('keeps same-provider navigation inside the current webview', () => {
    expect(shouldKeepNavigationInWebview(
      'https://chatgpt.com/c/abc',
      'https://chatgpt.com/gpts',
    )).toBe(true);

    expect(shouldKeepNavigationInWebview(
      'https://grok.com/',
      'https://x.com/i/grok',
    )).toBe(true);

    expect(shouldKeepNavigationInWebview(
      'https://chat.qwen.ai/',
      'https://chat.qwen.ai/c/123',
    )).toBe(true);
  });

  it('keeps known login flows inside the current webview', () => {
    expect(shouldKeepNavigationInWebview(
      'https://gemini.google.com/app',
      'https://accounts.google.com/v3/signin/identifier',
    )).toBe(true);

    expect(shouldKeepNavigationInWebview(
      'https://claude.ai/login',
      'https://appleid.apple.com/auth/authorize',
    )).toBe(true);
  });

  it('does not send non-http protocols through the external http-link path', () => {
    expect(shouldOpenInExternalBrowser(
      'https://chatgpt.com/c/abc',
      'mailto:hello@example.com',
    )).toBe(false);
  });
});
