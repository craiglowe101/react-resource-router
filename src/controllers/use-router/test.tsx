import { render, act } from '@testing-library/react';
import * as historyHelper from 'history';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { Router } from '../router';

import { useRouter } from './index';

jest.mock('../../common/utils/is-server-environment');

describe('useRouter()', () => {
  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.restoreAllMocks();
  });

  it('should return the public router state and actions', () => {
    let state = { location: {} };
    let actions;

    function App() {
      const router = useRouter();

      state = router[0];
      actions = router[1];

      return null;
    }

    render(<App />);

    expect(state.location).toMatchInlineSnapshot(`
      {
        "hash": "",
        "pathname": "/",
        "search": "",
      }
    `);

    expect(actions).toMatchInlineSnapshot(`
      {
        "bootstrapStore": [Function],
        "getBasePath": [Function],
        "getContext": [Function],
        "goBack": [Function],
        "goForward": [Function],
        "listen": [Function],
        "loadPlugins": [Function],
        "prefetchRoute": [Function],
        "push": [Function],
        "pushTo": [Function],
        "registerBlock": [Function],
        "replace": [Function],
        "replaceTo": [Function],
        "updatePathParam": [Function],
        "updateQueryParam": [Function],
      }
    `);
  });

  it('should update state on navigation', () => {
    const routes = [
      { path: '/a', component: () => null, name: 'a' },
      { path: '/b', component: () => null, name: 'b' },
    ];
    const history = historyHelper.createMemoryHistory({
      initialEntries: ['/a'],
    });

    let routerState: any;
    let routerActions: any;

    function App() {
      const [state, actions] = useRouter();
      routerState = state;
      routerActions = actions;

      return null;
    }

    render(
      <Router history={history} routes={routes} plugins={[]}>
        <App />
      </Router>
    );

    expect(routerState.route.name).toBe('a');
    expect(routerState.match.path).toBe('/a');

    act(() => {
      routerActions.push('/b');
    });

    expect(routerState.route.name).toBe('b');
    expect(routerState.match.path).toBe('/b');
  });

  it('should expose push and replace actions that navigate correctly', () => {
    const routes = [
      { path: '/x', component: () => null, name: 'x' },
      { path: '/y', component: () => null, name: 'y' },
    ];
    const history = historyHelper.createMemoryHistory({
      initialEntries: ['/x'],
    });

    let routerState: any;
    let routerActions: any;

    function App() {
      const [state, actions] = useRouter();
      routerState = state;
      routerActions = actions;

      return null;
    }

    render(
      <Router history={history} routes={routes} plugins={[]}>
        <App />
      </Router>
    );

    expect(routerState.route.name).toBe('x');

    act(() => {
      routerActions.replace('/y');
    });

    expect(routerState.route.name).toBe('y');
    expect(routerState.action).toBe('REPLACE');
  });
});
