import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as history4 from 'history';
import * as history5 from 'history-5';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import * as isServerEnvironment from '../../common/utils/is-server-environment';

import { ContainerProps } from './types';

import {
  createRouterSelector,
  getRouterState,
  getRouterStore,
  INITIAL_STATE,
  RouterContainer,
} from './index';

describe('RouterStore', () => {
  describe.each([
    ['v4', history4],
    ['v5', history5],
  ])('with history %s', (_, historyApi) => {
    const { createMemoryHistory } = historyApi;
    const location = {
      pathname: '/pages',
      search: '?key=value',
      hash: '#hash',
    };

    const routes = [
      {
        path: '/pages',
        component: () => <div>pages</div>,
        exact: true,
        name: 'pages',
      },
      {
        path: '/pages/:id',
        component: () => <div>page</div>,
        name: 'page',
      },
    ];

    function renderRouterContainer(props: Partial<ContainerProps> = {}) {
      const history = createMemoryHistory({ initialEntries: [location] });
      const listen = jest.spyOn(history, 'listen');
      const push = jest.spyOn(history, 'push');
      const replace = jest.spyOn(history, 'replace');

      const plugins = props.plugins || [];

      render(
        <RouterContainer
          history={history}
          isGlobal
          plugins={plugins}
          routes={routes}
          {...props}
        />
      );

      return {
        actions: getRouterStore().actions,
        getState: getRouterState,
        history: Object.assign({}, history, {
          listen,
          push,
          replace,
        }),
        plugins,
      };
    }

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          assign: jest.fn(),
          href: 'http://localhost:3000',
          replace: jest.fn(),
        },
      });

      jest
        .spyOn(isServerEnvironment, 'isServerEnvironment')
        .mockReturnValue(false);
    });

    afterEach(() => {
      defaultRegistry.stores.clear();
      jest.restoreAllMocks();
    });

    it('returns the default state when the container is not initialised', () => {
      expect(getRouterState()).toEqual({
        ...INITIAL_STATE,
        history: expect.objectContaining({
          block: expect.any(Function),
          createHref: expect.any(Function),
          goBack: expect.any(Function),
          goForward: expect.any(Function),
          listen: expect.any(Function),
          push: expect.any(Function),
          replace: expect.any(Function),
        }),
      });
    });

    describe('when the container is rendered', () => {
      it('calls history.listen() in a client environment', () => {
        const { history } = renderRouterContainer();

        expect(history.listen).toHaveBeenCalledTimes(1);
      });

      it('does not call history.listen() in a server environment', () => {
        jest
          .spyOn(isServerEnvironment, 'isServerEnvironment')
          .mockReturnValue(true);

        const { history } = renderRouterContainer();

        expect(history.listen).not.toHaveBeenCalled();
      });

      it('returns the expected state', () => {
        const onPrefetch = jest.fn();
        const { history, getState, plugins } = renderRouterContainer({
          onPrefetch,
        });

        expect(getState()).toMatchObject({
          ...INITIAL_STATE,
          history,
          location,
          match: {
            isExact: true,
            params: expect.any(Object),
            path: location.pathname,
            query: expect.any(Object),
            url: location.pathname,
          },
          onPrefetch,
          query: {
            key: 'value',
          },
          route: routes[0],
          routes: routes,
          unlisten: expect.any(Function),
          plugins,
        });
      });

      it('plugin routeLoad is called on initial render', () => {
        const plugin = {
          id: 'test-plugin',
          routeLoad: jest.fn(),
        };
        const plugins = [plugin];

        renderRouterContainer({
          plugins,
        });

        expect(plugin.routeLoad).toHaveBeenCalled();
      });
    });

    describe('push()', () => {
      describe.each([undefined, '/base-path'])('with %s basePath', basePath => {
        it('pushes a relative path given a relative path', async () => {
          const { actions, getState, history } = renderRouterContainer({
            basePath,
          });

          actions.push('/pages/1');

          expect(history.push).toBeCalledWith(
            `${basePath ?? ''}/pages/1`,
            undefined
          );

          expect(getState()).toMatchObject({
            action: 'PUSH',
            route: routes[1],
          });
        });

        if (!basePath) {
          it('pushes a relative path given an absolute URL on the same domain', async () => {
            const { actions, getState, history } = renderRouterContainer();

            actions.push(`http://localhost:3000${basePath ?? ''}/pages/1`);

            expect(history.push).toBeCalledWith(
              `${basePath ?? ''}/pages/1`,
              undefined
            );
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });

          it('pushes a relative path given an absolute URL on the same domain', async () => {
            const { actions, getState, history } = renderRouterContainer();

            actions.push(`http://localhost:3000/pages/1`);

            expect(history.push).toBeCalledWith('/pages/1', undefined);
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });

          it('pushes a relative Location object given a relative Location object', async () => {
            const { actions, getState, history } = renderRouterContainer();
            const nextLocation = { pathname: '/pages/1', search: '', hash: '' };

            actions.push(nextLocation);

            expect(history.push).toBeCalledWith(nextLocation, undefined);
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });

          it('plugin route load actions are called on route change', async () => {
            const plugin = {
              id: 'test-plugin',
              beforeRouteLoad: jest.fn(),
              routeLoad: jest.fn(),
            };
            const plugins = [plugin];

            const { actions } = renderRouterContainer({
              plugins,
            });
            const nextLocation = { pathname: '/pages/1', search: '', hash: '' };

            actions.push(nextLocation);

            expect(plugin.beforeRouteLoad).toBeCalledWith({
              nextContext: {
                match: {
                  isExact: true,
                  params: { id: '1' },
                  path: '/pages/:id',
                  query: {},
                  url: '/pages/1',
                },
                query: {},
                route: {
                  component: routes[1].component,
                  name: 'page',
                  path: '/pages/:id',
                },
              },
              context: {
                match: {
                  isExact: true,
                  params: {},
                  path: '/pages',
                  query: {},
                  url: '/pages',
                },
                query: { key: 'value' },
                route: {
                  component: routes[0].component,
                  exact: true,
                  name: 'pages',
                  path: '/pages',
                },
              },
            });

            // ignore onRouteLoad call on initial render and check the one after route change
            expect(plugin.routeLoad.mock.calls[1]).toEqual([
              {
                context: {
                  match: {
                    isExact: true,
                    params: { id: '1' },
                    path: '/pages/:id',
                    query: {},
                    url: '/pages/1',
                  },
                  query: {},
                  route: {
                    component: routes[1].component,
                    name: 'page',
                    path: '/pages/:id',
                  },
                },
                prevContext: {
                  match: {
                    isExact: true,
                    params: {},
                    path: '/pages',
                    query: {},
                    url: '/pages',
                  },
                  query: { key: 'value' },
                  route: {
                    component: routes[0].component,
                    exact: true,
                    name: 'pages',
                    path: '/pages',
                  },
                },
              },
            ]);
          });

          it('plugin route load actions are called only if route path/match/query change', async () => {
            const plugin = {
              id: 'test-plugin',
              beforeRouteLoad: jest.fn(),
              routeLoad: jest.fn(),
            };
            const resourcesPlugin = {
              id: 'resources-plugin',
              beforeRouteLoad: jest.fn(),
              routeLoad: jest.fn(),
            };
            const plugins = [plugin, resourcesPlugin];

            const { actions } = renderRouterContainer({
              plugins,
            });
            const nextLocation = {
              pathname: '/pages',
              search: '?a=1&b=2',
              hash: '',
            };

            actions.push(nextLocation);

            // Plugin actions would not be called as path/match/query does not change
            expect(plugin.beforeRouteLoad).not.toHaveBeenCalled();
            expect(plugin.routeLoad).toHaveBeenCalledTimes(1); // called only on router init

            // For Resources plugin keeping old behaviour
            expect(resourcesPlugin.beforeRouteLoad).toHaveBeenCalled();
            expect(resourcesPlugin.routeLoad).toHaveBeenCalledTimes(2); // called both on router init and URL change
          });
        }
      });

      it('calls location.assign given an absolute URL on a different domain', () => {
        const assign = jest.spyOn(window.location, 'assign');
        const { actions } = renderRouterContainer();

        actions.push('http://example.com');

        expect(assign).toBeCalledWith('http://example.com');
      });

      it('passes state when passed to push', () => {
        const basePath = '/base-path';
        const { actions, getState, history } = renderRouterContainer({
          basePath,
        });

        const pushedState = { ids: [1, 2, 3, 4, 5] };
        actions.push('/pages/1', pushedState);

        expect(history.push).toBeCalledWith(
          `${basePath ?? ''}/pages/1`,
          pushedState
        );

        expect(getState()).toMatchObject({
          action: 'PUSH',
          route: routes[1],
        });
        expect(getState().location?.state).toMatchObject(pushedState);
      });
    });

    describe('pushTo()', () => {
      it('pushes a relative path generated from the route and parameters', () => {
        const route = routes[1];
        const { actions, getState, history } = renderRouterContainer();

        actions.pushTo(route, { params: { id: '1' }, query: { uid: '1' } });

        expect(history.push).toBeCalledWith(
          {
            hash: '',
            pathname: '/pages/1',
            search: '?uid=1',
          },
          undefined
        );

        expect(getState()).toMatchObject({
          action: 'PUSH',
          route,
        });
      });

      it('passes state when passed to pushTo', () => {
        const route = routes[1];
        const { actions, getState, history } = renderRouterContainer();

        const pushedState = { ids: [1, 2, 3, 4, 5] };
        actions.pushTo(route, {
          params: { id: '1' },
          query: { uid: '1' },
          state: pushedState,
        });

        expect(history.push).toBeCalledWith(
          {
            hash: '',
            pathname: '/pages/1',
            search: '?uid=1',
          },
          pushedState
        );

        expect(getState()).toMatchObject({
          action: 'PUSH',
          route,
        });
        expect(getState().location?.state).toMatchObject(pushedState);
      });
    });

    describe('replace()', () => {
      describe.each([undefined, '/base-path'])('with %s basePath', basePath => {
        it('replaces a relative path given a relative path', async () => {
          const { actions, getState, history } = renderRouterContainer({
            basePath,
          });

          actions.replace('/pages/1');

          expect(history.replace).toBeCalledWith(
            `${basePath ?? ''}/pages/1`,
            undefined
          );
          expect(getState()).toMatchObject({
            action: 'REPLACE',
            route: routes[1],
          });
        });
      });

      it('replaces an absolute URL on the same domain with a relative path', () => {
        const path = 'http://localhost:3000/pages/1';
        const { actions, getState, history } = renderRouterContainer();

        actions.replace(path);

        expect(history.replace).toBeCalledWith('/pages/1', undefined);
        expect(getState()).toMatchObject({
          action: 'REPLACE',
          route: routes[1],
        });
      });

      it('calls window.location.replace with an absolute URL on a different domain', () => {
        const replace = jest.spyOn(window.location, 'replace');
        const { actions } = renderRouterContainer();

        actions.replace('http://example.com');

        expect(replace).toBeCalledWith('http://example.com');
      });

      it('it passes state to replace', () => {
        const path = 'http://localhost:3000/pages/1';
        const { actions, getState, history } = renderRouterContainer();

        const pushedState = { ids: [1, 2, 3, 4, 5] };
        actions.replace(path, pushedState);

        expect(history.replace).toBeCalledWith('/pages/1', pushedState);
        expect(getState()).toMatchObject({
          action: 'REPLACE',
          route: routes[1],
        });
        expect(getState().location?.state).toMatchObject(pushedState);
      });
    });

    describe('replaceTo()', () => {
      it('replaces a route and parameters with a relative path', () => {
        const route = routes[1];
        const { actions, getState, history } = renderRouterContainer();

        actions.replaceTo(route, { params: { id: '1' }, query: { uid: '1' } });

        expect(history.replace).toBeCalledWith(
          {
            hash: '',
            pathname: '/pages/1',
            search: '?uid=1',
          },
          undefined
        );

        expect(getState()).toMatchObject({
          action: 'REPLACE',
          route,
        });
      });

      it('it passes state to replaceTo', () => {
        const route = routes[1];
        const { actions, getState, history } = renderRouterContainer();

        const pushedState = { ids: [1, 2, 3, 4, 5] };
        actions.replaceTo(route, {
          params: { id: '1' },
          query: { uid: '1' },
          state: pushedState,
        });

        expect(history.replace).toBeCalledWith(
          {
            hash: '',
            pathname: '/pages/1',
            search: '?uid=1',
          },
          pushedState
        );

        expect(getState()).toMatchObject({
          action: 'REPLACE',
          route,
        });
        expect(getState().location?.state).toMatchObject(pushedState);
      });
    });

    describe('goBack()', () => {
      it('navigates back in history', () => {
        const hist = createMemoryHistory({ initialEntries: [location] });
        const { actions, getState } = renderRouterContainer({
          history: hist,
        });

        // push a new entry so there is something to go back to
        actions.push('/pages/1');
        expect(getState().location.pathname).toBe('/pages/1');

        actions.goBack();

        expect(getState().location.pathname).toBe('/pages');
      });
    });

    describe('goForward()', () => {
      it('navigates forward in history', () => {
        const hist = createMemoryHistory({ initialEntries: [location] });
        const { actions, getState } = renderRouterContainer({
          history: hist,
        });

        // push, then go back, then go forward
        actions.push('/pages/1');
        actions.goBack();
        expect(getState().location.pathname).toBe('/pages');

        actions.goForward();

        expect(getState().location.pathname).toBe('/pages/1');
      });
    });

    describe('history listener shape', () => {
      it('updates state correctly when history fires a location change', () => {
        const { actions, getState } = renderRouterContainer();

        // push triggers the history listener internally
        actions.push('/pages/1');

        const state = getState();
        expect(state.location.pathname).toBe('/pages/1');
        expect(state.action).toBe('PUSH');
        expect(state.route).toBe(routes[1]);
        expect(state.match.params).toEqual({ id: '1' });
      });

      it('handles replace action through the listener', () => {
        const { actions, getState } = renderRouterContainer();

        actions.replace('/pages/1');

        const state = getState();
        expect(state.location.pathname).toBe('/pages/1');
        expect(state.action).toBe('REPLACE');
        expect(state.route).toBe(routes[1]);
      });
    });

    describe('plugin lifecycle ordering', () => {
      it('fires beforeRouteLoad, then setState, then routeLoad in order', () => {
        const callOrder: string[] = [];

        const plugin = {
          id: 'ordering-plugin',
          beforeRouteLoad: jest.fn(() => {
            callOrder.push('beforeRouteLoad');
          }),
          routeLoad: jest.fn(() => {
            callOrder.push('routeLoad');
          }),
        };

        const { actions, getState } = renderRouterContainer({
          plugins: [plugin],
        });

        // reset call order after initial render
        callOrder.length = 0;
        plugin.beforeRouteLoad.mockClear();
        plugin.routeLoad.mockClear();

        actions.push({ pathname: '/pages/1', search: '', hash: '' });

        expect(plugin.beforeRouteLoad).toHaveBeenCalledTimes(1);
        expect(plugin.routeLoad).toHaveBeenCalledTimes(1);

        // beforeRouteLoad must fire before routeLoad
        expect(callOrder).toEqual(['beforeRouteLoad', 'routeLoad']);

        // state should reflect the new route after the batch
        expect(getState().route).toBe(routes[1]);
      });

      it('fires plugin hooks for multiple plugins in registration order', () => {
        const callOrder: string[] = [];

        const pluginA = {
          id: 'plugin-a',
          beforeRouteLoad: jest.fn(() => callOrder.push('A:beforeRouteLoad')),
          routeLoad: jest.fn(() => callOrder.push('A:routeLoad')),
        };
        const pluginB = {
          id: 'plugin-b',
          beforeRouteLoad: jest.fn(() => callOrder.push('B:beforeRouteLoad')),
          routeLoad: jest.fn(() => callOrder.push('B:routeLoad')),
        };

        const { actions } = renderRouterContainer({
          plugins: [pluginA, pluginB],
        });

        callOrder.length = 0;
        actions.push({ pathname: '/pages/1', search: '', hash: '' });

        expect(callOrder).toEqual([
          'A:beforeRouteLoad',
          'B:beforeRouteLoad',
          'A:routeLoad',
          'B:routeLoad',
        ]);
      });
    });

    describe('shouldReloadByPlugin gating', () => {
      it('does not call plugin hooks when route/match/query are unchanged for non-resources plugins', () => {
        const plugin = {
          id: 'custom-plugin',
          beforeRouteLoad: jest.fn(),
          routeLoad: jest.fn(),
        };

        const { actions } = renderRouterContainer({ plugins: [plugin] });
        plugin.beforeRouteLoad.mockClear();
        plugin.routeLoad.mockClear();

        // push to the same path — route/match/query do not change
        actions.push({
          pathname: '/pages',
          search: '?key=value',
          hash: '#hash',
        });

        expect(plugin.beforeRouteLoad).not.toHaveBeenCalled();
        // routeLoad should also not be called for non-resources plugins
        expect(plugin.routeLoad).not.toHaveBeenCalled();
      });

      it('calls plugin hooks for resources-plugin even when route/match are unchanged', () => {
        const resourcesPlugin = {
          id: 'resources-plugin',
          beforeRouteLoad: jest.fn(),
          routeLoad: jest.fn(),
        };

        const { actions } = renderRouterContainer({
          plugins: [resourcesPlugin],
        });
        resourcesPlugin.beforeRouteLoad.mockClear();
        resourcesPlugin.routeLoad.mockClear();

        // push to same route with different query
        actions.push({ pathname: '/pages', search: '?a=1', hash: '' });

        expect(resourcesPlugin.beforeRouteLoad).toHaveBeenCalled();
        expect(resourcesPlugin.routeLoad).toHaveBeenCalled();
      });

      it('calls plugin hooks for all plugins when the route changes', () => {
        const customPlugin = {
          id: 'custom-plugin',
          beforeRouteLoad: jest.fn(),
          routeLoad: jest.fn(),
        };
        const resourcesPlugin = {
          id: 'resources-plugin',
          beforeRouteLoad: jest.fn(),
          routeLoad: jest.fn(),
        };

        const { actions } = renderRouterContainer({
          plugins: [customPlugin, resourcesPlugin],
        });
        customPlugin.beforeRouteLoad.mockClear();
        customPlugin.routeLoad.mockClear();
        resourcesPlugin.beforeRouteLoad.mockClear();
        resourcesPlugin.routeLoad.mockClear();

        actions.push({ pathname: '/pages/1', search: '', hash: '' });

        expect(customPlugin.beforeRouteLoad).toHaveBeenCalledTimes(1);
        expect(customPlugin.routeLoad).toHaveBeenCalledTimes(1);
        expect(resourcesPlugin.beforeRouteLoad).toHaveBeenCalledTimes(1);
        expect(resourcesPlugin.routeLoad).toHaveBeenCalledTimes(1);
      });
    });

    describe('SSR branching', () => {
      it('does not call history.listen() in a server environment during bootstrap', () => {
        jest
          .spyOn(isServerEnvironment, 'isServerEnvironment')
          .mockReturnValue(true);

        const { history } = renderRouterContainer();

        expect(history.listen).not.toHaveBeenCalled();
      });

      it('does not call loadPlugins in a server environment', () => {
        jest
          .spyOn(isServerEnvironment, 'isServerEnvironment')
          .mockReturnValue(true);

        const plugin = {
          id: 'test-ssr-plugin',
          routeLoad: jest.fn(),
        };

        renderRouterContainer({ plugins: [plugin] });

        // routeLoad is only called via loadPlugins on init in non-server env
        expect(plugin.routeLoad).not.toHaveBeenCalled();
      });

      it('sets unlisten to null in a server environment', () => {
        jest
          .spyOn(isServerEnvironment, 'isServerEnvironment')
          .mockReturnValue(true);

        const { getState } = renderRouterContainer();

        expect(getState().unlisten).toBeNull();
      });

      it('sets unlisten to a function in a client environment', () => {
        const { getState } = renderRouterContainer();

        expect(getState().unlisten).toEqual(expect.any(Function));
      });
    });

    describe('createRouterSelector()', () => {
      it('should return selected state', () => {
        const routeNameSelector = jest
          .fn()
          .mockImplementation(s => s.route.name);

        const useRouteName = createRouterSelector(routeNameSelector);
        const RouteName = () => <>{useRouteName()}</>;

        const route = {
          component: () => <p>home</p>,
          name: 'home',
          path: '',
        };

        render(
          <RouterContainer
            history={createMemoryHistory()}
            plugins={[]}
            routes={[route]}
          >
            <RouteName />
          </RouterContainer>
        );

        expect(routeNameSelector).toBeCalledWith(
          expect.objectContaining({ route }),
          undefined
        );
        expect(screen.getByText('home')).toBeInTheDocument();
      });

      it('should pass through single hook argument to selector', () => {
        const routeNameSelector = jest
          .fn()
          .mockImplementation(s => s.route.name);

        const useRouteName = createRouterSelector(routeNameSelector);

        const RouteName = ({ argument }: { argument: unknown }) => (
          <>{useRouteName(argument)}</>
        );

        const route = {
          component: () => <p>home</p>,
          name: 'home',
          path: '',
        };

        render(
          <RouterContainer
            history={createMemoryHistory()}
            plugins={[]}
            routes={[route]}
          >
            <RouteName argument="bar" />
          </RouterContainer>
        );

        expect(routeNameSelector).toBeCalledWith(
          expect.objectContaining({ route }),
          'bar'
        );
        expect(screen.getByText('home')).toBeInTheDocument();
      });
    });
  });
});
