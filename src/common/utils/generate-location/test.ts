import { generateLocationFromPath } from './index';

describe('generateLocationFromPath', () => {
  it('should return root location with defaults', () => {
    const location = generateLocationFromPath();

    expect(location).toEqual({
      pathname: '/',
      search: '',
      hash: '',
    });
  });

  it('should return root location when pattern is /', () => {
    const location = generateLocationFromPath('/');

    expect(location).toEqual({
      pathname: '/',
      search: '',
      hash: '',
    });
  });

  it('should compile path with params', () => {
    const location = generateLocationFromPath('/users/:id', {
      params: { id: '42' },
    });

    expect(location).toEqual({
      pathname: '/users/42',
      search: '',
      hash: '',
    });
  });

  it('should compile path with multiple params', () => {
    const location = generateLocationFromPath('/users/:userId/posts/:postId', {
      params: { userId: '1', postId: '99' },
    });

    expect(location).toEqual({
      pathname: '/users/1/posts/99',
      search: '',
      hash: '',
    });
  });

  it('should generate query string from query params', () => {
    const location = generateLocationFromPath('/search', {
      query: { q: 'hello', page: '2' },
    });

    expect(location.pathname).toBe('/search');
    expect(location.search).toContain('q=hello');
    expect(location.search).toContain('page=2');
    expect(location.search).toMatch(/^\?/);
  });

  it('should prepend basePath to pathname', () => {
    const location = generateLocationFromPath('/dashboard', {
      basePath: '/app',
    });

    expect(location).toEqual({
      pathname: '/app/dashboard',
      search: '',
      hash: '',
    });
  });

  it('should prepend basePath when pattern is root /', () => {
    const location = generateLocationFromPath('/', {
      basePath: '/app',
    });

    expect(location).toEqual({
      pathname: '/app/',
      search: '',
      hash: '',
    });
  });

  it('should combine basePath, params, and query', () => {
    const location = generateLocationFromPath('/items/:id', {
      basePath: '/store',
      params: { id: '5' },
      query: { view: 'detail' },
    });

    expect(location.pathname).toBe('/store/items/5');
    expect(location.search).toBe('?view=detail');
    expect(location.hash).toBe('');
  });

  it('should handle empty query object', () => {
    const location = generateLocationFromPath('/page', {
      query: {},
    });

    expect(location.search).toBe('');
  });

  it('should handle empty params object', () => {
    const location = generateLocationFromPath('/static-path', {
      params: {},
    });

    expect(location.pathname).toBe('/static-path');
  });

  it('should handle special characters in query values', () => {
    const location = generateLocationFromPath('/search', {
      query: { q: 'hello world' },
    });

    expect(location.search).toContain('q=hello');
  });

  it('should always set hash to empty string', () => {
    const location = generateLocationFromPath('/page', {
      params: {},
      query: { tab: 'info' },
      basePath: '/base',
    });

    expect(location.hash).toBe('');
  });

  describe('query string serialization', () => {
    it('should serialize multiple query params', () => {
      const location = generateLocationFromPath('/results', {
        query: { page: '1', sort: 'asc', limit: '20' },
      });

      expect(location.search).toMatch(/^\?/);
      expect(location.search).toContain('page=1');
      expect(location.search).toContain('sort=asc');
      expect(location.search).toContain('limit=20');
    });

    it('should encode special characters in query values', () => {
      const location = generateLocationFromPath('/search', {
        query: { q: 'a&b=c' },
      });

      expect(location.search).toContain('q=');
      expect(location.search).not.toBe('?q=a&b=c');
    });

    it('should handle query value with spaces', () => {
      const location = generateLocationFromPath('/search', {
        query: { term: 'foo bar' },
      });

      expect(location.search).toMatch(/term=foo(%20|\+)bar/);
    });
  });

  describe('params and basePath edge cases', () => {
    it('should handle basePath with trailing slash removed from pattern', () => {
      const location = generateLocationFromPath('/items/:id', {
        basePath: '/api/v2',
        params: { id: '10' },
      });

      expect(location.pathname).toBe('/api/v2/items/10');
    });

    it('should handle root pattern with query and basePath', () => {
      const location = generateLocationFromPath('/', {
        basePath: '/app',
        query: { debug: 'true' },
      });

      expect(location.pathname).toBe('/app/');
      expect(location.search).toBe('?debug=true');
    });

    it('should handle numeric param values', () => {
      const location = generateLocationFromPath('/users/:id', {
        params: { id: '0' },
      });

      expect(location.pathname).toBe('/users/0');
    });
  });
});
