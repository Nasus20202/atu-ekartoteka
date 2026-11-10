import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { type Block, parseMarkdown } from '@/lib/privacy/markdown';
import { countPlaceholders } from '@/lib/privacy/placeholders';
import { PRIVACY_POLICY_TEMPLATE } from '@/lib/privacy/template';
import { parsePrivacyPolicy } from '@/lib/settings/parse-privacy-policy';

const SECTION_HEADINGS = [
  'W skrócie',
  'Dla kogo jest ta polityka',
  'Administrator danych i kontakt',
  'Gdy tylko przetwarzamy dane na zlecenie',
  'Jakie dane przetwarzamy',
  'Skąd mamy Twoje dane',
  'Po co i na jakiej podstawie',
  'Czy musisz podać dane',
  'Komu przekazujemy dane',
  'Czy dane trafiają poza Europejski Obszar Gospodarczy',
  'Jak długo przechowujemy dane',
  'Zautomatyzowane decyzje i profilowanie',
  'Twoje prawa',
  'Jak skorzystać z praw',
  'Dostałeś wiadomość, której się nie spodziewałeś',
  'Pliki cookies i podobne technologie',
  'Jak chronimy dane',
  'Zmiany tej polityki',
];

// Names of products, providers and arrangements of a real deployment.
const DEPLOYMENT_NAMES = [
  'grafana',
  'rybbit',
  'prometheus',
  'loki',
  'tempo',
  'amazon',
  'aws',
  'hetzner',
  'ovh',
  'azure',
  'digitalocean',
  'cyberfolks',
  'mailgun',
  'sendgrid',
  'matomo',
  'plausible',
  'analytics',
  'frankfurt',
  'warszawa, polska',
  'londyn',
  'vps',
  'kubernetes',
];

const blocks = parseMarkdown(PRIVACY_POLICY_TEMPLATE);

function sectionText(heading: string): string {
  const start = PRIVACY_POLICY_TEMPLATE.indexOf(`## ${heading}\n`);
  expect(start, `section "${heading}"`).toBeGreaterThanOrEqual(0);
  const next = PRIVACY_POLICY_TEMPLATE.indexOf('\n## ', start + 1);
  return PRIVACY_POLICY_TEMPLATE.slice(start, next === -1 ? undefined : next);
}

describe('privacy policy template', () => {
  it('has a title, then the sections in order', () => {
    const headings = blocks.flatMap((block) =>
      block.kind === 'heading' ? [{ level: block.level, block }] : []
    );

    expect(headings[0].level).toBe(1);
    const titles = PRIVACY_POLICY_TEMPLATE.match(/^## (.+)$/gm)?.map((line) =>
      line.slice(3)
    );
    expect(titles).toEqual(SECTION_HEADINGS);
  });

  it('opens with a summary and addresses the reader in the second person', () => {
    expect(PRIVACY_POLICY_TEMPLATE.indexOf('## W skrócie')).toBeLessThan(
      PRIVACY_POLICY_TEMPLATE.indexOf('## Dla kogo jest ta polityka')
    );
    expect(PRIVACY_POLICY_TEMPLATE).toMatch(/\bTwoich danych\b/);
    expect(PRIVACY_POLICY_TEMPLATE).toMatch(/\bmasz prawo\b/i);
  });

  it('has placeholders for the controller, retention and hosting', () => {
    expect(sectionText('Administrator danych i kontakt')).toMatch(
      /\[\[pełna nazwa administratora/
    );
    expect(sectionText('Jak długo przechowujemy dane')).toMatch(/\[\[okres/);
    expect(sectionText('Komu przekazujemy dane')).toMatch(
      /\[\[nazwa dostawcy hostingu/
    );
    expect(countPlaceholders(PRIVACY_POLICY_TEMPLATE)).toBeGreaterThan(20);
  });

  it('cannot be saved as it is, only after every placeholder is resolved', () => {
    expect(parsePrivacyPolicy(PRIVACY_POLICY_TEMPLATE)).toMatchObject({
      ok: false,
    });
    const filled = PRIVACY_POLICY_TEMPLATE.replace(/\[\[[^\]]*\]\]/g, 'x');

    expect(parsePrivacyPolicy(filled)).toMatchObject({ ok: true });
  });

  it('marks every optional part for removal', () => {
    const optional = [
      'Gdy tylko przetwarzamy dane na zlecenie',
      'Czy dane trafiają poza Europejski Obszar Gospodarczy',
    ];
    for (const heading of optional) {
      expect(sectionText(heading)).toMatch(/\[\[[^\]]*(usuń|Usuń)[^\]]*\]\]/);
    }
    expect(sectionText('Pliki cookies i podobne technologie')).toMatch(
      /\[\[Akapit opcjonalny, analityka[^\]]*usuń/
    );
    expect(sectionText('Administrator danych i kontakt')).toMatch(
      /\[\[Wskaż dane inspektora[^\]]*usuń/
    );
  });

  it('covers what art. 13 and 14 GDPR require', () => {
    const checks: [string, RegExp][] = [
      ['Administrator danych i kontakt', /inspektora ochrony danych/],
      ['Po co i na jakiej podstawie', /art\. 6 ust\. 1 RODO/],
      ['Po co i na jakiej podstawie', /prawnie uzasadniony interes/],
      ['Jakie dane przetwarzamy', /Nie przetwarzamy szczególnych kategorii/],
      ['Skąd mamy Twoje dane', /nie pochodzą ze źródeł publicznie/],
      ['Czy musisz podać dane', /Bez nich nie możemy/],
      ['Komu przekazujemy dane', /administratorów serwisu/],
      ['Czy dane trafiają poza Europejski Obszar Gospodarczy', /Stanach/],
      ['Jak długo przechowujemy dane', /co godzinę/],
      ['Zautomatyzowane decyzje i profilowanie', /art\. 22 RODO/],
    ];
    for (const [heading, pattern] of checks) {
      expect(sectionText(heading), heading).toMatch(pattern);
    }
  });

  it('lists every right and the complaint to the data protection authority', () => {
    const rights = sectionText('Twoje prawa');

    for (const article of [
      'art. 15',
      'art. 16',
      'art. 17',
      'art. 18',
      'art. 20',
      'art. 21',
      'art. 22',
      'art. 7 ust. 3',
    ]) {
      expect(rights).toContain(article);
    }
    expect(rights).toContain('Prezesa Urzędu Ochrony Danych Osobowych');
    expect(rights).toContain('ul. Stawki 2, 00-193 Warszawa');
  });

  it('explains how to use the rights, with the deadlines', () => {
    const how = sectionText('Jak skorzystać z praw');

    expect(how).toMatch(/najpóźniej w ciągu miesiąca/);
    expect(how).toMatch(/o kolejne dwa miesiące/);
    expect(how).toMatch(/Odpowiedź jest bezpłatna/);
    expect(how).toMatch(/ewidentnie nieuzasadniony albo nadmierny/);
    expect(how).toMatch(/potwierdzenie tożsamości/);
  });

  it('explains the e-mail the reader did not expect, including a typo', () => {
    const unexpected = sectionText(
      'Dostałeś wiadomość, której się nie spodziewałeś'
    );

    expect(unexpected).toMatch(/literówk/);
    expect(unexpected).toMatch(/usunęli konto/);
  });

  it('names the three readers', () => {
    const readers = sectionText('Dla kogo jest ta polityka');

    expect(readers).toContain('Założyłeś konto sam');
    expect(readers).toContain('Konto założył Ci administrator');
    expect(readers).toContain(
      'Dostałeś wiadomość, której się nie spodziewałeś'
    );
  });

  it('cites art. 399 of the Electronic Communications Law in the cookie section', () => {
    const cookies = sectionText('Pliki cookies i podobne technologie');

    expect(cookies).toMatch(/art\. 399 ustawy z 12 lipca 2024 r\./);
    expect(cookies).toContain('Prawo komunikacji elektronicznej');
    expect(cookies).toMatch(/Nie używamy marketingowych/);
    expect(cookies).not.toContain('art. 173');
  });

  it('names only the measures the application itself enforces', () => {
    const security = sectionText('Jak chronimy dane');

    expect(security).toMatch(/skrót/);
    expect(security).toMatch(/jednorazowe/);
    expect(security).toMatch(/HTTPS/);
    expect(security).toMatch(/72 godzin/);
  });

  it('describes the application, not a deployment', () => {
    const lower = PRIVACY_POLICY_TEMPLATE.toLowerCase();

    for (const name of DEPLOYMENT_NAMES) {
      expect(lower, name).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it('renders without any literal Markdown left in the text', () => {
    const leftovers = (block: Block): string[] => {
      if (block.kind === 'list') return block.items.flatMap(textOf);
      return textOf(block.content);
    };
    const textOf = (nodes: { kind: string; text?: string }[]): string[] =>
      nodes.filter((node) => node.kind === 'text').map((n) => n.text ?? '');

    for (const block of blocks) {
      for (const text of leftovers(block)) {
        expect(text).not.toMatch(/\*\*/);
        expect(text).not.toMatch(/\]\(/);
        expect(text).not.toMatch(/^#{1,6}\s/);
      }
      if (block.kind === 'paragraph') {
        const first = block.content[0];
        expect(first.kind === 'text' ? first.text : '').not.toMatch(
          /^(\d+\.|[-*])\s/
        );
      }
    }
  });

  it('keeps every source file under 200 lines', () => {
    const dir = join(__dirname, '../template');
    for (const file of readdirSync(dir)) {
      const lines = readFileSync(join(dir, file), 'utf8').split('\n').length;
      expect(lines, file).toBeLessThan(200);
    }
  });
});
