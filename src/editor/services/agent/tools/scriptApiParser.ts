/**
 * Script API Parser
 * Dynamically extracts API information from script-api.d.ts
 * Single source of truth - no duplication!
 */

export interface IAPIInfo {
  name: string;
  category: string;
  description: string;
  type: 'global' | 'interface';
  interfaceName?: string;
  methods?: string[];
  properties?: string[];
}

/**
 * Parse the script-api.d.ts file to extract all API information
 */
export async function parseScriptAPIs(fileContent: string): Promise<IAPIInfo[]> {
  const apis: IAPIInfo[] = [];

  // Extract global variable declarations
  const globalVarRegex = /\/\*\*\s*([^*]*?)\s*\*\/\s*const\s+(\w+):\s+(\w+)/g;
  let match;

  while ((match = globalVarRegex.exec(fileContent)) !== null) {
    const [, description, varName, interfaceName] = match;

    // Determine category based on description or name
    const category = categorizeAPI(varName, description);

    apis.push({
      name: varName,
      category,
      description: description.trim(),
      type: 'global',
      interfaceName,
    });
  }

  // Extract interface definitions to get methods and properties
  for (const api of apis) {
    if (api.interfaceName) {
      const interfaceInfo = extractInterfaceInfo(fileContent, api.interfaceName);
      api.methods = interfaceInfo.methods;
      api.properties = interfaceInfo.properties;
    }
  }

  // Add special entry for parameters (it's Record<string, unknown>)
  const parametersApi = apis.find((a) => a.name === 'parameters');
  if (parametersApi) {
    parametersApi.properties = ['(dynamic - defined by user)'];
    parametersApi.interfaceName = undefined;
  }

  return apis;
}

/**
 * Categorize an API based on its name and description
 */
function categorizeAPI(name: string, description: string): string {
  const lower = name.toLowerCase();
  const desc = description.toLowerCase();

  // Core APIs
  if (['entity', 'time', 'parameters'].includes(lower)) return 'Core';

  // Input
  if (lower === 'input' || desc.includes('keyboard') || desc.includes('mouse')) return 'Input';

  // Physics
  if (
    lower.includes('rigid') ||
    lower.includes('collider') ||
    lower.includes('physics') ||
    lower.includes('controller')
  )
    return 'Physics';

  // Components
  if (
    lower.includes('renderer') ||
    lower.includes('camera') ||
    lower.includes('light') ||
    desc.includes('component accessor')
  )
    return 'Components';

  // Scene
  if (
    ['query', 'prefab', 'entities', 'gameobject'].includes(lower) ||
    desc.includes('scene') ||
    desc.includes('entity')
  )
    return 'Scene';

  // Events
  if (lower === 'events' || desc.includes('event bus')) return 'Events';

  // Audio
  if (lower === 'audio' || desc.includes('sound') || desc.includes('audio')) return 'Audio';

  // Debug
  if (lower === 'console' || desc.includes('log')) return 'Debug';

  // Utilities (default)
  return 'Utilities';
}

/**
 * Extract methods and properties from an interface definition
 */
function extractInterfaceInfo(
  fileContent: string,
  interfaceName: string,
): { methods: string[]; properties: string[] } {
  const methods: string[] = [];
  const properties: string[] = [];

  // Find the interface definition
  const interfaceRegex = new RegExp(
    `interface\\s+${interfaceName}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`,
    'i',
  );
  const interfaceMatch = fileContent.match(interfaceRegex);

  if (!interfaceMatch) {
    return { methods, properties };
  }

  const interfaceBody = interfaceMatch[1];

  // Extract methods (functions with parentheses)
  const methodRegex = /(\w+)\s*\([^)]*\)\s*:/g;
  let methodMatch;
  while ((methodMatch = methodRegex.exec(interfaceBody)) !== null) {
    methods.push(methodMatch[1]);
  }

  // Extract properties (readonly or regular properties without parentheses)
  const propertyRegex = /(?:readonly\s+)?(\w+)\s*:\s*(?!\()/g;
  let propertyMatch;
  while ((propertyMatch = propertyRegex.exec(interfaceBody)) !== null) {
    const propName = propertyMatch[1];
    // Skip if it's actually a method we already captured
    if (!methods.includes(propName)) {
      properties.push(propName);
    }
  }

  return { methods, properties };
}

/**
 * Get list of all available script APIs
 * This is now a wrapper that fetches and parses the file
 */
export async function getAvailableAPIs(): Promise<IAPIInfo[]> {
  try {
    const response = await fetch('/src/game/scripts/script-api.d.ts');
    if (!response.ok) {
      throw new Error(`Failed to load script-api.d.ts: ${response.status}`);
    }

    const fileContent = await response.text();
    return await parseScriptAPIs(fileContent);
  } catch (error) {
    console.error('Failed to parse script APIs:', error);
    // Return empty array on error - the tool will handle it
    return [];
  }
}

/**
 * Get detailed information about specific APIs
 */
export async function getAPIDetails(apiNames: string[]): Promise<string> {
  const availableAPIs = await getAvailableAPIs();
  const requestedAPIs = apiNames.map((name) => name.toLowerCase());

  // Filter to requested APIs
  const matchedAPIs = availableAPIs.filter((api: IAPIInfo) =>
    requestedAPIs.includes(api.name.toLowerCase()),
  );

  if (matchedAPIs.length === 0) {
    return `No APIs found matching: ${apiNames.join(', ')}. Use list_available_apis to see all available APIs.`;
  }

  // Load the full API definitions file
  let fullApiDefs = '';
  try {
    const response = await fetch('/src/game/scripts/script-api.d.ts');
    if (response.ok) {
      fullApiDefs = await response.text();
    }
  } catch (error) {
    // Fallback if file can't be loaded
  }

  let result = `📋 API Details (${matchedAPIs.length} APIs)\n\n`;

  for (const api of matchedAPIs) {
    result += `## ${api.name} (${api.category})\n`;
    result += `**Type:** ${api.type}\n`;
    result += `**Description:** ${api.description}\n\n`;

    if (api.properties && api.properties.length > 0) {
      result += `**Properties:** ${api.properties.join(', ')}\n`;
    }

    if (api.methods && api.methods.length > 0) {
      result += `**Methods:** ${api.methods.join(', ')}\n`;
    }

    // Try to extract the interface definition from the full file
    if (fullApiDefs) {
      const interfacePattern = new RegExp(
        `interface I${api.name.charAt(0).toUpperCase() + api.name.slice(1)}API.*?\\{[\\s\\S]*?\\n  \\}`,
        'i',
      );
      const match = fullApiDefs.match(interfacePattern);
      if (match) {
        result += `\n**Type Definition:**\n\`\`\`typescript\n${match[0]}\n\`\`\`\n`;
      }
    }

    result += '\n---\n\n';
  }

  // Add usage examples for common APIs
  if (requestedAPIs.includes('parameters')) {
    result += `\n**Parameters Usage Example:**\n\`\`\`typescript\nfunction onUpdate(deltaTime: number): void {
  // Always provide fallback defaults
  const speed = (parameters.speed as number) || 1.0;
  const color = (parameters.color as string) || '#ffffff';

  entity.transform.rotate(0, deltaTime * speed, 0);
}\n\`\`\`\n\n`;
  }

  if (requestedAPIs.includes('transform')) {
    result += `\n**Transform Usage Example:**\n\`\`\`typescript\nfunction onUpdate(deltaTime: number): void {
  // Rotate entity
  entity.transform.rotate(0, deltaTime, 0);

  // Move entity
  entity.transform.translate(0, 0, deltaTime * 2);

  // Set absolute position
  entity.transform.setPosition(0, 5, 0);

  // Get current position
  const [x, y, z] = entity.transform.position;
}\n\`\`\`\n\n`;
  }

  if (requestedAPIs.includes('rigidbody')) {
    result += `\n**RigidBody Usage Example:**\n\`\`\`typescript\nfunction onStart(): void {
  if (entity.rigidBody) {
    entity.rigidBody.setMass(2.0);
    entity.rigidBody.setBodyType('dynamic');
    entity.rigidBody.applyImpulse([0, 10, 0]); // Jump
  }
}\n\`\`\`\n\n`;
  }

  if (requestedAPIs.includes('input')) {
    result += `\n**Input Usage Example:**\n\`\`\`typescript\nfunction onUpdate(deltaTime: number): void {
  const speed = 5.0;

  // Keyboard input
  if (input.isKeyDown('w')) {
    entity.transform.translate(0, 0, -speed * deltaTime);
  }

  // Mouse input
  if (input.isMouseButtonPressed(0)) {
    console.log('Left click!');
  }

  // Action system
  const moveValue = input.getActionValue('Gameplay', 'Move');
  if (Array.isArray(moveValue)) {
    const [x, y] = moveValue;
    entity.transform.translate(x * speed * deltaTime, 0, y * speed * deltaTime);
  }
}\n\`\`\`\n\n`;
  }

  return result;
}
