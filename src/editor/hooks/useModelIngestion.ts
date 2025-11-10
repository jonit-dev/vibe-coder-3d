import { Logger } from '@core/lib/logger';
import { useCallback } from 'react';

const logger = Logger.create('useModelIngestion');

export interface IIngestResult {
  name: string;
  basePath: string; // e.g. /assets/models/ModelName/glb/ModelName.glb
  lod?: {
    high_fidelity?: string;
    low_fidelity?: string;
  };
}

function sanitizeModelName(name: string): string {
  // Keep original casing for directories, but strip unsafe chars
  return name
    .replace(/[^\w\-\.]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function useModelIngestion() {
  const ingest = useCallback(async (file: File): Promise<IIngestResult> => {
    // Use Vite dev server instead of separate ingest server
    const apiUrl = '/api/ingest/model';

    if (!file) {
      throw new Error('No file provided for ingestion');
    }

    const nameNoExt = file.name.replace(/\.[^.]+$/, '');
    const modelName = sanitizeModelName(nameNoExt);
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('modelName', modelName);

    logger.info('Uploading model for ingestion', {
      name: file.name,
      size: file.size,
      apiUrl,
    });

    const res = await fetch(apiUrl, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `Ingest API failed (${res.status} ${res.statusText})${text ? `: ${text}` : ''}`,
      );
    }

    const json = (await res.json()) as IIngestResult;
    logger.info('Ingest complete', json);
    return json;
  }, []);

  return { ingest };
}
