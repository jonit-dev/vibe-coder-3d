/**
 * Zod Schemas for Chat Event Validation
 * Runtime validation for window events and payloads
 */

import { z } from 'zod';

export const ScreenshotEventSchema = z.object({
  imageData: z.string(),
  thumbnailData: z.string().optional(),
  sceneInfo: z.object({
    entity_count: z.number(),
    camera_position: z.string(),
    selected_entities: z.array(z.number()),
    scene_name: z.string().nullable(),
  }),
  reason: z.string(),
});

export const AnalysisEventSchema = z.object({
  analysis: z.string(),
});

export type IScreenshotEvent = z.infer<typeof ScreenshotEventSchema>;
export type IAnalysisEvent = z.infer<typeof AnalysisEventSchema>;
