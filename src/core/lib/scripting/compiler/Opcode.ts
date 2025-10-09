/**
 * Opcode definitions for compiled script instructions
 */

export enum Opcode {
  // Console operations
  Log = 'Log',

  // Transform operations (preferred API)
  SetPosition = 'SetPosition',
  SetRotation = 'SetRotation',
  SetScale = 'SetScale',
  Translate = 'Translate',
  Rotate = 'Rotate',

  // Legacy transform operations (backward compatibility)
  LegacySetPosX = 'LegacySetPosX',
  LegacySetPosY = 'LegacySetPosY',
  LegacySetPosZ = 'LegacySetPosZ',
  LegacySetRotX = 'LegacySetRotX',
  LegacySetRotY = 'LegacySetRotY',
  LegacySetRotZ = 'LegacySetRotZ',
  LegacyAddRotX = 'LegacyAddRotX',
  LegacyAddRotY = 'LegacyAddRotY',
  LegacyAddRotZ = 'LegacyAddRotZ',
  LegacySubRotX = 'LegacySubRotX',
  LegacySubRotY = 'LegacySubRotY',
  LegacySubRotZ = 'LegacySubRotZ',

  // Time-based animations
  SinusoidalPosX = 'SinusoidalPosX',
  SinusoidalPosY = 'SinusoidalPosY',
  SinusoidalPosZ = 'SinusoidalPosZ',
  DeltaRotX = 'DeltaRotX',
  DeltaRotY = 'DeltaRotY',
  DeltaRotZ = 'DeltaRotZ',

  // Material operations
  SetMaterialColor = 'SetMaterialColor',

  // No-op (for unknown/unsupported operations)
  Noop = 'Noop',
}
