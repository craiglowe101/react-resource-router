import { getValidLinkType } from './get-valid-link-type';

describe('getValidLinkType', () => {
  it('should return "a" when type is "a"', () => {
    expect(getValidLinkType('a')).toBe('a');
  });

  it('should return "button" when type is "button"', () => {
    expect(getValidLinkType('button')).toBe('button');
  });

  it('should default to "a" for invalid types', () => {
    // @ts-expect-error testing invalid input
    expect(getValidLinkType('div')).toBe('a');
  });

  it('should default to "a" for empty string', () => {
    // @ts-expect-error testing invalid input
    expect(getValidLinkType('')).toBe('a');
  });

  it('should default to "a" for other HTML element types', () => {
    // @ts-expect-error testing invalid input
    expect(getValidLinkType('span')).toBe('a');
    // @ts-expect-error testing invalid input
    expect(getValidLinkType('input')).toBe('a');
  });
});
