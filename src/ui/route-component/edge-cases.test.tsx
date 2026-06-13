import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { Router } from '../../controllers';

import { RouteComponent } from './index';

const MockLocation = {
  pathname: '/home',
  search: '',
  hash: '',
};

const HistoryMock: any = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  registerBlock: jest.fn(),
  listen: () => jest.fn(),
  createHref: jest.fn(),
  location: MockLocation,
  _history: jest.fn(),
};

describe('<RouteComponent /> edge cases', () => {
  it('renders null when no route matches', () => {
    const { container } = render(
      <Router
        history={{
          ...HistoryMock,
          location: { ...MockLocation, pathname: '/nonexistent' },
        }}
        routes={[]}
      >
        <RouteComponent />
      </Router>
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders null when route has no component', () => {
    const routes: any[] = [
      {
        path: '/home',
      },
    ];

    const { container } = render(
      <Router history={HistoryMock} routes={routes}>
        <RouteComponent />
      </Router>
    );

    expect(container.innerHTML).toBe('');
  });

  it('passes route props to the rendered component', () => {
    const MockComponent = (props: any) => (
      <div>
        <span data-testid="route-name">{props.route?.name}</span>
        <span data-testid="pathname">{props.location?.pathname}</span>
      </div>
    );

    const routes = [
      {
        name: 'home',
        path: '/home',
        component: MockComponent,
      },
    ];

    render(
      <Router history={HistoryMock} routes={routes}>
        <RouteComponent />
      </Router>
    );

    expect(screen.getByTestId('route-name')).toHaveTextContent('home');
    expect(screen.getByTestId('pathname')).toHaveTextContent('/home');
  });

  it('renders the matched route component with query params', () => {
    const MockComponent = (props: any) => (
      <div data-testid="query">{JSON.stringify(props.query)}</div>
    );

    const routes = [
      {
        name: 'search',
        path: '/search',
        component: MockComponent,
      },
    ];

    render(
      <Router
        history={{
          ...HistoryMock,
          location: { pathname: '/search', search: '?q=test', hash: '' },
        }}
        routes={routes}
      >
        <RouteComponent />
      </Router>
    );

    expect(screen.getByTestId('query')).toHaveTextContent('test');
  });

  it('renders match params from dynamic routes', () => {
    const MockComponent = (props: any) => (
      <div data-testid="match-params">
        {JSON.stringify(props.match?.params)}
      </div>
    );

    const routes = [
      {
        name: 'user',
        path: '/users/:id',
        component: MockComponent,
      },
    ];

    render(
      <Router
        history={{
          ...HistoryMock,
          location: { pathname: '/users/123', search: '', hash: '' },
        }}
        routes={routes}
      >
        <RouteComponent />
      </Router>
    );

    expect(screen.getByTestId('match-params')).toHaveTextContent('"id":"123"');
  });
});
