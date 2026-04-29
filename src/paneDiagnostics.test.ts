import { describe, expect, it } from 'vitest';
import { formatPromptInjectionDiagnostic } from './paneDiagnostics';

describe('pane diagnostics', () => {
  it('summarizes a successful prompt injection with attachment details', () => {
    expect(formatPromptInjectionDiagnostic({
      ok: true,
      provider: 'gemini',
      attachments: {
        uploaded: 1,
        method: 'native-file-input',
        ready: true,
      },
    })).toBe('gemini 成功；附件 1 个；方式 native-file-input；已就绪');
  });

  it('summarizes a failed attachment injection reason', () => {
    expect(formatPromptInjectionDiagnostic({
      ok: false,
      provider: 'gemini',
      reason: 'attachment-upload-failed',
      attachments: {
        uploaded: 0,
        reason: 'attachment-upload-unconfirmed',
      },
    })).toBe('gemini 失败：attachment-upload-failed；附件未确认：attachment-upload-unconfirmed');
  });
});
