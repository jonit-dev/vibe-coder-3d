// Updated useTransform hook - now uses the new reactive ECS system
import { useEntityTransform } from '@core/hooks/useECSReactive';

export interface IUseTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  setPosition: (next: [number, number, number]) => void;
  setRotation: (next: [number, number, number]) => void;
  setScale: (next: [number, number, number]) => void;
}

export const useTransform = (selectedEntity: number | null): IUseTransform => {
  const { transform, setPosition, setRotation, setScale } = useEntityTransform(selectedEntity);

  // Provide default values if no transform is available
  const position: [number, number, number] = transform?.position ?? [0, 0, 0];
  const rotation: [number, number, number] = transform?.rotation ?? [0, 0, 0];
  const scale: [number, number, number] = transform?.scale ?? [1, 1, 1];

  return { position, rotation, scale, setPosition, setRotation, setScale };
};
