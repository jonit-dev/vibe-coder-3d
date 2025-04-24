import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { useCallback, useEffect, useRef, useState } from 'react';

import { IPhysicsBallRef } from '@/core/components/physics/PhysicsBall';
import { getNodes } from '@/core/lib/tags';
import { useUIStore } from '@core/stores/uiStore';

import { PIN_TAGS } from './BowlingPin';

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

type GameState = 'ready' | 'rolling' | 'scoring' | 'resetting';

const BowlingGameManager = ({ children }: IBowlingGameProps) => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
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
  const { setScore: uiSetScore, showInstructions, score: _uiScore } = useUIStore();

  // Setup game instructions
  useEffect(() => {
    showInstructions('BOWLING DEMO', [
      { id: '1', text: 'Up/Down: Adjust Power' },
      { id: '2', text: 'Left/Right: Adjust Angle' },
      { id: '3', text: 'Space: Roll the ball' },
      { id: '4', text: 'R: Reset' },
    ]);
  }, [showInstructions]);

  // Update game state with callback
  const updateGameState = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  // Main game update logic
  useFrame(() => {
    // Only check for fallen pins if we're in the scoring state
    if (gameState === 'scoring') {
      // Get all pins via tags - this is the key functionality from our tags system
      const fallenPins = getNodes<RapierRigidBody>(PIN_TAGS.FALLEN);
      const totalPins = getNodes<RapierRigidBody>(PIN_TAGS.ALL);

      // Calculate current score based on fallen pins
      const currentScore = fallenPins.length;

      // Update score
      if (currentScore !== score) {
        setScore(currentScore);
        uiSetScore(currentScore);
      }

      // Check if ball has left play area and all pins have settled
      // This would be a good time to end the frame or prepare for the next roll

      // For demo purposes, let's just check if all pins are fallen
      if (fallenPins.length === totalPins.length) {
        console.log('Strike! All pins down.');
        updateGameState('resetting');
      }
    }
  });

  const handlePinHit = useCallback(
    (pinId: number) => {
      if (!pinsHit.current.has(pinId)) {
        pinsHit.current.add(pinId);
        setScore(score + 10);
        uiSetScore(score + 10);
      }
    },
    [setScore, score, uiSetScore],
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
    updateGameState('ready');
  }, [setScore, updateGameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  // Demo: Advanced query examples using the tags system
  const showTagDemos = useCallback(() => {
    // Get pins in the front row
    const frontRowPins = getNodes<RapierRigidBody>(PIN_TAGS.ROW_FRONT);
    console.log(`Front row pins: ${frontRowPins.length}`);

    // Check if the headpin is still standing
    const headpins = getNodes<RapierRigidBody>(PIN_TAGS.HEAD);
    const standingHeadpins = headpins.filter((pin) => {
      // The pin needs to be both tagged as HEAD and as STANDING
      return getNodes<RapierRigidBody>(PIN_TAGS.STANDING).includes(pin);
    });
    console.log(`Headpin standing: ${standingHeadpins.length > 0}`);

    // Check for a split (pins on both sides with middle pins knocked down)
    const leftCornerStanding = getNodes<RapierRigidBody>(PIN_TAGS.LEFT_CORNER).some((pin) =>
      getNodes<RapierRigidBody>(PIN_TAGS.STANDING).includes(pin),
    );

    const rightCornerStanding = getNodes<RapierRigidBody>(PIN_TAGS.RIGHT_CORNER).some((pin) =>
      getNodes<RapierRigidBody>(PIN_TAGS.STANDING).includes(pin),
    );

    const middleRowPins = getNodes<RapierRigidBody>(PIN_TAGS.ROW_MIDDLE);
    const middleRowFallen = middleRowPins.every((pin) =>
      getNodes<RapierRigidBody>(PIN_TAGS.FALLEN).includes(pin),
    );

    const isSplit = leftCornerStanding && rightCornerStanding && middleRowFallen;
    console.log(`Split detected: ${isSplit}`);
  }, []);

  // For demo purposes, run tag demos when component mounts
  useEffect(() => {
    // Small delay to ensure pins are registered
    const timer = setTimeout(showTagDemos, 1000);
    return () => clearTimeout(timer);
  }, [showTagDemos]);

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
