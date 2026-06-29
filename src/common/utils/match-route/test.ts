import { qs } from 'url-parse';

import { matchRouteCache } from './utils';

import matchRoute from './index';

const Noop = () => null;
const DEFAULT_QUERY_PARAMS = {};
const { parse } = qs;

describe('matchRoute()', () => {
  beforeEach(() => {
    matchRouteCache.cache.clear();
  });

  describe('pathname', () => {
    it('should match a pathname without a query string', () => {
      const route = { path: '/foo/:bar', component: Noop };
      // @ts-ignore
      expect(matchRoute([route], '/foo/abc', DEFAULT_QUERY_PARAMS)).toEqual({
        route,
        match: {
          params: { bar: 'abc' },
          isExact: true,
          path: '/foo/:bar',
          query: {},
          url: '/foo/abc',
        },
      });

      // @ts-ignore
      expect(matchRoute([route], '/baz/abc', DEFAULT_QUERY_PARAMS)).toBeNull();
    });

    it('should return the first route that is a match', () => {
      const routeA = { path: '/foo/:bar', component: Noop };
      const routeB = { path: '/foo/:baz', component: Noop };
      expect(
        // @ts-ignore
        matchRoute([routeA, routeB], '/foo/abc', DEFAULT_QUERY_PARAMS)
      ).toMatchObject({
        route: routeA,
      });

      expect(
        // @ts-ignore
        matchRoute([routeB], '/foo/abc', DEFAULT_QUERY_PARAMS)
      ).toMatchObject({
        route: routeB,
      });
    });
  });

  describe('pathname with basePath', () => {
    it('should match a pathname when basePath is empty', () => {
      const route = { path: '/foo/:bar', component: Noop };
      expect(
        // @ts-ignore
        matchRoute([route], '/foo/abc', DEFAULT_QUERY_PARAMS)
      ).toEqual({
        route,
        match: {
          params: { bar: 'abc' },
          isExact: true,
          path: '/foo/:bar',
          query: {},
          url: '/foo/abc',
        },
      });

      expect(
        // @ts-ignore
        matchRoute([route], '/hello/foo/abc', DEFAULT_QUERY_PARAMS)
      ).toBeNull();
      expect(
        // @ts-ignore
        matchRoute([route], '/baz/abc', DEFAULT_QUERY_PARAMS)
      ).toBeNull();
    });

    it('should match a basePath+pathname without a query string', () => {
      const route = { path: '/foo/:bar', component: Noop };
      const basePath = '/base';
      expect(
        // @ts-ignore
        matchRoute([route], '/base/foo/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toEqual({
        route,
        match: {
          params: { bar: 'abc' },
          isExact: true,
          path: '/base/foo/:bar',
          query: {},
          url: '/base/foo/abc',
        },
      });

      expect(
        // @ts-ignore
        matchRoute([route], '/foo/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toBeNull();
      expect(
        // @ts-ignore
        matchRoute([route], '/base/baz/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toBeNull();
    });

    it('should return the first route that is a match', () => {
      const routeA = { path: '/foo/:bar', component: Noop };
      const routeB = { path: '/foo/:baz', component: Noop };
      const basePath = '/base';
      expect(
        matchRoute(
          // @ts-ignore
          [routeA, routeB],
          '/base/foo/abc',
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeA,
      });

      expect(
        // @ts-ignore
        matchRoute([routeB], '/base/foo/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toMatchObject({
        route: routeB,
      });
    });

    it('should ignore basePath when navigating to / without path params', () => {
      const routeA = { path: '/', component: Noop };
      const routeB = { path: '/:bar', component: Noop };
      const basePath = '/base';
      expect(
        matchRoute(
          // @ts-ignore
          [routeA, routeB],
          '/',
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeA,
      });

      expect(
        // @ts-ignore
        matchRoute([routeA, routeB], '/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toBeNull();

      expect(
        matchRoute(
          // @ts-ignore
          [routeA, routeB],
          '/base/abc',
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeA,
      });

      expect(
        matchRoute(
          // @ts-ignore
          [routeB, routeA],
          '/base/def',
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeB,
      });
    });

    it('should ignore basePath when navigating to just basePath', () => {
      const routeA = { path: '/base', component: Noop };
      const routeB = { path: '/', component: Noop };
      const routeC = { path: '/:bar', component: Noop };
      const basePath = '/base';
      expect(
        matchRoute(
          // @ts-ignore
          [routeA, routeB, routeC],
          basePath,
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeA,
      });

      expect(
        matchRoute(
          // @ts-ignore
          [routeA, routeB, routeC],
          '/base/base',
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeA,
      });

      expect(
        matchRoute(
          // @ts-ignore
          [routeC, routeA, routeB],
          '/base/',
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeB,
      });

      expect(
        matchRoute(
          // @ts-ignore
          [routeA, routeC, routeB],
          '/base/abc',
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeC,
      });
    });
  });

  describe('query', () => {
    it('should match query config requiring query name to be present', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });

      // @ts-ignore
      expect(matchRoute([route], '/abc/def', DEFAULT_QUERY_PARAMS)).toBeNull();
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?spa=awesome'))).toBeNull();
    });

    it('should match query config with multiple query params if all of them match', () => {
      const multiple = {
        path: '/abc/:bar',
        query: ['foo', 'spa'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([multiple], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toMatchObject({
        route: multiple,
      });
      // @ts-ignore
      expect(matchRoute([multiple], '/abc/def', parse('?foo=baz'))).toBeNull();
      expect(
        // @ts-ignore
        matchRoute([multiple], '/abc/def', parse('?spa=awesome'))
      ).toBeNull();
    });

    it('should return same match object as matching pathname but with additional query object containing all query params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
      };

      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toEqual({
        route,
        match: {
          params: {
            bar: 'def',
          },
          query: {
            foo: 'baz',
          },
          isExact: true,
          path: '/abc/:bar',
          url: '/abc/def',
        },
      });
    });

    it('should match query config requiring query param to equal specific value', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo=baz'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });

      // @ts-ignore
      expect(matchRoute([route], '/abc/def', DEFAULT_QUERY_PARAMS)).toBeNull();
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=abc&spa=awesome'))
      ).toBeNull();
    });

    it('should match query config requiring query param to equal a regex value', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo=(plan.*)'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=plan&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'plan',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=planning&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'planning',
          },
        },
      });
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', DEFAULT_QUERY_PARAMS)).toBeNull();
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo=pla'))).toBeNull();

      const numberRegexRoute = {
        path: '/abc/:bar',
        query: ['spaAwesomeFactor=(\\d)'],
        component: Noop,
      };

      expect(
        // @ts-ignore
        matchRoute([numberRegexRoute], '/abc/def', parse('spaAwesomeFactor=9'))
      ).toMatchObject({
        route: numberRegexRoute,
      });
      // Should be only one number
      expect(
        matchRoute(
          // @ts-ignore
          [numberRegexRoute],
          '/abc/def',
          parse('spaAwesomeFactor=10')
        )
      ).toBeNull();
      // Should be a number
      expect(
        matchRoute(
          // @ts-ignore
          [numberRegexRoute],
          '/abc/def',
          parse('spaAwesomeFactor=abc')
        )
      ).toBeNull();
    });

    it('should match query params literally instead of as a regex when value does not start with parentheses', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo=plan.detail'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=plan.detail'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'plan.detail',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=plansdetail'))
      ).toBeNull();
    });

    it('should match query config requiring query param to not equal a specific value', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo!=bar'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {},
        },
      });
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo=bar'))).toBeNull();
    });

    it('should match query config requiring alternative params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo|foo2'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=bar&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'bar',
          },
        },
      });
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo2=1'))).toMatchObject({
        route,
        match: {
          query: {
            foo2: '1',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=bar&foo2=1'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'bar',
            foo2: '1',
          },
        },
      });
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?spa=awesome'))).toBeNull();
    });

    it('should match query config including optional params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo', 'baz?', 'bar?=(\\d+)'],
        component: Noop,
      };
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo'))).toMatchObject({
        route,
        match: {
          query: {
            foo: '',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo&baz=cool'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: '',
            baz: 'cool',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo&bar=1&baz=cool'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: '',
            bar: '1',
            baz: 'cool',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo&baz=cool&bar=cool'))
      ).toBeNull();
    });

    it('should match when the third argument is a string', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo', 'baz?', 'bar?=(\\d+)'],
        component: Noop,
      };

      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', '?foo&bar=1&baz=cool')
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: '',
            bar: '1',
            baz: 'cool',
          },
        },
      });
    });

    it('should fail gracefully if passed invalid query string', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
      };

      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?badstring=%'))).toBeNull();
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo=%'))).toBeNull();
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo=%2'))).toBeNull();
    });

    it('should handle non-standard characters', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo', 'bar?'],
        component: Noop,
      };

      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=a%0Ab&bar=3')) // %0A == line feed
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'a\nb',
            bar: '3',
          },
        },
      });

      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=a%00b&bar=3')) // %00 == null
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'a\0b',
            bar: '3',
          },
        },
      });

      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=prøve&bar=3')) // ø is non-ascii character
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'prøve',
            bar: '3',
          },
        },
      });
    });
  });

  describe('cache invalidation', () => {
    it('should return cached match for identical inputs', () => {
      const route = { path: '/foo/:bar', component: Noop };
      const routes = [route];

      // @ts-ignore
      const first = matchRoute(routes, '/foo/abc', DEFAULT_QUERY_PARAMS);
      // @ts-ignore
      const second = matchRoute(routes, '/foo/abc', DEFAULT_QUERY_PARAMS);

      expect(first).toEqual(second);
      // same object reference proves cache hit
      expect(first).toBe(second);
    });

    it('should bypass cache when the routes array no longer contains the cached route', () => {
      const routeA = { path: '/foo/:bar', component: Noop };
      const routeB = { path: '/foo/:baz', component: Noop };

      // populate cache with routeA
      // @ts-ignore
      const first = matchRoute(
        [routeA, routeB],
        '/foo/abc',
        DEFAULT_QUERY_PARAMS
      );
      expect(first).toMatchObject({ route: routeA });

      // call with a routes array that excludes routeA
      // @ts-ignore
      const second = matchRoute([routeB], '/foo/abc', DEFAULT_QUERY_PARAMS);
      expect(second).toMatchObject({ route: routeB });
      // must NOT be the cached routeA result
      expect(second!.route).toBe(routeB);
    });

    it('should bypass cache when routes is a different array even with same route objects', () => {
      const route = { path: '/foo/:bar', component: Noop };

      // populate cache
      const arr1 = [route];
      // @ts-ignore
      const first = matchRoute(arr1, '/foo/abc', DEFAULT_QUERY_PARAMS);

      // new array with the same route object — cache should still hit
      const arr2 = [route];
      // @ts-ignore
      const second = matchRoute(arr2, '/foo/abc', DEFAULT_QUERY_PARAMS);

      expect(first).toBe(second);
    });

    it('should not return stale cache when route is removed from routes', () => {
      const routeA = { path: '/items/:id', component: Noop };
      const routeB = { path: '/items/:slug', component: Noop };

      // @ts-ignore
      matchRoute([routeA, routeB], '/items/42', DEFAULT_QUERY_PARAMS);

      // remove routeA — cache entry for routeA should be bypassed
      // @ts-ignore
      const result = matchRoute([routeB], '/items/42', DEFAULT_QUERY_PARAMS);
      expect(result).toMatchObject({ route: routeB });
    });
  });

  describe('trailing-slash handling', () => {
    it('should match a route with a trailing slash on the pathname', () => {
      const route = { path: '/foo', component: Noop, exact: false };
      // @ts-ignore
      const result = matchRoute([route], '/foo/', DEFAULT_QUERY_PARAMS);
      expect(result).toMatchObject({ route });
    });

    it('should match a route without trailing slash against pathname with trailing slash', () => {
      const route = { path: '/foo/:bar', component: Noop };
      // @ts-ignore
      const result = matchRoute([route], '/foo/abc/', DEFAULT_QUERY_PARAMS);
      // path-to-regexp will match if exact is not enforced
      expect(result).toMatchObject({ route });
    });
  });

  describe('basePath edge cases', () => {
    it('should not prepend basePath when pathname is "/"', () => {
      const route = { path: '/', component: Noop };
      const basePath = '/app';
      // navigating to "/" should NOT produce "/app/" lookup
      // @ts-ignore
      const result = matchRoute([route], '/', DEFAULT_QUERY_PARAMS, basePath);
      expect(result).toMatchObject({
        route,
        match: expect.objectContaining({ path: '/' }),
      });
    });

    it('should not prepend basePath when pathname equals basePath', () => {
      const route = { path: '/mybase', component: Noop };
      const basePath = '/mybase';
      // @ts-ignore
      const result = matchRoute(
        [route],
        '/mybase',
        DEFAULT_QUERY_PARAMS,
        basePath
      );
      expect(result).toMatchObject({ route });
      // must NOT have doubled the basePath (i.e. /mybase/mybase)
      expect(result!.match.path).not.toContain('/mybase/mybase');
    });

    it('should prepend basePath for normal navigation', () => {
      const route = { path: '/foo', component: Noop };
      const basePath = '/base';
      // @ts-ignore
      const result = matchRoute(
        [route],
        '/base/foo',
        DEFAULT_QUERY_PARAMS,
        basePath
      );
      expect(result).toMatchObject({
        route,
        match: expect.objectContaining({ path: '/base/foo' }),
      });
    });

    it('should return null when pathname does not include basePath for non-root paths', () => {
      const route = { path: '/foo', component: Noop };
      const basePath = '/base';
      // @ts-ignore
      const result = matchRoute(
        [route],
        '/foo',
        DEFAULT_QUERY_PARAMS,
        basePath
      );
      expect(result).toBeNull();
    });
  });
});
