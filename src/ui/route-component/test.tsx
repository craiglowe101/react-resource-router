import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { Router } from '../../controllers';

import { RouteComponent } from './index';

const MockComponent = () => <div>My component</div>;

const MockLocation = {
  pathname: '/home',
  search: '',
  hash: '',
};

const HistoryMock = {
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

const routes = [
  {
    component: MockComponent,
    path: '/home',
  },
];

describe('<Route />', () => {
  it('renders the route component', () => {
    render(
      // @ts-expect-error
      <Router history={HistoryMock} routes={routes}>
        <RouteComponent />
      </Router>
    );

    // Check if the mock component is rendered
    const component = screen.getByText('My component');
    expect(component).toBeInTheDocument();
  });

  it('renders null when no route matches', () => {
    const noMatchHistory = {
      ...HistoryMock,
      location: { pathname: '/unknown', search: '', hash: '' },
    };

    const { container } = render(
      // @ts-expect-error
      <Router history={noMatchHistory} routes={routes}>
        <RouteComponent />
      </Router>
    );

    expect(container.innerHTML).toBe('');
  });

  it('passes route props (match, query, location) to the route component', () => {
    const spy = jest.fn(() => <div>spy</div>);
    const spyRoutes = [
      {
        component: spy,
        path: '/home',
      },
    ];

    render(
      // @ts-expect-error
      <Router history={HistoryMock} routes={spyRoutes}>
        <RouteComponent />
      </Router>
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        location: expect.any(Object),
        match: expect.any(Object),
        route: expect.objectContaining({ path: '/home' }),
      }),
      expect.anything()
    );
  });
});
