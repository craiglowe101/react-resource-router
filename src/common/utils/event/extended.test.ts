import { isKeyboardEvent, isModifiedEvent } from './index';

describe('isKeyboardEvent - extended', () => {
  it('returns true for keydown events', () => {
    expect(isKeyboardEvent({ type: 'keydown' })).toBe(true);
  });

  it('returns true for keyup events', () => {
    expect(isKeyboardEvent({ type: 'keyup' })).toBe(true);
  });

  it('returns true for keypress events', () => {
    expect(isKeyboardEvent({ type: 'keypress' })).toBe(true);
  });

  it('returns false for click events', () => {
    expect(isKeyboardEvent({ type: 'click' })).toBe(false);
  });

  it('returns false for mousedown events', () => {
    expect(isKeyboardEvent({ type: 'mousedown' })).toBe(false);
  });

  it('returns false for mouseup events', () => {
    expect(isKeyboardEvent({ type: 'mouseup' })).toBe(false);
  });

  it('returns false for touchstart events', () => {
    expect(isKeyboardEvent({ type: 'touchstart' })).toBe(false);
  });

  it('returns false for focus events', () => {
    expect(isKeyboardEvent({ type: 'focus' })).toBe(false);
  });

  it('returns false for empty type', () => {
    expect(isKeyboardEvent({ type: '' })).toBe(false);
  });

  it('returns false for undefined type', () => {
    expect(isKeyboardEvent({ type: undefined })).toBe(false);
  });
});

describe('isModifiedEvent - extended', () => {
  it('should return false for an event with no modifiers', () => {
    expect(isModifiedEvent({})).toBe(false);
  });

  it('should return true when multiple modifiers are present', () => {
    expect(isModifiedEvent({ metaKey: true, shiftKey: true })).toBe(true);
  });

  it('should return false when all modifier keys are explicitly false', () => {
    expect(
      isModifiedEvent({
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
      })
    ).toBe(false);
  });

  it('should return false when modifier keys are undefined', () => {
    expect(
      isModifiedEvent({
        metaKey: undefined,
        altKey: undefined,
        ctrlKey: undefined,
        shiftKey: undefined,
      })
    ).toBe(false);
  });

  it('should return false when modifier keys are 0', () => {
    expect(
      isModifiedEvent({
        metaKey: 0,
        altKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
      })
    ).toBe(false);
  });
});
