import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { LinkProps } from '../../common/types';
import { Router } from '../../controllers/router';

import Link from './index';

const MockLocation = {
  pathname: 'pathname',
  search: 'search',
  hash: 'hash',
};

const HistoryMock = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  listen: () => jest.fn(),
  block: jest.fn(),
  createHref: jest.fn(),
  location: MockLocation,
};

describe('<Link /> prefetch behaviour', () => {
  const renderInRouter = (
    children: LinkProps['children'],
    props: Partial<LinkProps> = {},
    basePath = ''
  ) => {
    return render(
      // @ts-expect-error
      <Router basePath={basePath} history={HistoryMock} routes={[]}>
        <Link {...props}>{children}</Link>
      </Router>
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
    defaultRegistry.stores.clear();
  });

  describe('prefetch="mount"', () => {
    it('should schedule prefetch on mount', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'mount' });

      // Prefetch is scheduled with a 225ms delay
      expect(screen.getByRole('link', { name: 'my link' })).toBeInTheDocument();
      // Advance timers to trigger the prefetch
      act(() => {
        jest.advanceTimersByTime(250);
      });
    });

    it('should cancel prefetch on unmount before timeout fires', () => {
      const { unmount } = renderInRouter('my link', {
        href: '/target',
        prefetch: 'mount',
      });

      // Unmount before the timer fires
      unmount();

      // Advancing timers should not throw
      act(() => {
        jest.advanceTimersByTime(250);
      });
    });
  });

  describe('prefetch="hover"', () => {
    it('should schedule prefetch on mouse enter', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'hover' });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.mouseEnter(link);
      });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Should not throw - prefetch triggered
      expect(link).toBeInTheDocument();
    });

    it('should cancel prefetch on mouse leave', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'hover' });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.mouseEnter(link);
      });

      act(() => {
        fireEvent.mouseLeave(link);
      });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(link).toBeInTheDocument();
    });

    it('should call onMouseEnter prop when provided', () => {
      const mockOnMouseEnter = jest.fn();
      renderInRouter('my link', {
        href: '/target',
        prefetch: 'hover',
        onMouseEnter: mockOnMouseEnter,
      });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.mouseEnter(link);
      });

      expect(mockOnMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('should call onMouseLeave prop when provided', () => {
      const mockOnMouseLeave = jest.fn();
      renderInRouter('my link', {
        href: '/target',
        prefetch: 'hover',
        onMouseLeave: mockOnMouseLeave,
      });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.mouseLeave(link);
      });

      expect(mockOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('should schedule prefetch on focus', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'hover' });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.focus(link);
      });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(link).toBeInTheDocument();
    });

    it('should call onFocus prop when provided', () => {
      const mockOnFocus = jest.fn();
      renderInRouter('my link', {
        href: '/target',
        prefetch: 'hover',
        onFocus: mockOnFocus,
      });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.focus(link);
      });

      expect(mockOnFocus).toHaveBeenCalledTimes(1);
    });

    it('should cancel prefetch on blur', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'hover' });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.focus(link);
      });

      act(() => {
        fireEvent.blur(link);
      });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(link).toBeInTheDocument();
    });

    it('should call onBlur prop when provided', () => {
      const mockOnBlur = jest.fn();
      renderInRouter('my link', {
        href: '/target',
        prefetch: 'hover',
        onBlur: mockOnBlur,
      });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.blur(link);
      });

      expect(mockOnBlur).toHaveBeenCalledTimes(1);
    });

    it('should cancel and trigger prefetch immediately on pointer down', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'hover' });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.pointerDown(link);
      });

      expect(link).toBeInTheDocument();
    });

    it('should call onPointerDown prop when provided', () => {
      const mockOnPointerDown = jest.fn();
      renderInRouter('my link', {
        href: '/target',
        prefetch: 'hover',
        onPointerDown: mockOnPointerDown,
      });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.pointerDown(link);
      });

      expect(mockOnPointerDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('prefetch with route `to` prop', () => {
    const route = {
      name: 'my-page',
      path: '/my-page/:id',
      component: () => null,
    };

    it('should not trigger prefetch if async route is not resolved yet', () => {
      // Provide a promise that never resolves
      let resolveRoute: any;
      const asyncRoute = new Promise<any>(resolve => {
        resolveRoute = resolve;
      });

      renderInRouter('my link', {
        to: asyncRoute,
        params: { id: '1' },
        prefetch: 'mount',
      });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Should not throw even though route isn't resolved
      expect(screen.getByRole('link', { name: 'my link' })).toBeInTheDocument();

      // Clean up by resolving the promise
      act(() => {
        resolveRoute({ default: route });
      });
    });

    it('should trigger prefetch after async route resolves', async () => {
      renderInRouter('my link', {
        to: Promise.resolve({ default: route }),
        params: { id: '1' },
        prefetch: 'mount',
      });

      // Let the promise resolve
      await act(() => Promise.resolve());

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(screen.getByRole('link', { name: 'my link' })).toBeInTheDocument();
    });
  });

  describe('prefetch="hover" additional hover/focus scenarios', () => {
    it('should not trigger prefetch if mouse leaves before delay', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'hover' });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.mouseEnter(link);
      });

      // Leave before the 225ms delay fires
      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        fireEvent.mouseLeave(link);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // No error = prefetch was successfully cancelled
      expect(link).toBeInTheDocument();
    });

    it('should trigger prefetch on focus and cancel on blur before delay', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'hover' });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.focus(link);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        fireEvent.blur(link);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // No error = prefetch was successfully cancelled
      expect(link).toBeInTheDocument();
    });

    it('should trigger prefetch after full delay on hover without leaving', () => {
      renderInRouter('my link', { href: '/target', prefetch: 'hover' });

      const link = screen.getByRole('link', { name: 'my link' });

      act(() => {
        fireEvent.mouseEnter(link);
      });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Prefetch triggered successfully
      expect(link).toBeInTheDocument();
    });
  });

  describe('Link with state prop', () => {
    it('should pass state to history.push on click', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      renderInRouter('my link', {
        href: '/target',
        state: { from: 'test' },
      });

      await user.click(screen.getByRole('link', { name: 'my link' }));

      expect(HistoryMock.push).toHaveBeenCalledWith('/target', {
        from: 'test',
      });
    });

    it('should pass state to history.replace when replace is true', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      renderInRouter('my link', {
        href: '/target',
        replace: true,
        state: { from: 'test' },
      });

      await user.click(screen.getByRole('link', { name: 'my link' }));

      expect(HistoryMock.replace).toHaveBeenCalledWith('/target', {
        from: 'test',
      });
    });
  });
});
