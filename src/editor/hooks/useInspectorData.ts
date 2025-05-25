import { useEntityComponents } from '@/editor/hooks/useEntityComponents';
import { useEditorStore } from '@/editor/store/editorStore';

export const useInspectorData = () => {
  const selectedEntity = useEditorStore((s) => s.selectedId);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  // Use new ECS system
  const entityComponentsData = useEntityComponents(selectedEntity);

  // Removed debug logging to reduce console spam during drag
  // React.useEffect(() => {
  //   if (selectedEntity != null) {
  //     console.log(`[Inspector] 🔍 Selected entity: ${selectedEntity}`);
  //     console.log(`[Inspector] - Entity components:`, entityComponentsData.components);
  //   }
  // }, [selectedEntity, entityComponentsData.components]);

  return {
    selectedEntity,
    isPlaying,
    ...entityComponentsData,
  };
};
