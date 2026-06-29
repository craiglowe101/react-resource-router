import { render, act } from '@testing-library/react';
import * as historyHelper from 'history';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { Router } from '../router';
import { getRouterStore } from '../router-store';

import { useRouterActions } from './index';

jest.mock('../../common/utils/is-server-environment');

describe('useRouterActions()', () => {
  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.restoreAllMocks();
  });

  it('should return the public router actions', () => {
    let routerActions;

    function App() {
      routerActions = useRouterActions();

      return null;
    }

    render(<App />);

    expect(routerActions).toMatchInlineSnapshot(`
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

  it('should push navigation without causing re-render in the actions-only hook consumer', () => {
    const routes = [
      { path: '/a', component: () => null, name: 'a' },
      { path: '/b', component: () => null, name: 'b' },
    ];
    const history = historyHelper.createMemoryHistory({
      initialEntries: ['/a'],
    });

    let renderCount = 0;
    let actions: any;

    function ActionsOnly() {
      actions = useRouterActions();
      renderCount++;

      return null;
    }

    render(
      <Router history={history} routes={routes} plugins={[]}>
        <ActionsOnly />
      </Router>
    );

    expect(renderCount).toBe(1);

    act(() => {
      actions.push('/b');
    });

    // Actions-only hook should not re-render on route change
    expect(renderCount).toBe(1);

    const { storeState } = getRouterStore();
    expect(storeState.getState().route.name).toBe('b');
  });

  it('should support replace navigation', () => {
    const routes = [
      { path: '/c', component: () => null, name: 'c' },
      { path: '/d', component: () => null, name: 'd' },
    ];
    const history = historyHelper.createMemoryHistory({
      initialEntries: ['/c'],
    });

    let actions: any;

    function ActionsOnly() {
      actions = useRouterActions();

      return null;
    }

    render(
      <Router history={history} routes={routes} plugins={[]}>
        <ActionsOnly />
      </Router>
    );

    act(() => {
      actions.replace('/d');
    });

    const { storeState } = getRouterStore();
    expect(storeState.getState().route.name).toBe('d');
    expect(storeState.getState().action).toBe('REPLACE');
  });
});
