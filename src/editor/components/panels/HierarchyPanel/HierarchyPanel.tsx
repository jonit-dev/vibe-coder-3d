import React from 'react';

export interface IHierarchyPanelProps {
  entityIds: number[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
}

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
              className={`px-2 py-1 rounded cursor-pointer text-sm ${selectedId === id ? 'bg-blue-700 text-white' : 'hover:bg-[#333] text-gray-300'}`}
              onClick={() => setSelectedId(id)}
            >
              Entity {id}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
