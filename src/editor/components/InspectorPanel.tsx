import React from 'react';

import type { ISceneObject } from '../Editor';

import Section from './inspector/Section';
import TransformFields from './inspector/TransformFields';

export interface IInspectorPanelProps {
  selectedObject: ISceneObject | undefined;
  onTransformChange: (t: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
}

const label = 'text-xs text-gray-300 w-20';

const InspectorPanel: React.FC<IInspectorPanelProps> = ({ selectedObject, onTransformChange }) => {
  if (!selectedObject) {
    return (
      <aside className="w-80 bg-[#23272e] flex-shrink-0 flex flex-col items-center justify-center text-gray-400">
        <div className="text-sm opacity-70">No object selected</div>
      </aside>
    );
  }

  const { position, rotation, scale } = selectedObject.components.Transform;

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
          <TransformFields
            label="Position"
            value={position}
            onChange={(next) => onTransformChange({ position: next, rotation, scale })}
          />
          <TransformFields
            label="Rotation"
            value={rotation}
            onChange={(next) => onTransformChange({ position, rotation: next, scale })}
          />
          <TransformFields
            label="Scale"
            value={scale}
            onChange={(next) => onTransformChange({ position, rotation, scale: next })}
          />
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
        {/* Add more sections as needed */}
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
