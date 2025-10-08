import React from 'react';
import { ToggleSetting, RangeSetting } from './SettingControls';

export const GamepadSettings: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">Gamepad Settings</h3>
      <div className="space-y-4">
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <span className="text-sm font-semibold">Coming Soon</span>
          </div>
          <p className="text-xs text-yellow-200/70">
            Gamepad support is planned for a future release. You'll be able to configure Xbox,
            PlayStation, and generic controllers here.
          </p>
        </div>

        <div className="space-y-3 opacity-50">
          <ToggleSetting
            label="Enable gamepad support"
            checked={false}
            onChange={() => {}}
            disabled
          />
          <RangeSetting
            label="Dead zone"
            value={0.1}
            min={0}
            max={0.5}
            step={0.05}
            onChange={() => {}}
            disabled
          />
          <ToggleSetting label="Vibration" checked={false} onChange={() => {}} disabled />
        </div>
      </div>
    </div>
  );
};
