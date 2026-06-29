import { handleNavigation } from './handle-navigation';

const createMockRouterActions = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  pushTo: jest.fn(),
  replaceTo: jest.fn(),
});

const createMouseEvent = (overrides: Record<string, any> = {}) => ({
  type: 'click',
  button: 0,
  defaultPrevented: false,
  preventDefault: jest.fn(),
  metaKey: false,
  altKey: false,
  ctrlKey: false,
  shiftKey: false,
  ...overrides,
});

const createKeyboardEvent = (
  key: string,
  overrides: Record<string, any> = {}
) => ({
  type: 'keydown',
  key,
  defaultPrevented: false,
  preventDefault: jest.fn(),
  metaKey: false,
  altKey: false,
  ctrlKey: false,
  shiftKey: false,
  ...overrides,
});

describe('handleNavigation', () => {
  describe('keyboard events', () => {
    it('should navigate on Enter key', () => {
      const routerActions = createMockRouterActions();
      const event = createKeyboardEvent('Enter');

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(routerActions.push).toHaveBeenCalledWith('/target', undefined);
    });

    it('should not navigate on non-Enter key', () => {
      const routerActions = createMockRouterActions();
      const event = createKeyboardEvent('Tab');

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(routerActions.push).not.toHaveBeenCalled();
    });
  });

  describe('mouse events', () => {
    it('should navigate with push on left click', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(routerActions.push).toHaveBeenCalledWith('/target', undefined);
    });

    it('should navigate with replace when replace is true', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();

      handleNavigation(event, {
        routerActions,
        replace: true,
        href: '/target',
        to: undefined,
      });

      expect(routerActions.replace).toHaveBeenCalledWith('/target', undefined);
    });

    it('should not navigate on right click', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent({ button: 2 });

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(routerActions.push).not.toHaveBeenCalled();
    });

    it('should not navigate on middle click', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent({ button: 1 });

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(routerActions.push).not.toHaveBeenCalled();
    });
  });

  describe('modifier keys', () => {
    it.each([
      ['metaKey', { metaKey: true }],
      ['altKey', { altKey: true }],
      ['ctrlKey', { ctrlKey: true }],
      ['shiftKey', { shiftKey: true }],
    ])('should not navigate when %s is pressed', (_name, modifiers) => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent(modifiers);

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(routerActions.push).not.toHaveBeenCalled();
    });
  });

  describe('target handling', () => {
    it('should not navigate when target is _blank', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();

      handleNavigation(event, {
        target: '_blank',
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(routerActions.push).not.toHaveBeenCalled();
    });

    it('should navigate when target is _self', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();

      handleNavigation(event, {
        target: '_self',
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(routerActions.push).toHaveBeenCalledWith('/target', undefined);
    });

    it('should navigate when target is not specified', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(routerActions.push).toHaveBeenCalled();
    });
  });

  describe('default prevented', () => {
    it('should not navigate when default is already prevented', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent({ defaultPrevented: true });

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(routerActions.push).not.toHaveBeenCalled();
    });
  });

  describe('onClick callback', () => {
    it('should call onClick before navigating', () => {
      const routerActions = createMockRouterActions();
      const onClick = jest.fn();
      const event = createMouseEvent();

      handleNavigation(event, {
        onClick,
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(onClick).toHaveBeenCalledWith(event);
      expect(routerActions.push).toHaveBeenCalled();
    });

    it('should call onClick even when navigation is prevented by onClick', () => {
      const routerActions = createMockRouterActions();
      const onClick = jest.fn((e: any) => {
        e.defaultPrevented = true;
      });
      const event = createMouseEvent();

      handleNavigation(event, {
        onClick,
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
      });

      expect(onClick).toHaveBeenCalled();
      expect(routerActions.push).not.toHaveBeenCalled();
    });
  });

  describe('route-based navigation with `to`', () => {
    const route = {
      name: 'my-route',
      path: '/my-route/:id',
      component: () => null,
    };
    const routeAttributes = { params: { id: '1' }, query: { foo: 'bar' } };

    it('should use pushTo when `to` is provided', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/fallback',
        to: [route, routeAttributes],
      });

      expect(routerActions.pushTo).toHaveBeenCalledWith(
        route,
        routeAttributes,
        undefined
      );
      expect(routerActions.push).not.toHaveBeenCalled();
    });

    it('should use replaceTo when `to` is provided and replace is true', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();

      handleNavigation(event, {
        routerActions,
        replace: true,
        href: '/fallback',
        to: [route, routeAttributes],
      });

      expect(routerActions.replaceTo).toHaveBeenCalledWith(
        route,
        routeAttributes,
        undefined
      );
    });

    it('should fall back to push when `to` is undefined', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/fallback',
        to: undefined,
      });

      expect(routerActions.push).toHaveBeenCalledWith('/fallback', undefined);
      expect(routerActions.pushTo).not.toHaveBeenCalled();
    });
  });

  describe('state passing', () => {
    it('should pass state to push', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();
      const state = { from: 'test-page' };

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/target',
        to: undefined,
        state,
      });

      expect(routerActions.push).toHaveBeenCalledWith('/target', state);
    });

    it('should pass state to replace', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();
      const state = { from: 'test-page' };

      handleNavigation(event, {
        routerActions,
        replace: true,
        href: '/target',
        to: undefined,
        state,
      });

      expect(routerActions.replace).toHaveBeenCalledWith('/target', state);
    });

    it('should pass state to pushTo when route is provided', () => {
      const routerActions = createMockRouterActions();
      const event = createMouseEvent();
      const route = { name: 'r', path: '/r', component: () => null };
      const state = { context: 'value' };

      handleNavigation(event, {
        routerActions,
        replace: false,
        href: '/fallback',
        to: [route, {}],
        state,
      });

      expect(routerActions.pushTo).toHaveBeenCalledWith(route, {}, state);
    });
  });
});
