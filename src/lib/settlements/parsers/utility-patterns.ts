import {
  DATE,
  NUMBER,
  RESULT_LABEL,
} from '@/lib/settlements/parsers/parse-values';

const row = (...parts: string[]) => new RegExp(`^${parts.join('')}$`);

export const UTILITY_PATTERNS = {
  issuedOn: new RegExp(String.raw`dn\.\s*${DATE}`),
  owner: /^Klient:\s*(.*)$/,
  apartment: /^Lokal:\s*(\S+)\s+Nazwa:.*$/,
  service: /^Usługa:\s*(.+)$/,
  columns: /^Okres od Okres do Ilość Cena (.+)$/,
  line: row(DATE, ' ', DATE, ' ', NUMBER, ' ', NUMBER, ' ', NUMBER),
  meterHeader:
    /^URZĄDZENIE TYP DATA POCZ\. STAN POCZ\. DATA KOŃ\. STAN KOŃ\. ZUŻYCIE$/,
  // "CO 01 7000001 (CO mieszkania) 30/04/2022 100,000 ... 7,700 m3"
  meter: row(
    String.raw`(\S+ \d+) (\S+) \((.*)\) `,
    DATE,
    ' ',
    NUMBER,
    ' ',
    DATE,
    ' ',
    NUMBER,
    ' ',
    NUMBER,
    String.raw` ?(\S+)`
  ),
  period: new RegExp(`^${DATE} ${DATE} Zużycie\\b.*Suma zaliczek.*$`),
  summary: row(
    String.raw`([^:]+): `,
    NUMBER,
    ' - ',
    NUMBER,
    ' = ',
    NUMBER,
    ' ',
    NUMBER
  ),
  total: row(RESULT_LABEL, String.raw` \[lokal\]: ?`, NUMBER),
};
