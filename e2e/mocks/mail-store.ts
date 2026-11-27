export interface CapturedMail {
  id: number;
  to: string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  date: string;
}

export type NewMail = Omit<CapturedMail, 'id'>;

const messages: CapturedMail[] = [];
let lastId = 0;

function matches(mail: CapturedMail, to?: string): boolean {
  const wanted = to?.trim().toLowerCase();
  return !wanted || mail.to.includes(wanted);
}

export function addMail(mail: NewMail): void {
  lastId += 1;
  messages.push({ id: lastId, ...mail });
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
