import { useEffect } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';

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
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection.trackId && selection.keyframeIndices.length > 0) {
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
        selection.keyframeIndices.forEach((index) => {
          removeKeyframe(selection.trackId!, index);
        });
        return;
      }

      // S: Add keyframe at current time on selected track
      if (e.key === 's' && selection.trackId && activeClip) {
        e.preventDefault();
        const track = activeClip.tracks.find((t) => t.id === selection.trackId);
        if (track) {
          // Get default value based on track type
          let defaultValue: number | [number, number, number] | [number, number, number, number] | Record<string, number> = 0;
          if (track.type.includes('position') || track.type.includes('scale')) {
            defaultValue = [0, 0, 0] as [number, number, number];
          } else if (track.type.includes('rotation')) {
            defaultValue = [0, 0, 0, 1] as [number, number, number, number]; // Identity quaternion
          }

          addKeyframe(selection.trackId, {
            time: currentTime,
            value: defaultValue,
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
