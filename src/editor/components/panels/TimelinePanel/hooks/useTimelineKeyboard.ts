import { useEffect } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';
import { getDefaultKeyframeValueForTrackType } from '@core/components/animation/tracks/TrackTypes';

export function useTimelineKeyboard() {
  const {
    togglePlay,
    stop,
    undo,
    redo,
    copyKeyframes,
    pasteKeyframes,
    selection,
    removeKeyframe,
    currentTime,
    addKeyframe,
    activeClip,
  } = useTimelineStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Space: Play/Pause
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Escape: Stop
      if (e.key === 'Escape') {
        e.preventDefault();
        stop();
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + C: Copy keyframes
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'c' &&
        selection.trackId &&
        selection.keyframeIndices.length > 0
      ) {
        e.preventDefault();
        copyKeyframes();
        return;
      }

      // Ctrl/Cmd + V: Paste keyframes
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && selection.trackId) {
        e.preventDefault();
        pasteKeyframes();
        return;
      }

      // Delete/Backspace: Remove selected keyframes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection.trackId) {
        e.preventDefault();
        // Sort indices in descending order to avoid index shifting issues
        const sortedIndices = [...selection.keyframeIndices].sort((a, b) => b - a);
        sortedIndices.forEach((index) => {
          removeKeyframe(selection.trackId!, index);
        });
        return;
      }

      // S: Add keyframe at current time on selected track
      if (e.key === 's' && selection.trackId && activeClip) {
        e.preventDefault();
        const track = activeClip.tracks.find((t) => t.id === selection.trackId);
        if (track) {
          addKeyframe(selection.trackId, {
            time: currentTime,
            value: getDefaultKeyframeValueForTrackType(track.type),
            easing: 'linear',
          });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    stop,
    undo,
    redo,
    copyKeyframes,
    pasteKeyframes,
    selection,
    removeKeyframe,
    currentTime,
    addKeyframe,
    activeClip,
  ]);
}
