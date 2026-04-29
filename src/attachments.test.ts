import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_ATTACHMENT_EXTENSIONS,
  createAttachmentPayloads,
  MAX_ATTACHMENT_COUNT,
  MAX_ATTACHMENT_SIZE_BYTES,
} from './attachments';

function makeFile(name: string, type: string, size = 4) {
  return new File([new Uint8Array(size)], name, { type });
}

describe('attachment payloads', () => {
  it('accepts images, PDFs, docx, txt, and csv files', async () => {
    const files = [
      makeFile('screen.png', 'image/png'),
      makeFile('brief.pdf', 'application/pdf'),
      makeFile('notes.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      makeFile('readme.txt', 'text/plain'),
      makeFile('data.csv', 'text/csv'),
    ];

    const result = await createAttachmentPayloads(files);

    expect(result.attachments.map((attachment) => attachment.name)).toEqual([
      'screen.png',
      'brief.pdf',
      'notes.docx',
      'readme.txt',
      'data.csv',
    ]);
    expect(result.rejected).toEqual([]);
  });

  it('rejects unsupported types, oversized files, and files above the count limit', async () => {
    const files = [
      makeFile('malware.exe', 'application/octet-stream'),
      makeFile('huge.pdf', 'application/pdf', MAX_ATTACHMENT_SIZE_BYTES + 1),
      ...Array.from({ length: MAX_ATTACHMENT_COUNT + 1 }, (_, index) =>
        makeFile(`image-${index}.png`, 'image/png'),
      ),
    ];

    const result = await createAttachmentPayloads(files);

    expect(result.attachments).toHaveLength(MAX_ATTACHMENT_COUNT);
    expect(result.rejected.map((item) => item.reason)).toEqual(
      expect.arrayContaining(['unsupported-type', 'too-large', 'too-many']),
    );
  });

  it('exports the file picker accept list', () => {
    expect(ACCEPTED_ATTACHMENT_EXTENSIONS).toContain('.docx');
    expect(ACCEPTED_ATTACHMENT_EXTENSIONS).toContain('.csv');
  });

  it('keeps the native Electron file path when one is available', async () => {
    const file = makeFile('paper.pdf', 'application/pdf');

    const result = await createAttachmentPayloads([
      file,
    ], () => '/Users/learner/Documents/paper.pdf');

    expect(result.attachments[0]).toMatchObject({
      name: 'paper.pdf',
      path: '/Users/learner/Documents/paper.pdf',
    });
  });
});
