import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

  it('copies attachments into a temporary tray folder and returns staged paths', async () => {
    const baseDir = await makeTempDir();
    const [attachment] = await stagePromptAttachments([makeAttachment('paper:name.pdf')], {
      baseDir,
      folderName: 'test-tray',
    });

    expect(attachment.path).toContain('test-tray');
    expect(attachment.path).toMatch(/paper_name\.pdf$/);
    expect(attachment.originalPath).toBe('/Users/example/Documents/paper:name.pdf');
    await expect(readFile(attachment.path, 'utf8')).resolves.toBe('hello temporary tray');
  });

  it('can copy attachments directly into a user-managed tray folder', async () => {
    const baseDir = await makeTempDir();
    const [attachment] = await stagePromptAttachments([makeAttachment('paper.pdf')], {
      baseDir,
      useBatchFolder: false,
    });

    expect(attachment.path).toBe(join(baseDir, 'paper.pdf'));
    await expect(readFile(attachment.path, 'utf8')).resolves.toBe('hello temporary tray');
  });

  it('does not overwrite existing files in a user-managed tray folder', async () => {
    const baseDir = await makeTempDir();
    await writeFile(join(baseDir, 'paper.pdf'), 'existing file');

    const [attachment] = await stagePromptAttachments([makeAttachment('paper.pdf')], {
      baseDir,
      useBatchFolder: false,
    });

    expect(attachment.path).toBe(join(baseDir, 'paper-2.pdf'));
    await expect(readFile(join(baseDir, 'paper.pdf'), 'utf8')).resolves.toBe('existing file');
    await expect(readFile(attachment.path, 'utf8')).resolves.toBe('hello temporary tray');
  });
});
