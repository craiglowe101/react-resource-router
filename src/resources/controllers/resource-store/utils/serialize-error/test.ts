import { serializeError, deserializeError } from './index';

describe('serializeError', () => {
  it('should serialize a standard Error object', () => {
    const error = new Error('something went wrong');
    const result = serializeError(error);

    expect(result.message).toBe('something went wrong');
    expect(result.name).toBe('Error');
    expect(result.stack).toBeDefined();
  });

  it('should serialize an Error with a custom code property', () => {
    const error = new Error('not found') as Error & { code: string };
    error.code = 'ERR_NOT_FOUND';
    const result = serializeError(error);

    expect(result.message).toBe('not found');
    expect(result.code).toBe('ERR_NOT_FOUND');
  });

  it('should handle circular references', () => {
    const error: any = new Error('circular');
    error.self = error;
    const result = serializeError(error);

    expect(result.message).toBe('circular');
    expect(result.self).toBe('[Circular]');
  });

  it('should handle nested objects with circular references', () => {
    const obj: any = { a: 1, nested: { b: 2 } };
    obj.nested.parent = obj;
    const result = serializeError(obj);

    expect(result.a).toBe(1);
    expect(result.nested.b).toBe(2);
    expect(result.nested.parent).toBe('[Circular]');
  });

  it('should skip function values in objects', () => {
    const obj = {
      name: 'test',
      fn: () => 'hello',
      message: 'error msg',
    };
    const result = serializeError(obj);

    expect(result.name).toBe('test');
    expect(result.message).toBe('error msg');
    expect(result.fn).toBeUndefined();
  });

  it('should handle non-object values - string', () => {
    const result = serializeError('string error');
    expect(result).toBe('string error');
  });

  it('should handle non-object values - number', () => {
    const result = serializeError(42);
    expect(result).toBe(42);
  });

  it('should handle non-object values - boolean', () => {
    const result = serializeError(true);
    expect(result).toBe(true);
  });

  it('should handle non-object values - undefined', () => {
    const result = serializeError(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle non-object values - null', () => {
    const result = serializeError(null);
    expect(result).toBeNull();
  });

  it('should handle function values thrown directly', () => {
    const fn = function myFunc() {};
    const result = serializeError(fn);
    expect(result).toBe('[Function: myFunc]');
  });

  it('should handle anonymous functions', () => {
    const result = serializeError(() => {});
    expect(result).toBe('[Function: anonymous]');
  });

  it('should handle arrays in error objects', () => {
    const error: any = new Error('array error');
    error.details = [1, 2, 3];
    const result = serializeError(error);

    expect(result.message).toBe('array error');
    expect(result.details).toEqual([1, 2, 3]);
  });

  it('should handle deeply nested objects', () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    };
    const result = serializeError(obj);
    expect(result.level1.level2.level3.value).toBe('deep');
  });

  it('should preserve common properties from errors', () => {
    const error = new TypeError('type error');
    const result = serializeError(error);

    expect(result.name).toBe('TypeError');
    expect(result.message).toBe('type error');
    expect(result.stack).toEqual(expect.any(String));
  });

  it('should handle RangeError', () => {
    const error = new RangeError('out of range');
    const result = serializeError(error);

    expect(result.name).toBe('RangeError');
    expect(result.message).toBe('out of range');
  });

  it('should handle an empty Error with no message', () => {
    const error = new Error();
    const result = serializeError(error);

    expect(result.message).toBe('');
    expect(result.name).toBe('Error');
  });

  it('should handle an object with mixed value types', () => {
    const obj = {
      count: 42,
      label: 'test',
      flag: true,
      missing: null,
      nothing: undefined,
      method: () => {},
    };
    const result = serializeError(obj);

    expect(result.count).toBe(42);
    expect(result.label).toBe('test');
    expect(result.flag).toBe(true);
    expect(result.missing).toBeNull();
    expect(result.method).toBeUndefined();
  });

  it('should handle Symbol values in error objects gracefully', () => {
    const obj: any = { message: 'sym' };
    obj[Symbol('hidden')] = 'invisible';
    const result = serializeError(obj);

    expect(result.message).toBe('sym');
  });
});

describe('deserializeError', () => {
  it('should return the same Error if already an Error instance', () => {
    const error = new Error('already an error');
    const result = deserializeError(error);

    expect(result).toBe(error);
    expect(result.message).toBe('already an error');
  });

  it('should convert a plain object to an Error', () => {
    const obj = {
      message: 'deserialized error',
      name: 'CustomError',
      stack: 'some stack trace',
    };
    const result = deserializeError(obj);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('deserialized error');
    expect(result.name).toBe('CustomError');
    expect(result.stack).toBe('some stack trace');
  });

  it('should create a NonError for string input', () => {
    const result = deserializeError('string input');

    expect(result).toBeInstanceOf(Error);
    expect(result.name).toBe('NonError');
    expect(result.message).toBe('string input');
  });

  it('should create a NonError for number input', () => {
    const result = deserializeError(42);

    expect(result).toBeInstanceOf(Error);
    expect(result.name).toBe('NonError');
    expect(result.message).toBe('42');
  });

  it('should create a NonError for null input', () => {
    const result = deserializeError(null);

    expect(result).toBeInstanceOf(Error);
    expect(result.name).toBe('NonError');
  });

  it('should create a NonError for undefined input', () => {
    const result = deserializeError(undefined);

    expect(result).toBeInstanceOf(Error);
    expect(result.name).toBe('NonError');
  });

  it('should create a NonError for array input', () => {
    const result = deserializeError([1, 2, 3]);

    expect(result).toBeInstanceOf(Error);
    expect(result.name).toBe('NonError');
  });

  it('should handle an object with extra properties', () => {
    const obj = {
      message: 'has extras',
      code: 'ERR_CUSTOM',
      details: { key: 'value' },
    };
    const result = deserializeError(obj) as any;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('has extras');
    expect(result.code).toBe('ERR_CUSTOM');
    expect(result.details.key).toBe('value');
  });

  it('should handle object with circular references', () => {
    const obj: any = { message: 'circular' };
    obj.self = obj;
    const result = deserializeError(obj) as any;

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('circular');
    expect(result.self).toBe('[Circular]');
  });

  it('should create a NonError for boolean input', () => {
    const result = deserializeError(false);

    expect(result).toBeInstanceOf(Error);
    expect(result.name).toBe('NonError');
    expect(result.message).toBe('false');
  });

  it('should create a NonError for empty string input', () => {
    const result = deserializeError('');

    expect(result).toBeInstanceOf(Error);
    expect(result.name).toBe('NonError');
  });

  it('should preserve stack from serialized object', () => {
    const obj = {
      message: 'with stack',
      name: 'Error',
      stack: 'Error: with stack\n    at test.ts:1:1',
    };
    const result = deserializeError(obj);

    expect(result.stack).toBe('Error: with stack\n    at test.ts:1:1');
  });

  it('should handle object with only message', () => {
    const obj = { message: 'just a message' };
    const result = deserializeError(obj);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('just a message');
  });
});
