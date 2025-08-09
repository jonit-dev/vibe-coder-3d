import React, { useCallback } from 'react';
import { FiPlay, FiPause, FiSquare, FiVolume2 } from 'react-icons/fi';

import { SoundData } from '@/core/lib/ecs/components/definitions/SoundComponent';
import { AssetSelector } from '@/editor/components/shared/AssetSelector';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { FieldGroup } from '@/editor/components/shared/FieldGroup';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';

export interface ISoundSectionProps {
  sound: SoundData;
  setSound: (sound: SoundData | null) => void;
  isPlaying: boolean;
}

export const SoundSection: React.FC<ISoundSectionProps> = ({
  sound,
  setSound,
  isPlaying,
}) => {
  const updateSound = useCallback(
    (updates: Partial<SoundData>) => {
      setSound({ ...sound, ...updates });
    },
    [sound, setSound],
  );

  const handlePlayControl = useCallback(
    (action: 'play' | 'pause' | 'stop') => {
      switch (action) {
        case 'play':
          updateSound({ isPlaying: true });
          break;
        case 'pause':
          updateSound({ isPlaying: false });
          break;
        case 'stop':
          updateSound({ isPlaying: false, currentTime: 0 });
          break;
      }
    },
    [updateSound],
  );

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <CollapsibleSection
      title="Sound"
      icon={<FiVolume2 className="w-4 h-4" />}
      defaultExpanded={true}
    >
      {/* Audio File */}
      <div className="mb-2">
        <AssetSelector
          label="Audio File"
          value={sound.audioPath}
          onChange={(assetPath) => updateSound({ audioPath: assetPath || '' })}
          placeholder="No audio file selected"
          buttonIcon={<FiVolume2 />}
          buttonText="Browse"
          buttonTitle="Select Audio File"
          basePath="/assets/audio"
          allowedExtensions={['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']}
          showPreview={true}
        />
      </div>

      {/* Basic Controls */}
      <FieldGroup label="Basic Controls">
        <div className="grid grid-cols-2 gap-3">
          <CheckboxField
            label="Enabled"
            value={sound.enabled}
            onChange={(enabled) => updateSound({ enabled })}
          />
          <CheckboxField
            label="Autoplay"
            value={sound.autoplay}
            onChange={(autoplay) => updateSound({ autoplay })}
          />
          <CheckboxField
            label="Loop"
            value={sound.loop}
            onChange={(loop) => updateSound({ loop })}
          />
          <CheckboxField
            label="Muted"
            value={sound.muted}
            onChange={(muted) => updateSound({ muted })}
          />
        </div>
      </FieldGroup>

      {/* Playback Controls */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-300">Playback</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => handlePlayControl('play')}
            disabled={!sound.enabled || isPlaying}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
          >
            <FiPlay className="w-3 h-3" />
            Play
          </button>
          <button
            onClick={() => handlePlayControl('pause')}
            disabled={!sound.enabled || !sound.isPlaying}
            className="flex items-center gap-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
          >
            <FiPause className="w-3 h-3" />
            Pause
          </button>
          <button
            onClick={() => handlePlayControl('stop')}
            disabled={!sound.enabled || !sound.isPlaying}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
          >
            <FiSquare className="w-3 h-3" />
            Stop
          </button>
        </div>
        
        {/* Progress Info */}
        {sound.duration > 0 && (
          <div className="text-xs text-gray-400">
            {formatTime(sound.currentTime)} / {formatTime(sound.duration)}
          </div>
        )}
      </div>

      {/* Audio Properties */}
      <FieldGroup label="Audio Properties">
        <div className="grid grid-cols-2 gap-3">
          <SingleAxisField
            label="Volume"
            value={sound.volume}
            onChange={(volume) => updateSound({ volume })}
            min={0}
            max={1}
            step={0.01}
            disabled={isPlaying}
          />
          <SingleAxisField
            label="Pitch"
            value={sound.pitch}
            onChange={(pitch) => updateSound({ pitch })}
            min={0.1}
            max={4}
            step={0.01}
            disabled={isPlaying}
          />
        </div>
        <SingleAxisField
          label="Playback Rate"
          value={sound.playbackRate}
          onChange={(playbackRate) => updateSound({ playbackRate })}
          min={0.1}
          max={4}
          step={0.01}
          disabled={isPlaying}
        />
      </FieldGroup>

      {/* 3D Audio Settings */}
      <FieldGroup label="3D Audio">
        <CheckboxField
          label="Enable 3D Audio"
          value={sound.is3D}
          onChange={(is3D) => updateSound({ is3D })}
        />
        
        {sound.is3D && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <SingleAxisField
              label="Min Distance"
              value={sound.minDistance}
              onChange={(minDistance) => updateSound({ minDistance })}
              min={0}
              max={100}
              step={0.1}
            />
            <SingleAxisField
              label="Max Distance"
              value={sound.maxDistance}
              onChange={(maxDistance) => updateSound({ maxDistance })}
              min={1}
              max={10000}
              step={1}
            />
            <SingleAxisField
              label="Rolloff Factor"
              value={sound.rolloffFactor}
              onChange={(rolloffFactor) => updateSound({ rolloffFactor })}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        )}
      </FieldGroup>

      {/* Advanced 3D Settings */}
      {sound.is3D && (
        <FieldGroup label="Directional Audio">
          <div className="grid grid-cols-2 gap-3">
            <SingleAxisField
              label="Inner Cone (°)"
              value={sound.coneInnerAngle}
              onChange={(coneInnerAngle) => updateSound({ coneInnerAngle })}
              min={0}
              max={360}
              step={1}
            />
            <SingleAxisField
              label="Outer Cone (°)"
              value={sound.coneOuterAngle}
              onChange={(coneOuterAngle) => updateSound({ coneOuterAngle })}
              min={0}
              max={360}
              step={1}
            />
          </div>
          <SingleAxisField
            label="Outer Gain"
            value={sound.coneOuterGain}
            onChange={(coneOuterGain) => updateSound({ coneOuterGain })}
            min={0}
            max={1}
            step={0.01}
          />
        </FieldGroup>
      )}

      {/* Debug Info */}
      {sound.format && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-300">Info</span>
          </div>
          <div className="text-xs text-gray-400 bg-gray-750 border border-gray-600 rounded p-2">
            Format: {sound.format.toUpperCase()}
            {sound.isPlaying && <span className="text-green-400 ml-2">● Playing</span>}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
};