import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { AIModel } from '../types';
import type { PromptTarget } from '../electron';
import type { LoginProfileId } from '../sessionProfiles';
import {
  getStableWorkspaceRenderIds,
  loadPanelLayout,
  savePanelLayout,
} from '../workspaceState';
import AIPane from './AIPane';

type WorkspaceLayout = Record<string, number>;

interface WorkspaceProps {
  activeModels: AIModel[];
  onRemoveModel: (id: string) => void;
  onMoveModel: (id: string, direction: 'left' | 'right') => void;
  getLoginProfileId: (id: string) => LoginProfileId;
  getLoginProfileCount: (id: string) => number;
  onLoginProfileChange: (id: string, profileId: LoginProfileId) => void;
  onLoginProfileAdd: (id: string) => void;
  onWebviewTargetChange: (id: string, target: PromptTarget | null) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
  activeModels,
  onRemoveModel,
  onMoveModel,
  getLoginProfileId,
  getLoginProfileCount,
  onLoginProfileChange,
  onLoginProfileAdd,
  onWebviewTargetChange,
}) => {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const paneShellsRef = useRef(new Map<string, HTMLDivElement>());
  const activeModelIds = useMemo(
    () => activeModels.map((model) => model.id),
    [activeModels],
  );
  const [renderState, setRenderState] = useState(() => ({
    activeModelIds,
    layout: getInitialPanelLayout(activeModelIds),
    renderModelIds: activeModelIds,
  }));
  let renderModelIds = renderState.renderModelIds;
  let panelLayout = renderState.layout;

  if (!haveSameIds(renderState.activeModelIds, activeModelIds)) {
    renderModelIds = getStableWorkspaceRenderIds(activeModelIds, renderState.renderModelIds);
    panelLayout = getInitialPanelLayout(activeModelIds, renderState.layout);
    setRenderState({
      activeModelIds,
      layout: panelLayout,
      renderModelIds,
    });
  }
  const modelsById = useMemo(
    () => new Map(activeModels.map((model) => [model.id, model])),
    [activeModels],
  );
  const visualIndexById = useMemo(
    () => new Map(activeModelIds.map((id, index) => [id, index])),
    [activeModelIds],
  );
  const renderModels = useMemo(
    () => renderModelIds
      .map((id) => modelsById.get(id))
      .filter((model): model is AIModel => Boolean(model)),
    [modelsById, renderModelIds],
  );

  const handleResizeStart = useCallback((
    leftModelId: string,
    rightModelId: string,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const workspaceRect = workspace.getBoundingClientRect();
    if (workspaceRect.width <= 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const startingLayout = panelLayout;
    const leftStart = startingLayout[leftModelId] ?? 0;
    const rightStart = startingLayout[rightModelId] ?? 0;
    const combinedSize = leftStart + rightStart;
    if (combinedSize <= 0) return;

    const minSize = Math.min(MIN_PANEL_SIZE, combinedSize / 2);
    let latestLayout = startingLayout;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaPercent = ((moveEvent.clientX - event.clientX) / workspaceRect.width) * 100;
      const nextLeft = clamp(leftStart + deltaPercent, minSize, combinedSize - minSize);
      const nextRight = combinedSize - nextLeft;

      latestLayout = {
        ...startingLayout,
        [leftModelId]: nextLeft,
        [rightModelId]: nextRight,
      };

      applyPanelLayoutStyles(latestLayout, paneShellsRef.current);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      setRenderState((currentState) => ({
        ...currentState,
        layout: latestLayout,
      }));
      savePanelLayout(activeModelIds, latestLayout);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    window.addEventListener('pointercancel', handlePointerUp, { once: true });
  }, [activeModelIds, panelLayout]);

  if (activeModels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No AI Models Selected</h2>
          <p className="text-gray-500 mb-6">Select one or more AI models from the top bar to start.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-gray-100 p-2 flex">
      <div
        ref={workspaceRef}
        id="ai-multiplexer-workspace"
        className="h-full w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm flex"
      >
        {renderModels.map((model) => {
          const visualIndex = visualIndexById.get(model.id) ?? 0;
          const isFirst = visualIndex === 0;
          const isLast = visualIndex === activeModels.length - 1;
          const panelOrder = visualIndex * 2;
          const nextModelId = activeModelIds[visualIndex + 1];

          return (
            <React.Fragment key={model.id}>
              <div
                ref={(element) => {
                  if (element) {
                    paneShellsRef.current.set(model.id, element);
                  } else {
                    paneShellsRef.current.delete(model.id);
                  }
                }}
                data-testid="workspace-pane-shell"
                data-model-id={model.id}
                style={{
                  order: panelOrder,
                  flexGrow: panelLayout[model.id] ?? 1,
                  flexBasis: 0,
                }}
                className="bg-white flex flex-col relative group min-w-0"
              >
                <AIPane
                  model={model}
                  onRemove={onRemoveModel}
                  onMove={onMoveModel}
                  loginProfileId={getLoginProfileId(model.id)}
                  loginProfileCount={getLoginProfileCount(model.id)}
                  onLoginProfileChange={onLoginProfileChange}
                  onLoginProfileAdd={onLoginProfileAdd}
                  onWebviewTargetChange={onWebviewTargetChange}
                  isFirst={isFirst}
                  isLast={isLast}
                />
              </div>

              {/* The Draggable Resize Handle */}
              {!isLast && nextModelId && (
                <div
                  data-testid="workspace-separator"
                  style={{ order: panelOrder + 1 }}
                  onPointerDown={(event) => handleResizeStart(model.id, nextModelId, event)}
                  className="w-2 bg-gray-100 hover:bg-blue-400 focus:bg-blue-500 transition-colors cursor-col-resize flex flex-col justify-center items-center z-10 shrink-0"
                >
                  <div className="w-0.5 h-8 bg-gray-300 rounded-full"></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

function haveSameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

const MIN_PANEL_SIZE = 12;

function getInitialPanelLayout(activeModelIds: string[], previousLayout?: WorkspaceLayout) {
  const storedLayout = loadPanelLayout(activeModelIds);
  return normalizePanelLayout(activeModelIds, storedLayout ?? previousLayout);
}

function normalizePanelLayout(activeModelIds: string[], sourceLayout?: WorkspaceLayout) {
  if (activeModelIds.length === 0) return {};

  const equalSize = 100 / activeModelIds.length;
  if (!sourceLayout) {
    return Object.fromEntries(activeModelIds.map((id) => [id, equalSize]));
  }

  const nextLayout: WorkspaceLayout = {};
  let usedSize = 0;
  const missingIds: string[] = [];

  for (const id of activeModelIds) {
    const size = sourceLayout[id];
    if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
      nextLayout[id] = size;
      usedSize += size;
    } else {
      missingIds.push(id);
    }
  }

  const missingSize = missingIds.length > 0
    ? Math.max(0, 100 - usedSize) / missingIds.length
    : 0;

  for (const id of missingIds) {
    nextLayout[id] = missingSize || equalSize;
  }

  const totalSize = Object.values(nextLayout).reduce((sum, size) => sum + size, 0);
  if (totalSize <= 0) {
    return Object.fromEntries(activeModelIds.map((id) => [id, equalSize]));
  }

  return Object.fromEntries(
    activeModelIds.map((id) => [id, (nextLayout[id] / totalSize) * 100]),
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function applyPanelLayoutStyles(
  layout: WorkspaceLayout,
  paneShells: Map<string, HTMLDivElement>,
) {
  for (const [id, size] of Object.entries(layout)) {
    const paneShell = paneShells.get(id);
    if (!paneShell) continue;

    paneShell.style.flexGrow = String(size);
    paneShell.style.flexBasis = '0px';
  }
}

export default Workspace;
