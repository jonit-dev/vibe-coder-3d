import { useCallback, useEffect, useRef, useState } from 'react';

import { IPhysicsBallRef } from '@/core/components/physics/PhysicsBall';
import { useUIStore } from '@core/stores/uiStore';

export interface IBowlingGameProps {
  children: (props: {
    handleShoot: (position: [number, number, number], power: number) => void;
    activeBall: boolean;
    currentBall: {
      position: [number, number, number];
      velocity: [number, number, number];
      id: number;
    } | null;
    pinsKey: number;
    ballRef: React.RefObject<IPhysicsBallRef | null>;
    score: number;
    handlePinHit: (pinId: number) => void;
    handleFirstPinFallen: () => void;
    handleReset: () => void;
  }) => React.ReactNode;
}

export const BowlingGameManager = ({ children }: IBowlingGameProps) => {
  const [activeBall, setActiveBall] = useState(true);
  const [currentBall, setCurrentBall] = useState<{
    position: [number, number, number];
    velocity: [number, number, number];
    id: number;
  } | null>(null);
  const [pinsKey, setPinsKey] = useState(0);
  const pinsHit = useRef<Set<number>>(new Set());
  const ballRef = useRef<IPhysicsBallRef | null>(null);

  // Get UI store functions
  const { setScore, showInstructions, score } = useUIStore();

  // Setup game instructions
  useEffect(() => {
    showInstructions('BOWLING DEMO', [
      { id: '1', text: 'Up/Down: Adjust Power' },
      { id: '2', text: 'Left/Right: Adjust Angle' },
      { id: '3', text: 'Space: Roll the ball' },
      { id: '4', text: 'R: Reset' },
    ]);
  }, [showInstructions]);

  const handlePinHit = useCallback(
    (pinId: number) => {
      if (!pinsHit.current.has(pinId)) {
        pinsHit.current.add(pinId);
        setScore(score + 10);
      }
    },
    [setScore, score],
  );

  const handleFirstPinFallen = useCallback(() => {
    // Schedule new ball after pin falls
    setTimeout(() => {
      setActiveBall(true);
      setPinsKey((k) => k + 1); // Reset pins
      pinsHit.current.clear();
      setCurrentBall(null);
    }, 5000);
  }, []);

  const handleShoot = useCallback((position: [number, number, number], power: number) => {
    setActiveBall(false);
    setCurrentBall({
      position,
      velocity: [0, 0, power],
      id: Date.now(),
    });
  }, []);

  const handleReset = useCallback(() => {
    setScore(0);
    pinsHit.current.clear();
    setActiveBall(true);
    setCurrentBall(null);
    setPinsKey((k) => k + 1);
  }, [setScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  return children({
    handleShoot,
    activeBall,
    currentBall,
    pinsKey,
    ballRef,
    score,
    handlePinHit,
    handleFirstPinFallen,
    handleReset,
  });
};

export default BowlingGameManager;
