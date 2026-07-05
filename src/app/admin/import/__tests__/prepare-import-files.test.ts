import { describe, expect, it } from 'vitest';

import { prepareImportFiles } from '@/app/admin/import/prepare-import-files';

function createFile(
  content: string,
  name: string,
  relativePath?: string
): File {
  const file = new File([content], name, { type: 'text/plain' });
  Object.defineProperty(file, 'stream', {
    value: () =>
      new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(controller) {
          controller.enqueue(
            new Uint8Array(new TextEncoder().encode(content).buffer)
          );
          controller.close();
        },
      }),
  });

  if (relativePath) {
    Object.defineProperty(file, 'webkitRelativePath', {
      value: relativePath,
    });
  }

  return file;
}

async function decodeGzippedBase64(content: string): Promise<string> {
  const bytes = Uint8Array.from(atob(content), (char) => char.charCodeAt(0));
  const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes.buffer));
      controller.close();
    },
  });
  const decompressedStream = stream.pipeThrough(
    new DecompressionStream('gzip')
  );
  return new Response(decompressedStream).text();
}

describe('prepareImportFiles', () => {
  it('uses webkitRelativePath when available', async () => {
    const result = await prepareImportFiles([
      createFile('lok data', 'lok.txt', 'hoa1/lok.txt'),
    ]);

    expect(result[0]).toMatchObject({
      path: 'hoa1/lok.txt',
      name: 'lok.txt',
    });
    await expect(decodeGzippedBase64(result[0].content)).resolves.toBe(
      'lok data'
    );
  });

  it('falls back to file name when relative path is unavailable', async () => {
    const result = await prepareImportFiles([createFile('data', 'lok.txt')]);

    expect(result[0].path).toBe('lok.txt');
  });
});
