import {
  RouteResourceDataForType,
  RouteResourceResponse,
  RouteResourceTimestamp,
} from '../../../../common/types';

import { getLRUResourceKey } from './index';

const mock = <T>({
  data,
  accessedAt,
  expiresAt,
}: {
  data: T;
  accessedAt: RouteResourceTimestamp;
  expiresAt: RouteResourceTimestamp;
}): RouteResourceResponse<T> => ({
  loading: false,
  error: null,
  data,
  promise: Promise.resolve(data),
  accessedAt,
  expiresAt,
});

describe('getLRUResourceKey()', () => {
  const resourceDataForTypeWithExpiredKeys: RouteResourceDataForType = {
    home: mock({
      data: 'home',
      accessedAt: 2500,
      expiresAt: 5000,
    }),
    about: mock({
      data: 'about',
      accessedAt: 500,
      expiresAt: 1000,
    }),
    shop: mock({
      data: 'shop',
      accessedAt: 2500,
      expiresAt: 3000,
    }),
  };

  const resourceDataForTypeWithNoExpiredKeys: RouteResourceDataForType = {
    home: mock({
      data: 'home',
      accessedAt: 2400,
      expiresAt: 5000,
    }),
    about: mock({
      data: 'about',
      accessedAt: 2600,
      expiresAt: 3500,
    }),
    shop: mock({
      data: 'shop',
      accessedAt: 2500,
      expiresAt: 3000,
    }),
  };

  const currentTime = 2000;

  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockReturnValue(currentTime);
  });

  it('should return null if max cache is equal to Infinity', () => {
    const key = getLRUResourceKey(
      Infinity,
      resourceDataForTypeWithExpiredKeys,
      'home'
    );
    expect(key).toBeNull();
  });

  it('should return null if max cache is less than 1', () => {
    const key = getLRUResourceKey(
      0,
      resourceDataForTypeWithExpiredKeys,
      'home'
    );
    expect(key).toBeNull();
  });

  it('should return expired key if keys for a type are less than the max cache value', () => {
    const key = getLRUResourceKey(
      2,
      resourceDataForTypeWithExpiredKeys,
      'home'
    );
    expect(key).toEqual('about');
  });

  it('should return the least recent key which is not equal to the current key if max cache is attained for a type', () => {
    expect(
      getLRUResourceKey(2, resourceDataForTypeWithNoExpiredKeys, 'home')
    ).toEqual('home');

    expect(
      getLRUResourceKey(2, resourceDataForTypeWithNoExpiredKeys, 'shop')
    ).toEqual('home');
  });

  it('should return null when keys length is below maxCache', () => {
    const key = getLRUResourceKey(
      5,
      resourceDataForTypeWithNoExpiredKeys,
      'home'
    );
    expect(key).toBeNull();
  });

  it('should return null for maxCache of -1', () => {
    const key = getLRUResourceKey(
      -1,
      resourceDataForTypeWithExpiredKeys,
      'home'
    );
    expect(key).toBeNull();
  });

  it('should return expired key before LRU when both exist', () => {
    const key = getLRUResourceKey(
      3,
      resourceDataForTypeWithExpiredKeys,
      'home'
    );
    expect(key).toEqual('about');
  });

  it('should return LRU key when maxCache is 1', () => {
    const singleEntry: RouteResourceDataForType = {
      only: mock({ data: 'only', accessedAt: 100, expiresAt: 5000 }),
    };
    jest.spyOn(global.Date, 'now').mockReturnValue(2000);

    const key = getLRUResourceKey(1, singleEntry, 'newKey');
    expect(key).toEqual('only');
  });

  it('should evict the oldest accessed key among non-expired entries', () => {
    const data: RouteResourceDataForType = {
      a: mock({ data: 'a', accessedAt: 100, expiresAt: 9999 }),
      b: mock({ data: 'b', accessedAt: 300, expiresAt: 9999 }),
      c: mock({ data: 'c', accessedAt: 200, expiresAt: 9999 }),
    };
    jest.spyOn(global.Date, 'now').mockReturnValue(500);

    const key = getLRUResourceKey(2, data, 'b');
    expect(key).toEqual('a');
  });
});
