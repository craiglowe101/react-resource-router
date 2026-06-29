// TAKEN FROM https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/matchPath.js

import { Key, pathToRegexp } from 'path-to-regexp';

import { MatchParams } from '../../types';

export interface PathMatch {
  path: string;
  url: string;
  isExact: boolean;
  params: MatchParams;
}

interface CompileOptions {
  end: boolean;
  strict: boolean;
  sensitive: boolean;
}

interface CompiledPath {
  regexp: RegExp;
  keys: Key[];
}

interface MatchPathOptions {
  path?: string;
  exact?: boolean;
  strict?: boolean;
  sensitive?: boolean;
  basePath?: string;
}

const cache: Record<string, Record<string, CompiledPath>> = {};
const cacheLimit = 10000;
let cacheCount = 0;

function compilePath(path: string, options: CompileOptions): CompiledPath {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

  if (pathCache[path]) return pathCache[path];

  const keys: Key[] = [];
  const regexp = pathToRegexp(path, keys, options);
  const result = { regexp, keys };

  if (cacheCount < cacheLimit) {
    pathCache[path] = result;
    cacheCount++;
  }

  return result;
}

/**
 * Public API for matching a URL pathname to a path.
 */
function matchPath(
  pathname: string,
  options: MatchPathOptions = {}
): PathMatch | null {
  if (typeof options === 'string' || Array.isArray(options)) {
    options = { path: options as unknown as string };
  }

  const {
    path: p,
    exact = false,
    strict = false,
    sensitive = false,
    basePath = '',
  } = options;
  const paths: string[] = ([] as string[]).concat(basePath + (p || ''));

  return paths.reduce((matched: PathMatch | null, path: string) => {
    if (!path && path !== '') return null;
    if (matched) return matched;

    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict,
      sensitive,
    });
    const match = regexp.exec(pathname);

    if (!match) return null;

    const [url, ...values] = match;
    const isExact = pathname === url;

    if (exact && !isExact) return null;

    return {
      path, // the path used to match
      url: path === '/' && url === '' ? '/' : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo: MatchParams, key: Key, index: number) => {
        memo[key.name] = values[index];

        return memo;
      }, {}),
    };
  }, null);
}

export default matchPath;
