import React, { useState } from 'react';
import { FiEdit, FiEye, FiImage } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { IMeshRendererData } from '@/core/lib/ecs/components/MeshRendererComponent';
import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import { MaterialBrowserModal } from '@/editor/components/materials/MaterialBrowserModal';
import { MaterialCreateModal } from '@/editor/components/materials/MaterialCreateModal';
import { MaterialInspector } from '@/editor/components/materials/MaterialInspector';
import { useMaterials } from '@/editor/components/materials/hooks/useMaterials';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { ColorField } from '@/editor/components/shared/ColorField';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { ToggleField } from '@/editor/components/shared/ToggleField';

export interface IMeshRendererSectionProps {
  meshRenderer: IMeshRendererData | null;
  setMeshRenderer: (data: IMeshRendererData | null) => void;
  isPlaying: boolean;
}

export const MeshRendererSection: React.FC<IMeshRendererSectionProps> = ({
  meshRenderer,
  setMeshRenderer,
}) => {
  const materialRegistry = MaterialRegistry.getInstance();
  const {
    isBrowserOpen,
    isCreateOpen,
    isInspectorOpen,
    selectedMaterialId,
    openBrowser,
    closeBrowser,
    openCreate,
    closeCreate,
    openInspector,
    closeInspector,
    handleBrowserSelect,
    handleCreate,
  } = useMaterials({
    selectedMaterialId: meshRenderer?.materialId,
  });

  // Local state for overrides toggle (kept independent from derived ECS data)
  const [overridesEnabled, setOverridesEnabled] = useState(!!meshRenderer?.material);

  const handleRemoveMeshRenderer = () => {
    setMeshRenderer(null);
  };

  const updateMeshRenderer = (updates: Partial<IMeshRendererData>) => {
    if (meshRenderer) {
      const newMeshRenderer = { ...meshRenderer, ...updates };
      setMeshRenderer(newMeshRenderer);
    }
  };

  // For backward compatibility: if no materialId, use 'default'
  const currentMaterialId = meshRenderer?.materialId || 'default';
  const currentMaterial = materialRegistry.get(currentMaterialId);

  // Base overrides template derived from current material (used when enabling overrides)
  const baseOverridesTemplate = React.useMemo(() => {
    const base = (currentMaterial as IMaterialDefinition | undefined) || {
      color: '#cccccc',
      metalness: 0,
      roughness: 0.7,
    };
    return {
      color: base.color ?? '#cccccc',
      metalness: base.metalness ?? 0,
      roughness: base.roughness ?? 0.7,
    };
  }, [currentMaterial]);

  // Handle material selection from browser
  const handleMaterialSelect = (materialId: string) => {
    // Clear overrides when selecting a new material to see the actual material
    updateMeshRenderer({
      materialId,
      material: undefined // Clear overrides
    });
    // Keep UI consistent with cleared overrides
    setOverridesEnabled(false);
    handleBrowserSelect(materialId);
  };

  // Handle material inspector save
  const handleMaterialSave = (updatedMaterial: IMaterialDefinition) => {
    // Material is saved in the inspector, just update the mesh renderer to use it
    updateMeshRenderer({ materialId: updatedMaterial.id });
  };

  // Don't render the section if meshRenderer is null
  if (!meshRenderer) {
    return null;
  }

  // Effective overrides for UI (use existing overrides or fall back to template while enabling)
  const effectiveOverrides = React.useMemo(
    () => (meshRenderer.material ? meshRenderer.material : baseOverridesTemplate),
    [meshRenderer.material, baseOverridesTemplate]
  );

  return (
    <>
      <GenericComponentSection
        title="Mesh Renderer"
        icon={<FiEye />}
        headerColor="cyan"
        componentId={KnownComponentTypes.MESH_RENDERER}
        onRemove={handleRemoveMeshRenderer}
      >
        <ToggleField
          label="Enabled"
          value={meshRenderer.enabled ?? true}
          onChange={(value: boolean) => updateMeshRenderer({ enabled: value })}
          resetValue={true}
          color="cyan"
        />

        <ComponentField
          label="Mesh"
          type="select"
          value={meshRenderer.meshId}
          onChange={(value) => updateMeshRenderer({ meshId: value as string })}
          options={[
            { value: 'cube', label: 'Cube' },
            { value: 'sphere', label: 'Sphere' },
            { value: 'plane', label: 'Plane' },
            { value: 'cylinder', label: 'Cylinder' },
            { value: 'cone', label: 'Cone' },
            { value: 'torus', label: 'Torus' },
            { value: 'capsule', label: 'Capsule' },
          ]}
        />

        {/* Material Section - Now uses materialId */}
        <CollapsibleSection title="Material" icon={<FiImage />} defaultExpanded={true} badge="Asset">
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-gray-300">Material</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">{currentMaterial?.name || 'Unknown Material'}</span>
              <div className="flex space-x-1">
                <button
                  onClick={openBrowser}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                >
                  Browse
                </button>
                <button
                  onClick={() => openInspector(currentMaterialId)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                >
                  <FiEdit size={14} />
                </button>
              </div>
            </div>
            {currentMaterialId === 'default' && (
              <div className="text-xs text-gray-500">Default material</div>
            )}
          </div>

          {/* Material Overrides Section */}
          <CollapsibleSection
            title="Overrides"
            defaultExpanded={false}
            badge={overridesEnabled ? "ENABLED" : "DISABLED"}
          >
            <div className="space-y-3">
              <ToggleField
                label="Enable Overrides"
                value={overridesEnabled}
                onChange={(enabled: boolean) => {
                  // Update local state immediately for responsive UI
                  setOverridesEnabled(enabled);

                  if (enabled) {
                    // Enable overrides - initialize with base material values
                    const baseMaterial = currentMaterial || { color: '#cccccc', metalness: 0, roughness: 0.7 };
                    const newMaterial = {
                      color: baseMaterial.color,
                      metalness: baseMaterial.metalness,
                      roughness: baseMaterial.roughness
                    };
                    updateMeshRenderer({ material: newMaterial });
                  } else {
                    // Disable overrides - clear them
                    updateMeshRenderer({ material: undefined });
                  }
                }}
                resetValue={false}
                color="orange"
              />

              {overridesEnabled && (
                <div className="space-y-3">
                  <div className="text-xs text-yellow-400">⚠️ Overriding base material properties for this object only</div>

                  <ColorField
                    label="Color Override"
                    value={effectiveOverrides.color || '#cccccc'}
                    onChange={(value: string) => {
                      updateMeshRenderer({
                        material: { ...(meshRenderer.material ?? {}), color: value }
                      });
                    }}
                    resetValue="#cccccc"
                    placeholder="#cccccc"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <SingleAxisField
                      label="Metalness"
                      value={effectiveOverrides.metalness ?? 0}
                      onChange={(value) => {
                        updateMeshRenderer({
                          material: { ...(meshRenderer.material ?? {}), metalness: Math.max(0, Math.min(1, value)) }
                        });
                      }}
                      min={0}
                      max={1}
                      step={0.1}
                      sensitivity={0.1}
                      resetValue={0}
                      axisLabel="MET"
                      axisColor="#95a5a6"
                    />

                    <SingleAxisField
                      label="Roughness"
                      value={effectiveOverrides.roughness ?? 0.7}
                      onChange={(value) => {
                        updateMeshRenderer({
                          material: { ...(meshRenderer.material ?? {}), roughness: Math.max(0, Math.min(1, value)) }
                        });
                      }}
                      min={0}
                      max={1}
                      step={0.1}
                      sensitivity={0.1}
                      resetValue={0.7}
                      axisLabel="ROU"
                      axisColor="#34495e"
                    />
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        </CollapsibleSection>

        {/* Shadow Settings */}
        <CollapsibleSection title="Shadow Settings" defaultExpanded={false} badge="2">
          <CheckboxField
            label="Cast Shadows"
            value={meshRenderer.castShadows ?? true}
            onChange={(value: boolean) => updateMeshRenderer({ castShadows: value })}
            description="Cast shadows on other objects"
            resetValue={true}
            color="purple"
          />

          <CheckboxField
            label="Receive Shadows"
            value={meshRenderer.receiveShadows ?? true}
            onChange={(value: boolean) => updateMeshRenderer({ receiveShadows: value })}
            description="Receive shadows from other objects"
            resetValue={true}
            color="purple"
          />
        </CollapsibleSection>
      </GenericComponentSection>

      {/* Material Browser Modal */}
      <MaterialBrowserModal
        isOpen={isBrowserOpen}
        onClose={closeBrowser}
        onSelect={handleMaterialSelect}
        selectedMaterialId={currentMaterialId}
        onEdit={(materialId) => {
          closeBrowser();
          openInspector(materialId);
        }}
        onCreate={() => {
          closeBrowser();
          openCreate();
        }}
      />

      {/* Material Create Modal */}
      <MaterialCreateModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        onCreate={handleCreate}
      />

      {/* Material Inspector Modal */}
      <MaterialInspector
        materialId={selectedMaterialId || currentMaterialId}
        isOpen={isInspectorOpen}
        onClose={closeInspector}
        onSave={handleMaterialSave}
      />
    </>
  );
};
