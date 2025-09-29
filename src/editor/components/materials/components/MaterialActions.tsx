import React from 'react';
import { FiPlus } from 'react-icons/fi';

export interface IMaterialActionsProps {
  onClose: () => void;
  onSubmit: () => void;
  isCreateDisabled: boolean;
}

export const MaterialActions: React.FC<IMaterialActionsProps> = ({
  onClose,
  onSubmit,
  isCreateDisabled,
}) => (
  <div className="px-4 py-3 border-t border-gray-600 flex-shrink-0">
    <div className="flex justify-end space-x-3">
      <button
        onClick={onClose}
        className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-sm"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={isCreateDisabled}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded flex items-center space-x-2 text-sm"
      >
        <FiPlus size={14} />
        <span>Create Material</span>
      </button>
    </div>
  </div>
);