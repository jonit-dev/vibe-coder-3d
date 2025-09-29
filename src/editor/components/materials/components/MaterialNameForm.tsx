import React from 'react';

export interface IMaterialNameFormProps {
  materialName: string;
  materialId: string;
  onNameChange: (name: string) => void;
  onIdChange: (id: string) => void;
}

export const MaterialNameForm: React.FC<IMaterialNameFormProps> = ({
  materialName,
  materialId,
  onNameChange,
  onIdChange,
}) => (
  <div className="px-4 py-3 border-b border-gray-600 flex-shrink-0">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          Material Name
        </label>
        <input
          type="text"
          value={materialName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My Material"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          Material ID
        </label>
        <input
          type="text"
          value={materialId}
          onChange={(e) => onIdChange(e.target.value)}
          placeholder="my_material"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
        />
      </div>
    </div>

    <p className="text-xs text-gray-500 mt-1">
      Unique identifier for code reference
    </p>
  </div>
);