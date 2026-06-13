import { getResourceStore } from '../controllers/resource-store';

import { createResourcesPlugin, PLUGIN_ID } from './index';

const firstContextMock = {
  match: {
    isExact: true,
    params: {},
    path: '/pages',
    query: {},
    url: '/pages',
  },
  query: { key: 'value' },
  route: {
    component: () => null,
    exact: true,
    name: 'pages',
    path: '/pages',
  },
};

const secondContextMock = {
  match: {
    isExact: true,
    params: { id: '1' },
    path: '/pages/:id',
    query: {},
    url: '/pages/1',
  },
  query: {},
  route: {
    component: () => null,
    name: 'page',
    path: '/pages/:id',
  },
};

describe('Resources plugin - extended', () => {
  it('has the correct plugin ID', () => {
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    expect(plugin.id).toBe(PLUGIN_ID);
    expect(plugin.id).toBe('resources-plugin');
  });

  it('hydrates initial context and data on creation', () => {
    const hydrate = jest.spyOn(getResourceStore().actions, 'hydrate');
    const context = { someContext: true };
    const resourceData = { TYPE: { key: { data: 'value' } } };

    createResourcesPlugin({
      context: context as any,
      resourceData: resourceData as any,
    });

    expect(hydrate).toHaveBeenCalledWith({
      resourceContext: context,
      resourceData,
    });
  });

  it('hydrates with undefined when no initial values provided', () => {
    const hydrate = jest.spyOn(getResourceStore().actions, 'hydrate');

    createResourcesPlugin({});

    expect(hydrate).toHaveBeenCalledWith({
      resourceContext: undefined,
      resourceData: undefined,
    });
  });

  it('getLatestResources returns resolved promise initially', async () => {
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    const result = await (plugin as any).getLatestResources();
    expect(result).toEqual([]);
  });

  it('getSerializedResources returns safe data from store', async () => {
    const mockSafeData = { TYPE: { key: { data: 'safe' } } };
    const getSafeData = jest.spyOn(getResourceStore().actions, 'getSafeData');
    getSafeData.mockReturnValue(mockSafeData as any);

    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    const result = await plugin.getSerializedResources();
    expect(result).toEqual(mockSafeData);
    getSafeData.mockRestore();
  });

  it('getLatestResources returns result from routeLoad with prevContext', async () => {
    const mockPromise = Promise.resolve([{ data: 'resource' }]);
    const requestResources = jest.spyOn(
      getResourceStore().actions,
      'requestResources'
    );
    requestResources.mockReturnValue([mockPromise] as any);

    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    if (plugin.routeLoad !== undefined) {
      plugin.routeLoad({
        context: secondContextMock,
        prevContext: firstContextMock,
      });
    }

    const result = await (plugin as any).getLatestResources();
    expect(result).toBeDefined();

    requestResources.mockRestore();
  });

  it('routeLoad calls requestAllResources when no prevContext (initial load)', () => {
    const requestAllResources = jest.spyOn(
      getResourceStore().actions,
      'requestAllResources'
    );
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
      timeout: 5000,
    });

    if (plugin.routeLoad !== undefined)
      plugin.routeLoad({
        context: secondContextMock,
      });

    expect(requestAllResources).toHaveBeenCalledWith(secondContextMock, {
      timeout: 5000,
    });
    requestAllResources.mockRestore();
  });

  it('routeLoad calls requestResources when prevContext exists (navigation)', () => {
    const requestResources = jest.spyOn(
      getResourceStore().actions,
      'requestResources'
    );
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    if (plugin.routeLoad !== undefined)
      plugin.routeLoad({
        context: secondContextMock,
        prevContext: firstContextMock,
      });

    expect(requestResources).toHaveBeenCalledWith([], secondContextMock, {});
    requestResources.mockRestore();
  });

  it('beforeRouteLoad calls cleanExpiredResources with next resources', () => {
    const cleanExpiredResources = jest.spyOn(
      getResourceStore().actions,
      'cleanExpiredResources'
    );
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    if (plugin.beforeRouteLoad !== undefined) {
      plugin.beforeRouteLoad({
        context: firstContextMock,
        nextContext: secondContextMock,
      });
    }

    expect(cleanExpiredResources).toHaveBeenCalledWith([], secondContextMock);
    cleanExpiredResources.mockRestore();
  });

  it('routePrefetch calls prefetchResources with next context', () => {
    const prefetchResources = jest.spyOn(
      getResourceStore().actions,
      'prefetchResources'
    );
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    if (plugin.routePrefetch !== undefined) {
      plugin.routePrefetch({
        context: firstContextMock,
        nextContext: secondContextMock,
      });
    }

    expect(prefetchResources).toHaveBeenCalledWith([], secondContextMock, {});
    prefetchResources.mockRestore();
  });
});
