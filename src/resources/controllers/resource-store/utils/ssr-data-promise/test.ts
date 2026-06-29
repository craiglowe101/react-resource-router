import { setSsrDataPromise } from './index';

describe('setSsrDataPromise', () => {
  it('should create a resolved promise with slice data when promise is null', () => {
    const slice = {
      data: 'test-data',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);

    expect(result.promise).toBeInstanceOf(Promise);
    expect(result.data).toBe('test-data');
    expect(result).not.toBe(slice);
  });

  it('should resolve the created promise with the slice data', async () => {
    const slice = {
      data: { key: 'value' },
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);
    const resolved = await result.promise;

    expect(resolved).toEqual({ key: 'value' });
  });

  it('should return the original slice when promise is not null', () => {
    const existingPromise = Promise.resolve('existing');
    const slice = {
      data: 'test-data',
      error: null,
      loading: false,
      promise: existingPromise,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);

    expect(result).toBe(slice);
    expect(result.promise).toBe(existingPromise);
  });

  it('should handle null data with null promise', async () => {
    const slice = {
      data: null,
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);
    const resolved = await result.promise;

    expect(resolved).toBeNull();
  });

  it('should preserve all other slice properties', () => {
    const slice = {
      data: 'data',
      error: null,
      loading: false,
      promise: null,
      expiresAt: 12345,
      accessedAt: 67890,
    };

    const result = setSsrDataPromise(slice as any);

    expect(result.data).toBe('data');
    expect(result.error).toBeNull();
    expect(result.loading).toBe(false);
    expect(result.expiresAt).toBe(12345);
    expect(result.accessedAt).toBe(67890);
  });

  it('should hydrate with undefined data when promise is null', async () => {
    const slice = {
      data: undefined,
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);

    expect(result.promise).toBeInstanceOf(Promise);
    const resolved = await result.promise;
    expect(resolved).toBeUndefined();
  });

  it('should not mutate the original slice', () => {
    const slice = {
      data: 'original',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);

    expect(slice.promise).toBeNull();
    expect(result.promise).toBeInstanceOf(Promise);
    expect(result).not.toBe(slice);
  });

  it('should preserve error state when hydrating with null promise', () => {
    const error = new Error('SSR error');
    const slice = {
      data: null,
      error,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);

    expect(result.error).toBe(error);
    expect(result.promise).toBeInstanceOf(Promise);
  });

  it('should handle complex data types during hydration', async () => {
    const complexData = {
      users: [{ id: 1, name: 'Alice' }],
      meta: { total: 100, page: 1 },
    };
    const slice = {
      data: complexData,
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);
    const resolved = await result.promise;

    expect(resolved).toBe(complexData);
    expect(resolved).toEqual({
      users: [{ id: 1, name: 'Alice' }],
      meta: { total: 100, page: 1 },
    });
  });

  it('should return original slice reference when promise already exists', () => {
    const existingPromise = Promise.resolve('data');
    const slice = {
      data: 'data',
      error: null,
      loading: true,
      promise: existingPromise,
      expiresAt: null,
      accessedAt: null,
    };

    const result = setSsrDataPromise(slice as any);
    const result2 = setSsrDataPromise(slice as any);

    expect(result).toBe(slice);
    expect(result2).toBe(slice);
  });
});
