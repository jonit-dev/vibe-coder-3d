import { useEffect, useRef, useState } from 'react';

import { InputAction, useInput } from '@core/hooks/useInput';
import { useUIStore } from '@core/stores/uiStore';

export interface IControlAxis {
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface IObjectControlsProps {
  onAction: (position: [number, number, number], power: number) => void;
  active?: boolean;
  axes?: {
    x?: Partial<IControlAxis>;
    y?: Partial<IControlAxis>;
    z?: Partial<IControlAxis>;
  };
  power?: {
    min?: number;
    max?: number;
    step?: number;
    initial?: number;
  };
  actionKey?: InputAction;
  actionLabel?: string;
  children?: (props: {
    position: [number, number, number];
    power: number;
    isActive: boolean;
  }) => React.ReactNode;
}

/**
 * Generic object controls for positioning and controlling 3D objects
 * Can be used for various game elements that need basic position control and a power action
 */
const ObjectControls = ({
  onAction,
  active = true,
  axes = {},
  power = {},
  actionKey = 'jump',
  actionLabel = 'SHOOT',
  children,
}: IObjectControlsProps) => {
  // Default position with configurable axes
  const xAxis = {
    min: -1.5,
    max: 1.5,
    step: 0.1,
    value: 0,
    ...axes.x,
  };

  const yAxis = {
    min: 0.3,
    max: 2,
    step: 0.1,
    value: 0.3,
    ...axes.y,
  };

  const zAxis = {
    min: -8,
    max: -3,
    step: 0.1,
    value: -8,
    ...axes.z,
  };

  // Configure power settings
  const powerSettings = {
    min: 10,
    max: 40,
    step: 0.5,
    initial: 20,
    ...power,
  };

  // State
  const [position, setPosition] = useState<[number, number, number]>([
    xAxis.value,
    yAxis.value,
    zAxis.value,
  ]);
  const [powerValue, setPowerValue] = useState(powerSettings.initial);
  const { isPressed } = useInput();
  const actionTriggered = useRef(false);
  const { showActionMessage, hideActionMessage } = useUIStore();

  // Update messages based on state
  useEffect(() => {
    if (active) {
      showActionMessage(
        `PRESS ${actionKey.toUpperCase()} TO ${actionLabel} (Power: ${powerValue.toFixed(1)})`,
      );
    }
  }, [active, powerValue, showActionMessage, actionKey, actionLabel]);

  // Prevent default browser behaviors for control keys
  useEffect(() => {
    const preventDefaultForKeys = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventDefaultForKeys);
    return () => {
      window.removeEventListener('keydown', preventDefaultForKeys);
    };
  }, []);

  // Reset when active state changes
  useEffect(() => {
    if (active) {
      actionTriggered.current = false;
      setPosition([xAxis.value, yAxis.value, zAxis.value]);
    } else {
      hideActionMessage();
    }

    return () => {
      hideActionMessage();
    };
  }, [active, hideActionMessage, xAxis.value, yAxis.value, zAxis.value]);

  // Handle user input
  useEffect(() => {
    if (!active) return;

    let animationFrame: number;
    const updateControls = () => {
      if (actionTriggered.current) {
        animationFrame = requestAnimationFrame(updateControls);
        return;
      }

      let moved = false;

      // X-axis movement
      if (isPressed('lookLeft')) {
        setPosition((prev) => {
          moved = true;
          return [Math.max(prev[0] - xAxis.step, xAxis.min), prev[1], prev[2]];
        });
      }

      if (isPressed('lookRight')) {
        setPosition((prev) => {
          moved = true;
          return [Math.min(prev[0] + xAxis.step, xAxis.max), prev[1], prev[2]];
        });
      }

      // Power adjustment
      if (isPressed('lookUp')) {
        setPowerValue((prev) => {
          const newPower = Math.min(prev + powerSettings.step, powerSettings.max);
          moved = true;
          return newPower;
        });
      }

      if (isPressed('lookDown')) {
        setPowerValue((prev) => {
          const newPower = Math.max(prev - powerSettings.step, powerSettings.min);
          moved = true;
          return newPower;
        });
      }

      // Trigger action
      if (isPressed(actionKey)) {
        if (!actionTriggered.current && active) {
          actionTriggered.current = true;
          hideActionMessage();
          onAction(position, powerValue);
        }
      }

      // Throttle or continue animation loop
      if (moved) {
        setTimeout(() => {
          animationFrame = requestAnimationFrame(updateControls);
        }, 50);
      } else {
        animationFrame = requestAnimationFrame(updateControls);
      }
    };

    animationFrame = requestAnimationFrame(updateControls);
    return () => cancelAnimationFrame(animationFrame);
  }, [
    active,
    isPressed,
    onAction,
    hideActionMessage,
    powerValue,
    position,
    xAxis,
    actionKey,
    powerSettings.max,
    powerSettings.min,
    powerSettings.step,
  ]);

  // Return the children function with current state
  return children
    ? children({
        position,
        power: powerValue,
        isActive: active,
      })
    : null;
};

export default ObjectControls;
