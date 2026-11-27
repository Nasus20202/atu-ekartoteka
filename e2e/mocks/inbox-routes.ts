import { readFile } from 'fs/promises';
import type { IncomingMessage, ServerResponse } from 'http';

import { INBOX_PATH } from './constants';
import { HTTP_FOUND, HTTP_OK } from './http';

const ROOT_PATH = '/';
const CONTENT_TYPES = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
} as const;

interface InboxFile {
  file: URL;
  contentType: string;
}

function inboxFile(name: string, contentType: string): InboxFile {
  return { file: new URL(`./inbox/${name}`, import.meta.url), contentType };
}

const INBOX_FILES = new Map<string, InboxFile>([
  [INBOX_PATH, inboxFile('index.html', CONTENT_TYPES.html)],
  [`${INBOX_PATH}/inbox.js`, inboxFile('inbox.js', CONTENT_TYPES.js)],
  [`${INBOX_PATH}/inbox.css`, inboxFile('inbox.css', CONTENT_TYPES.css)],
]);

/** Serves the mail browser. Returns false when the path is not one of its routes. */
export async function handleInboxRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> {
  if (req.method !== 'GET') return false;

  if (pathname === ROOT_PATH) {
    res.writeHead(HTTP_FOUND, { Location: INBOX_PATH }).end();
    return true;
  }

  const entry = INBOX_FILES.get(pathname);
  if (!entry) return false;

  const body = await readFile(entry.file);
  res.writeHead(HTTP_OK, { 'Content-Type': entry.contentType }).end(body);
  return true;
}
