import React from 'react';

import type { ISceneObject } from '../Editor';

export interface IInspectorPanelProps {
  selectedObject: ISceneObject | undefined;
  onTransformChange: (t: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
}

const InspectorPanel: React.FC<IInspectorPanelProps> = ({ selectedObject, onTransformChange }) => {
  if (!selectedObject) {
    return (
      <aside className="w-80 unity-panel flex-shrink-0 flex flex-col items-center justify-center text-gray-400">
        <div className="text-sm opacity-70">No object selected</div>
      </aside>
    );
  }

  const { position, rotation, scale } = selectedObject.components.Transform;

  // Handle transform input changes
  const handleTransformInput = (
    type: 'position' | 'rotation' | 'scale',
    idx: number,
    value: string,
  ) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    const next = {
      position: [...position] as [number, number, number],
      rotation: [...rotation] as [number, number, number],
      scale: [...scale] as [number, number, number],
    };
    next[type][idx] = parsed;
    onTransformChange(next);
  };

  return (
    <aside className="w-80 unity-panel flex-shrink-0 flex flex-col h-full">
      {/* Inspector Header */}
      <div className="unity-header flex justify-between items-center py-2">
        <div className="text-xs uppercase tracking-wider font-bold">Inspector</div>
        <div className="flex gap-1">
          <button className="text-xs opacity-70 hover:opacity-100 px-1">⚙️</button>
        </div>
      </div>

      {/* Object Header */}
      <div className="px-3 py-2 border-b border-[#3f3f3f] flex items-center bg-[#2d2d2d]">
        <div className="flex-1">
          <div className="font-bold text-sm text-white">{selectedObject.name}</div>
          <div className="text-xs opacity-50">ID: {selectedObject.id.substring(0, 8)}</div>
        </div>
        <div className="flex items-center gap-1">
          <input type="checkbox" className="w-3 h-3" defaultChecked />
          <span className="text-xs opacity-70">Active</span>
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto">
        {/* Transform Component */}
        <div className="p-2 border-b border-[#3f3f3f]">
          <div className="unity-header mb-2 flex items-center">
            <span className="flex-1">Transform</span>
            <button className="text-xs opacity-70 hover:opacity-100">▼</button>
          </div>

          <div className="space-y-2">
            {(['position', 'rotation', 'scale'] as const).map((type) => (
              <div className="flex items-center gap-2" key={type}>
                <span className="unity-label w-20">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                <div className="flex gap-1 items-center">
                  <span className="w-2 text-xs text-[#ff5555]">X</span>
                  <input
                    className="unity-input"
                    type="number"
                    step={type === 'scale' ? 0.1 : 0.01}
                    value={selectedObject.components.Transform[type][0]}
                    onChange={(e) => handleTransformInput(type, 0, e.target.value)}
                  />
                </div>
                <div className="flex gap-1 items-center">
                  <span className="w-2 text-xs text-[#55ff55]">Y</span>
                  <input
                    className="unity-input"
                    type="number"
                    step={type === 'scale' ? 0.1 : 0.01}
                    value={selectedObject.components.Transform[type][1]}
                    onChange={(e) => handleTransformInput(type, 1, e.target.value)}
                  />
                </div>
                <div className="flex gap-1 items-center">
                  <span className="w-2 text-xs text-[#5555ff]">Z</span>
                  <input
                    className="unity-input"
                    type="number"
                    step={type === 'scale' ? 0.1 : 0.01}
                    value={selectedObject.components.Transform[type][2]}
                    onChange={(e) => handleTransformInput(type, 2, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mesh Component */}
        <div className="p-2 border-b border-[#3f3f3f]">
          <div className="unity-header mb-2 flex items-center">
            <span className="flex-1">Mesh Renderer</span>
            <button className="text-xs opacity-70 hover:opacity-100">▼</button>
          </div>
          <div className="px-2">
            <div className="flex justify-between items-center mb-1">
              <span className="unity-label">Mesh</span>
              <span className="text-xs opacity-80 font-mono">{selectedObject.components.Mesh}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="unity-label">Cast Shadows</span>
              <select className="unity-input w-24 text-xs">
                <option>On</option>
                <option>Off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Material Component */}
        <div className="p-2 border-b border-[#3f3f3f]">
          <div className="unity-header mb-2 flex items-center">
            <span className="flex-1">Material</span>
            <button className="text-xs opacity-70 hover:opacity-100">▼</button>
          </div>
          <div className="px-2">
            <div className="flex justify-between items-center mb-1">
              <span className="unity-label">Type</span>
              <span className="text-xs opacity-80 font-mono">
                {selectedObject.components.Material}
              </span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="unity-label">Color</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs opacity-80">#FF0000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Surface Options */}
        <div className="p-2">
          <div className="unity-header mb-2 flex items-center">
            <span className="flex-1">Surface Options</span>
            <button className="text-xs opacity-70 hover:opacity-100">▼</button>
          </div>
          <div className="px-2 space-y-1">
            <div className="flex justify-between items-center">
              <span className="unity-label">Workflow</span>
              <select className="unity-input w-24 text-xs">
                <option>Metallic</option>
                <option>Specular</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className="unity-label">Surface Type</span>
              <select className="unity-input w-24 text-xs">
                <option>Opaque</option>
                <option>Transparent</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className="unity-label">Render Face</span>
              <select className="unity-input w-24 text-xs">
                <option>Front</option>
                <option>Back</option>
                <option>Both</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default InspectorPanel;
