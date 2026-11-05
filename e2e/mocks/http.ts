import type { IncomingMessage, ServerResponse } from 'http';

export const HTTP_OK = 200;
export const HTTP_NO_CONTENT = 204;
export const HTTP_FOUND = 302;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_NOT_FOUND = 404;
export const HTTP_SERVER_ERROR = 500;

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  /** Path below the route prefix, e.g. `/token` */
  route: string;
  query: URLSearchParams;
}

export async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf-8');
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown
): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function notFound(res: ServerResponse): void {
  sendJson(res, HTTP_NOT_FOUND, { error: 'not found' });
}
