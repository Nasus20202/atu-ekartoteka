import { createServer, type IncomingMessage, type ServerResponse } from 'http';

import {
  GOOGLE_PATH,
  HEALTH_PATH,
  MAIL_PATH,
  MOCK_HTTP_PORT,
  MOCK_SMTP_PORT,
  TURNSTILE_PATH,
} from './constants';
import { handleGoogle } from './google-routes';
import {
  HTTP_BAD_REQUEST,
  HTTP_OK,
  HTTP_SERVER_ERROR,
  notFound,
  type RouteContext,
  sendJson,
} from './http';
import { createMockLogger } from './logger';
import { handleMail } from './mail-routes';
import { startSmtpServer } from './smtp';
import { handleTurnstile } from './turnstile-routes';

const log = createMockLogger('mock:http');

const PREFIXED_ROUTES: [string, (ctx: RouteContext) => unknown][] = [
  [GOOGLE_PATH, handleGoogle],
  [TURNSTILE_PATH, handleTurnstile],
];

type RequestLevel = 'debug' | 'info' | 'warn' | 'error';

/** Health probes run every few seconds, so they stay at debug level. */
function requestLevel(path: string, status: number): RequestLevel {
  if (status >= HTTP_SERVER_ERROR) return 'error';
  if (status >= HTTP_BAD_REQUEST) return 'warn';
  return path === HEALTH_PATH ? 'debug' : 'info';
}

function logRequest(req: IncomingMessage, res: ServerResponse): void {
  const startedAt = Date.now();
  const path = new URL(req.url ?? '/', 'http://mock').pathname;
  res.on('finish', () => {
    const fields = {
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    };
    log[requestLevel(path, res.statusCode)](fields, 'request');
  });
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://mock');
  const { pathname, searchParams: query } = url;
  const context = (prefix: string): RouteContext => ({
    req,
    res,
    route: pathname.slice(prefix.length),
    query,
  });

  if (pathname === HEALTH_PATH) return sendJson(res, HTTP_OK, { ok: true });
  if (pathname === MAIL_PATH) return handleMail(context(MAIL_PATH));

  for (const [prefix, handler] of PREFIXED_ROUTES) {
    if (pathname.startsWith(`${prefix}/`)) {
      await handler(context(prefix));
      return;
    }
  }
  notFound(res);
}

export async function startMockServer() {
  const smtp = await startSmtpServer(MOCK_SMTP_PORT);
  const http = createServer((req, res) => {
    logRequest(req, res);
    handle(req, res).catch((error: unknown) => {
      log.error({ err: error }, 'request failed');
      sendJson(res, HTTP_SERVER_ERROR, { error: String(error) });
    });
  });
  await new Promise<void>((resolve) =>
    http.listen(MOCK_HTTP_PORT, '0.0.0.0', resolve)
  );
  log.info(
    { httpPort: MOCK_HTTP_PORT, smtpPort: MOCK_SMTP_PORT },
    'E2E mocks ready'
  );
  return {
    close: () =>
      new Promise<void>((resolve) => {
        smtp.close();
        http.close(() => resolve());
      }),
  };
}
