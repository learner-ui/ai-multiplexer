export interface AIModel {
  id: string;
  name: string;
  url: string;
  color: string;
  custom?: boolean;
  supportsGlobalPrompt?: boolean;
  newChatUrl?: string;
}

export interface PromptAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  path?: string;
}

export interface GlobalSendOptions {
  skipAttachmentModelIds?: string[];
}

export interface RejectedAttachment {
  name: string;
  reason: 'too-large' | 'too-many' | 'unsupported-type' | 'read-failed';
}

export const AVAILABLE_MODELS: AIModel[] = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', color: 'bg-emerald-600', newChatUrl: 'https://chatgpt.com/' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-blue-600', newChatUrl: 'https://gemini.google.com/app' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai', color: 'bg-amber-600', newChatUrl: 'https://claude.ai/new' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', color: 'bg-slate-700', newChatUrl: 'https://chat.deepseek.com/' },
  { id: 'copilot', name: 'Copilot', url: 'https://copilot.microsoft.com', color: 'bg-purple-600', newChatUrl: 'https://copilot.microsoft.com/' },
  { id: 'doubao', name: '豆包', url: 'https://www.doubao.com/chat/', color: 'bg-orange-600', newChatUrl: 'https://www.doubao.com/chat/' },
  { id: 'grok', name: 'Grok', url: 'https://grok.com/', color: 'bg-cyan-600', newChatUrl: 'https://grok.com/' },
  { id: 'qwen', name: 'Qwen', url: 'https://chat.qwen.ai/', color: 'bg-teal-600', newChatUrl: 'https://chat.qwen.ai/' },
  { id: 'metaso', name: '秘塔', url: 'https://metaso.cn/', color: 'bg-sky-600', newChatUrl: 'https://metaso.cn/' },
  { id: 'yuanbao', name: '元宝', url: 'https://yuanbao.tencent.com/chat/naQivTmsDa', color: 'bg-red-600', newChatUrl: 'https://yuanbao.tencent.com/chat/naQivTmsDa' },
  { id: 'kimi', name: 'Kimi', url: 'https://www.kimi.com/', color: 'bg-neutral-700', newChatUrl: 'https://www.kimi.com/' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', color: 'bg-cyan-700', newChatUrl: 'https://www.perplexity.ai/' },
];
