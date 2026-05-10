import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import stagingModule from './attachmentStaging.cjs';

const { stagePromptAttachments } = stagingModule;
const tempDirs: string[] = [];

async function makeTempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'ai-multiplexer-staging-test-'));
  tempDirs.push(dir);
  return dir;
}

function makeAttachment(name = 'paper.pdf') {
  const data = Buffer.from('hello temporary tray');
  return {
    id: name,
    name,
    type: 'application/pdf',
    size: data.byteLength,
    data,
    path: `/Users/example/Documents/${name}`,
  };
}

describe('attachment staging', () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('copies attachments into a staging folder and returns staged paths', async () => {
    const baseDir = await makeTempDir();
    const [attachment] = await stagePromptAttachments([makeAttachment('paper:name.pdf')], {
      baseDir,
      folderName: 'test-batch',
    });

    expect(attachment.path).toContain(join('ai-multiplexer-attachment-staging', 'test-batch'));
    expect(attachment.path).toMatch(/paper_name\.pdf$/);
    await expect(readFile(attachment.path, 'utf8')).resolves.toBe('hello temporary tray');
  });

  it('stages duplicates side by side without overwriting', async () => {
    const baseDir = await makeTempDir();
    const staged = await stagePromptAttachments(
      [makeAttachment('paper.pdf'), makeAttachment('paper.pdf')],
      { baseDir, folderName: 'duplicates' },
    );

    expect(staged).toHaveLength(2);
    expect(staged[0].path).toMatch(/paper\.pdf$/);
    expect(staged[1].path).toMatch(/paper-2\.pdf$/);
    await expect(readFile(staged[0].path, 'utf8')).resolves.toBe('hello temporary tray');
    await expect(readFile(staged[1].path, 'utf8')).resolves.toBe('hello temporary tray');
  });
});
