import { useEffect, useRef, useState } from 'react';

import { useInput } from '@core/hooks/useInput';
import { useUIStore } from '@core/stores/uiStore';

interface IBowlingBallControllerProps {
  onShoot: (position: [number, number, number], power: number) => void;
  active?: boolean;
  minX?: number;
  maxX?: number;
  minPower?: number;
  maxPower?: number;
}

const BowlingBallControls = ({
  onShoot,
  active = true,
  minX = -1.5,
  maxX = 1.5,
  minPower = 10,
  maxPower = 40,
}: IBowlingBallControllerProps) => {
  const [position, setPosition] = useState<[number, number, number]>([0, 0.5, -8]);
  const [power, setPower] = useState(20);
  const { isPressed } = useInput();
  const alreadyShot = useRef(false);
  const { showActionMessage, hideActionMessage } = useUIStore();

  useEffect(() => {
    const preventDefaultForArrows = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventDefaultForArrows);
    return () => {
      window.removeEventListener('keydown', preventDefaultForArrows);
    };
  }, []);

  // Reset when active state changes
  useEffect(() => {
    if (active) {
      alreadyShot.current = false;
      setPosition([0, 0.5, -8]);

      // Update UI with current power via action message
      showActionMessage(`PRESS SPACE TO SHOOT (Power: ${power.toFixed(1)})`);
    } else {
      hideActionMessage();
    }

    return () => {
      hideActionMessage();
    };
  }, [active, power, showActionMessage, hideActionMessage]);

  // Handle user input
  useEffect(() => {
    if (!active) return;

    let animationFrame: number;
    const updateControls = () => {
      if (alreadyShot.current) {
        animationFrame = requestAnimationFrame(updateControls);
        return;
      }

      let moved = false;

      // Move left/right
      if (isPressed('lookLeft')) {
        setPosition((prev) => {
          moved = true;
          return [Math.max(prev[0] - 0.1, minX), prev[1], prev[2]];
        });
      }

      if (isPressed('lookRight')) {
        setPosition((prev) => {
          moved = true;
          return [Math.min(prev[0] + 0.1, maxX), prev[1], prev[2]];
        });
      }

      // Adjust power
      if (isPressed('lookUp')) {
        setPower((prev) => {
          const newPower = Math.min(prev + 0.5, maxPower);
          moved = true;
          // Update UI with new power
          showActionMessage(`PRESS SPACE TO SHOOT (Power: ${newPower.toFixed(1)})`);
          return newPower;
        });
      }

      if (isPressed('lookDown')) {
        setPower((prev) => {
          const newPower = Math.max(prev - 0.5, minPower);
          moved = true;
          // Update UI with new power
          showActionMessage(`PRESS SPACE TO SHOOT (Power: ${newPower.toFixed(1)})`);
          return newPower;
        });
      }

      // Shoot
      if (isPressed('jump')) {
        if (!alreadyShot.current && active) {
          alreadyShot.current = true;
          hideActionMessage();
          onShoot(position, power);
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
    onShoot,
    minX,
    maxX,
    minPower,
    maxPower,
    showActionMessage,
    hideActionMessage,
    power,
  ]);

  // Visual representation only (no HTML)
  return active ? (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ff5733" emissive="#ff3300" emissiveIntensity={0.3} />
      </mesh>
    </group>
  ) : null;
};

export default BowlingBallControls;
