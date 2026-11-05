import { simpleParser } from 'mailparser';
import { SMTPServer } from 'smtp-server';

import { createMockLogger } from './logger';
import { addMail } from './mail-store';

const log = createMockLogger('mock:smtp');

/** Accepts plain SMTP without TLS or AUTH, which is how the app sends in E2E. */
export function startSmtpServer(port: number): Promise<SMTPServer> {
  const server = new SMTPServer({
    disabledCommands: ['STARTTLS', 'AUTH'],
    onData(stream, _session, callback) {
      simpleParser(stream)
        .then((parsed) => {
          const recipients = [parsed.to ?? []].flat();
          const mail = {
            to: recipients.flatMap((group) =>
              group.value.map((entry) => entry.address?.toLowerCase() ?? '')
            ),
            from: parsed.from?.text ?? '',
            subject: parsed.subject ?? '',
            html: typeof parsed.html === 'string' ? parsed.html : '',
            text: parsed.text ?? '',
            date: (parsed.date ?? new Date()).toISOString(),
          };
          addMail(mail);
          // Body and HTML stay out of the log; they are read through the API
          log.info(
            {
              to: mail.to,
              from: mail.from,
              subject: mail.subject,
              date: mail.date,
            },
            'mail captured'
          );
          callback();
        })
        .catch((error: Error) => {
          log.error({ err: error }, 'mail parse failed');
          callback(error);
        });
    },
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '0.0.0.0', () => resolve(server));
  });
}
