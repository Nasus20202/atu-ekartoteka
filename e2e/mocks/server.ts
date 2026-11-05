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
  HTTP_OK,
  HTTP_SERVER_ERROR,
  notFound,
  type RouteContext,
  sendJson,
} from './http';
import { handleMail } from './mail-routes';
import { startSmtpServer } from './smtp';
import { handleTurnstile } from './turnstile-routes';

const PREFIXED_ROUTES: [string, (ctx: RouteContext) => unknown][] = [
  [GOOGLE_PATH, handleGoogle],
  [TURNSTILE_PATH, handleTurnstile],
];

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
    handle(req, res).catch((error: unknown) => {
      sendJson(res, HTTP_SERVER_ERROR, { error: String(error) });
    });
  });
  await new Promise<void>((resolve) =>
    http.listen(MOCK_HTTP_PORT, '0.0.0.0', resolve)
  );
  console.log(
    `E2E mocks ready: http ${MOCK_HTTP_PORT}, smtp ${MOCK_SMTP_PORT}`
  );
  return {
    close: () =>
      new Promise<void>((resolve) => {
        smtp.close();
        http.close(() => resolve());
      }),
  };
}
