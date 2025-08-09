import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiAlertTriangle } from 'react-icons/fi';

interface IAudioPreviewProps {
  audioPath: string;
  className?: string;
}

export const AudioPreview: React.FC<IAudioPreviewProps> = ({ 
  audioPath, 
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time in MM:SS format
  const formatTime = useCallback((time: number): string => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Handle audio metadata loading
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      setError('');
    }
  }, []);

  // Handle time update during playback
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Handle playback end
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Handle audio loading errors
  const handleError = useCallback(() => {
    setError('Failed to load audio file');
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    if (!audioRef.current || error) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        setError('Failed to play audio file');
      });
      setIsPlaying(true);
    }
  }, [isPlaying, error]);

  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    
    if (volume === 0) {
      setVolume(0.5);
      audioRef.current.volume = 0.5;
    } else {
      setVolume(0);
      audioRef.current.volume = 0;
    }
  }, [volume]);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  }, []);

  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Reset state when audio path changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError('');
    
    // Pause current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioPath]);

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!audioPath) {
    return (
      <div className={`bg-gray-800/50 rounded-md border border-gray-700/30 p-4 ${className}`}>
        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
          No audio file selected
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-md border border-gray-700/30 p-3 ${className}`}>
      <audio
        ref={audioRef}
        src={audioPath}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
      />
      
      {error ? (
        <div className="flex items-center justify-center h-32 text-red-400 text-sm">
          <FiAlertTriangle className="mr-2" />
          {error}
        </div>
      ) : (
        <>
          {/* Audio Info */}
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-200 mb-1 truncate">
              {audioPath.split('/').pop() || 'Unknown'}
            </div>
            <div className="text-xs text-gray-400">
              {isLoading ? 'Loading...' : `Duration: ${formatTime(duration)}`}
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={togglePlayback}
              disabled={isLoading || !!error}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
            >
              {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} />}
            </button>
            
            <div className="flex-1 text-xs text-gray-400 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            
            <button 
              onClick={toggleMute}
              disabled={isLoading || !!error}
              className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {volume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
            </button>
          </div>
          
          {/* Progress Bar */}
          <div 
            className="h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer mb-3"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-cyan-400 transition-all duration-100"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <FiVolume2 size={14} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              disabled={isLoading || !!error}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-xs text-gray-400 font-mono w-8">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
};