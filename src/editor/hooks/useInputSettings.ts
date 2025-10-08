import { useState, useEffect } from 'react';

export interface IInputSettings {
  // Keyboard
  preventDefaultArrows: boolean;
  preventDefaultSpace: boolean;
  preventDefaultTab: boolean;
  keyRepeatDelay: number;

  // Mouse
  mouseSensitivity: number;
  invertY: boolean;
  invertX: boolean;
  smoothMouse: boolean;
  scrollSensitivity: number;

  // Debug
  showInputDebug: boolean;
  logInputEvents: boolean;
}

const DEFAULT_SETTINGS: IInputSettings = {
  preventDefaultArrows: true,
  preventDefaultSpace: true,
  preventDefaultTab: true,
  keyRepeatDelay: 250,
  mouseSensitivity: 1.0,
  invertY: false,
  invertX: false,
  smoothMouse: true,
  scrollSensitivity: 1.0,
  showInputDebug: false,
  logInputEvents: false,
};

const STORAGE_KEY = 'vibe-coder-input-settings';

export const useInputSettings = () => {
  const [settings, setSettings] = useState<IInputSettings>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Failed to parse input settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof IInputSettings>(key: K, value: IInputSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetToDefaults,
  };
};
