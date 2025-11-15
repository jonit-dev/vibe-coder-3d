import { Logger } from '@core/lib/logger';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { ZodSchema, ZodTypeDef, ZodNumberDef, ZodArrayDef, ZodObjectDef, ZodStringDef, ZodBooleanDef, ZodOptionalDef } from 'zod';

const logger = Logger.create('RustSchemaExporter');

/**
 * Exports component schemas as JSON for Rust consumption
 */
export class RustSchemaExporter {
  /**
   * Export all component schemas to JSON files
   */
  async exportSchemas(outputDir: string): Promise<void> {
    logger.info('Exporting component schemas', { outputDir });

    const registry = ComponentRegistry.getInstance();
    const componentIds = registry.listComponents();
    const components = componentIds.map(id => registry.get(id)).filter(c => c !== undefined);

    for (const component of components) {
      const schema = component.schema;
      if (!schema) {
        logger.warn('Component has no schema, skipping', { componentId: component.id });
        continue;
      }

      // Convert Zod schema to JSON Schema
      const jsonSchema = this.zodToJsonSchema(schema, component.id);

      // Write to file
      const filename = `${component.id}.json`;
      const filepath = join(outputDir, filename);

      await fs.writeFile(filepath, JSON.stringify(jsonSchema, null, 2), 'utf-8');
      logger.debug('Exported component schema', { componentId: component.id, filepath });
    }

    logger.info('Component schema export complete', { count: components.length });
  }

  /**
   * Convert Zod schema to JSON Schema format
   * This is a simplified version - for production, consider using zod-to-json-schema
   */
  private zodToJsonSchema(zodSchema: ZodSchema<unknown>, componentId: string): Record<string, unknown> {
    const shape = zodSchema._def?.shape?.();
    if (!shape) {
      return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: componentId,
        type: 'object',
        properties: {},
      };
    }

    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as any;
      const fieldDef = this.parseZodField(fieldSchema);
      properties[key] = fieldDef;

      // Check if field is required
      if (!fieldSchema._def?.typeName?.includes('ZodOptional')) {
        required.push(key);
      }
    }

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: componentId,
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  /**
   * Parse a Zod field definition to JSON Schema
   */
  private parseZodField(field: ZodTypeDef): Record<string, unknown> {
    const typeName = field._def?.typeName;

    switch (typeName) {
      case 'ZodString':
        return { type: 'string' };

      case 'ZodNumber': {
        const numberSchema: Record<string, unknown> = { type: 'number' };
        // Check for min/max constraints
        if (field._def?.checks) {
          for (const check of field._def.checks) {
            if (check.kind === 'min') numberSchema.minimum = check.value;
            if (check.kind === 'max') numberSchema.maximum = check.value;
          }
        }
        return numberSchema;
      }

      case 'ZodBoolean':
        return { type: 'boolean' };

      case 'ZodArray':
        return {
          type: 'array',
          items: this.parseZodField(field._def.type),
        };

      case 'ZodTuple':
        return {
          type: 'array',
          items: field._def.items.map((item: ZodTypeDef) => this.parseZodField(item)),
          minItems: field._def.items.length,
          maxItems: field._def.items.length,
        };

      case 'ZodObject': {
        const shape = field._def.shape();
        const properties: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(shape)) {
          properties[key] = this.parseZodField(value);
        }
        return {
          type: 'object',
          properties,
        };
      }

      case 'ZodEnum':
        return {
          type: 'string',
          enum: field._def.values,
        };

      case 'ZodOptional':
        return this.parseZodField(field._def.innerType);

      case 'ZodDefault': {
        const defaultSchema = this.parseZodField(field._def.innerType);
        defaultSchema.default = field._def.defaultValue();
        return defaultSchema;
      }

      default:
        logger.warn('Unknown Zod type', { typeName });
        return { type: 'any' };
    }
  }
}
