import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AIModel } from '../types';
import { ADD_LOGIN_PROFILE_VALUE } from '../sessionProfiles';
import AIPane from './AIPane';

(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}).IS_REACT_ACT_ENVIRONMENT = true;

const chatgpt: AIModel = {
  id: 'chatgpt',
  name: 'ChatGPT',
  url: 'https://chatgpt.com',
  color: 'bg-emerald-600',
};

describe('AIPane', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    container?.remove();
    root = null;
    container = null;
    vi.restoreAllMocks();
  });

  it('shows per-model account slots and no settings button', () => {
    const onLoginProfileAdd = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <AIPane
          model={chatgpt}
          onRemove={() => undefined}
          onMove={() => undefined}
          loginProfileId="account-1"
          loginProfileCount={2}
          onLoginProfileChange={() => undefined}
          onLoginProfileAdd={onLoginProfileAdd}
          onWebviewTargetChange={() => undefined}
          isFirst
          isLast
        />,
      );
    });

    expect(container.querySelector('[title="Settings"]')).toBeNull();
    expect(container.querySelector('[title="Open DevTools"]')).toBeNull();
    expect(Array.from(container.querySelectorAll('option')).map((option) => option.textContent)).toEqual([
      '账号 1',
      '账号 2',
      '+ 添加账号',
    ]);

    const select = container.querySelector('select');
    expect(select).toBeTruthy();
    if (!select) return;

    act(() => {
      select.value = ADD_LOGIN_PROFILE_VALUE;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onLoginProfileAdd).toHaveBeenCalledWith('chatgpt');
  });
});
