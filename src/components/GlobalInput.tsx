import React, { useRef, useState } from 'react';
import { FileText, FolderCog, FolderOpen, MessageSquarePlus, Paperclip, Send, X } from 'lucide-react';
import {
  ACCEPTED_ATTACHMENT_EXTENSIONS,
  createAttachmentPayloads,
  MAX_ATTACHMENT_COUNT,
} from '../attachments';
import {
  loadAttachmentTrayFolder,
  saveAttachmentTrayFolder,
} from '../attachmentTraySettings';
import type { GlobalSendOptions, PromptAttachment, RejectedAttachment } from '../types';

const MANUAL_ATTACHMENT_MODEL_IDS = ['gemini'];

interface GlobalInputProps {
  onSend: (message: string, attachments: PromptAttachment[], options?: GlobalSendOptions) => void;
  onNewChat: () => void;
  activeCount: number;
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getRejectedMessage(rejected: RejectedAttachment[]) {
  if (rejected.length === 0) return '';

  const labels = {
    'read-failed': '读取失败',
    'too-large': '超过 25MB',
    'too-many': `最多 ${MAX_ATTACHMENT_COUNT} 个`,
    'unsupported-type': '类型不支持',
  };

  return rejected.map((item) => `${item.name}: ${labels[item.reason]}`).join('；');
}

const GlobalInput: React.FC<GlobalInputProps> = ({ onSend, onNewChat, activeCount }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isNewChatConfirmOpen, setIsNewChatConfirmOpen] = useState(false);
  const [attachmentTrayFolder, setAttachmentTrayFolder] = useState(() => loadAttachmentTrayFolder());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasMessage = Boolean(message.trim());
  const canSend = (hasMessage || attachments.length > 0) && activeCount > 0;
  const canNewChat = activeCount > 0;

  const handleNewChatClick = () => {
    if (!canNewChat) return;
    setIsNewChatConfirmOpen(true);
  };

  const handleConfirmNewChat = () => {
    setIsNewChatConfirmOpen(false);
    onNewChat();
  };

  const stageAttachmentsForTray = async (items: PromptAttachment[]) => {
    if (items.length === 0 || !window.electronAPI?.stageAttachments) return items;

    try {
      return await window.electronAPI.stageAttachments(
        items,
        attachmentTrayFolder || undefined,
      );
    } catch (error) {
      console.warn('Failed to stage attachments for tray:', error);
      return items;
    }
  };

  const handleChooseAttachmentFolder = async () => {
    if (!window.electronAPI?.selectAttachmentFolder) return;

    const folderPath = await window.electronAPI.selectAttachmentFolder();
    if (!folderPath) return;

    saveAttachmentTrayFolder(folderPath);
    setAttachmentTrayFolder(folderPath);
  };

  const addFiles = async (files: File[]) => {
    setAttachmentError('');

    const remainingSlots = MAX_ATTACHMENT_COUNT - attachments.length;
    const filesToRead = files.slice(0, Math.max(remainingSlots, 0));
    const rejectedOverflow = files.slice(Math.max(remainingSlots, 0)).map((file) => ({
      name: file.name,
      reason: 'too-many' as const,
    }));

    const result = await createAttachmentPayloads(filesToRead, window.electronAPI?.getPathForFile);
    const stagedAttachments = await stageAttachmentsForTray(result.attachments);
    setAttachments([...attachments, ...stagedAttachments]);
    setAttachmentError(getRejectedMessage([...result.rejected, ...rejectedOverflow]));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    void addFiles(files);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(Array.from(event.dataTransfer.files));
  };

  const handleAttachmentDragStart = (
    event: React.DragEvent<HTMLElement>,
    attachment: PromptAttachment,
  ) => {
    if (!attachment.path || !window.electronAPI?.startFileDrag) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', attachment.name);
    window.electronAPI.startFileDrag([attachment.path]);
  };

  const handleRevealAttachment = (
    event: React.MouseEvent<HTMLButtonElement>,
    attachment: PromptAttachment,
  ) => {
    event.stopPropagation();
    if (!attachment.path || !window.electronAPI?.showItemInFolder) return;
    void window.electronAPI.showItemInFolder(attachment.path);
  };

  const removeAttachment = (attachment: PromptAttachment) => {
    setAttachments(attachments.filter((item) => item.id !== attachment.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) {
      onSend(message, attachments, {
        skipAttachmentModelIds: attachments.length > 0 ? MANUAL_ATTACHMENT_MODEL_IDS : [],
      });
      setMessage('');
      setAttachments([]);
      setAttachmentError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div
      className={`bg-white border-t p-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-10 transition-colors ${
        isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="max-w-5xl mx-auto flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex-1 flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_ATTACHMENT_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= MAX_ATTACHMENT_COUNT}
            className="h-10 w-10 shrink-0 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            title="Attach files"
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            data-testid="attachment-folder-button"
            onClick={handleChooseAttachmentFolder}
            disabled={!window.electronAPI?.selectAttachmentFolder}
            className={`h-10 w-10 shrink-0 rounded-lg border transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
              attachmentTrayFolder
                ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            title={
              attachmentTrayFolder
                ? `更换聊天文件夹：${attachmentTrayFolder}`
                : '选择聊天文件夹（保存上传到聊天的文件）'
            }
          >
            <FolderCog size={16} />
          </button>
          <div className="flex-1 min-w-0">
            {(attachments.length > 0 || attachmentError) && (
              <div className="mb-1 flex flex-wrap gap-1.5">
                {attachments.map((attachment) => (
                  <span
                    key={attachment.id}
                    data-testid="attachment-tray-item"
                    draggable={Boolean(attachment.path)}
                    onDragStart={(event) => handleAttachmentDragStart(event, attachment)}
                    className={`inline-flex max-w-[220px] items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 ${
                      attachment.path ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                    title={
                      attachment.path
                        ? `${attachment.name} (${formatBytes(attachment.size)}) - 已存入聊天文件夹`
                        : `${attachment.name} (${formatBytes(attachment.size)})`
                    }
                  >
                    <FileText size={13} className="shrink-0" />
                    <span className="truncate">{attachment.name}</span>
                    <span className="shrink-0 text-gray-400">{formatBytes(attachment.size)}</span>
                    {attachment.path && window.electronAPI?.showItemInFolder && (
                      <button
                        type="button"
                        data-testid="attachment-reveal-button"
                        draggable={false}
                        onClick={(event) => handleRevealAttachment(event, attachment)}
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                        title={`在聊天文件夹中显示 ${attachment.name}`}
                      >
                        <FolderOpen size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      draggable={false}
                      onClick={() => removeAttachment(attachment)}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                      title={`Remove ${attachment.name}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {attachmentError && (
                  <span className="text-xs text-red-600">{attachmentError}</span>
                )}
              </div>
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${activeCount} AI models simultaneously... (Shift+Enter for new line)`}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[120px] text-sm transition-all block"
              rows={1}
              style={{
                height: message ? 'auto' : '40px',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleNewChatClick}
            disabled={!canNewChat}
            className={`h-10 w-10 shrink-0 rounded-lg border flex items-center justify-center transition-colors ${
              canNewChat
                ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
            title="为所有打开的模型同时开启新对话"
          >
            <MessageSquarePlus size={17} />
          </button>
          <button
            type="submit"
            disabled={!canSend}
            className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
              canSend
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Send to all active AIs"
          >
            <Send size={17} />
          </button>
        </form>
      </div>

      {isNewChatConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">开启全部新对话</h2>
              <button
                type="button"
                onClick={() => setIsNewChatConfirmOpen(false)}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-4 text-sm text-gray-700 space-y-2">
              <p>将为当前打开的 <span className="font-semibold">{activeCount}</span> 个 AI 模型同时开启新对话。</p>
              <p className="text-xs text-gray-500">每个模型当前的会话页会被替换为新对话窗口，登录状态会保留。</p>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setIsNewChatConfirmOpen(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmNewChat}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                确认开启
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalInput;
