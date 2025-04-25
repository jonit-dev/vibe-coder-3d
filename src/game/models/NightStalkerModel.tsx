import { useAsset } from '@/core/hooks/useAsset';
import { useMixamoAnimations } from '@/core/hooks/useMixamoAnimations';
import { IAnimationControls } from '@/core/hooks/useModelAnimations';
import { useModelDebug } from '@/core/hooks/useModelDebug';
import { AssetKeys, IModelConfig } from '@/core/types/assets';

interface INightStalkerModelProps {
  onAnimationsReady?: (controls: IAnimationControls) => void;
  debug?: boolean;
}

export function NightStalkerModel({ onAnimationsReady, debug = false }: INightStalkerModelProps) {
  const { model, config } = useAsset(AssetKeys.NightStalkerModel);
  const modelConfig = config as IModelConfig;

  // Handle animations
  const { animationControls } = useMixamoAnimations({
    model,
    modelConfig,
    debug,
    onAnimationsReady,
  });

  // Handle debug visualizations
  const { renderDebugElements } = useModelDebug({
    model,
    config: modelConfig,
    debug,
  });

  // Determine positioning based on config
  const groupPosition: [number, number, number] = modelConfig?.position ?? [0, 0, 0];

  return model ? (
    <group position={groupPosition}>
      <primitive object={model} />
      {renderDebugElements}
    </group>
  ) : null;
}
