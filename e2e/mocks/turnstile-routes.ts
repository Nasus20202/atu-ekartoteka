import {
  HTTP_OK,
  notFound,
  readBody,
  type RouteContext,
  sendJson,
} from './http';
import { createMockLogger } from './logger';
import { verifyMockToken } from './turnstile';

const log = createMockLogger('mock:turnstile');

export async function handleTurnstile({
  req,
  res,
  route,
}: RouteContext): Promise<void> {
  if (route === '/siteverify' && req.method === 'POST') {
    const form = new URLSearchParams(await readBody(req));
    const result = verifyMockToken(form.get('response'));
    // The token is deliberately left out of the log line
    if (result.success) {
      log.info({ success: true }, 'siteverify');
    } else {
      log.warn(
        { success: false, errorCodes: result['error-codes'] },
        'siteverify'
      );
    }
    return sendJson(res, HTTP_OK, result);
  }
  notFound(res);
}
