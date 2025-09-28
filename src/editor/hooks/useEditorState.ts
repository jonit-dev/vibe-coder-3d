import { useEditorStore } from '../store/editorStore';

interface IEntityState {
  entityIds: number[];
  selectedId: number | null;
  setEntityIds: (ids: number[]) => void;
  setSelectedId: (id: number | null) => void;
}

interface IUIState {
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  isLeftPanelCollapsed: boolean;
  setIsLeftPanelCollapsed: (collapsed: boolean) => void;
  isMaterialsExpanded: boolean;
  setIsMaterialsExpanded: (expanded: boolean) => void;
  showAddMenu: boolean;
  setShowAddMenu: (show: boolean) => void;
}

interface IPhysicsState {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

interface IPerformanceMetrics {
  averageFPS: number;
  frameTime: number;
  renderCount: number;
}

interface IAppState {
  statusMessage: string;
  setStatusMessage: (message: string) => void;
  performanceMetrics: IPerformanceMetrics;
}

export const useEntityState = (): IEntityState => {
  const entityIds = useEditorStore((state) => state.entityIds);
  const selectedId = useEditorStore((state) => state.selectedId);
  const setEntityIds = useEditorStore((state) => state.setEntityIds);
  const setSelectedId = useEditorStore((state) => state.setSelectedId);

  return {
    entityIds,
    selectedId,
    setEntityIds,
    setSelectedId,
  };
};

export const useUIState = (): IUIState => {
  const isChatExpanded = useEditorStore((state) => state.isChatExpanded);
  const setIsChatExpanded = useEditorStore((state) => state.setIsChatExpanded);
  const isLeftPanelCollapsed = useEditorStore((state) => state.isLeftPanelCollapsed);
  const setIsLeftPanelCollapsed = useEditorStore((state) => state.setIsLeftPanelCollapsed);
  const isMaterialsExpanded = useEditorStore((state) => state.isMaterialsExpanded);
  const setIsMaterialsExpanded = useEditorStore((state) => state.setIsMaterialsExpanded);
  const showAddMenu = useEditorStore((state) => state.showAddMenu);
  const setShowAddMenu = useEditorStore((state) => state.setShowAddMenu);

  return {
    isChatExpanded,
    setIsChatExpanded,
    isLeftPanelCollapsed,
    setIsLeftPanelCollapsed,
    isMaterialsExpanded,
    setIsMaterialsExpanded,
    showAddMenu,
    setShowAddMenu,
  };
};

export const usePhysicsState = (): IPhysicsState => {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const setIsPlaying = useEditorStore((state) => state.setIsPlaying);

  return {
    isPlaying,
    setIsPlaying,
  };
};

export const useAppState = (): IAppState => {
  const statusMessage = useEditorStore((state) => state.statusMessage);
  const setStatusMessage = useEditorStore((state) => state.setStatusMessage);
  const performanceMetrics = useEditorStore((state) => state.performanceMetrics);

  return {
    statusMessage,
    setStatusMessage,
    performanceMetrics,
  };
};
