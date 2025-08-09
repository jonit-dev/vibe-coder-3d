import React from 'react';

import { IComponent, KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { SoundData } from '@/core/lib/ecs/components/definitions/SoundComponent';
import { SoundSection } from '@/editor/components/panels/InspectorPanel/Sound/SoundSection';

export interface ISoundAdapterProps {
  soundComponent: IComponent<SoundData> | null;
  updateComponent: (type: string, data: SoundData) => void;
  removeComponent?: (type: string) => void;
  isPlaying: boolean;
}

export const SoundAdapter: React.FC<ISoundAdapterProps> = ({
  soundComponent,
  updateComponent,
  removeComponent,
  isPlaying,
}) => {
  const data = soundComponent?.data;

  if (!data) return null;

  // Convert ECS data to the format expected by SoundSection
  const soundData: SoundData = {
    audioPath: data.audioPath || '',
    enabled: data.enabled ?? true,
    autoplay: data.autoplay ?? false,
    loop: data.loop ?? false,
    volume: data.volume ?? 1,
    pitch: data.pitch ?? 1,
    playbackRate: data.playbackRate ?? 1,
    muted: data.muted ?? false,
    
    // 3D Audio properties
    is3D: data.is3D ?? true,
    minDistance: data.minDistance ?? 1,
    maxDistance: data.maxDistance ?? 10000,
    rolloffFactor: data.rolloffFactor ?? 1,
    coneInnerAngle: data.coneInnerAngle ?? 360,
    coneOuterAngle: data.coneOuterAngle ?? 360,
    coneOuterGain: data.coneOuterGain ?? 0,
    
    // State properties
    isPlaying: data.isPlaying ?? false,
    currentTime: data.currentTime ?? 0,
    duration: data.duration ?? 0,
    
    // Format info
    format: data.format,
  };

  const handleUpdate = (newData: SoundData | null) => {
    if (newData === null) {
      // Remove component
      if (removeComponent) {
        removeComponent(KnownComponentTypes.SOUND);
      }
    } else {
      // Update component
      updateComponent(KnownComponentTypes.SOUND, newData);
    }
  };

  return (
    <SoundSection
      sound={soundData}
      setSound={handleUpdate}
      isPlaying={isPlaying}
    />
  );
};