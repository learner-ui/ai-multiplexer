import { describe, expect, it } from 'vitest';
import nativeFileInputModule from './nativeFileInput.cjs';

const { getFindTaggedFileInputExpression } = nativeFileInputModule;

describe('native file input helpers', () => {
  it('builds a safe expression for locating a tagged file input', () => {
    const expression = getFindTaggedFileInputExpression('token-"quoted"');

    expect(expression).toContain('data-ai-multiplexer-file-input-token');
    expect(expression).toContain(JSON.stringify('token-"quoted"'));
    expect(expression).toContain('shadowRoot');
  });

});
