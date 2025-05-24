import React from 'react';
import { FiBox } from 'react-icons/fi';

import { InspectorSection } from '@/editor/components/ui/InspectorSection';

export interface IMeshTypeSectionProps {
  meshType: string;
  setMeshType: (type: string) => void;
}

export const MeshTypeSection: React.FC<IMeshTypeSectionProps> = ({ meshType, setMeshType }) => (
  <InspectorSection
    title="Mesh Type"
    icon={<FiBox />}
    headerColor="purple"
    collapsible
    defaultCollapsed={false}
  >
    <div className="space-y-0.5">
      <label className="text-[11px] font-medium text-gray-300">Type</label>
      <select
        value={meshType}
        onChange={(e) => setMeshType(e.target.value)}
        className="w-full bg-black/30 border border-gray-600/30 rounded-sm px-1.5 py-0.5 text-[11px] text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200"
      >
        <option value="unknown" disabled>
          Select mesh type
        </option>
        <option value="Cube">Cube</option>
        <option value="Sphere">Sphere</option>
        <option value="Cylinder">Cylinder</option>
        <option value="Cone">Cone</option>
        <option value="Torus">Torus</option>
        <option value="Plane">Plane</option>
      </select>
    </div>
  </InspectorSection>
);
