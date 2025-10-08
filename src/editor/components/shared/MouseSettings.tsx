import React from 'react';
import { useInputSettings } from '@editor/hooks/useInputSettings';
import { ToggleSetting, RangeSetting } from './SettingControls';

export const MouseSettings: React.FC = () => {
  const { settings, updateSetting } = useInputSettings();

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">Mouse Settings</h3>
      <div className="space-y-4">
        <RangeSetting
          label="Mouse Sensitivity"
          description="Affects camera rotation speed"
          value={settings.mouseSensitivity}
          min={0.1}
          max={5}
          step={0.1}
          formatValue={(v) => `${v.toFixed(1)}x`}
          onChange={(value) => updateSetting('mouseSensitivity', value)}
        />
        <ToggleSetting
          label="Invert Y-axis"
          description="Invert vertical mouse movement"
          checked={settings.invertY}
          onChange={(checked) => updateSetting('invertY', checked)}
        />
        <ToggleSetting
          label="Invert X-axis"
          description="Invert horizontal mouse movement"
          checked={settings.invertX}
          onChange={(checked) => updateSetting('invertX', checked)}
        />
        <ToggleSetting
          label="Smooth mouse movement"
          description="Apply smoothing to mouse delta"
          checked={settings.smoothMouse}
          onChange={(checked) => updateSetting('smoothMouse', checked)}
        />
        <RangeSetting
          label="Scroll sensitivity"
          value={settings.scrollSensitivity}
          min={0.1}
          max={3}
          step={0.1}
          formatValue={(v) => `${v.toFixed(1)}x`}
          onChange={(value) => updateSetting('scrollSensitivity', value)}
        />
      </div>
    </div>
  );
};
