import { useEffect } from 'react';

interface IUseAutoSelectionProps {
  selectedId: number | null;
  entityIds: number[];
  setSelectedId: (id: number | null) => void;
}

export const useAutoSelection = ({
  selectedId,
  entityIds,
  setSelectedId,
}: IUseAutoSelectionProps) => {
  useEffect(() => {
    // Auto-select first entity when available or current selection is invalid
    if ((selectedId === null || !entityIds.includes(selectedId)) && entityIds.length > 0) {
      setSelectedId(entityIds[0]);
    }
  }, [selectedId, entityIds, setSelectedId]);
};
