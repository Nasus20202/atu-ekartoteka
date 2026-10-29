const TEXT_MIME_TYPE = 'text/plain';

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(content: string, fileName: string): void {
  downloadBlob(new Blob([content], { type: TEXT_MIME_TYPE }), fileName);
}
