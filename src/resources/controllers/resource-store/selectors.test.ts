import { getSliceForResource, getResourceStoreContext } from './selectors';

describe('getSliceForResource', () => {
  it('should return the slice for a given resource type and key', () => {
    const mockSlice = {
      data: 'some data',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const state = {
      data: {
        MY_TYPE: {
          'my-key': mockSlice,
        },
      },
      context: {},
    };

    const result = getSliceForResource(state as any, {
      type: 'MY_TYPE',
      key: 'my-key',
    });

    expect(result).toEqual(mockSlice);
  });

  it('should return a new object (not the same reference) for existing slices', () => {
    const mockSlice = {
      data: 'some data',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    const state = {
      data: {
        MY_TYPE: {
          'my-key': mockSlice,
        },
      },
      context: {},
    };

    const result = getSliceForResource(state as any, {
      type: 'MY_TYPE',
      key: 'my-key',
    });

    expect(result).not.toBe(mockSlice);
    expect(result).toEqual(mockSlice);
  });

  it('should return default state slice when type does not exist', () => {
    const state = {
      data: {},
      context: {},
    };

    const result = getSliceForResource(state as any, {
      type: 'NON_EXISTENT',
      key: 'some-key',
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
    expect(result.loading).toBe(false);
    expect(result.promise).toBeNull();
    expect(result.expiresAt).toEqual(expect.any(Number));
    expect(result.accessedAt).toEqual(expect.any(Number));
  });

  it('should return default state slice when key does not exist for type', () => {
    const state = {
      data: {
        MY_TYPE: {
          'other-key': { data: 'other' },
        },
      },
      context: {},
    };

    const result = getSliceForResource(state as any, {
      type: 'MY_TYPE',
      key: 'missing-key',
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
    expect(result.loading).toBe(false);
    expect(result.promise).toBeNull();
  });
});

describe('getResourceStoreContext', () => {
  it('should return the context from state', () => {
    const mockContext = { routerContext: true };
    const state = {
      data: {},
      context: mockContext,
      executing: null,
    };

    const result = getResourceStoreContext(state as any);
    expect(result).toBe(mockContext);
  });

  it('should return empty object when context is empty', () => {
    const state = {
      data: {},
      context: {},
      executing: null,
    };

    const result = getResourceStoreContext(state as any);
    expect(result).toEqual({});
  });
});
