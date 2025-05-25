import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="p-3 text-gray-400 text-center">
      <div className="text-xs">No entity selected</div>
      <div className="text-xs text-gray-500 mt-1">Select an object from the hierarchy</div>
    </div>
  );
};
