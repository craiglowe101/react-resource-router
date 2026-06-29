import { compile } from 'path-to-regexp';
import { qs } from 'url-parse';

import { GenerateLocationOptions, Location } from '../../types';

export function generateLocationFromPath(
  pattern = '/',
  options: GenerateLocationOptions = {}
): Location {
  const { params = {}, query = {}, basePath = '' } = options;
  const stringifiedQuery = (
    qs.stringify as (q: object, prefix: boolean) => string
  )(query, true);
  const pathname = pattern === '/' ? pattern : compile(pattern)(params);

  return {
    pathname: `${basePath}${pathname}`,
    search: stringifiedQuery,
    hash: '',
  };
}
