import { createServer, type IncomingMessage, type ServerResponse } from 'http';

import {
  GOOGLE_PATH,
  HEALTH_PATH,
  MAIL_PATH,
  MOCK_HTTP_PORT,
  MOCK_SMTP_PORT,
  TURNSTILE_PATH,
} from './constants';
import {
  authorize,
  discoveryDocument,
  exchangeCode,
  type GoogleIdentity,
  jwks,
  setNextIdentity,
} from './google';
import { clearMail, listMail, startSmtpServer } from './mail';
import { verifyMockToken } from './turnstile';

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_FOUND = 302;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf-8');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function handleGoogle(
  req: IncomingMessage,
  res: ServerResponse,
  route: string,
  query: URLSearchParams
): Promise<void> {
  const issuer = `http://${req.headers.host}${GOOGLE_PATH}`;

  if (route === '/.well-known/openid-configuration') {
    return sendJson(res, HTTP_OK, discoveryDocument(issuer, GOOGLE_PATH));
  }
  if (route === '/jwks') return sendJson(res, HTTP_OK, jwks());
  if (route === '/identity' && req.method === 'POST') {
    setNextIdentity(JSON.parse(await readBody(req)) as GoogleIdentity);
    res.writeHead(HTTP_NO_CONTENT).end();
    return;
  }
  if (route === '/authorize') {
    const target = authorize(query);
    if (!target)
      return sendJson(res, HTTP_BAD_REQUEST, { error: 'no identity' });
    res.writeHead(HTTP_FOUND, { Location: target }).end();
    return;
  }
  if (route === '/token' && req.method === 'POST') {
    const form = new URLSearchParams(await readBody(req));
    const tokens = exchangeCode(form.get('code'), issuer);
    return sendJson(
      res,
      tokens ? HTTP_OK : HTTP_BAD_REQUEST,
      tokens ?? { error: 'invalid_grant' }
    );
  }
  sendJson(res, HTTP_NOT_FOUND, { error: 'not found' });
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://mock');
  const path = url.pathname;

  if (path === HEALTH_PATH) return sendJson(res, HTTP_OK, { ok: true });
  if (path === MAIL_PATH && req.method === 'DELETE') {
    clearMail(url.searchParams.get('to') ?? undefined);
    res.writeHead(HTTP_NO_CONTENT).end();
    return;
  }
  if (path === MAIL_PATH) {
    return sendJson(res, HTTP_OK, listMail(url.searchParams.get('to') ?? ''));
  }
  if (path === `${TURNSTILE_PATH}/siteverify` && req.method === 'POST') {
    const form = new URLSearchParams(await readBody(req));
    return sendJson(res, HTTP_OK, verifyMockToken(form.get('response')));
  }
  if (path.startsWith(`${GOOGLE_PATH}/`)) {
    return handleGoogle(
      req,
      res,
      path.slice(GOOGLE_PATH.length),
      url.searchParams
    );
  }
  sendJson(res, HTTP_NOT_FOUND, { error: 'not found' });
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
