const crypto = require('node:crypto');
const path = require('node:path');
const { access, mkdir, writeFile } = require('node:fs/promises');

const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

function getAttachmentBytes(attachment) {
  const data = attachment?.data;

  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }
  if (Array.isArray(data)) return Buffer.from(data);

  return Buffer.from([]);
}

function sanitizeFileName(fileName, fallbackName) {
  const baseName = path.basename(String(fileName || fallbackName || 'attachment'));
  const sanitized = baseName.replace(INVALID_FILE_NAME_CHARS, '_').trim();
  return sanitized || fallbackName || 'attachment';
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getAvailableFilePath(stagingDir, fileName, usedNames) {
  const extension = path.extname(fileName);
  const stem = extension ? fileName.slice(0, -extension.length) : fileName;
  let index = 1;
  let candidate = fileName;

  while (usedNames.has(candidate) || await fileExists(path.join(stagingDir, candidate))) {
    index += 1;
    candidate = `${stem}-${index}${extension}`;
  }

  usedNames.add(candidate);
  return path.join(stagingDir, candidate);
}

async function stagePromptAttachments(attachments, options = {}) {
  const baseDir = options.baseDir || process.env.TMPDIR || '/tmp';
  const folderName = options.folderName || `${Date.now()}-${crypto.randomUUID()}`;
  const stagingDir = path.join(baseDir, 'ai-multiplexer-attachment-staging', folderName);
  const usedNames = new Set();

  await mkdir(stagingDir, { recursive: true });

  const stagedAttachments = [];

  for (const [index, attachment] of attachments.entries()) {
    const safeName = sanitizeFileName(attachment.name, `attachment-${index + 1}`);
    const stagedPath = await getAvailableFilePath(stagingDir, safeName, usedNames);

    await writeFile(stagedPath, getAttachmentBytes(attachment));

    stagedAttachments.push({
      ...attachment,
      path: stagedPath,
    });
  }

  return stagedAttachments;
}

module.exports = {
  sanitizeFileName,
  stagePromptAttachments,
};
