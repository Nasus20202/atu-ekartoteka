export interface PreparedImportFile {
  path: string;
  content: string;
  name: string;
}

function getFilePath(file: File): string {
  return (
    (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
    file.name
  );
}

async function gzipToBase64(file: File): Promise<string> {
  const stream = file.stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const compressedBlob = await new Response(compressedStream).blob();
  const compressedBuffer = await compressedBlob.arrayBuffer();

  return btoa(
    new Uint8Array(compressedBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );
}

export async function prepareImportFiles(
  files: Iterable<File>
): Promise<PreparedImportFile[]> {
  const fileData: PreparedImportFile[] = [];

  for (const file of files) {
    fileData.push({
      path: getFilePath(file),
      name: file.name,
      content: await gzipToBase64(file),
    });
  }

  return fileData;
}
