import { getResourceStore } from '../resource-store';

import { addResourcesListener } from './index';

describe('addResourcesListener', () => {
  it('should subscribe a callback to the resource store state', () => {
    const subscribeSpy = jest.spyOn(getResourceStore().storeState, 'subscribe');
    const callback = jest.fn();

    addResourcesListener(callback);

    expect(subscribeSpy).toHaveBeenCalledWith(callback);
    subscribeSpy.mockRestore();
  });

  it('should return an unsubscribe function', () => {
    const mockUnsubscribe = jest.fn();
    const subscribeSpy = jest.spyOn(getResourceStore().storeState, 'subscribe');
    subscribeSpy.mockReturnValue(mockUnsubscribe);

    const unsubscribe = addResourcesListener(jest.fn());

    expect(unsubscribe).toBe(mockUnsubscribe);
    subscribeSpy.mockRestore();
  });
});
