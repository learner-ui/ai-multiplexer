import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, RefreshCw, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ADD_LOGIN_PROFILE_VALUE,
  getLoginProfilesForModel,
  getPartitionForLoginProfile,
} from '../sessionProfiles';
import type { LoginProfileId } from '../sessionProfiles';
import type { PromptTarget } from '../electron';
import type { AIModel } from '../types';
import { formatPromptInjectionDiagnostic } from '../paneDiagnostics';

type ReloadableElectronWebviewElement = ElectronWebviewElement & {
  reloadIgnoringCache?: () => void;
};

type PaneDiagnostic = {
  tone: 'info' | 'success' | 'error';
  title: string;
  detail?: string;
  at: string;
};

interface AIPaneProps {
  model: AIModel;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: 'left' | 'right') => void;
  loginProfileId: LoginProfileId;
  loginProfileCount: number;
  onLoginProfileChange: (id: string, profileId: LoginProfileId) => void;
  onLoginProfileAdd: (id: string) => void;
  onWebviewTargetChange: (id: string, target: PromptTarget | null) => void;
  isFirst: boolean;
  isLast: boolean;
}

const AIPane: React.FC<AIPaneProps> = ({
  model,
  onRemove,
  onMove,
  loginProfileId,
  loginProfileCount,
  onLoginProfileChange,
  onLoginProfileAdd,
  onWebviewTargetChange,
  isFirst,
  isLast,
}) => {
  const webviewRef = useRef<ElectronWebviewElement | null>(null);
  const [diagnostic, setDiagnostic] = useState<PaneDiagnostic | null>(null);
  const isElectron = Boolean(window.electronAPI?.isElectron);
  const isDev = import.meta.env.DEV;
  const preloadPath = window.electronAPI?.getWebviewPreloadPath();
  const partition = getPartitionForLoginProfile(model.id, loginProfileId);
  const loginProfiles = useMemo(
    () => getLoginProfilesForModel(model.id, loginProfileCount),
    [loginProfileCount, model.id],
  );
  const browserLikeUserAgent = useMemo(
    () => {
      const normalizedUserAgent = navigator.userAgent.replace(/\sElectron\/[\d.]+/g, '').trim();

      if (model.id !== 'gemini') {
        return normalizedUserAgent;
      }

      const chromeCoreUserAgent = normalizedUserAgent.match(
        /Mozilla\/5\.0 .*?AppleWebKit\/537\.36 \(KHTML, like Gecko\) Chrome\/[\d.]+ Safari\/537\.36/,
      )?.[0] ?? normalizedUserAgent;

      return chromeCoreUserAgent
        .replace(/\sEdg(?:A|iOS)?\/[\d.]+/g, '')
        .replace(/\sOPR\/[\d.]+/g, '')
        .replace(/\sBrave\/[\d.]+/g, '')
        .trim();
    },
    [model.id],
  );

  useEffect(() => {
    if (!isElectron) return undefined;

    const webview = webviewRef.current;
    if (!webview) return undefined;

    const reportTarget = () => {
      try {
        const webContentsId = webview.getWebContentsId();
        if (Number.isInteger(webContentsId) && webContentsId > 0) {
          onWebviewTargetChange(model.id, {
            url: model.url,
            webContentsId,
          });

          if (isDev) {
            setDiagnostic({
              tone: 'info',
              title: `webview 已连接 #${webContentsId}`,
              detail: webview.getURL?.() || model.url,
              at: new Date().toLocaleTimeString(),
            });
          }
        }
      } catch {
        // The webview may not be attached yet; the did-attach event reports it later.
      }
    };

    const timeout = window.setTimeout(reportTarget, 0);
    webview.addEventListener('did-attach', reportTarget);
    webview.addEventListener('dom-ready', reportTarget);
    webview.addEventListener('did-navigate', reportTarget);
    webview.addEventListener('did-navigate-in-page', reportTarget);

    return () => {
      window.clearTimeout(timeout);
      webview.removeEventListener('did-attach', reportTarget);
      webview.removeEventListener('dom-ready', reportTarget);
      webview.removeEventListener('did-navigate', reportTarget);
      webview.removeEventListener('did-navigate-in-page', reportTarget);
      onWebviewTargetChange(model.id, null);
    };
  }, [isDev, isElectron, model.id, model.url, onWebviewTargetChange, partition]);

  useEffect(() => {
    if (!isElectron) return undefined;

    const webview = webviewRef.current;
    if (!webview) return undefined;

    const handleConsoleMessage = (event: Event) => {
      const detail = event as Event & {
        level?: number;
        message?: string;
        line?: number;
        sourceId?: string;
      };

      console.log(`[webview:${model.name}] console-message`, {
        level: detail.level,
        message: detail.message,
        line: detail.line,
        sourceId: detail.sourceId,
      });
    };

    const handleDidFailLoad = (event: Event) => {
      const detail = event as Event & {
        errorCode?: number;
        errorDescription?: string;
        validatedURL?: string;
      };

      console.error(`[webview:${model.name}] did-fail-load`, {
        errorCode: detail.errorCode,
        errorDescription: detail.errorDescription,
        validatedURL: detail.validatedURL,
      });

      if (isDev) {
        setDiagnostic({
          tone: 'error',
          title: `加载失败 ${detail.errorCode ?? ''}`.trim(),
          detail: detail.errorDescription ?? detail.validatedURL,
          at: new Date().toLocaleTimeString(),
        });
      }
    };

    const handleRenderProcessGone = (event: Event) => {
      const detail = event as Event & {
        reason?: string;
        exitCode?: number;
      };

      console.error(`[webview:${model.name}] render-process-gone`, {
        reason: detail.reason,
        exitCode: detail.exitCode,
      });

      if (isDev) {
        setDiagnostic({
          tone: 'error',
          title: '页面进程退出',
          detail: [detail.reason, detail.exitCode].filter(Boolean).join(' / '),
          at: new Date().toLocaleTimeString(),
        });
      }
    };

    const handleIpcMessage = (event: Event) => {
      const detail = event as Event & {
        channel?: string;
        args?: unknown[];
      };

      if (detail.channel !== 'prompt-injection-result') return;
      const result = detail.args?.[0];
      const failed = result && typeof result === 'object' && 'ok' in result && result.ok === false;
      if (failed) {
        console.error(`[webview:${model.name}] prompt-injection-result`, result);
      } else {
        console.log(`[webview:${model.name}] prompt-injection-result`, result);
      }

      if (isDev) {
        setDiagnostic({
          tone: failed ? 'error' : 'success',
          title: formatPromptInjectionDiagnostic(result),
          detail: safeStringify(result),
          at: new Date().toLocaleTimeString(),
        });
      }
    };

    const handleDomReady = () => {
      webview.executeJavaScript(`(() => ({
        href: location.href,
        title: document.title,
        userAgent: navigator.userAgent,
        readyState: document.readyState,
      }))()`, true)
        .then((info) => {
          console.log(`[webview:${model.name}] dom-ready`, info);
          setDiagnostic({
            tone: 'info',
            title: '页面 DOM ready',
            detail: safeStringify(info),
            at: new Date().toLocaleTimeString(),
          });
        })
        .catch((error) => {
          console.error(`[webview:${model.name}] dom-ready executeJavaScript failed`, error);
        });
    };

    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('render-process-gone', handleRenderProcessGone);
    webview.addEventListener('ipc-message', handleIpcMessage);

    if (isDev) {
      webview.addEventListener('console-message', handleConsoleMessage);
      webview.addEventListener('dom-ready', handleDomReady);
    }

    return () => {
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      webview.removeEventListener('render-process-gone', handleRenderProcessGone);
      webview.removeEventListener('ipc-message', handleIpcMessage);

      if (isDev) {
        webview.removeEventListener('console-message', handleConsoleMessage);
        webview.removeEventListener('dom-ready', handleDomReady);
      }
    };
  }, [isDev, isElectron, model.name, partition]);

  const handleReload = () => {
    const webview = webviewRef.current as ReloadableElectronWebviewElement | null;
    if (!webview) return;

    if (model.id === 'gemini' && typeof webview.reloadIgnoringCache === 'function') {
      webview.reloadIgnoringCache();
      return;
    }

    webview.reload();
  };

  const handleOpenExternal = () => {
    if (window.electronAPI?.isElectron) {
      window.electronAPI.openExternal(model.url).catch((error) => {
        console.error(`Failed to open ${model.url} externally:`, error);
      });
      return;
    }

    window.open(model.url, '_blank', 'noopener,noreferrer');
  };

  const diagnosticToneClass = diagnostic?.tone === 'error'
    ? 'border-red-200 bg-red-50 text-red-800'
    : diagnostic?.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-slate-200 bg-white/95 text-slate-700';

  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Header */}
      <div className={`flex items-center justify-between px-2 py-1.5 text-white ${model.color} shrink-0`}>
        <div className="flex items-center space-x-1 overflow-hidden">
          <span className="font-semibold text-xs truncate">{model.name}</span>
          <select
            value={loginProfileId}
            onChange={(event) => {
              if (event.target.value === ADD_LOGIN_PROFILE_VALUE) {
                onLoginProfileAdd(model.id);
                return;
              }

              onLoginProfileChange(model.id, event.target.value as LoginProfileId);
            }}
            className="max-w-24 rounded border border-white/30 bg-black/15 px-1 py-0.5 text-[11px] text-white outline-none"
            title={`${model.name} 登录账号`}
          >
            {loginProfiles.map((profile) => (
              <option key={profile.id} value={profile.id} className="text-gray-900">
                {profile.label}
              </option>
            ))}
            <option value={ADD_LOGIN_PROFILE_VALUE} className="text-gray-900">
              + 添加账号
            </option>
          </select>
        </div>
        
        <div className="flex items-center space-x-0.5 shrink-0">
          {!isFirst && (
            <button className="p-1 hover:bg-white/20 rounded transition-colors" onClick={() => onMove(model.id, 'left')} title="Move Left">
              <ChevronLeft size={14} />
            </button>
          )}
          {!isLast && (
            <button className="p-1 hover:bg-white/20 rounded transition-colors" onClick={() => onMove(model.id, 'right')} title="Move Right">
              <ChevronRight size={14} />
            </button>
          )}
          <div className="w-px h-3 bg-white/30 mx-1"></div>
          <button className="p-1 hover:bg-white/20 rounded transition-colors disabled:opacity-40" onClick={handleReload} disabled={!isElectron} title="Reload">
            <RefreshCw size={12} />
          </button>
          <button className="p-1 hover:bg-white/20 rounded transition-colors" onClick={handleOpenExternal} title="Open in browser">
            <ExternalLink size={12} />
          </button>
          <button 
            className="p-1 hover:bg-red-500 rounded transition-colors ml-1" 
            onClick={() => onRemove(model.id)}
            title="Remove Pane"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white relative min-h-0">
        {isElectron && preloadPath ? (
          <webview
            key={`${model.id}-${partition}`}
            ref={webviewRef}
            src={model.url}
            partition={partition}
            preload={preloadPath}
            useragent={browserLikeUserAgent}
            webpreferences="contextIsolation=yes,nodeIntegration=no,sandbox=no"
            allowpopups={true}
            className="h-full w-full bg-white"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-500 overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2 shrink-0">
              <span className="text-xl font-bold text-gray-400">{model.name[0]}</span>
            </div>
            <p className="mb-1 font-medium text-gray-700 text-sm truncate w-full px-2">Electron &lt;webview&gt;</p>
            <p className="text-xs text-gray-400 truncate w-full px-2">
              <a href={model.url} className="text-blue-500 hover:underline">{model.url}</a>
            </p>
          </div>
        )}

        {isDev && diagnostic && (
          <div
            className={`pointer-events-none absolute left-2 bottom-2 z-20 max-w-[calc(100%-1rem)] rounded-md border px-2 py-1.5 text-[10px] shadow-lg ${diagnosticToneClass}`}
          >
            <div className="flex items-center gap-1 font-semibold leading-tight">
              <span className="truncate">{diagnostic.title}</span>
              <span className="shrink-0 opacity-60">{diagnostic.at}</span>
            </div>
            {diagnostic.detail && (
              <div className="mt-0.5 max-h-14 overflow-hidden break-all font-mono leading-tight opacity-80">
                {diagnostic.detail}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default AIPane;
