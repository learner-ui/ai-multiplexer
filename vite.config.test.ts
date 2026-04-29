import { describe, expect, it } from 'vitest';
import config from './vite.config';

describe('Vite production asset paths', () => {
  it('uses relative asset URLs so Electron can load the packaged renderer over file://', () => {
    expect(config.base).toBe('./');
  });
});
