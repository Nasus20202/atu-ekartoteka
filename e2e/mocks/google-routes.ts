import { GOOGLE_PATH } from './constants';
import {
  authorize,
  discoveryDocument,
  exchangeCode,
  type GoogleIdentity,
  jwks,
  setNextIdentity,
} from './google';
import {
  HTTP_BAD_REQUEST,
  HTTP_FOUND,
  HTTP_NO_CONTENT,
  HTTP_OK,
  notFound,
  readBody,
  type RouteContext,
  sendJson,
} from './http';

export async function handleGoogle({
  req,
  res,
  route,
  query,
}: RouteContext): Promise<void> {
  // The issuer follows the host the caller used, so it matches inside Docker
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
    if (!target) {
      return sendJson(res, HTTP_BAD_REQUEST, { error: 'no identity' });
    }
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

  notFound(res);
}
