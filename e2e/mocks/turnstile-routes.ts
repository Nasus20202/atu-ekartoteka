import {
  HTTP_OK,
  notFound,
  readBody,
  type RouteContext,
  sendJson,
} from './http';
import { verifyMockToken } from './turnstile';

export async function handleTurnstile({
  req,
  res,
  route,
}: RouteContext): Promise<void> {
  if (route === '/siteverify' && req.method === 'POST') {
    const form = new URLSearchParams(await readBody(req));
    return sendJson(res, HTTP_OK, verifyMockToken(form.get('response')));
  }
  notFound(res);
}
