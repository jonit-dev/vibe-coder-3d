import React from 'react';

import { Collapsible } from '@/editor/components/common/Collapsible';

export interface IMeshTypeSectionProps {
  meshType: string;
  setMeshType: (type: string) => void;
}

export const MeshTypeSection: React.FC<IMeshTypeSectionProps> = ({ meshType, setMeshType }) => (
  <Collapsible title="Mesh Type" defaultOpen>
    <div className="form-control mb-1">
      <label className="label py-1">
        <span className="label-text text-xs font-medium">Mesh Type</span>
      </label>
      <select
        value={meshType}
        onChange={(e) => setMeshType(e.target.value)}
        className="select select-bordered select-sm w-full"
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
  </Collapsible>
);
