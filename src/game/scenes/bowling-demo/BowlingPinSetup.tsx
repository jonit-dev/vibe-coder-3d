import { useRef, useState } from 'react';

import BowlingPin from './BowlingPin';

const BowlingPinSetup = ({
  onPinHit,
  onFirstPinFallen,
}: {
  onPinHit: (pinId: number) => void;
  onFirstPinFallen: () => void;
}) => {
  const [fallenPins, setFallenPins] = useState<Set<number>>(new Set());
  const pinsRef = useRef<Map<number, boolean>>(new Map());
  const firstPinFallen = useRef(false);

  const updatePinStatus = (pinId: number, isFallen: boolean) => {
    if (isFallen && !fallenPins.has(pinId)) {
      setFallenPins((prev) => {
        const newSet = new Set(prev);
        newSet.add(pinId);
        return newSet;
      });
      onPinHit(pinId);
      if (!firstPinFallen.current) {
        firstPinFallen.current = true;
        onFirstPinFallen();
      }
    }
    pinsRef.current.set(pinId, isFallen);
  };

  return (
    <group position={[0, 0, 5]}>
      <BowlingPin position={[-0.6, 0.3, 0.6]} pinId={7} onFallen={updatePinStatus} />
      <BowlingPin position={[-0.2, 0.3, 0.6]} pinId={8} onFallen={updatePinStatus} />
      <BowlingPin position={[0.2, 0.3, 0.6]} pinId={9} onFallen={updatePinStatus} />
      <BowlingPin position={[0.6, 0.3, 0.6]} pinId={10} onFallen={updatePinStatus} />
      <BowlingPin position={[-0.45, 0.3, 0.3]} pinId={4} onFallen={updatePinStatus} />
      <BowlingPin position={[-0.15, 0.3, 0.3]} pinId={5} onFallen={updatePinStatus} />
      <BowlingPin position={[0.15, 0.3, 0.3]} pinId={6} onFallen={updatePinStatus} />
      <BowlingPin position={[-0.3, 0.3, 0]} pinId={2} onFallen={updatePinStatus} />
      <BowlingPin position={[0, 0.3, 0]} pinId={3} onFallen={updatePinStatus} />
      <BowlingPin position={[-0.15, 0.3, -0.3]} pinId={1} onFallen={updatePinStatus} />
    </group>
  );
};

export default BowlingPinSetup;
