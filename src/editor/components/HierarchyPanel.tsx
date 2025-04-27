import React from 'react';

import type { ISceneObject } from '../Editor';

export interface IHierarchyPanelProps {
  objects: ISceneObject[];
  selectedId: string;
  setSelectedId: (id: string) => void;
}

const HierarchyPanel: React.FC<IHierarchyPanelProps> = ({ objects, selectedId, setSelectedId }) => (
  <aside className="w-60 bg-[#23272e] border-r border-[#181a1b] p-2 flex-shrink-0 flex flex-col">
    <div className="font-semibold mb-2 text-xs uppercase tracking-wider text-gray-400">
      Hierarchy
    </div>
    <ul className="space-y-1 text-sm">
      {objects.map((obj) => (
        <li
          key={obj.id}
          className={`px-2 py-1 rounded cursor-pointer select-none ${obj.id === selectedId ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'}`}
          onClick={() => setSelectedId(obj.id)}
        >
          {obj.name}
        </li>
      ))}
    </ul>
  </aside>
);

export default HierarchyPanel;
