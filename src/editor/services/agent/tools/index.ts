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

// Type for all available tools (union of tool types)
export type AvailableTool = typeof planningTool | typeof sceneManipulationTool | typeof sceneQueryTool | typeof entityEditTool | typeof prefabManagementTool | typeof screenshotFeedbackTool | typeof getAvailableShapesTool | typeof getShapeSchemaTool | typeof getSceneInfoTool | typeof getAvailableMaterialsTool | typeof scriptManagementTool;

export const AVAILABLE_TOOLS = [
  planningTool,
  sceneManipulationTool,
  sceneQueryTool,
  entityEditTool,
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
  | Parameters<typeof executePrefabManagement>[0]
  | Parameters<typeof executeScreenshotFeedback>[0]
  | Parameters<typeof executeGetAvailableShapes>[0]
  | Parameters<typeof executeGetShapeSchema>[0]
  | Parameters<typeof executeGetSceneInfo>[0]
  | Parameters<typeof executeGetAvailableMaterials>[0]
  | Parameters<typeof executeScriptManagement>[0];

export async function executeTool(toolName: string, params: ToolParameters): Promise<string> {
  switch (toolName) {
    case 'planning':
      return executePlanning(params as Parameters<typeof executePlanning>[0]);
    case 'scene_manipulation':
      return executeSceneManipulation(params as Parameters<typeof executeSceneManipulation>[0]);
    case 'scene_query':
      return executeSceneQuery(params as Parameters<typeof executeSceneQuery>[0]);
    case 'entity_edit':
      return executeEntityEdit(params as Parameters<typeof executeEntityEdit>[0]);
    // case 'geometry_creation':
    //   return executeGeometryCreation(params);
    case 'prefab_management':
      return executePrefabManagement(params as Parameters<typeof executePrefabManagement>[0]);
    case 'screenshot_feedback':
      return executeScreenshotFeedback(params as Parameters<typeof executeScreenshotFeedback>[0]);
    case 'get_available_shapes':
      return executeGetAvailableShapes(params as Parameters<typeof executeGetAvailableShapes>[0]);
    case 'get_shape_schema':
      return executeGetShapeSchema(params as Parameters<typeof executeGetShapeSchema>[0]);
    case 'get_scene_info':
      return executeGetSceneInfo(params as Parameters<typeof executeGetSceneInfo>[0]);
    case 'get_available_materials':
      return executeGetAvailableMaterials(params as Parameters<typeof executeGetAvailableMaterials>[0]);
    case 'script_management':
      return executeScriptManagement(params as Parameters<typeof executeScriptManagement>[0]);
    default:
      return `Unknown tool: ${toolName}`;
  }
}
