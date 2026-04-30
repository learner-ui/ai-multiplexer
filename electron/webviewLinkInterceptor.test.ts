import { describe, expect, it } from 'vitest';
import interceptor from './webviewLinkInterceptor.cjs';

const { getExternalLinkFromClickEvent } = interceptor;

function clickEventOn(element: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
  Object.defineProperty(event, 'target', { value: element, configurable: true });
  Object.defineProperty(event, 'composedPath', { value: () => [element, document.body, document], configurable: true });
  return event;
}

describe('webview link click interception', () => {
  it('detects a normal left-click on an external answer link', () => {
    document.body.innerHTML = '<a href="https://github.com/learner-ui/ai-multiplexer"><span>repo</span></a>';
    const target = document.querySelector('span')!;
    const event = clickEventOn(target);

    expect(getExternalLinkFromClickEvent(event, 'https://chatgpt.com/c/abc')).toBe(
      'https://github.com/learner-ui/ai-multiplexer',
    );
  });

  it('ignores same-provider links so in-app navigation still works', () => {
    document.body.innerHTML = '<a href="https://chatgpt.com/gpts">GPTs</a>';
    const event = clickEventOn(document.querySelector('a')!);

    expect(getExternalLinkFromClickEvent(event, 'https://chatgpt.com/c/abc')).toBeNull();
  });

  it('ignores non-primary mouse buttons', () => {
    document.body.innerHTML = '<a href="https://github.com/learner-ui/ai-multiplexer">repo</a>';
    const event = clickEventOn(document.querySelector('a')!, { button: 1 });

    expect(getExternalLinkFromClickEvent(event, 'https://chatgpt.com/c/abc')).toBeNull();
  });
});
