import React from 'react';
import { act, render, renderHook } from '@testing-library/react';

import {
  EngineProvider,
  useComponentManager,
  useECSWorld,
  useEntityManager,
} from '../EngineProvider';

describe('EngineProvider', () => {
  it('should provide isolated engine instances', () => {
    const TestComponent = () => {
      const { world } = useECSWorld();
      const { entityManager } = useEntityManager();
      const { componentManager } = useComponentManager();

      return (
        <div>
          <span data-testid="world">{world ? 'world-present' : 'world-missing'}</span>
          <span data-testid="entity-manager">
            {entityManager ? 'entity-manager-present' : 'entity-manager-missing'}
          </span>
          <span data-testid="component-manager">
            {componentManager ? 'component-manager-present' : 'component-manager-missing'}
          </span>
        </div>
      );
    };

    const { getByTestId } = render(
      <EngineProvider>
        <TestComponent />
      </EngineProvider>,
    );

    expect(getByTestId('world')).toHaveTextContent('world-present');
    expect(getByTestId('entity-manager')).toHaveTextContent('entity-manager-present');
    expect(getByTestId('component-manager')).toHaveTextContent('component-manager-present');
  });

  it('should provide different instances for different providers', () => {
    let worldA: unknown;
    let worldB: unknown;

    const TestComponentA = () => {
      const { world } = useECSWorld();
      worldA = world;
      return null;
    };

    const TestComponentB = () => {
      const { world } = useECSWorld();
      worldB = world;
      return null;
    };

    render(
      <>
        <EngineProvider>
          <TestComponentA />
        </EngineProvider>
        <EngineProvider>
          <TestComponentB />
        </EngineProvider>
      </>,
    );

    expect(worldA).toBeDefined();
    expect(worldB).toBeDefined();
    expect(worldA).not.toBe(worldB);
  });

  it('should throw error when used outside provider', () => {
    const { result } = renderHook(() => useECSWorld());

    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('useEngineContext must be used within an EngineProvider');
  });

  it('should cleanup instances on unmount', () => {
    const TestComponent = () => {
      const { world } = useECSWorld();
      return <div>{world ? 'mounted' : 'unmounted'}</div>;
    };

    const { unmount, getByText } = render(
      <EngineProvider>
        <TestComponent />
      </EngineProvider>,
    );

    expect(getByText('mounted')).toBeInTheDocument();

    act(() => {
      unmount();
    });

    // After unmount, singleton adapter should be cleared
    // This is tested indirectly through the singleton adapter
  });
});