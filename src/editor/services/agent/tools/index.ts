/**
 * Tool Registry
 * Central registry of all available tools for the AI agent
 */

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
];

export async function executeTool(toolName: string, params: any): Promise<string> {
  switch (toolName) {
    case 'planning':
      return executePlanning(params);
    case 'scene_manipulation':
      return executeSceneManipulation(params);
    case 'scene_query':
      return executeSceneQuery(params);
    case 'entity_edit':
      return executeEntityEdit(params);
    // case 'geometry_creation':
    //   return executeGeometryCreation(params);
    case 'prefab_management':
      return executePrefabManagement(params);
    case 'screenshot_feedback':
      return executeScreenshotFeedback(params);
    case 'get_available_shapes':
      return executeGetAvailableShapes(params);
    case 'get_shape_schema':
      return executeGetShapeSchema(params);
    case 'get_scene_info':
      return executeGetSceneInfo(params);
    case 'get_available_materials':
      return executeGetAvailableMaterials(params);
    default:
      return `Unknown tool: ${toolName}`;
  }
}
