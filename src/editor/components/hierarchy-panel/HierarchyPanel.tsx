import React from 'react';

export interface IHierarchyPanelProps {
  entityIds: number[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
}

const HierarchyPanel: React.FC<IHierarchyPanelProps> = ({
  entityIds,
  selectedId,
  setSelectedId,
}) => (
  <aside className="w-60 bg-[#23272e] border-r border-[#181a1b] p-2 flex-shrink-0 flex flex-col">
    <div className="font-semibold mb-2 text-xs uppercase tracking-wider text-gray-400">
      Hierarchy
    </div>
    <ul className="space-y-1 text-sm">
      {entityIds.map((id) => (
        <li
          key={id}
          className={`px-2 py-1 rounded cursor-pointer select-none ${id === selectedId ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'}`}
          onClick={() => setSelectedId(id)}
        >
          Entity {id}
        </li>
      ))}
    </ul>
  </aside>
);

export default HierarchyPanel;
