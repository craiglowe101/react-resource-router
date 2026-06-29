// NOTE! This has been copy pasted from https://github.com/sindresorhus/serialize-error/blob/master/index.js
// When the router moves to its own package, this must become a dependency
// For now, we have put it here so that we don't need to get it included in Jira's vendor bundle

class NonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NonError);
    }
  }
}

const commonProperties = ['name', 'message', 'stack', 'code'] as const;

const destroyCircular = (
  from: Record<string, unknown>,
  seen: Record<string, unknown>[],
  to_?: Record<string, unknown>
): Record<string, unknown> => {
  const to: Record<string, unknown> =
    to_ || ((Array.isArray(from) ? [] : {}) as Record<string, unknown>);

  seen.push(from);

  for (const [key, value] of Object.entries(from)) {
    if (typeof value === 'function') {
      continue;
    }

    if (!value || typeof value !== 'object') {
      to[key] = value;
      continue;
    }

    if (!seen.includes(from[key] as Record<string, unknown>)) {
      to[key] = destroyCircular(
        from[key] as Record<string, unknown>,
        seen.slice()
      );
      continue;
    }

    to[key] = '[Circular]';
  }

  for (const property of commonProperties) {
    if (typeof from[property] === 'string') {
      to[property] = from[property];
    }
  }

  return to;
};

export interface SerializedResult {
  [key: string]: SerializedResult;
}

export const serializeError = (value: unknown): SerializedResult => {
  if (typeof value === 'object' && value !== null) {
    return destroyCircular(
      value as Record<string, unknown>,
      []
    ) as unknown as SerializedResult;
  }

  // People sometimes throw things besides Error objects…
  if (typeof value === 'function') {
    // `JSON.stringify()` discards functions. We do too, unless a function is thrown directly.
    return `[Function: ${(value as { name?: string }).name || 'anonymous'}]` as unknown as SerializedResult;
  }

  return value as unknown as SerializedResult;
};

export const deserializeError = (value: unknown): Error => {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const newError = new Error();
    destroyCircular(
      value as Record<string, unknown>,
      [],
      newError as unknown as Record<string, unknown>
    );

    return newError;
  }

  return new NonError(String(value));
};
