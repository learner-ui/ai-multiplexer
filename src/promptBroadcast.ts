import type { PromptTarget } from './electron';
import type { AIModel, PromptAttachment } from './types';

interface CreatePromptBroadcastBatchesOptions {
  activeModels: AIModel[];
  webviewTargetsByModel: Record<string, PromptTarget>;
  attachments: PromptAttachment[];
  skipAttachmentModelIds?: string[];
}

export interface PromptBroadcastBatch {
  targets: PromptTarget[];
  attachments: PromptAttachment[];
}

export function createPromptBroadcastBatches({
  activeModels,
  webviewTargetsByModel,
  attachments,
  skipAttachmentModelIds = [],
}: CreatePromptBroadcastBatchesOptions): PromptBroadcastBatch[] {
  const skipAttachmentModels = new Set(skipAttachmentModelIds);
  const targetsWithAttachments: PromptTarget[] = [];
  const targetsWithoutAttachments: PromptTarget[] = [];

  for (const model of activeModels) {
    if (model.supportsGlobalPrompt === false) continue;

    const target = webviewTargetsByModel[model.id] ?? { url: model.url };
    if (attachments.length > 0 && skipAttachmentModels.has(model.id)) {
      targetsWithoutAttachments.push(target);
    } else {
      targetsWithAttachments.push(target);
    }
  }

  return [
    ...(targetsWithAttachments.length > 0 ? [{
      targets: targetsWithAttachments,
      attachments,
    }] : []),
    ...(targetsWithoutAttachments.length > 0 ? [{
      targets: targetsWithoutAttachments,
      attachments: [],
    }] : []),
  ];
}
