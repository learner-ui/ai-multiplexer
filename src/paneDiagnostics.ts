type PlainRecord = Record<string, unknown>;

function isPlainRecord(value: unknown): value is PlainRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function formatPromptInjectionDiagnostic(result: unknown) {
  if (!isPlainRecord(result)) return '未知结果';

  const provider = readString(result.provider) ?? 'unknown';
  const status = result.ok === false
    ? `失败：${readString(result.reason) ?? 'unknown'}`
    : '成功';
  const parts = [`${provider} ${status}`];

  if (isPlainRecord(result.attachments)) {
    const uploaded = readNumber(result.attachments.uploaded);
    const method = readString(result.attachments.method);
    const reason = readString(result.attachments.reason);

    if (uploaded && uploaded > 0) {
      parts.push(`附件 ${uploaded} 个`);
      if (method) parts.push(`方式 ${method}`);
      if (result.attachments.ready === true) parts.push('已就绪');
    } else if (reason) {
      parts.push(`附件未确认：${reason}`);
    }
  }

  return parts.join('；');
}
