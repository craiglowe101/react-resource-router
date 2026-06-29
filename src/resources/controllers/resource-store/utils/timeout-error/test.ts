import { TimeoutError } from './index';

describe('TimeoutError', () => {
  it('should be an instance of Error', () => {
    const error = new TimeoutError('my-resource');
    expect(error).toBeInstanceOf(Error);
  });

  it('should be an instance of TimeoutError', () => {
    const error = new TimeoutError('my-resource');
    expect(error).toBeInstanceOf(TimeoutError);
  });

  it('should have name set to "TimeoutError"', () => {
    const error = new TimeoutError('my-resource');
    expect(error.name).toBe('TimeoutError');
  });

  it('should include resource type in message', () => {
    const error = new TimeoutError('user-profile');
    expect(error.message).toBe('Resource timed out: user-profile');
  });

  it('should be catchable as an Error', () => {
    expect(() => {
      throw new TimeoutError('test');
    }).toThrow(Error);
  });

  it('should be catchable as a TimeoutError', () => {
    expect(() => {
      throw new TimeoutError('test');
    }).toThrow(TimeoutError);
  });

  it('should have a stack trace', () => {
    const error = new TimeoutError('test');
    expect(error.stack).toBeDefined();
  });
});
