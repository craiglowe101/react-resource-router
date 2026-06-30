import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryHistory } from 'history';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { isServerEnvironment } from '../../common/utils/is-server-environment';
import { Router, RouteComponent, invokePluginLoad } from '../../index';
import { createResource, createResourcesPlugin, useResource } from '../index';

jest.mock('../../common/utils/is-server-environment');

const mockedIsServerEnvironment = isServerEnvironment as jest.MockedFunction<
  typeof isServerEnvironment
>;

describe('SSR integration: server-render then client-hydrate flow', () => {
  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
  });

  it('hydrates resources from serialized server data without refetching on the client', async () => {
    const getData = jest.fn(() => Promise.resolve('server-fetched-data'));

    const resource = createResource({
      type: 'SSR_RESOURCE',
      getKey: () => 'ssr-key',
      getData,
    });

    const RouteComp = () => {
      const { data, loading } = useResource(resource);

      return (
        <div>
          {loading ? 'loading' : null}
          {data ? <span data-testid="resource-data">{data}</span> : null}
        </div>
      );
    };

    const route = {
      component: RouteComp,
      name: 'ssr-route',
      path: '/ssr-path',
      resources: [resource],
    };

    const location = '/ssr-path';

    // --- Phase 1: Server-side rendering ---
    mockedIsServerEnvironment.mockReturnValue(true);

    const serverHistory = createMemoryHistory({ initialEntries: [location] });
    const serverResourcesPlugin = createResourcesPlugin({});

    invokePluginLoad([serverResourcesPlugin], {
      history: serverHistory,
      routes: [route],
    });

    const serializedResourceData =
      await serverResourcesPlugin.getSerializedResources();

    // Verify getData was called exactly once on the server
    expect(getData).toHaveBeenCalledTimes(1);

    // Verify serialized data contains the fetched value
    expect(serializedResourceData).toEqual({
      SSR_RESOURCE: {
        'ssr-key': {
          data: 'server-fetched-data',
          error: null,
          expiresAt: null,
          key: undefined,
          loading: false,
          promise: null,
          accessedAt: null,
        },
      },
    });

    // --- Phase 2: Client-side hydration ---
    // Clear stores to simulate a fresh client environment
    defaultRegistry.stores.clear();
    mockedIsServerEnvironment.mockReturnValue(false);

    const clientHistory = createMemoryHistory({ initialEntries: [location] });

    render(
      <Router
        history={clientHistory}
        plugins={[
          createResourcesPlugin({
            resourceData: serializedResourceData,
          }),
        ]}
        routes={[route]}
      >
        <RouteComponent />
      </Router>
    );

    // The resource data should be hydrated from the server cache
    await waitFor(() => {
      expect(screen.getByTestId('resource-data')).toHaveTextContent(
        'server-fetched-data'
      );
    });

    // getData should still only have been called once (on the server),
    // proving the client hydrated from cache rather than refetching
    expect(getData).toHaveBeenCalledTimes(1);
  });

  it('hydrates multiple resources from server data without refetching', async () => {
    const getDataA = jest.fn(() => Promise.resolve('data-a'));
    const getDataB = jest.fn(() => Promise.resolve('data-b'));

    const resourceA = createResource({
      type: 'RESOURCE_A',
      getKey: () => 'key-a',
      getData: getDataA,
    });

    const resourceB = createResource({
      type: 'RESOURCE_B',
      getKey: () => 'key-b',
      getData: getDataB,
    });

    const MultiComp = () => {
      const { data: dataA } = useResource(resourceA);
      const { data: dataB } = useResource(resourceB);

      return (
        <div>
          <span data-testid="data-a">{dataA}</span>
          <span data-testid="data-b">{dataB}</span>
        </div>
      );
    };

    const route = {
      component: MultiComp,
      name: 'multi-resource-route',
      path: '/multi',
      resources: [resourceA, resourceB],
    };

    const location = '/multi';

    // --- Server phase ---
    mockedIsServerEnvironment.mockReturnValue(true);

    const serverHistory = createMemoryHistory({ initialEntries: [location] });
    const serverResourcesPlugin = createResourcesPlugin({});

    invokePluginLoad([serverResourcesPlugin], {
      history: serverHistory,
      routes: [route],
    });

    const serializedResourceData =
      await serverResourcesPlugin.getSerializedResources();

    expect(getDataA).toHaveBeenCalledTimes(1);
    expect(getDataB).toHaveBeenCalledTimes(1);

    // --- Client phase ---
    defaultRegistry.stores.clear();
    mockedIsServerEnvironment.mockReturnValue(false);

    const clientHistory = createMemoryHistory({ initialEntries: [location] });

    render(
      <Router
        history={clientHistory}
        plugins={[
          createResourcesPlugin({
            resourceData: serializedResourceData,
          }),
        ]}
        routes={[route]}
      >
        <RouteComponent />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByTestId('data-a')).toHaveTextContent('data-a');
      expect(screen.getByTestId('data-b')).toHaveTextContent('data-b');
    });

    // Neither resource should have been refetched on the client
    expect(getDataA).toHaveBeenCalledTimes(1);
    expect(getDataB).toHaveBeenCalledTimes(1);
  });

  it('refetches resources that errored/timed out on the server during client hydration', async () => {
    const getData = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise(resolve => setTimeout(() => resolve('slow-data'), 500))
      )
      .mockImplementationOnce(() => Promise.resolve('client-refetched'));

    const resource = createResource({
      type: 'TIMEOUT_RESOURCE',
      getKey: () => 'timeout-key',
      getData,
    });

    const TimeoutComp = () => {
      const { data, loading, error } = useResource(resource);

      return (
        <div>
          {loading && <span data-testid="loading">loading</span>}
          {error && <span data-testid="error">{error.message}</span>}
          {data && <span data-testid="data">{data}</span>}
        </div>
      );
    };

    const route = {
      component: TimeoutComp,
      name: 'timeout-route',
      path: '/timeout',
      resources: [resource],
    };

    const location = '/timeout';

    // --- Server phase with a short timeout ---
    mockedIsServerEnvironment.mockReturnValue(true);

    const serverHistory = createMemoryHistory({ initialEntries: [location] });
    const serverResourcesPlugin = createResourcesPlugin({ timeout: 100 });

    invokePluginLoad([serverResourcesPlugin], {
      history: serverHistory,
      routes: [route],
    });

    const serializedResourceData =
      await serverResourcesPlugin.getSerializedResources();

    // The resource timed out on the server
    expect(
      serializedResourceData.TIMEOUT_RESOURCE['timeout-key'].error
    ).toEqual(expect.objectContaining({ name: 'TimeoutError' }));
    expect(getData).toHaveBeenCalledTimes(1);

    // --- Client phase: should refetch the timed-out resource ---
    defaultRegistry.stores.clear();
    mockedIsServerEnvironment.mockReturnValue(false);

    const clientHistory = createMemoryHistory({ initialEntries: [location] });

    render(
      <Router
        history={clientHistory}
        plugins={[
          createResourcesPlugin({
            resourceData: serializedResourceData,
          }),
        ]}
        routes={[route]}
      >
        <RouteComponent />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('client-refetched');
    });

    // getData called twice: once on server (timed out) and once on client (refetch)
    expect(getData).toHaveBeenCalledTimes(2);
  });

  it('preserves resource context through the SSR hydration flow', async () => {
    const getData = jest.fn((_routerContext, resourceContext) =>
      Promise.resolve(`context:${(resourceContext as any)?.tenant ?? 'none'}`)
    );

    const resource = createResource({
      type: 'CONTEXT_RESOURCE',
      getKey: () => 'ctx-key',
      getData,
    });

    const ContextComp = () => {
      const { data } = useResource(resource);

      return <span data-testid="ctx-data">{data}</span>;
    };

    const route = {
      component: ContextComp,
      name: 'context-route',
      path: '/context',
      resources: [resource],
    };

    const location = '/context';
    const resourceContext = { tenant: 'acme' };

    // --- Server phase ---
    mockedIsServerEnvironment.mockReturnValue(true);

    const serverHistory = createMemoryHistory({ initialEntries: [location] });
    const serverResourcesPlugin = createResourcesPlugin({
      context: resourceContext,
    });

    invokePluginLoad([serverResourcesPlugin], {
      history: serverHistory,
      routes: [route],
    });

    const serializedResourceData =
      await serverResourcesPlugin.getSerializedResources();

    expect(getData).toHaveBeenCalledTimes(1);
    expect(serializedResourceData.CONTEXT_RESOURCE['ctx-key'].data).toBe(
      'context:acme'
    );

    // --- Client phase with same context ---
    defaultRegistry.stores.clear();
    mockedIsServerEnvironment.mockReturnValue(false);

    const clientHistory = createMemoryHistory({ initialEntries: [location] });

    render(
      <Router
        history={clientHistory}
        plugins={[
          createResourcesPlugin({
            context: resourceContext,
            resourceData: serializedResourceData,
          }),
        ]}
        routes={[route]}
      >
        <RouteComponent />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ctx-data')).toHaveTextContent('context:acme');
    });

    // Should not refetch since data was successfully hydrated from server
    expect(getData).toHaveBeenCalledTimes(1);
  });
});
