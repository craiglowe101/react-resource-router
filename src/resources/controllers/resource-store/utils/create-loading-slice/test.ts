import { TimeoutError } from '../timeout-error';

import { DEFAULT_PREFETCH_MAX_AGE } from './constants';

import { createLoadingSlice } from './index';

describe('createLoadingSlice', () => {
  const baseResource = {
    type: 'test-resource',
    getKey: () => 'key',
    maxAge: 0,
    getData: jest.fn(),
    maxCache: 100,
    isBrowserOnly: false,
    depends: null,
  };

  const baseRouterStoreContext = {
    route: { path: '/test', name: 'test', component: () => null },
    match: {
      params: {},
      isExact: true,
      path: '/test',
      url: '/test',
      query: {},
    },
    query: {},
  };

  const baseContext = {};
  const baseDependencies = () => ({});

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('async getData', () => {
    it('should return a slice with a promise when getData returns a promise', () => {
      const resource = {
        ...baseResource,
        getData: jest.fn(() => Promise.resolve('async-data')),
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(slice.promise).toBeInstanceOf(Promise);
      expect(slice.data).toBeUndefined();
      expect(slice.expiresAt).toEqual(expect.any(Number));
    });

    it('should resolve the promise with getData result', async () => {
      const resource = {
        ...baseResource,
        getData: jest.fn(() => Promise.resolve('resolved-value')),
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      const result = await slice.promise;
      expect(result).toBe('resolved-value');
    });
  });

  describe('sync getData', () => {
    it('should return data synchronously when getData returns a non-promise', () => {
      const resource = {
        ...baseResource,
        getData: jest.fn(() => 'sync-data'),
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(slice.data).toBe('sync-data');
      expect(slice.promise).toBeInstanceOf(Promise);
    });

    it('should wrap sync data in a resolved promise', async () => {
      const resource = {
        ...baseResource,
        getData: jest.fn(() => 'sync-value'),
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      const result = await slice.promise;
      expect(result).toBe('sync-value');
    });
  });

  describe('getData error handling', () => {
    it('should catch thrown errors from getData and convert to rejected promise', async () => {
      const thrownError = new Error('getData exploded');
      const resource = {
        ...baseResource,
        getData: jest.fn(() => {
          throw thrownError;
        }),
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(slice.promise).toBeInstanceOf(Promise);
      await expect(slice.promise).rejects.toThrow('getData exploded');
    });
  });

  describe('getData context', () => {
    it('should pass routerStoreContext with isPrefetch=false by default', () => {
      const getData = jest.fn(() => 'data');
      const resource = { ...baseResource, getData };

      createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(getData).toHaveBeenCalledWith(
        expect.objectContaining({
          isPrefetch: false,
          route: baseRouterStoreContext.route,
          match: baseRouterStoreContext.match,
          query: baseRouterStoreContext.query,
        }),
        baseContext
      );
    });

    it('should set isPrefetch=true when prefetch option is truthy', () => {
      const getData = jest.fn(() => 'data');
      const resource = { ...baseResource, getData };

      createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: { prefetch: true },
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(getData).toHaveBeenCalledWith(
        expect.objectContaining({ isPrefetch: true }),
        baseContext
      );
    });

    it('should pass dependencies to getData', () => {
      const getData = jest.fn(() => 'data');
      const resource = { ...baseResource, getData };
      const deps = { dep1: { data: 'dep-data' } };

      createLoadingSlice({
        context: baseContext,
        dependencies: () => deps as any,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(getData).toHaveBeenCalledWith(
        expect.objectContaining({ dependencies: deps }),
        baseContext
      );
    });
  });

  describe('expiry', () => {
    it('should calculate expiresAt based on resource maxAge', () => {
      const now = Date.now();
      const resource = { ...baseResource, maxAge: 5000, getData: () => 'data' };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(slice.expiresAt).toBeGreaterThanOrEqual(now + 5000);
      expect(slice.expiresAt).toBeLessThanOrEqual(now + 5100);
    });

    it('should use DEFAULT_RESOURCE_MAX_AGE when resource has no maxAge', () => {
      const now = Date.now();
      const resource = {
        ...baseResource,
        maxAge: undefined as any,
        getData: () => 'data',
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: {},
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(slice.expiresAt).toBeGreaterThanOrEqual(now);
      expect(slice.expiresAt).toBeLessThanOrEqual(now + 100);
    });

    it('should use longer of resource maxAge and DEFAULT_PREFETCH_MAX_AGE when prefetching', () => {
      const now = Date.now();
      const resource = { ...baseResource, maxAge: 1000, getData: () => 'data' };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: { prefetch: true },
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(slice.expiresAt).toBeGreaterThanOrEqual(
        now + DEFAULT_PREFETCH_MAX_AGE
      );
    });

    it('should keep resource maxAge when it is longer than prefetch max age', () => {
      const now = Date.now();
      const longMaxAge = DEFAULT_PREFETCH_MAX_AGE + 30000;
      const resource = {
        ...baseResource,
        maxAge: longMaxAge,
        getData: () => 'data',
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: { prefetch: true },
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      expect(slice.expiresAt).toBeGreaterThanOrEqual(now + longMaxAge);
    });
  });

  describe('timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should race getData against timeout when timeout option is provided', async () => {
      const resource = {
        ...baseResource,
        getData: jest.fn(
          () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
        ),
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: { timeout: 50 },
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      jest.advanceTimersByTime(50);

      await expect(slice.promise).rejects.toThrow(TimeoutError);
    });

    it('should resolve normally when getData completes before timeout', async () => {
      const resource = {
        ...baseResource,
        getData: jest.fn(() => Promise.resolve('fast-data')),
      };

      const slice = createLoadingSlice({
        context: baseContext,
        dependencies: baseDependencies,
        options: { timeout: 5000 },
        resource,
        routerStoreContext: baseRouterStoreContext,
      });

      const result = await slice.promise;
      expect(result).toBe('fast-data');
    });
  });
});
