import React, { useState } from 'react';

import type { ISceneObject } from '../Editor';

export interface IInspectorPanelProps {
  selectedObject: ISceneObject | undefined;
  onTransformChange: (t: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
}

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#333]">
      <button
        className="w-full flex items-center gap-2 px-2 py-1 bg-[#23272e] hover:bg-[#292d33] text-xs font-bold text-gray-200 uppercase tracking-wider select-none"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        <span>{title}</span>
      </button>
      {open && <div className="px-3 py-2">{children}</div>}
    </div>
  );
};

const label = 'text-xs text-gray-300 w-20';
const input =
  'bg-[#181a1b] border border-[#333] rounded px-2 py-1 text-xs text-white w-16 focus:outline-none focus:ring-2 focus:ring-blue-600';

const InspectorPanel: React.FC<IInspectorPanelProps> = ({ selectedObject, onTransformChange }) => {
  if (!selectedObject) {
    return (
      <aside className="w-80 bg-[#23272e] flex-shrink-0 flex flex-col items-center justify-center text-gray-400">
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
    <aside className="w-80 bg-[#23272e] flex-shrink-0 flex flex-col h-full border-l border-[#181a1b]">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#23272e]">
        <div className="text-xs uppercase tracking-wider font-bold text-gray-300">Inspector</div>
        <div className="flex gap-1">
          <button className="text-xs opacity-70 hover:opacity-100 px-1">⚙️</button>
        </div>
      </div>

      {/* Object Header */}
      <div className="px-3 py-2 border-b border-[#333] flex items-center bg-[#2d2d2d]">
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
      <div className="flex-1 overflow-y-auto bg-[#23272e]">
        <Section title="Transform">
          <div className="space-y-2">
            {(['position', 'rotation', 'scale'] as const).map((type) => (
              <div className="flex items-center gap-2" key={type}>
                <span className={label}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <div className="flex gap-1 items-center">
                  <span className="w-2 text-xs text-[#ff5555]">X</span>
                  <input
                    className={input}
                    type="number"
                    step={type === 'scale' ? 0.1 : 0.01}
                    value={selectedObject.components.Transform[type][0]}
                    onChange={(e) => handleTransformInput(type, 0, e.target.value)}
                  />
                </div>
                <div className="flex gap-1 items-center">
                  <span className="w-2 text-xs text-[#55ff55]">Y</span>
                  <input
                    className={input}
                    type="number"
                    step={type === 'scale' ? 0.1 : 0.01}
                    value={selectedObject.components.Transform[type][1]}
                    onChange={(e) => handleTransformInput(type, 1, e.target.value)}
                  />
                </div>
                <div className="flex gap-1 items-center">
                  <span className="w-2 text-xs text-[#5555ff]">Z</span>
                  <input
                    className={input}
                    type="number"
                    step={type === 'scale' ? 0.1 : 0.01}
                    value={selectedObject.components.Transform[type][2]}
                    onChange={(e) => handleTransformInput(type, 2, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Mesh Renderer">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className={label}>Mesh</span>
              <span className="text-xs opacity-80 font-mono">{selectedObject.components.Mesh}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={label}>Cast Shadows</span>
              <select className="bg-[#181a1b] border border-[#333] rounded px-2 py-1 text-xs text-white w-24">
                <option>On</option>
                <option>Off</option>
              </select>
            </div>
          </div>
        </Section>
        <Section title="Material">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className={label}>Type</span>
              <span className="text-xs opacity-80 font-mono">
                {selectedObject.components.Material}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={label}>Color</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs opacity-80">#FF0000</span>
              </div>
            </div>
          </div>
        </Section>
        <Section title="Surface Options">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className={label}>Workflow</span>
              <select className="bg-[#181a1b] border border-[#333] rounded px-2 py-1 text-xs text-white w-24">
                <option>Metallic</option>
                <option>Specular</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className={label}>Surface Type</span>
              <select className="bg-[#181a1b] border border-[#333] rounded px-2 py-1 text-xs text-white w-24">
                <option>Opaque</option>
                <option>Transparent</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className={label}>Render Face</span>
              <select className="bg-[#181a1b] border border-[#333] rounded px-2 py-1 text-xs text-white w-24">
                <option>Front</option>
                <option>Back</option>
                <option>Both</option>
              </select>
            </div>
          </div>
        </Section>
      </div>
      {/* Add Component Button */}
      <div className="p-3 border-t border-[#333] bg-[#23272e] flex justify-center">
        <button className="bg-[#444] hover:bg-[#666] text-xs text-white font-bold px-4 py-2 rounded shadow">
          Add Component
        </button>
      </div>
    </aside>
  );
};

export default InspectorPanel;
