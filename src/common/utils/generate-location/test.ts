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
});
