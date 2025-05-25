import { useEntityComponents } from '@/editor/hooks/useEntityComponents';
import { useEditorStore } from '@/editor/store/editorStore';

export const useInspectorData = () => {
  const selectedEntity = useEditorStore((s) => s.selectedId);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  // Use new ECS system
  const entityComponentsData = useEntityComponents(selectedEntity);

  return {
    selectedEntity,
    isPlaying,
    ...entityComponentsData,
  };
};
