import React from 'react';

import { IComponent, KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ScriptData } from '@/core/lib/ecs/components/definitions/ScriptComponent';
import { ScriptSection } from '@/editor/components/panels/InspectorPanel/Script/ScriptSection';

export interface IScriptAdapterProps {
  scriptComponent: IComponent<ScriptData> | null;
  updateComponent: (type: string, data: ScriptData) => void;
  removeComponent?: (type: string) => void;
}

export const ScriptAdapter: React.FC<IScriptAdapterProps> = ({
  scriptComponent,
  updateComponent,
  removeComponent,
}) => {
  const data = scriptComponent?.data;

  if (!data) return null;

  // Convert ECS data to the format expected by ScriptSection
  const scriptData: ScriptData = {
    code: data.code || '',
    enabled: data.enabled ?? true,

    scriptName: data.scriptName || 'Script',
    description: data.description || '',

    executeInUpdate: data.executeInUpdate ?? true,
    executeOnStart: data.executeOnStart ?? false,
    executeOnEnable: data.executeOnEnable ?? false,

    maxExecutionTime: data.maxExecutionTime ?? 16,

    // Runtime state (read-only in UI)
    hasErrors: data.hasErrors ?? false,
    lastErrorMessage: data.lastErrorMessage || '',
    lastExecutionTime: data.lastExecutionTime ?? 0,
    executionCount: data.executionCount ?? 0,

    parameters: data.parameters || {},

    lastModified: data.lastModified ?? Date.now(),
    compiledCode: data.compiledCode || '',
  };

  const handleUpdate = (updatedData: Partial<ScriptData>) => {
    const newData: ScriptData = {
      ...scriptData,
      ...updatedData,
      lastModified: Date.now(),
    };

    updateComponent(KnownComponentTypes.SCRIPT, newData);
  };

  const handleRemove = () => {
    if (removeComponent) {
      removeComponent(KnownComponentTypes.SCRIPT);
    }
  };

  return <ScriptSection scriptData={scriptData} onUpdate={handleUpdate} onRemove={handleRemove} />;
};
