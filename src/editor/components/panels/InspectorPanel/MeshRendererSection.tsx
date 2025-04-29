import React from 'react';

import { Collapsible } from '@/editor/components/common/Collapsible';
import { MeshRendererField } from '@/editor/components/panels/InspectorPanel/MeshRendererField';

export interface IMeshRendererSettings {
  castShadows: boolean;
  staticShadowCaster: boolean;
  contributeGlobalIllum: boolean;
  receiveGlobalIllum: boolean;
  lightProbes: 'Off' | 'Blend Probes' | 'Use Proxy Volume';
  anchorOverride: string | null;
  rayTracingMode: 'Off' | 'Dynamic Transform' | 'Static';
  proceduralGeometry: boolean;
  preferFastTrace: boolean;
  motionVectors: 'Camera Motion' | 'Per Object Motion' | 'Force No Motion';
  dynamicOcclusion: boolean;
  renderingLayer: string;
}

export const meshRendererDefaults: IMeshRendererSettings = {
  castShadows: true,
  staticShadowCaster: false,
  contributeGlobalIllum: false,
  receiveGlobalIllum: false,
  lightProbes: 'Blend Probes',
  anchorOverride: null,
  rayTracingMode: 'Dynamic Transform',
  proceduralGeometry: false,
  preferFastTrace: false,
  motionVectors: 'Per Object Motion',
  dynamicOcclusion: true,
  renderingLayer: 'Default',
};

export const MeshRendererSection: React.FC<{
  meshRenderer: IMeshRendererSettings;
  setMeshRenderer: React.Dispatch<React.SetStateAction<IMeshRendererSettings>>;
}> = ({ meshRenderer, setMeshRenderer }) => (
  <Collapsible title="Mesh Renderer">
    {/* Materials subsection */}
    <Collapsible title="Materials" defaultOpen>
      <div className="py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs">Materials</span>
          <div className="badge badge-neutral badge-xs">1</div>
        </div>
      </div>
    </Collapsible>
    {/* Lighting subsection */}
    <Collapsible title="Lighting" defaultOpen>
      <MeshRendererField
        label="Cast Shadows"
        value={meshRenderer.castShadows ? 'On' : 'Off'}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, castShadows: value === 'On' }))}
        type="select"
        options={[
          { value: 'On', label: 'On' },
          { value: 'Off', label: 'Off' },
        ]}
      />
      <MeshRendererField
        label="Static Shadow Caster"
        value={meshRenderer.staticShadowCaster}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, staticShadowCaster: value }))}
        type="checkbox"
      />
      <MeshRendererField
        label="Contribute Global Illum"
        value={meshRenderer.contributeGlobalIllum}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, contributeGlobalIllum: value }))}
        type="checkbox"
      />
      <div className="flex items-center justify-between mb-1 opacity-50">
        <span className="text-xs">Receive Global Illum</span>
        <input
          type="checkbox"
          className="checkbox checkbox-xs"
          checked={meshRenderer.receiveGlobalIllum}
          disabled
          readOnly
        />
      </div>
    </Collapsible>
    {/* Probes subsection */}
    <Collapsible title="Probes">
      <MeshRendererField
        label="Light Probes"
        value={meshRenderer.lightProbes}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, lightProbes: value as any }))}
        type="select"
        options={[
          { value: 'Off', label: 'Off' },
          { value: 'Blend Probes', label: 'Blend Probes' },
          { value: 'Use Proxy Volume', label: 'Use Proxy Volume' },
        ]}
      />
      <MeshRendererField
        label="Anchor Override"
        value={meshRenderer.anchorOverride || ''}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, anchorOverride: value || null }))}
        type="text"
      />
    </Collapsible>
    {/* Ray Tracing subsection */}
    <Collapsible title="Ray Tracing">
      <MeshRendererField
        label="Ray Tracing Mode"
        value={meshRenderer.rayTracingMode}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, rayTracingMode: value as any }))}
        type="select"
        options={[
          { value: 'Off', label: 'Off' },
          { value: 'Dynamic Transform', label: 'Dynamic Transform' },
          { value: 'Static', label: 'Static' },
        ]}
      />
      <MeshRendererField
        label="Procedural Geometry"
        value={meshRenderer.proceduralGeometry}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, proceduralGeometry: value }))}
        type="checkbox"
      />
      <MeshRendererField
        label="Prefer Fast Trace"
        value={meshRenderer.preferFastTrace}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, preferFastTrace: value }))}
        type="checkbox"
      />
    </Collapsible>
    {/* Additional subsection */}
    <Collapsible title="Additional">
      <MeshRendererField
        label="Motion Vectors"
        value={meshRenderer.motionVectors}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, motionVectors: value as any }))}
        type="select"
        options={[
          { value: 'Camera Motion', label: 'Camera Motion' },
          { value: 'Per Object Motion', label: 'Per Object Motion' },
          { value: 'Force No Motion', label: 'Force No Motion' },
        ]}
      />
      <MeshRendererField
        label="Dynamic Occlusion"
        value={meshRenderer.dynamicOcclusion}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, dynamicOcclusion: value }))}
        type="checkbox"
      />
      <MeshRendererField
        label="Rendering Layer"
        value={meshRenderer.renderingLayer}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, renderingLayer: value }))}
        type="text"
      />
    </Collapsible>
  </Collapsible>
);
