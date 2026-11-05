import { HTTP_NO_CONTENT, HTTP_OK, type RouteContext, sendJson } from './http';
import { clearMail, listMail } from './mail-store';

export function handleMail({ req, res, query }: RouteContext): void {
  const to = query.get('to') ?? undefined;

  if (req.method === 'DELETE') {
    clearMail(to);
    res.writeHead(HTTP_NO_CONTENT).end();
    return;
  }
  sendJson(res, HTTP_OK, listMail(to));
}
