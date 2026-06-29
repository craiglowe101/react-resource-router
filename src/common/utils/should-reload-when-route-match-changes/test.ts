import { mockRouteContext } from '../../mocks';

import { shouldReloadWhenRouteMatchChanges } from './index';

describe('shoudl-reload-when-route-match-changes', () => {
  it('return "true" when query param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectId: '1' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectId: '2' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });

  it('return "false" when query param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectKey: '1' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectKey: '2' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });

  it('return "true" when param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { projectId: '1' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { projectId: '2' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        params: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });

  it('return "false" when param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { projectKey: '1' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { projectKey: '2' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });

  it('return "true" when multiple query params are watched and one changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectId: '1', view: 'board' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectId: '1', view: 'list' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['projectId', 'view'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });

  it('return "false" when watched query params stay the same', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectId: '1', other: 'changed' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectId: '1', other: 'original' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });

  it('return "true" when both params and query are watched and param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { id: '2' },
        query: { tab: 'info' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { id: '1' },
        query: { tab: 'info' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        params: ['id'],
        query: ['tab'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });

  it('return "false" when no params or query options are provided', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { id: '2' },
        query: { tab: 'new' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { id: '1' },
        query: { tab: 'old' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({})({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });

  it('return "false" when watched param is missing from both contexts', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: {},
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: {},
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        params: ['nonExistent'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });

  it('return "true" when watched query appears in next but not in prev', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { filter: 'active' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: {},
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['filter'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });
});
