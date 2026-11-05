export interface CapturedMail {
  to: string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  date: string;
}

const messages: CapturedMail[] = [];

function matches(mail: CapturedMail, to?: string): boolean {
  const wanted = to?.trim().toLowerCase();
  return !wanted || mail.to.includes(wanted);
}

export function addMail(mail: CapturedMail): void {
  messages.push(mail);
}

/** Newest first. */
export function listMail(to?: string): CapturedMail[] {
  return messages.filter((mail) => matches(mail, to)).reverse();
}

export function clearMail(to?: string): void {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (matches(messages[i], to)) messages.splice(i, 1);
  }
}
