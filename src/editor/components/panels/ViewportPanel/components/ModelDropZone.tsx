import { useToastStore } from '@/core/stores/toastStore';
import { useEntityCreation } from '@/editor/hooks/useEntityCreation';
import { useModelIngestion } from '@/editor/hooks/useModelIngestion';
import { Logger } from '@core/lib/logger';
import React from 'react';

const logger = Logger.create('ModelDropZone');

export const ModelDropZone: React.FC = () => {
  const [isDragging, setIsDragging] = React.useState(false);
  const { ingest } = useModelIngestion();
  const { createCustomModel } = useEntityCreation();
  const toast = useToastStore();

  React.useEffect(() => {
    // Listen for drag events at document level to detect external drags
    const handleDragEnter = (e: DragEvent) => {
      // Check if dragging files (not internal elements)
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      // Only hide if leaving the viewport entirely
      if (e.relatedTarget === null || !(e.relatedTarget instanceof Node)) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length) return;

      const file =
        files.find((f) => f.name.toLowerCase().endsWith('.glb')) ||
        files.find((f) => f.name.toLowerCase().endsWith('.gltf')) ||
        files.find((f) => f.name.toLowerCase().endsWith('.fbx')) ||
        files.find((f) => f.name.toLowerCase().endsWith('.obj')) ||
        files[0];

      const loadingToastId = toast.showLoading('Importing Model...', 'Optimizing and generating LODs');
      try {
        const result = await ingest(file);
        const entity = createCustomModel(result.basePath);

        toast.removeToast(loadingToastId);
        toast.showSuccess(
          'Import Complete',
          `Created entity ${entity.id} from ${result.name}`,
          { duration: 3000 }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('Model ingestion failed', { error: msg });

        toast.removeToast(loadingToastId);
        toast.showError('Import Failed', msg, { duration: 8000 });
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [ingest, createCustomModel, toast]);

  if (!isDragging) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-2 border-dashed border-blue-400/50 pointer-events-none">
      <div className="px-8 py-4 bg-gray-900/90 rounded-lg border border-blue-400/30 shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📦</div>
          <div>
            <div className="text-sm font-medium text-blue-200">Drop 3D Model</div>
            <div className="text-xs text-gray-400 mt-0.5">Auto-optimize with LOD generation</div>
          </div>
        </div>
      </div>
    </div>
  );
};
