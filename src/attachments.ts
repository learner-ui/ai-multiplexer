import type { PromptAttachment, RejectedAttachment } from './types';

export const MAX_ATTACHMENT_COUNT = 5;
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

export const ACCEPTED_ATTACHMENT_EXTENSIONS = [
  'image/*',
  '.pdf',
  '.docx',
  '.txt',
  '.csv',
] as const;

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
]);

const ACCEPTED_FILE_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.csv']);

type FilePathResolver = (file: File) => string | undefined;

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index).toLowerCase() : '';
}

export function isSupportedAttachment(file: File) {
  if (file.type.startsWith('image/')) return true;
  if (ACCEPTED_MIME_TYPES.has(file.type)) return true;

  return ACCEPTED_FILE_EXTENSIONS.has(getExtension(file.name));
}

export async function createAttachmentPayloads(files: File[], getPathForFile?: FilePathResolver) {
  const attachments: PromptAttachment[] = [];
  const rejected: RejectedAttachment[] = [];

  for (const file of files) {
    if (!isSupportedAttachment(file)) {
      rejected.push({ name: file.name, reason: 'unsupported-type' });
      continue;
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      rejected.push({ name: file.name, reason: 'too-large' });
      continue;
    }

    if (attachments.length >= MAX_ATTACHMENT_COUNT) {
      rejected.push({ name: file.name, reason: 'too-many' });
      continue;
    }

    try {
      const filePath = getPathForFile?.(file);
      attachments.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: await file.arrayBuffer(),
        ...(filePath ? { path: filePath } : {}),
      });
    } catch {
      rejected.push({ name: file.name, reason: 'read-failed' });
    }
  }

  return { attachments, rejected };
}
