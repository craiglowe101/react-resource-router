import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { withRouter } from './index';

describe('withRouter() displayName', () => {
  beforeEach(() => {
    defaultRegistry.stores.clear();
  });

  it('should use displayName when set on the component', () => {
    const MyComponent = () => <div>test</div>;
    MyComponent.displayName = 'MyCustomDisplayName';

    const Wrapped = withRouter(MyComponent);

    // displayName should be overridden by name since both exist,
    // but the code checks displayName first then name
    expect(Wrapped.displayName).toBe('withRouter(MyComponent)');
  });

  it('should use function name when no displayName is set', () => {
    function NamedComponent() {
      return <div>test</div>;
    }

    const Wrapped = withRouter(NamedComponent);
    expect(Wrapped.displayName).toBe('withRouter(NamedComponent)');
  });

  it('should use displayName over function name when only displayName is available', () => {
    // Create an anonymous component-like function with only displayName
    const component: any = Object.assign(
      (() => <div>test</div>) as React.ComponentType<any>,
      {}
    );
    // Override name to be empty to test displayName path
    Object.defineProperty(component, 'name', { value: '' });
    component.displayName = 'ExplicitDisplayName';

    const Wrapped = withRouter(component);
    expect(Wrapped.displayName).toBe('withRouter(ExplicitDisplayName)');
  });

  it('should fall back to UNDEFINED when component has neither displayName nor name', () => {
    const component: any = Object.assign(
      (() => <div>test</div>) as React.ComponentType<any>,
      {}
    );
    Object.defineProperty(component, 'name', { value: '' });

    const Wrapped = withRouter(component);
    expect(Wrapped.displayName).toBe('withRouter(UNDEFINED)');
  });
});
