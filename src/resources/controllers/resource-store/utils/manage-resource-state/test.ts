import {
  getPrefetchSlice,
  setPrefetchSlice,
  setResourceState,
  getResourceState,
  deleteResourceState,
} from './index';

const createMockStoreApi = (initialState: any) => {
  let state = initialState;
  const dispatched: Array<(api: any) => any> = [];
  const api: any = {
    getState: () => state,
    setState: (partial: any) => {
      state = { ...state, ...partial };
    },
    dispatch: (action: any) => {
      dispatched.push(action);

      return action(api);
    },
  };

  return { api, getState: () => state, dispatched };
};

describe('getPrefetchSlice', () => {
  it('should return a fresh prefetch slice', () => {
    const slice = {
      promise: Promise.resolve('data'),
      data: 'data',
      expiresAt: Date.now() + 10000,
    };
    const { api } = createMockStoreApi({
      prefetching: {
        MY_TYPE: { myKey: slice },
      },
    });

    const result = getPrefetchSlice('MY_TYPE', 'myKey')(api);
    expect(result).toBe(slice);
  });

  it('should return undefined when slice does not exist', () => {
    const { api } = createMockStoreApi({ prefetching: {} });

    const result = getPrefetchSlice('MISSING', 'key')(api);
    expect(result).toBeUndefined();
  });

  it('should return undefined when prefetching is null', () => {
    const { api } = createMockStoreApi({ prefetching: null });

    const result = getPrefetchSlice('TYPE', 'key')(api);
    expect(result).toBeUndefined();
  });

  it('should return undefined when type exists but key does not', () => {
    const { api } = createMockStoreApi({
      prefetching: {
        MY_TYPE: { otherKey: { data: 'x', expiresAt: Date.now() + 10000 } },
      },
    });

    const result = getPrefetchSlice('MY_TYPE', 'missingKey')(api);
    expect(result).toBeUndefined();
  });

  it('should return undefined when slice has expired', () => {
    const slice = {
      promise: Promise.resolve('data'),
      data: 'data',
      expiresAt: Date.now() - 1000,
    };
    const { api } = createMockStoreApi({
      prefetching: {
        MY_TYPE: { myKey: slice },
      },
    });

    const result = getPrefetchSlice('MY_TYPE', 'myKey')(api);
    expect(result).toBeUndefined();
  });
});

describe('setPrefetchSlice', () => {
  it('should set a prefetch slice in state', () => {
    const { api, getState } = createMockStoreApi({ prefetching: {} });
    const slice = {
      promise: Promise.resolve('data'),
      data: 'data',
      expiresAt: Date.now() + 10000,
    };

    setPrefetchSlice('MY_TYPE', 'myKey', slice)(api);

    expect(getState().prefetching).toEqual({
      MY_TYPE: { myKey: slice },
    });
  });

  it('should overwrite an existing prefetch slice', () => {
    const oldSlice = {
      promise: Promise.resolve('old'),
      data: 'old',
      expiresAt: Date.now() + 5000,
    };
    const newSlice = {
      promise: Promise.resolve('new'),
      data: 'new',
      expiresAt: Date.now() + 10000,
    };
    const { api, getState } = createMockStoreApi({
      prefetching: { MY_TYPE: { myKey: oldSlice } },
    });

    setPrefetchSlice('MY_TYPE', 'myKey', newSlice)(api);

    expect(getState().prefetching.MY_TYPE.myKey).toBe(newSlice);
  });

  it('should not update state if setting the same slice reference', () => {
    const slice = {
      promise: Promise.resolve('data'),
      data: 'data',
      expiresAt: Date.now() + 10000,
    };
    const setState = jest.fn();
    const api: any = {
      getState: () => ({ prefetching: { MY_TYPE: { myKey: slice } } }),
      setState,
      dispatch: (fn: any) => fn(api),
    };

    setPrefetchSlice('MY_TYPE', 'myKey', slice)(api);

    expect(setState).not.toHaveBeenCalled();
  });

  it('should clear a prefetch slice when set to undefined', () => {
    const slice = {
      promise: Promise.resolve('data'),
      data: 'data',
      expiresAt: Date.now() + 10000,
    };
    const { api, getState } = createMockStoreApi({
      prefetching: { MY_TYPE: { myKey: slice } },
    });

    setPrefetchSlice('MY_TYPE', 'myKey', undefined)(api);

    expect(getState().prefetching.MY_TYPE.myKey).toBeUndefined();
  });

  it('should handle null prefetching state', () => {
    const { api, getState } = createMockStoreApi({ prefetching: null });
    const slice = {
      promise: Promise.resolve('data'),
      data: 'data',
      expiresAt: Date.now() + 10000,
    };

    setPrefetchSlice('MY_TYPE', 'myKey', slice)(api);

    expect(getState().prefetching).toEqual({
      MY_TYPE: { myKey: slice },
    });
  });
});

describe('setResourceState', () => {
  it('should set resource state for a type and key', () => {
    const { api, getState } = createMockStoreApi({
      data: {},
      prefetching: null,
    });
    const resourceState = {
      data: 'value',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    setResourceState('MY_TYPE', 'myKey', resourceState as any)(api);

    expect(getState().data).toEqual({
      MY_TYPE: { myKey: resourceState },
    });
  });

  it('should preserve other keys for the same type', () => {
    const existing = {
      data: 'existing',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };
    const newState = {
      data: 'new',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };
    const { api, getState } = createMockStoreApi({
      data: { MY_TYPE: { otherKey: existing } },
      prefetching: null,
    });

    setResourceState('MY_TYPE', 'myKey', newState as any)(api);

    expect(getState().data.MY_TYPE.otherKey).toEqual(existing);
    expect(getState().data.MY_TYPE.myKey).toEqual(newState);
  });

  it('should clear prefetch slice for the same type/key', () => {
    const slice = {
      promise: Promise.resolve('x'),
      data: 'x',
      expiresAt: Date.now() + 10000,
    };
    const { api, getState } = createMockStoreApi({
      data: {},
      prefetching: { MY_TYPE: { myKey: slice } },
    });
    const resourceState = {
      data: 'value',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };

    setResourceState('MY_TYPE', 'myKey', resourceState as any)(api);

    expect(getState().prefetching.MY_TYPE.myKey).toBeUndefined();
  });
});

describe('getResourceState', () => {
  it('should return resource state for a given type and key', () => {
    const resourceState = {
      data: 'value',
      error: null,
      loading: false,
      promise: null,
      expiresAt: null,
      accessedAt: null,
    };
    const { api } = createMockStoreApi({
      data: { MY_TYPE: { myKey: resourceState } },
    });

    const result = getResourceState('MY_TYPE', 'myKey')(api);
    expect(result).toEqual(resourceState);
  });

  it('should return undefined when type does not exist', () => {
    const { api } = createMockStoreApi({ data: {} });

    const result = getResourceState('MISSING', 'key')(api);
    expect(result).toBeUndefined();
  });

  it('should return undefined when key does not exist for type', () => {
    const { api } = createMockStoreApi({
      data: { MY_TYPE: { otherKey: { data: 'x' } } },
    });

    const result = getResourceState('MY_TYPE', 'missingKey')(api);
    expect(result).toBeUndefined();
  });
});

describe('deleteResourceState', () => {
  it('should delete all data for a type when no key is provided', () => {
    const { api, getState } = createMockStoreApi({
      data: {
        MY_TYPE: { key1: { data: 'a' }, key2: { data: 'b' } },
        OTHER: { key3: { data: 'c' } },
      },
    });

    deleteResourceState('MY_TYPE')(api);

    expect(getState().data).toEqual({ OTHER: { key3: { data: 'c' } } });
    expect(getState().data.MY_TYPE).toBeUndefined();
  });

  it('should delete a specific key for a type when key is provided', () => {
    const { api, getState } = createMockStoreApi({
      data: {
        MY_TYPE: { key1: { data: 'a' }, key2: { data: 'b' } },
      },
    });

    deleteResourceState('MY_TYPE', 'key1')(api);

    expect(getState().data.MY_TYPE).toEqual({ key2: { data: 'b' } });
  });

  it('should do nothing when type does not exist and key is specified', () => {
    const initialData = {
      OTHER: { key: { data: 'x' } },
    };
    const { api, getState } = createMockStoreApi({ data: { ...initialData } });

    deleteResourceState('MISSING', 'key')(api);

    expect(getState().data).toEqual(initialData);
  });

  it('should remove entire type when key is undefined', () => {
    const { api, getState } = createMockStoreApi({
      data: {
        MY_TYPE: { key1: { data: 'a' } },
        OTHER: { key2: { data: 'b' } },
      },
    });

    deleteResourceState('MY_TYPE', undefined)(api);

    expect(getState().data).not.toHaveProperty('MY_TYPE');
    expect(getState().data).toHaveProperty('OTHER');
  });
});
