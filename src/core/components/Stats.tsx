import { useEngineStore } from '@core/state/engineStore';
import { Stats as DreiStats } from '@react-three/drei';
import { useEffect, useState } from 'react';

export default function Stats() {
  const { showFps } = useEngineStore();
  const [mounted, setMounted] = useState(false);

  // Lazy load stats to avoid SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !showFps) return null;

  return <DreiStats />;
} 
