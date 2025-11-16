/**
 * Tool Registry
 * Central registry of all available tools for the AI agent
 */

// Base interface for all agent tools
export interface IAgentTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

// Base interface for tool execution functions
export interface IToolExecutor {
  (params: unknown): Promise<string>;
}

import { sceneManipulationTool, executeSceneManipulation } from './SceneManipulationTool';
import { sceneQueryTool, executeSceneQuery } from './SceneQueryTool';
import { entityEditTool, executeEntityEdit } from './EntityEditTool';
import { entityBatchEditTool, executeEntityBatchEdit } from './EntityBatchEditTool';
// import { geometryCreationTool, executeGeometryCreation } from './GeometryCreationTool';
import { prefabManagementTool, executePrefabManagement } from './PrefabManagementTool';
import { screenshotFeedbackTool, executeScreenshotFeedback } from './ScreenshotFeedbackTool';
import { getAvailableShapesTool, executeGetAvailableShapes } from './GetAvailableShapesTool';
import { getShapeSchemaTool, executeGetShapeSchema } from './GetShapeSchemaTool';
import { getSceneInfoTool, executeGetSceneInfo } from './GetSceneInfoTool';
import {
  getAvailableMaterialsTool,
  executeGetAvailableMaterials,
} from './GetAvailableMaterialsTool';
import { planningTool, executePlanning } from './PlanningTool';
import { scriptManagementTool, executeScriptManagement } from './ScriptManagementTool';
import { refreshViewport } from './utils/viewportRefresh';

// Type for all available tools (union of tool types)
export type AvailableTool =
  | typeof planningTool
  | typeof sceneManipulationTool
  | typeof sceneQueryTool
  | typeof entityEditTool
  | typeof entityBatchEditTool
  | typeof prefabManagementTool
  | typeof screenshotFeedbackTool
  | typeof getAvailableShapesTool
  | typeof getShapeSchemaTool
  | typeof getSceneInfoTool
  | typeof getAvailableMaterialsTool
  | typeof scriptManagementTool;

export const AVAILABLE_TOOLS = [
  planningTool,
  sceneManipulationTool,
  sceneQueryTool,
  entityEditTool,
  entityBatchEditTool,
  // geometryCreationTool,
  prefabManagementTool,
  screenshotFeedbackTool,
  getAvailableShapesTool,
  getShapeSchemaTool,
  getSceneInfoTool,
  getAvailableMaterialsTool,
  scriptManagementTool,
];

// Union type for all possible tool parameters
export type ToolParameters =
  | Parameters<typeof executePlanning>[0]
  | Parameters<typeof executeSceneManipulation>[0]
  | Parameters<typeof executeSceneQuery>[0]
  | Parameters<typeof executeEntityEdit>[0]
  | Parameters<typeof executeEntityBatchEdit>[0]
  | Parameters<typeof executePrefabManagement>[0]
  | Parameters<typeof executeScreenshotFeedback>[0]
  | Parameters<typeof executeGetAvailableShapes>[0]
  | Parameters<typeof executeGetShapeSchema>[0]
  | Parameters<typeof executeGetSceneInfo>[0]
  | Parameters<typeof executeGetAvailableMaterials>[0]
  | Parameters<typeof executeScriptManagement>[0];

export async function executeTool(toolName: string, params: ToolParameters): Promise<string> {
  let result: string;

  switch (toolName) {
    case 'planning':
      result = await executePlanning(params as Parameters<typeof executePlanning>[0]);
      break;
    case 'scene_manipulation':
      result = await executeSceneManipulation(
        params as Parameters<typeof executeSceneManipulation>[0],
      );
      break;
    case 'scene_query':
      result = await executeSceneQuery(params as Parameters<typeof executeSceneQuery>[0]);
      break;
    case 'entity_edit':
      result = await executeEntityEdit(params as Parameters<typeof executeEntityEdit>[0]);
      break;
    case 'entity_batch_edit':
      result = await executeEntityBatchEdit(params as Parameters<typeof executeEntityBatchEdit>[0]);
      break;
    // case 'geometry_creation':
    //   result = await executeGeometryCreation(params);
    //   break;
    case 'prefab_management':
      result = await executePrefabManagement(
        params as Parameters<typeof executePrefabManagement>[0],
      );
      break;
    case 'screenshot_feedback':
      result = await executeScreenshotFeedback(
        params as Parameters<typeof executeScreenshotFeedback>[0],
      );
      break;
    case 'get_available_shapes':
      result = await executeGetAvailableShapes(
        params as Parameters<typeof executeGetAvailableShapes>[0],
      );
      break;
    case 'get_shape_schema':
      result = await executeGetShapeSchema(params as Parameters<typeof executeGetShapeSchema>[0]);
      break;
    case 'get_scene_info':
      result = await executeGetSceneInfo(params as Parameters<typeof executeGetSceneInfo>[0]);
      break;
    case 'get_available_materials':
      result = await executeGetAvailableMaterials(
        params as Parameters<typeof executeGetAvailableMaterials>[0],
      );
      break;
    case 'script_management':
      result = await executeScriptManagement(
        params as Parameters<typeof executeScriptManagement>[0],
      );
      break;
    default:
      result = `Unknown tool: ${toolName}`;
  }

  // Force viewport refresh after every tool execution to avoid stale state
  refreshViewport();

  return result;
}
