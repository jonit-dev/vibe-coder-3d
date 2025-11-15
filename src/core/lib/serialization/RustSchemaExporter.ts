import { Logger } from '@core/lib/logger';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { ZodSchema } from 'zod';

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
    const components = componentIds.map((id) => registry.get(id)).filter((c) => c !== undefined);

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
  private zodToJsonSchema(
    zodSchema: ZodSchema<unknown>,
    componentId: string,
  ): Record<string, unknown> {
    const def = zodSchema._def as { shape?: () => Record<string, unknown> };
    const shape = typeof def.shape === 'function' ? def.shape() : undefined;
    if (!shape) {
      return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: componentId,
        type: 'object',
        properties: {},
      };
    }

    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape ?? {})) {
      const fieldSchema = value as { _def?: { typeName?: string; [key: string]: unknown } };
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
  private parseZodField(field: { _def?: { typeName?: string; [key: string]: unknown } }): Record<string, unknown> {
    const typeName = field._def?.typeName;

    switch (typeName) {
      case 'ZodString':
        return { type: 'string' };

      case 'ZodNumber': {
        const numberSchema: Record<string, unknown> = { type: 'number' };
        // Check for min/max constraints
        const checks = field._def?.checks as Array<{ kind: string; value: unknown }> | undefined;
        if (checks && Array.isArray(checks)) {
          for (const check of checks) {
            if (check.kind === 'min') numberSchema.minimum = check.value;
            if (check.kind === 'max') numberSchema.maximum = check.value;
          }
        }
        return numberSchema;
      }

      case 'ZodBoolean':
        return { type: 'boolean' };

      case 'ZodArray': {
        const arrayType = field._def && 'type' in field._def ? field._def.type : null;
        return {
          type: 'array',
          items: arrayType ? this.parseZodField(arrayType as { _def?: { typeName?: string; [key: string]: unknown } }) : { type: 'any' },
        };
      }

      case 'ZodTuple': {
        const items = field._def && 'items' in field._def && Array.isArray(field._def.items) ? field._def.items : [];
        return {
          type: 'array',
          items: items.map((item: unknown) => this.parseZodField(item as { _def?: { typeName?: string; [key: string]: unknown } })),
          minItems: items.length,
          maxItems: items.length,
        };
      }

      case 'ZodObject': {
        const shapeFn = field._def && typeof field._def.shape === 'function' ? field._def.shape as () => Record<string, unknown> : undefined;
        const shape = shapeFn ? shapeFn() : {};
        const properties: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(shape)) {
          properties[key] = this.parseZodField(value as { _def?: { typeName?: string; [key: string]: unknown } });
        }
        return {
          type: 'object',
          properties,
        };
      }

      case 'ZodEnum':
        return {
          type: 'string',
          enum: field._def?.values || [],
        };

      case 'ZodOptional':
        return field._def ? this.parseZodField(field._def.innerType as { _def?: { typeName?: string; [key: string]: unknown } }) : { type: 'any' };

      case 'ZodDefault': {
        const innerType = field._def?.innerType as { _def?: { typeName?: string; [key: string]: unknown } } | undefined;
        const defaultSchema = innerType ? this.parseZodField(innerType) : { type: 'any' };
        const defaultValueFn = field._def?.defaultValue as (() => unknown) | undefined;
        if (defaultValueFn) {
          defaultSchema.default = defaultValueFn();
        }
        return defaultSchema;
      }

      default:
        logger.warn('Unknown Zod type', { typeName });
        return { type: 'any' };
    }
  }
}
