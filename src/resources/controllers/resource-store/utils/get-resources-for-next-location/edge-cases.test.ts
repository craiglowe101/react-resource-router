import { createResource } from '../create-resource';

import { getResourcesForNextLocation } from './index';

const mockMatch = {
  params: {},
  query: {},
  isExact: false,
  path: '',
  url: '',
};

const mockResource = createResource({
  type: 'TEST_RESOURCE',
  getKey: () => 'key',
  getData: () => Promise.resolve('data'),
});

const mockResourceStoreContext = {};

describe('getResourcesForNextLocation() edge cases', () => {
  it('should handle null nextRoute gracefully', () => {
    const prevRouterStoreContext = {
      route: {
        name: 'prev',
        path: '/prev',
        resources: [mockResource],
      },
      match: mockMatch,
      query: {},
    };
    const nextRouterStoreContext = {
      route: null,
      match: mockMatch,
      query: {},
    };

    const result = getResourcesForNextLocation(
      prevRouterStoreContext as any,
      nextRouterStoreContext as any,
      mockResourceStoreContext
    );

    expect(result).toEqual([]);
  });

  it('should return empty array when next route has empty resources array', () => {
    const prevRouterStoreContext = {
      route: {
        name: 'prev',
        path: '/prev',
        resources: [mockResource],
      },
      match: mockMatch,
      query: {},
    };
    const nextRouterStoreContext = {
      route: {
        name: 'next',
        path: '/next',
        resources: [],
      },
      match: mockMatch,
      query: {},
    };

    const result = getResourcesForNextLocation(
      prevRouterStoreContext as any,
      nextRouterStoreContext as any,
      mockResourceStoreContext
    );

    expect(result).toEqual([]);
  });

  it('should handle route without resources property on prevRoute', () => {
    const prevRouterStoreContext = {
      route: {
        name: 'prev',
        path: '/prev',
        // no resources property
      },
      match: mockMatch,
      query: {},
    };
    const nextRouterStoreContext = {
      route: {
        name: 'next',
        path: '/next',
        resources: [mockResource],
      },
      match: mockMatch,
      query: {},
    };

    const result = getResourcesForNextLocation(
      prevRouterStoreContext as any,
      nextRouterStoreContext as any,
      mockResourceStoreContext
    );

    // Route changed (different path) so all next resources returned
    expect(result).toEqual([mockResource]);
  });

  it('should return only changed resources when same route but different match params', () => {
    const keyedResource = createResource({
      type: 'KEYED',
      getKey: ({ match }: { match: any }) => match.params.id || '',
      getData: () => Promise.resolve('data'),
    });
    const staticResource = createResource({
      type: 'STATIC',
      getKey: () => 'static-key',
      getData: () => Promise.resolve('static'),
    });

    const route = {
      name: 'detail',
      path: '/items/:id',
      resources: [keyedResource, staticResource],
    };

    const prevRouterStoreContext = {
      route,
      match: { ...mockMatch, params: { id: '1' } },
      query: {},
    };
    const nextRouterStoreContext = {
      route,
      match: { ...mockMatch, params: { id: '2' } },
      query: {},
    };

    const result = getResourcesForNextLocation(
      prevRouterStoreContext as any,
      nextRouterStoreContext as any,
      mockResourceStoreContext
    );

    // Only the keyed resource should change since its key depends on params
    expect(result).toEqual([keyedResource]);
  });

  it('should return no resources when same route and same match params', () => {
    const staticResource = createResource({
      type: 'STATIC',
      getKey: () => 'static-key',
      getData: () => Promise.resolve('static'),
    });

    const route = {
      name: 'list',
      path: '/items',
      resources: [staticResource],
    };

    const prevRouterStoreContext = {
      route,
      match: mockMatch,
      query: {},
    };
    const nextRouterStoreContext = {
      route,
      match: mockMatch,
      query: {},
    };

    const result = getResourcesForNextLocation(
      prevRouterStoreContext as any,
      nextRouterStoreContext as any,
      mockResourceStoreContext
    );

    // No resources changed because key is the same
    expect(result).toEqual([]);
  });
});
