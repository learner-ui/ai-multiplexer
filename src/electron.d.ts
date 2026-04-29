import type { PromptAttachment } from './types';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

export interface BroadcastPromptResult {
  sent: number;
}

export interface NewChatTarget {
  matchUrl: string;
  newChatUrl: string;
  webContentsId?: number;
}

export interface PromptTarget {
  url: string;
  webContentsId?: number;
}

export interface BroadcastNewChatResult {
  sent: number;
}

export interface StageAttachmentsResult {
  attachments: PromptAttachment[];
}

export interface ElectronAPI {
  isElectron: true;
  getWebviewPreloadPath: () => string;
  getPathForFile: (file: File) => string;
  broadcastPrompt: (
    message: string,
    targets?: PromptTarget[],
    attachments?: PromptAttachment[],
  ) => Promise<BroadcastPromptResult>;
  broadcastNewChat: (targets: NewChatTarget[]) => Promise<BroadcastNewChatResult>;
  openExternal: (url: string) => Promise<void>;
  stageAttachments: (
    attachments: PromptAttachment[],
    baseDir?: string,
  ) => Promise<PromptAttachment[]>;
  selectAttachmentFolder: () => Promise<string | null>;
  showItemInFolder: (path: string) => Promise<void>;
  startFileDrag: (paths: string[]) => void;
}

export interface ElectronWebviewElement extends HTMLElement {
  reload: () => void;
  getURL: () => string;
  getWebContentsId: () => number;
}

type WebviewProps = DetailedHTMLProps<HTMLAttributes<ElectronWebviewElement>, ElectronWebviewElement> & {
  allowpopups?: string | boolean;
  partition?: string;
  preload?: string;
  src?: string;
  useragent?: string;
  webpreferences?: string;
};

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }

  interface ElectronWebviewElement extends HTMLElement {
    reload: () => void;
    getURL: () => string;
    getWebContentsId: () => number;
    executeJavaScript: <T = unknown>(code: string, userGesture?: boolean) => Promise<T>;
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: WebviewProps;
    }
  }
}
