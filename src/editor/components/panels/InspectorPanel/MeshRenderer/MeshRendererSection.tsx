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

export const MeshRendererSection: React.FC<IMeshRendererSectionProps> = React.memo(
  ({ meshRenderer, setMeshRenderer }) => {
    const materialRegistry = React.useMemo(() => MaterialRegistry.getInstance(), []);

    // Memoize options to prevent useMaterials from recreating callbacks on every render
    const materialsOptions = React.useMemo(
      () => ({
        selectedMaterialId: meshRenderer?.materialId,
      }),
      [meshRenderer?.materialId],
    );

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
    } = useMaterials(materialsOptions);

    // Local state for overrides toggle (kept independent from derived ECS data)
    const [overridesEnabled, setOverridesEnabled] = useState(!!meshRenderer?.material);

    // Track which material slot is being edited (for multi-material mode)
    const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

    const handleRemoveMeshRenderer = React.useCallback(() => {
      setMeshRenderer(null);
    }, [setMeshRenderer]);

    const updateMeshRenderer = React.useCallback(
      (updates: Partial<IMeshRendererData>) => {
        if (meshRenderer) {
          const newMeshRenderer = { ...meshRenderer, ...updates };
          setMeshRenderer(newMeshRenderer);
        }
      },
      [meshRenderer, setMeshRenderer],
    );

    // Memoize all onChange handlers to prevent ComponentField re-renders
    const handleEnabledChange = React.useCallback(
      (value: boolean) => {
        updateMeshRenderer({ enabled: value });
      },
      [updateMeshRenderer],
    );

    const handleMeshIdChange = React.useCallback(
      (value: unknown) => {
        updateMeshRenderer({ meshId: value as string });
      },
      [updateMeshRenderer],
    );

    const handleCastShadowsChange = React.useCallback(
      (value: boolean) => {
        updateMeshRenderer({ castShadows: value });
      },
      [updateMeshRenderer],
    );

    const handleReceiveShadowsChange = React.useCallback(
      (value: boolean) => {
        updateMeshRenderer({ receiveShadows: value });
      },
      [updateMeshRenderer],
    );

    // Memoize mesh options array to prevent ComponentField re-renders
    const meshOptions = React.useMemo(
      () => [
        { value: 'cube', label: 'Cube' },
        { value: 'sphere', label: 'Sphere' },
        { value: 'plane', label: 'Plane' },
        { value: 'cylinder', label: 'Cylinder' },
        { value: 'cone', label: 'Cone' },
        { value: 'torus', label: 'Torus' },
        { value: 'capsule', label: 'Capsule' },
      ],
      [],
    );

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
      // Check if we're editing a material slot (multi-material mode)
      if (editingSlotIndex !== null && meshRenderer && meshRenderer.materials) {
        const newMaterials = [...meshRenderer.materials];
        newMaterials[editingSlotIndex] = materialId;
        updateMeshRenderer({ materials: newMaterials });
        setEditingSlotIndex(null); // Clear slot editing state
      } else {
        // Single material mode: Clear overrides when selecting a new material
        updateMeshRenderer({
          materialId,
          material: undefined, // Clear overrides
        });
        // Keep UI consistent with cleared overrides
        setOverridesEnabled(false);
      }
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
      [meshRenderer.material, baseOverridesTemplate],
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
            onChange={handleEnabledChange}
            resetValue={true}
            color="cyan"
          />

          <ComponentField
            label="Mesh"
            type="select"
            value={meshRenderer.meshId}
            onChange={handleMeshIdChange}
            options={meshOptions}
          />

          {/* Material Section - Now uses materialId */}
          <CollapsibleSection
            title="Material"
            icon={<FiImage />}
            defaultExpanded={true}
            badge="Asset"
          >
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-gray-300">Material</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">
                  {currentMaterial?.name || 'Unknown Material'}
                </span>
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

            {/* Multi-Material Support (Submeshes) */}
            <CollapsibleSection
              title="Material Slots"
              defaultExpanded={false}
              badge={
                (meshRenderer.materials?.length || 0) > 0
                  ? `${meshRenderer.materials?.length || 0} slots`
                  : undefined
              }
            >
              <div className="space-y-2">
                {/* Enable Multi-Material Mode Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Multi-Material Mode</span>
                  <ToggleField
                    label=""
                    value={(meshRenderer.materials?.length || 0) > 0}
                    onChange={(enabled: boolean) => {
                      if (enabled) {
                        // Enable multi-material mode with current material as first slot
                        updateMeshRenderer({
                          materials: [meshRenderer.materialId || 'default'],
                        });
                      } else {
                        // Disable multi-material mode
                        updateMeshRenderer({ materials: undefined });
                      }
                    }}
                    resetValue={false}
                  />
                </div>

                {meshRenderer && meshRenderer.materials && meshRenderer.materials.length > 0 ? (
                  <>
                    <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded p-2">
                      ⚠️ Multi-material mode: Each slot can have a different material
                    </div>

                    {/* Material Slots List */}
                    <div className="space-y-2">
                      {meshRenderer.materials?.map((matId, index) => {
                        const mat = materialRegistry.get(matId);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-gray-800 rounded"
                          >
                            <span className="text-xs text-gray-400 w-6">#{index}</span>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm text-white truncate">
                                {mat?.name || matId}
                              </span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    // Open browser to select material for this slot
                                    setEditingSlotIndex(index);
                                    openBrowser();
                                  }}
                                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                                  title="Change material"
                                >
                                  Change
                                </button>
                                <button
                                  onClick={() => openInspector(matId)}
                                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                                  title="Edit material"
                                >
                                  <FiEdit size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    // Remove this slot
                                    const newMaterials = meshRenderer.materials!.filter(
                                      (_, i) => i !== index,
                                    );
                                    if (newMaterials.length === 0) {
                                      updateMeshRenderer({ materials: undefined });
                                    } else {
                                      updateMeshRenderer({ materials: newMaterials });
                                    }
                                  }}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
                                  title="Remove slot"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Material Slot Button */}
                    <button
                      onClick={() => {
                        const newMaterials = [
                          ...(meshRenderer.materials || []),
                          meshRenderer.materialId || 'default',
                        ];
                        updateMeshRenderer({ materials: newMaterials });
                      }}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      + Add Material Slot
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-3">
                    Enable multi-material mode to assign different materials to submeshes
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Material Overrides Section */}
            <CollapsibleSection
              title="Overrides"
              defaultExpanded={false}
              badge={overridesEnabled ? 'ENABLED' : 'DISABLED'}
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
                      const baseMaterial = currentMaterial || {
                        color: '#cccccc',
                        metalness: 0,
                        roughness: 0.7,
                      };
                      const newMaterial = {
                        color: baseMaterial.color,
                        metalness: baseMaterial.metalness,
                        roughness: baseMaterial.roughness,
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
                    <div className="text-xs text-yellow-400">
                      ⚠️ Overriding base material properties for this object only
                    </div>

                    <ColorField
                      label="Color Override"
                      value={effectiveOverrides.color || '#cccccc'}
                      onChange={(value: string) => {
                        updateMeshRenderer({
                          material: { ...(meshRenderer.material ?? {}), color: value },
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
                            material: {
                              ...(meshRenderer.material ?? {}),
                              metalness: Math.max(0, Math.min(1, value)),
                            },
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
                            material: {
                              ...(meshRenderer.material ?? {}),
                              roughness: Math.max(0, Math.min(1, value)),
                            },
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
              onChange={handleCastShadowsChange}
              description="Cast shadows on other objects"
              resetValue={true}
              color="purple"
            />

            <CheckboxField
              label="Receive Shadows"
              value={meshRenderer.receiveShadows ?? true}
              onChange={handleReceiveShadowsChange}
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
        <MaterialCreateModal isOpen={isCreateOpen} onClose={closeCreate} onCreate={handleCreate} />

        {/* Material Inspector Modal */}
        <MaterialInspector
          materialId={selectedMaterialId || currentMaterialId}
          isOpen={isInspectorOpen}
          onClose={closeInspector}
          onSave={handleMaterialSave}
        />
      </>
    );
  },
);
