import React, { useState } from 'react';
import { FiZap, FiSettings } from 'react-icons/fi';

import { ICharacterControllerData, IInputMapping } from '@/core/lib/ecs/components/accessors/types';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { ComponentDependencyWarning } from '@/editor/components/shared/ComponentDependencyWarning';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { InspectorSection } from '@/editor/components/shared/InspectorSection';

import { InputConfigurationModal } from './InputConfigurationModal';

export interface ICharacterControllerSectionProps {
  data: ICharacterControllerData;
  setData: (data: ICharacterControllerData | null) => void;
  isPlaying: boolean;
  isGrounded: boolean;
  hasMeshCollider?: boolean;
  hasRigidBody?: boolean;
  onAddPhysicsComponents?: () => void;
  onRemoveRigidBody?: () => void;
}

export const CharacterControllerSection: React.FC<ICharacterControllerSectionProps> = ({
  data,
  setData,
  isPlaying,
  isGrounded,
  hasMeshCollider = true,
  onAddPhysicsComponents,
}) => {
  const [showInputModal, setShowInputModal] = useState(false);

  const updateData = (updates: Partial<ICharacterControllerData>) => {
    setData({ ...data, ...updates });
  };

  const updateInputMapping = (mapping: IInputMapping) => {
    setData({ ...data, inputMapping: mapping });
  };

  // Show warning if collider is missing
  const showPhysicsWarning = !hasMeshCollider;

  return (
    <>
      <InspectorSection
        title="Character Controller"
        icon={<FiZap className="w-4 h-4" />}
        headerColor="green"
        removable
        onRemove={() => setData(null)}
      >
        {/* Physics Recommendation */}
        {showPhysicsWarning && !isPlaying && onAddPhysicsComponents && (
          <div className="mb-4">
            <ComponentDependencyWarning
              title="Collider Recommended"
              description="For collision detection and realistic movement, add a collider. The character won't be affected by physics, but can push objects."
              buttonText="Add Collider"
              onButtonClick={onAddPhysicsComponents}
              footerText="Will add: Mesh Collider (Capsule)"
            />
          </div>
        )}

        {/* Basic Settings */}
        <div className="space-y-3">
          <CheckboxField
            label="Enabled"
            value={data.enabled}
            onChange={(enabled) => updateData({ enabled })}
            disabled={isPlaying}
          />

          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Control Mode</label>
            <select
              value={data.controlMode}
              onChange={(e) => updateData({ controlMode: e.target.value as 'auto' | 'manual' })}
              disabled={isPlaying}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            >
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Input Configuration Button for Auto Mode */}
          {data.controlMode === 'auto' && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-xs text-gray-400">Input Settings</span>
              <button
                onClick={() => setShowInputModal(true)}
                disabled={isPlaying}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSettings className="w-3 h-3" />
                Configure
              </button>
            </div>
          )}
        </div>

        {/* Movement Parameters */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-3">
            Movement
          </h4>
          <div className="space-y-3">
            <SingleAxisField
              label="Max Speed"
              value={data.maxSpeed}
              onChange={(maxSpeed) => updateData({ maxSpeed })}
              min={0}
              max={20}
              step={0.5}
              precision={1}
              disabled={isPlaying}
            />

            <SingleAxisField
              label="Jump Strength"
              value={data.jumpStrength}
              onChange={(jumpStrength) => updateData({ jumpStrength })}
              min={0}
              max={20}
              step={0.5}
              precision={1}
              disabled={isPlaying}
            />
          </div>
        </div>

        {/* Physics Parameters */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-3">
            Physics
          </h4>
          <div className="space-y-3">
            <SingleAxisField
              label="Slope Limit"
              value={data.slopeLimit}
              onChange={(slopeLimit) => updateData({ slopeLimit })}
              min={0}
              max={90}
              step={1}
              precision={0}
              disabled={isPlaying}
            />

            <SingleAxisField
              label="Step Offset"
              value={data.stepOffset}
              onChange={(stepOffset) => updateData({ stepOffset })}
              min={0}
              max={1}
              step={0.05}
              precision={2}
              disabled={isPlaying}
            />

            <SingleAxisField
              label="Skin Width"
              value={data.skinWidth}
              onChange={(skinWidth) => updateData({ skinWidth })}
              min={0}
              max={0.5}
              step={0.01}
              precision={3}
              disabled={isPlaying}
            />

            <SingleAxisField
              label="Gravity Scale"
              value={data.gravityScale}
              onChange={(gravityScale) => updateData({ gravityScale })}
              min={0}
              max={5}
              step={0.1}
              precision={1}
              disabled={isPlaying}
            />
          </div>
        </div>

        {/* Runtime State (Read-only) */}
        {isPlaying && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-3">
              Runtime State
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Grounded</span>
              <div
                className={`w-2 h-2 rounded-full ${isGrounded ? 'bg-green-500' : 'bg-red-500'}`}
              />
            </div>
          </div>
        )}
      </InspectorSection>

      {/* Input Configuration Modal */}
      <InputConfigurationModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        inputMapping={
          data.inputMapping || {
            forward: 'w',
            backward: 's',
            left: 'a',
            right: 'd',
            jump: 'space',
          }
        }
        onSave={updateInputMapping}
      />
    </>
  );
};
