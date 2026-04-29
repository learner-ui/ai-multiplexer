import { describe, expect, it } from 'vitest';
import userAgentModule from './userAgent.cjs';

const {
  getBrowserLikeUserAgent,
  getGeminiCompatibleRequestHeaders,
  getGeminiCompatibleUserAgent,
} = userAgentModule;

function getExpectedClientHintPlatform() {
  if (process.platform === 'darwin') return 'macOS';
  if (process.platform === 'win32') return 'Windows';
  if (process.platform === 'linux') return 'Linux';
  return 'Unknown';
}

describe('Electron user agent helpers', () => {
  it('removes the Electron product token from Chromium user agents', () => {
    expect(getBrowserLikeUserAgent(
      'Mozilla/5.0 AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36 Electron/41.3.0',
    )).toBe(
      'Mozilla/5.0 AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36',
    );
  });

  it('normalizes Gemini user agents to look like standard Chrome', () => {
    expect(getGeminiCompatibleUserAgent(
      'Mozilla/5.0 AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36 Electron/41.3.0 Edg/142.0.0.0 OPR/117.0.0.0 Brave/1.80.120',
    )).toBe(
      'Mozilla/5.0 AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36',
    );
  });

  it('strips extra app product tokens from Gemini user agents', () => {
    expect(getGeminiCompatibleUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Electron/41.3.0 AI-Multiplexer/0.0.0',
    )).toBe(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    );
  });

  it('builds Gemini-compatible request headers from the normalized user agent', () => {
    expect(getGeminiCompatibleRequestHeaders(
      'Mozilla/5.0 AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36 Electron/41.3.0 Edg/142.0.0.0',
      'zh-CN,zh,en-US,en',
    )).toEqual({
      'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh,en-US,en',
      'Sec-CH-UA': '"Google Chrome";v="142", "Chromium";v="142", "Not=A?Brand";v="24"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': `"${getExpectedClientHintPlatform()}"`,
    });
  });
});
