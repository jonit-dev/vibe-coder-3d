import { useRef, useState } from 'react';

import BowlingPin from './BowlingPin';

// Custom tag for this specific pin setup (could have multiple setups)
const SETUP_TAG = 'bowling-pin-setup-main';

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
      {/* Back row (heavier pins) */}
      <BowlingPin
        position={[-0.6, 0.3, 0.6]}
        pinId={7}
        onFallen={updatePinStatus}
        mass={1.5}
        stripeColor="#4477ff"
        tags={[SETUP_TAG]}
      />
      <BowlingPin
        position={[-0.2, 0.3, 0.6]}
        pinId={8}
        onFallen={updatePinStatus}
        mass={1.5}
        stripeColor="#4477ff"
        tags={[SETUP_TAG]}
      />
      <BowlingPin
        position={[0.2, 0.3, 0.6]}
        pinId={9}
        onFallen={updatePinStatus}
        mass={1.5}
        stripeColor="#4477ff"
        tags={[SETUP_TAG]}
      />
      <BowlingPin
        position={[0.6, 0.3, 0.6]}
        pinId={10}
        onFallen={updatePinStatus}
        mass={1.5}
        stripeColor="#4477ff"
        tags={[SETUP_TAG]}
      />

      {/* Middle row (standard pins) */}
      <BowlingPin
        position={[-0.45, 0.3, 0.3]}
        pinId={4}
        onFallen={updatePinStatus}
        tags={[SETUP_TAG]}
      />
      <BowlingPin
        position={[-0.15, 0.3, 0.3]}
        pinId={5}
        onFallen={updatePinStatus}
        tags={[SETUP_TAG]}
      />
      <BowlingPin
        position={[0.15, 0.3, 0.3]}
        pinId={6}
        onFallen={updatePinStatus}
        tags={[SETUP_TAG]}
      />

      {/* Front row (lighter pins) */}
      <BowlingPin
        position={[-0.3, 0.3, 0]}
        pinId={2}
        onFallen={updatePinStatus}
        mass={0.9}
        stripeColor="#00cc77"
        tags={[SETUP_TAG]}
      />
      <BowlingPin
        position={[0, 0.3, 0]}
        pinId={3}
        onFallen={updatePinStatus}
        mass={0.9}
        stripeColor="#00cc77"
        tags={[SETUP_TAG]}
      />

      {/* Head pin (special) */}
      <BowlingPin
        position={[-0.15, 0.3, -0.3]}
        pinId={1}
        onFallen={updatePinStatus}
        stripeColor="#ffd700" // Gold
        tags={[SETUP_TAG, 'headpin']}
      />
    </group>
  );
};

export default BowlingPinSetup;
