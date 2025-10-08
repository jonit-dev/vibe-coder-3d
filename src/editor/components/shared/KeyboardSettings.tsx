import React from 'react';
import { useInputSettings } from '@editor/hooks/useInputSettings';
import { ToggleSetting, NumberSetting } from './SettingControls';

export const KeyboardSettings: React.FC = () => {
  const { settings, updateSetting } = useInputSettings();

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">Keyboard Settings</h3>
      <div className="space-y-4">
        <ToggleSetting
          label="Prevent default on arrow keys"
          description="Prevents browser scroll when using arrow keys"
          checked={settings.preventDefaultArrows}
          onChange={(checked) => updateSetting('preventDefaultArrows', checked)}
        />
        <ToggleSetting
          label="Prevent default on space"
          description="Prevents page scroll when pressing space"
          checked={settings.preventDefaultSpace}
          onChange={(checked) => updateSetting('preventDefaultSpace', checked)}
        />
        <ToggleSetting
          label="Prevent default on Tab"
          description="Keeps focus within the application"
          checked={settings.preventDefaultTab}
          onChange={(checked) => updateSetting('preventDefaultTab', checked)}
        />
        <NumberSetting
          label="Key repeat delay"
          value={settings.keyRepeatDelay}
          min={0}
          max={1000}
          step={50}
          unit="ms"
          onChange={(value) => updateSetting('keyRepeatDelay', value)}
        />
      </div>
    </div>
  );
};
