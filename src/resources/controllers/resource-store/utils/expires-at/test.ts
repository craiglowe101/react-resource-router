import { mockRouteResourceResponse } from '../../../../common/mocks';

import { getExpiresAt, setExpiresAt } from './index';

describe('getExpiresAt()', () => {
  it('should return the value passed plus the current timestamp', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(10);

    expect(getExpiresAt(100)).toEqual(110);
  });
});

describe('setExpiresAt()', () => {
  it('should return an object with expiresAt set if it was null when passed', () => {
    const mock = { ...mockRouteResourceResponse, expiresAt: null };

    jest.spyOn(global.Date, 'now').mockReturnValue(0);

    expect(setExpiresAt(mock, 10)).toEqual({
      ...mockRouteResourceResponse,
      expiresAt: 10,
    });
  });

  it('should return an object with the same expiresAt as passed if it was not null', () => {
    expect(setExpiresAt(mockRouteResourceResponse, 100)).toEqual(
      mockRouteResourceResponse
    );
  });
});

describe('getExpiresAt() boundary conditions', () => {
  it('should return current time when maxAge is 0', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(500);
    expect(getExpiresAt(0)).toEqual(500);
  });

  it('should handle large maxAge values', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(1000);
    expect(getExpiresAt(Number.MAX_SAFE_INTEGER)).toEqual(
      1000 + Number.MAX_SAFE_INTEGER
    );
  });

  it('should handle negative maxAge (already expired)', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(1000);
    expect(getExpiresAt(-500)).toEqual(500);
  });
});

describe('setExpiresAt() boundary conditions', () => {
  it('should set expiresAt when current value is null and maxAge is 0', () => {
    const mock = { ...mockRouteResourceResponse, expiresAt: null };
    jest.spyOn(global.Date, 'now').mockReturnValue(100);

    const result = setExpiresAt(mock, 0);
    expect(result.expiresAt).toEqual(100);
  });

  it('should preserve a zero expiresAt (not null)', () => {
    const mock = { ...mockRouteResourceResponse, expiresAt: 0 };
    const result = setExpiresAt(mock, 999);
    expect(result.expiresAt).toEqual(0);
  });

  it('should preserve existing expiresAt even when already expired', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(2000);
    const mock = { ...mockRouteResourceResponse, expiresAt: 500 };
    const result = setExpiresAt(mock, 100);
    expect(result.expiresAt).toEqual(500);
  });
});
