import { isServerEnvironment } from './index';

describe('isServerEnvironment', () => {
  it('should return true in jsdom (test) environment', () => {
    expect(isServerEnvironment()).toBe(true);
  });

  it('should return true when window is undefined', () => {
    const originalWindow = globalThis.window;
    // @ts-ignore
    delete globalThis.window;

    expect(isServerEnvironment()).toBe(true);

    globalThis.window = originalWindow;
  });

  it('should return true when process.versions.node is defined', () => {
    expect(typeof process.versions.node).toBe('string');
    expect(isServerEnvironment()).toBe(true);
  });

  it('should return true when navigator userAgent includes jsdom', () => {
    expect(navigator.userAgent).toContain('jsdom');
    expect(isServerEnvironment()).toBe(true);
  });
});
