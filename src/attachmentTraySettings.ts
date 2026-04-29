export const ATTACHMENT_TRAY_FOLDER_STORAGE_KEY = 'ai-multiplexer.attachmentTrayFolder.v1';

function getStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  const targetStorage = window.localStorage;
  if (
    !targetStorage ||
    typeof targetStorage.getItem !== 'function' ||
    typeof targetStorage.setItem !== 'function'
  ) {
    return null;
  }

  return targetStorage;
}

export function loadAttachmentTrayFolder(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return '';

  try {
    const rawValue = targetStorage.getItem(ATTACHMENT_TRAY_FOLDER_STORAGE_KEY);
    if (!rawValue) return '';

    const parsed = JSON.parse(rawValue);
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    return '';
  }
}

export function saveAttachmentTrayFolder(
  folderPath: string,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return;

  targetStorage.setItem(ATTACHMENT_TRAY_FOLDER_STORAGE_KEY, JSON.stringify(folderPath));
}
