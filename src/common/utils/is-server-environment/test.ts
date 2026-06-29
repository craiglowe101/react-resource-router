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

  it('should return true when navigator userAgent includes Node.js', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Node.js/v16.0.0',
      configurable: true,
    });

    expect(isServerEnvironment()).toBe(true);

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });

  it('should return true when window.name is nodejs', () => {
    const originalName = window.name;
    window.name = 'nodejs';

    expect(isServerEnvironment()).toBe(true);

    window.name = originalName;
  });

  it('should return false in a browser-like environment', () => {
    const originalProcess = globalThis.process;
    const originalUA = navigator.userAgent;

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Chrome/91.0',
      configurable: true,
    });
    window.name = '';
    // @ts-ignore
    delete globalThis.process;

    expect(isServerEnvironment()).toBe(false);

    globalThis.process = originalProcess;
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });
});
