import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { IKeyframe } from '@core/components/animation/tracks/TrackTypes';
import { TrackType } from '@core/components/animation/tracks/TrackTypes';

export interface IKeyframeValueEditorProps {
  keyframe: IKeyframe;
  trackType: TrackType;
  onSave: (value: IKeyframe['value']) => void;
  onCancel: () => void;
}

export const KeyframeValueEditor: React.FC<IKeyframeValueEditorProps> = ({
  keyframe,
  trackType,
  onSave,
  onCancel,
}) => {
  const [value, setValue] = useState<IKeyframe['value']>(keyframe.value);

  useEffect(() => {
    setValue(keyframe.value);
  }, [keyframe]);

  const handleSave = () => {
    onSave(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const renderValueInputs = () => {
    // Vector3 (Position, Scale)
    if (trackType === TrackType.TRANSFORM_POSITION || trackType === TrackType.TRANSFORM_SCALE) {
      const vec = Array.isArray(value) ? value : [0, 0, 0];
      return (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={vec[0]}
              onChange={(e) => setValue([parseFloat(e.target.value) || 0, vec[1], vec[2]])}
              onKeyDown={handleKeyDown}
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={vec[1]}
              onChange={(e) => setValue([vec[0], parseFloat(e.target.value) || 0, vec[2]])}
              onKeyDown={handleKeyDown}
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Z</label>
            <input
              type="number"
              value={vec[2]}
              onChange={(e) => setValue([vec[0], vec[1], parseFloat(e.target.value) || 0])}
              onKeyDown={handleKeyDown}
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      );
    }

    // Quaternion (Rotation) - show as Euler angles for easier editing
    if (trackType === TrackType.TRANSFORM_ROTATION) {
      const quat = Array.isArray(value) && value.length === 4 ? value : [0, 0, 0, 1];
      // TODO: Convert quaternion to euler for display, convert back on save
      // For now, show raw quaternion values with warning
      return (
        <div className="space-y-2">
          <div className="text-xs text-yellow-400 mb-2">
            Note: Editing quaternions directly. Euler angle editor coming soon.
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={quat[0]}
              onChange={(e) =>
                setValue([parseFloat(e.target.value) || 0, quat[1], quat[2], quat[3]])
              }
              onKeyDown={handleKeyDown}
              step="0.01"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={quat[1]}
              onChange={(e) =>
                setValue([quat[0], parseFloat(e.target.value) || 0, quat[2], quat[3]])
              }
              onKeyDown={handleKeyDown}
              step="0.01"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Z</label>
            <input
              type="number"
              value={quat[2]}
              onChange={(e) =>
                setValue([quat[0], quat[1], parseFloat(e.target.value) || 0, quat[3]])
              }
              onKeyDown={handleKeyDown}
              step="0.01"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">W</label>
            <input
              type="number"
              value={quat[3]}
              onChange={(e) =>
                setValue([quat[0], quat[1], quat[2], parseFloat(e.target.value) || 1])
              }
              onKeyDown={handleKeyDown}
              step="0.01"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      );
    }

    // Single number (Morph, Material properties)
    if (typeof value === 'number') {
      return (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            step="0.01"
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        </div>
      );
    }

    // Object/Record (Event data, Material properties map)
    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">Event Data (JSON)</div>
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                setValue(JSON.parse(e.target.value));
              } catch {
                // Keep editing
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSave();
              } else if (e.key === 'Escape') {
                onCancel();
              }
            }}
            rows={8}
            className="w-full px-2 py-1 text-sm font-mono bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <div className="text-xs text-gray-500">Press Ctrl+Enter to save</div>
        </div>
      );
    }

    return <div className="text-xs text-red-400">Unknown value type</div>;
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-auto">
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Edit Keyframe Value</h3>
          <p className="text-xs text-gray-400 mt-1">
            Time: {keyframe.time.toFixed(3)}s • Type: {trackType}
          </p>
        </div>

        <div className="px-4 py-4">{renderValueInputs()}</div>

        <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
