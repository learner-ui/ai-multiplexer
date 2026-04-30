import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  createCustomModel,
  CUSTOM_MODEL_COLORS,
  DEFAULT_MODELS,
  loadCustomModels,
  saveCustomModels,
} from './modelStorage';
import {
  DEFAULT_LOGIN_PROFILE_ID,
  getLoginProfileNumber,
  getNextLoginProfileId,
  loadLoginProfileChoices,
  loadLoginProfileCounts,
  saveLoginProfileChoices,
  saveLoginProfileCounts,
} from './sessionProfiles';
import { loadActiveModels, saveActiveModels } from './workspaceState';
import { createPromptBroadcastBatches } from './promptBroadcast';
import type { LoginProfileCounts, LoginProfileId } from './sessionProfiles';
import type { AIModel } from './types';
import type { GlobalSendOptions, PromptAttachment } from './types';
import type { PromptTarget } from './electron';
import Workspace from './components/Workspace';
import GlobalInput from './components/GlobalInput';

function App() {
  const [customModels, setCustomModels] = useState<AIModel[]>(() => loadCustomModels());
  const [activeModels, setActiveModels] = useState<AIModel[]>(() => (
    loadActiveModels([...DEFAULT_MODELS, ...loadCustomModels()])
  ));
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customNewChatUrl, setCustomNewChatUrl] = useState('');
  const [customColor, setCustomColor] = useState<string>(CUSTOM_MODEL_COLORS[0]);
  const [customGlobalSend, setCustomGlobalSend] = useState(true);
  const [customError, setCustomError] = useState('');
  const [loginProfilesByModel, setLoginProfilesByModel] = useState<Record<string, LoginProfileId>>(
    () => loadLoginProfileChoices(),
  );
  const [loginProfileCountsByModel, setLoginProfileCountsByModel] = useState<LoginProfileCounts>(
    () => loadLoginProfileCounts(),
  );
  const [webviewTargetsByModel, setWebviewTargetsByModel] = useState<Record<string, PromptTarget>>({});

  const allModels = useMemo(() => [...DEFAULT_MODELS, ...customModels], [customModels]);

  useEffect(() => {
    saveCustomModels(customModels);
  }, [customModels]);

  useEffect(() => {
    saveLoginProfileChoices(loginProfilesByModel);
  }, [loginProfilesByModel]);

  useEffect(() => {
    saveLoginProfileCounts(loginProfileCountsByModel);
  }, [loginProfileCountsByModel]);

  useEffect(() => {
    saveActiveModels(activeModels);
  }, [activeModels]);

  const handleAddModel = (model: AIModel) => {
    if (!activeModels.find(m => m.id === model.id)) {
      setActiveModels([...activeModels, model]);
    }
  };

  const handleRemoveModel = (id: string) => {
    setActiveModels(activeModels.filter(m => m.id !== id));
    setWebviewTargetsByModel((targets) => {
      const nextTargets = { ...targets };
      delete nextTargets[id];
      return nextTargets;
    });
  };

  const handleDeleteCustomModel = (id: string) => {
    setCustomModels(customModels.filter(model => model.id !== id));
    setActiveModels(activeModels.filter(model => model.id !== id));
    setWebviewTargetsByModel((targets) => {
      const nextTargets = { ...targets };
      delete nextTargets[id];
      return nextTargets;
    });
  };

  const handleMoveModel = (id: string, direction: 'left' | 'right') => {
    const index = activeModels.findIndex(m => m.id === id);
    if (index === -1) return;
    
    if (direction === 'left' && index > 0) {
      const newModels = [...activeModels];
      [newModels[index - 1], newModels[index]] = [newModels[index], newModels[index - 1]];
      setActiveModels(newModels);
    } else if (direction === 'right' && index < activeModels.length - 1) {
      const newModels = [...activeModels];
      [newModels[index], newModels[index + 1]] = [newModels[index + 1], newModels[index]];
      setActiveModels(newModels);
    }
  };

  const handleLoginProfileChange = (id: string, profileId: LoginProfileId) => {
    setLoginProfilesByModel({
      ...loginProfilesByModel,
      [id]: profileId,
    });
  };

  const getLoginProfileCount = (id: string) => {
    const selectedProfile = loginProfilesByModel[id] ?? DEFAULT_LOGIN_PROFILE_ID;
    return Math.max(
      loginProfileCountsByModel[id] ?? 1,
      getLoginProfileNumber(selectedProfile),
    );
  };

  const handleLoginProfileAdd = (id: string) => {
    const nextCount = getLoginProfileCount(id) + 1;
    const nextProfileId = getNextLoginProfileId(getLoginProfileCount(id));

    setLoginProfileCountsByModel({
      ...loginProfileCountsByModel,
      [id]: nextCount,
    });
    setLoginProfilesByModel({
      ...loginProfilesByModel,
      [id]: nextProfileId,
    });
  };

  const handleWebviewTargetChange = useCallback((id: string, target: PromptTarget | null) => {
    setWebviewTargetsByModel((targets) => {
      if (!target) {
        if (!targets[id]) return targets;
        const nextTargets = { ...targets };
        delete nextTargets[id];
        return nextTargets;
      }

      if (
        targets[id]?.url === target.url &&
        targets[id]?.webContentsId === target.webContentsId
      ) {
        return targets;
      }

      return {
        ...targets,
        [id]: target,
      };
    });
  }, []);

  const handleGlobalSend = (
    message: string,
    attachments: PromptAttachment[],
    options: GlobalSendOptions = {},
  ) => {
    if (!window.electronAPI?.isElectron) {
      console.warn('Global prompt broadcast is only available in the Electron desktop app.', {
        message,
        attachments,
      });
      return;
    }

    const batches = createPromptBroadcastBatches({
      activeModels,
      webviewTargetsByModel,
      attachments,
      skipAttachmentModelIds: options.skipAttachmentModelIds,
    });

    Promise.all(
      batches.map((batch) => (
        window.electronAPI!.broadcastPrompt(message, batch.targets, batch.attachments)
      )),
    ).catch((error) => {
      console.error('Failed to broadcast prompt to AI webviews:', error);
    });
  };

  const handleGlobalNewChat = () => {
    if (!window.electronAPI?.isElectron) {
      console.warn('Global new-chat is only available in the Electron desktop app.');
      return;
    }

    const targets = activeModels.map((model) => ({
      matchUrl: model.url,
      newChatUrl: model.newChatUrl ?? model.url,
      webContentsId: webviewTargetsByModel[model.id]?.webContentsId,
    }));

    if (targets.length === 0) return;

    window.electronAPI.broadcastNewChat(targets).catch((error) => {
      console.error('Failed to broadcast new-chat to AI webviews:', error);
    });
  };

  const handleCreateCustomModel = (event: React.FormEvent) => {
    event.preventDefault();
    setCustomError('');

    try {
      const model = createCustomModel({
        name: customName,
        url: customUrl,
        newChatUrl: customNewChatUrl,
        color: customColor,
        supportsGlobalPrompt: customGlobalSend,
      });

      if (allModels.some(existingModel => existingModel.id === model.id)) {
        setCustomError('这个模型已经存在。');
        return;
      }

      setCustomModels([...customModels, model]);
      setActiveModels([...activeModels, model]);
      setCustomName('');
      setCustomUrl('');
      setCustomNewChatUrl('');
      setCustomColor(CUSTOM_MODEL_COLORS[0]);
      setCustomGlobalSend(true);
      setIsCustomDialogOpen(false);
    } catch {
      setCustomError('请填写名称，并输入有效的网址。');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-4 shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <img src="/app-icon.svg" alt="" className="h-7 w-7 rounded-md" />
          <h1 className="text-lg font-bold text-gray-800">AI Multiplexer</h1>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto min-w-0">
          {allModels.map(model => (
            <div key={model.id} className="flex items-center shrink-0">
              <button
                onClick={() => handleAddModel(model)}
                disabled={activeModels.some(m => m.id === model.id)}
                className={`flex items-center px-2 py-1 rounded-l text-xs font-medium transition-colors border ${
                  activeModels.some(m => m.id === model.id)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${model.custom ? 'rounded-r-none' : 'rounded-r'}`}
              >
                <Plus size={12} className="mr-1" />
                {model.name}
              </button>
              {model.custom && (
                <button
                  onClick={() => handleDeleteCustomModel(model.id)}
                  className="p-1.5 rounded-r border border-l-0 border-gray-300 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title={`Delete ${model.name}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setIsCustomDialogOpen(true)}
            className="flex items-center px-2 py-1 rounded text-xs font-medium transition-colors border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shrink-0"
          >
            <Plus size={12} className="mr-1" />
            自定义
          </button>
        </div>
      </header>

      {isCustomDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <form onSubmit={handleCreateCustomModel} className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">添加自定义 AI 窗口</h2>
              <button
                type="button"
                onClick={() => setIsCustomDialogOpen(false)}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1">名称</span>
                <input
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例如 Kimi、Perplexity"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1">网址</span>
                <input
                  value={customUrl}
                  onChange={(event) => setCustomUrl(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1">
                  新对话网址 <span className="text-gray-400 font-normal">（可选）</span>
                </span>
                <input
                  value={customNewChatUrl}
                  onChange={(event) => setCustomNewChatUrl(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="留空则使用上方网址"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  点击「新对话」按钮时跳转的地址。多数 AI 留空即可，如果首页和新对话页不同（例如 /chat/new）就在这里指定。
                </span>
              </label>

              <div>
                <span className="block text-xs font-medium text-gray-700 mb-2">颜色</span>
                <div className="flex gap-2">
                  {CUSTOM_MODEL_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCustomColor(color)}
                      className={`h-6 w-6 rounded-full ${color} ring-offset-2 ${
                        customColor === color ? 'ring-2 ring-gray-900' : 'ring-1 ring-gray-300'
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-700">启用全局发送</span>
                <input
                  type="checkbox"
                  checked={customGlobalSend}
                  onChange={(event) => setCustomGlobalSend(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>

              {customError && (
                <p className="text-xs text-red-600">{customError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setIsCustomDialogOpen(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                添加
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Workspace Area (The Split Panes) */}
      <Workspace 
        activeModels={activeModels} 
        onRemoveModel={handleRemoveModel} 
        onMoveModel={handleMoveModel}
        getLoginProfileId={(id) => loginProfilesByModel[id] ?? DEFAULT_LOGIN_PROFILE_ID}
        getLoginProfileCount={getLoginProfileCount}
        onLoginProfileChange={handleLoginProfileChange}
        onLoginProfileAdd={handleLoginProfileAdd}
        onWebviewTargetChange={handleWebviewTargetChange}
      />

      {/* Global Input Area (Bottom Bar) */}
      <GlobalInput
        onSend={handleGlobalSend}
        onNewChat={handleGlobalNewChat}
        activeCount={activeModels.length}
      />
    </div>
  );
}

export default App;
