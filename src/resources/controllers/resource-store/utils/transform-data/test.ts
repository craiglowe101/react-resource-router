import { transformData } from './index';

describe('transformData()', () => {
  it('should transform the supplied data with the transformer function passed', () => {
    const staticProps = { promise: null, error: null, loading: false };
    const transformFrom = {
      data: { hello: 'world' },
      expiresAt: Infinity,
      accessedAt: 0,
    };
    const transformTo = {
      data: { goodbye: 'cruel world' },
      expiresAt: 1000,
      accessedAt: 0,
    };
    const data = {
      type: {
        key: {
          ...staticProps,
          ...transformFrom,
        },
      },
    };
    const transformed = transformData(data, slice => ({
      ...slice,
      ...transformTo,
    }));

    expect(transformed).toEqual({
      type: {
        key: {
          ...staticProps,
          ...transformTo,
        },
      },
    });
  });

  it('should handle empty data object', () => {
    const data = {};
    const transformed = transformData(data, slice => slice);
    expect(transformed).toEqual({});
  });

  it('should transform multiple types and keys', () => {
    const staticProps = { promise: null, error: null, loading: false };
    const slice1 = {
      data: 'a',
      expiresAt: 100,
      accessedAt: 0,
    };
    const slice2 = {
      data: 'b',
      expiresAt: 200,
      accessedAt: 0,
    };
    const data = {
      typeA: {
        key1: { ...staticProps, ...slice1 },
      },
      typeB: {
        key2: { ...staticProps, ...slice2 },
      },
    };
    const transformed = transformData(data, slice => ({
      ...slice,
      accessedAt: 999,
    }));

    expect(transformed.typeA.key1.accessedAt).toBe(999);
    expect(transformed.typeB.key2.accessedAt).toBe(999);
  });

  it('should apply identity transformer without changes', () => {
    const staticProps = { promise: null, error: null, loading: false };
    const data = {
      type: {
        key: {
          ...staticProps,
          data: 'unchanged',
          expiresAt: 1000,
          accessedAt: 0,
        },
      },
    };
    const transformed = transformData(data, slice => slice);

    expect(transformed).toEqual(data);
  });

  it('should handle a type with multiple keys', () => {
    const staticProps = { promise: null, error: null, loading: false };
    const data = {
      users: {
        admin: { ...staticProps, data: 'admin', expiresAt: 100, accessedAt: 0 },
        guest: { ...staticProps, data: 'guest', expiresAt: 200, accessedAt: 0 },
      },
    };
    const transformed = transformData(data, slice => ({
      ...slice,
      data: null,
    }));

    expect(transformed.users.admin.data).toBeNull();
    expect(transformed.users.guest.data).toBeNull();
  });

  it('should not mutate the original data', () => {
    const staticProps = { promise: null, error: null, loading: false };
    const data = {
      type: {
        key: {
          ...staticProps,
          data: 'original',
          expiresAt: 100,
          accessedAt: 0,
        },
      },
    };
    transformData(data, slice => ({
      ...slice,
      data: 'mutated',
    }));

    expect(data.type.key.data).toBe('original');
  });
});
