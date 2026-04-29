import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AIModel } from '../types';
import Workspace from './Workspace';

(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}).IS_REACT_ACT_ENVIRONMENT = true;

const paneRenderCounts = new Map<string, number>();

vi.mock('./AIPane', () => ({
  default: ({
    model,
    isFirst,
    isLast,
  }: {
    model: AIModel;
    isFirst: boolean;
    isLast: boolean;
  }) => {
    paneRenderCounts.set(model.id, (paneRenderCounts.get(model.id) ?? 0) + 1);

    return (
      <div
        data-testid="ai-pane"
        data-model-id={model.id}
        data-is-first={String(isFirst)}
        data-is-last={String(isLast)}
      >
        {model.name}
      </div>
    );
  },
}));

const gemini: AIModel = {
  id: 'gemini',
  name: 'Gemini',
  url: 'https://gemini.google.com',
  color: 'bg-blue-600',
};

const grok: AIModel = {
  id: 'custom-grok-grok-com',
  name: 'Grok',
  url: 'https://grok.com',
  color: 'bg-cyan-600',
};

function renderWorkspace(root: Root, activeModels: AIModel[]) {
  act(() => {
    root.render(
      <Workspace
        activeModels={activeModels}
        onRemoveModel={() => undefined}
        onMoveModel={() => undefined}
        getLoginProfileId={() => 'account-1'}
        getLoginProfileCount={() => 1}
        onLoginProfileChange={() => undefined}
        onLoginProfileAdd={() => undefined}
        onWebviewTargetChange={() => undefined}
      />,
    );
  });
}

function getPanelIds(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-testid="workspace-pane-shell"]'))
    .map((element) => element.getAttribute('data-model-id'));
}

function getPanelCssOrderById(container: HTMLElement) {
  return Object.fromEntries(
    Array.from(container.querySelectorAll<HTMLElement>('[data-testid="workspace-pane-shell"]'))
      .map((element) => [
        element.getAttribute('data-model-id'),
        element.style.order,
      ]),
  );
}

function getPaneRenderCount() {
  return Array.from(paneRenderCounts.values()).reduce((sum, count) => sum + count, 0);
}

describe('Workspace', () => {
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
    paneRenderCounts.clear();
  });

  it('keeps pane DOM order stable when visual model order changes', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    renderWorkspace(root, [gemini, grok]);
    expect(getPanelIds(container)).toEqual(['gemini', 'custom-grok-grok-com']);
    expect(getPanelCssOrderById(container)).toMatchObject({
      gemini: '0',
      'custom-grok-grok-com': '2',
    });

    renderWorkspace(root, [grok, gemini]);

    expect(getPanelIds(container)).toEqual(['gemini', 'custom-grok-grok-com']);
    expect(getPanelCssOrderById(container)).toMatchObject({
      gemini: '2',
      'custom-grok-grok-com': '0',
    });
  });

  it('resizes pane DOM without rerendering AI panes during pointer movement', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    renderWorkspace(root, [gemini, grok]);

    const workspace = container.querySelector<HTMLElement>('#ai-multiplexer-workspace');
    const separator = container.querySelector<HTMLElement>('[data-testid="workspace-separator"]');
    const geminiShell = container.querySelector<HTMLElement>('[data-model-id="gemini"]');

    expect(workspace).toBeTruthy();
    expect(separator).toBeTruthy();
    expect(geminiShell).toBeTruthy();

    if (!workspace || !separator || !geminiShell) return;

    workspace.getBoundingClientRect = () => ({
      bottom: 100,
      height: 100,
      left: 0,
      right: 1000,
      top: 0,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    paneRenderCounts.clear();
    expect(geminiShell.style.flexGrow).toBe('50');

    act(() => {
      separator.dispatchEvent(new MouseEvent('pointerdown', {
        bubbles: true,
        clientX: 500,
      }));
      window.dispatchEvent(new MouseEvent('pointermove', {
        bubbles: true,
        clientX: 550,
      }));
    });

    expect(geminiShell.style.flexGrow).toBe('55');
    expect(getPaneRenderCount()).toBe(0);
  });
});
