import React from 'react';
import { TbCube } from 'react-icons/tb';

export interface IHierarchyPanelProps {
  entityIds: number[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
}

// Cube icon component (Unity-style, reused from AddObjectMenu)
export const CubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <TbCube className={className} size={16} />
);

export const HierarchyPanel: React.FC<IHierarchyPanelProps> = ({
  entityIds,
  selectedId,
  setSelectedId,
}) => {
  return (
    <aside className="w-64 bg-[#23272e] flex-shrink-0 flex flex-col h-full border-r border-[#181a1b]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#23272e]">
        <div className="text-xs uppercase tracking-wider font-bold text-gray-300">Hierarchy</div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#23272e]">
        <ul className="p-4 space-y-2">
          {entityIds.map((id) => (
            <li
              key={id}
              className={`px-2 py-1 rounded cursor-pointer text-sm flex items-center gap-2 ${selectedId === id ? 'bg-blue-700 text-white' : 'hover:bg-[#333] text-gray-300'}`}
              onClick={() => setSelectedId(id)}
            >
              <CubeIcon className="text-gray-400" />
              <span>Entity {id}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
