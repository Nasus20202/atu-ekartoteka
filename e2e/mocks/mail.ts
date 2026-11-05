import { simpleParser } from 'mailparser';
import { SMTPServer } from 'smtp-server';

export interface CapturedMail {
  to: string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  date: string;
}

const messages: CapturedMail[] = [];

export function listMail(to?: string): CapturedMail[] {
  const wanted = to?.trim().toLowerCase();
  return messages
    .filter((message) => !wanted || message.to.includes(wanted))
    .reverse();
}

export function clearMail(to?: string): void {
  const wanted = to?.trim().toLowerCase();
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!wanted || messages[i].to.includes(wanted)) messages.splice(i, 1);
  }
}

export function startSmtpServer(port: number): Promise<SMTPServer> {
  const server = new SMTPServer({
    disabledCommands: ['STARTTLS', 'AUTH'],
    onData(stream, _session, callback) {
      simpleParser(stream)
        .then((parsed) => {
          const recipients = [parsed.to ?? []].flat();
          messages.push({
            to: recipients.flatMap((group) =>
              group.value.map((entry) => entry.address?.toLowerCase() ?? '')
            ),
            from: parsed.from?.text ?? '',
            subject: parsed.subject ?? '',
            html: typeof parsed.html === 'string' ? parsed.html : '',
            text: parsed.text ?? '',
            date: (parsed.date ?? new Date()).toISOString(),
          });
          callback();
        })
        .catch(callback);
    },
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '0.0.0.0', () => resolve(server));
  });
}
