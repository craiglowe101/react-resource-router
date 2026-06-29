import { getAccessedAt } from './index';

describe('getAccessedAt()', () => {
  it('should return current timestamp', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(10);

    expect(getAccessedAt()).toEqual(10);
  });

  it('should return 0 when Date.now returns 0', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(0);

    expect(getAccessedAt()).toEqual(0);
  });

  it('should return a large timestamp', () => {
    const largeTimestamp = 1893456000000; // year 2030
    jest.spyOn(global.Date, 'now').mockReturnValue(largeTimestamp);

    expect(getAccessedAt()).toEqual(largeTimestamp);
  });

  it('should return different values when Date.now changes', () => {
    const spy = jest.spyOn(global.Date, 'now');

    spy.mockReturnValue(100);
    const first = getAccessedAt();

    spy.mockReturnValue(200);
    const second = getAccessedAt();

    expect(first).toEqual(100);
    expect(second).toEqual(200);
    expect(first).not.toEqual(second);
  });
});
