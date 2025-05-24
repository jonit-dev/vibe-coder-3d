import { componentManager, registerBuiltInComponents } from '../dynamic-components/init';

// Use the unified registration system
export function registerAllBuiltInComponents(): void {
  registerBuiltInComponents(componentManager);
}

// Re-export built-in components for backwards compatibility
export {
  materialDescriptor,
  meshColliderDescriptor,
  meshRendererDescriptor,
  meshTypeDescriptor,
  nameDescriptor,
  rigidBodyDescriptor,
  transformDescriptor,
  velocityDescriptor,
} from '../dynamic-components/components/BuiltInComponents';

// Legacy function for backwards compatibility
export function registerBuiltInComponentsLegacy(): void {
  console.warn(
    'registerBuiltInComponentsLegacy() is deprecated. Use registerAllBuiltInComponents() instead.',
  );
  registerAllBuiltInComponents();
}
