import {
  DATE,
  NUMBER,
  RESULT_LABEL,
} from '@/lib/settlements/parsers/parse-values';

// The amount that ends each of the three result rows
const RESULT_VALUE = String.raw`: ?${NUMBER} ?zł\.$`;

export const ANNUAL_PATTERNS = {
  issuedOn: new RegExp(String.raw`dn\.\s*${DATE}`),
  apartment: /^Lokal:\s*(.+)$/,
  // "Lipowa 22 B / 15": street, building number with an optional letter, flat
  address: /^(.+?) (\d+(?: ?[A-Z])?) ?\/ ?(\w+)$/,
  heading: /^Rozliczenie kwoty proporcjonalnie$/,
  title: /^Tytułem:\s*(.+)$/,
  communityAmount: new RegExp(
    String.raw`^Kwota do rozliczenia:\* ?${NUMBER} ?zł\.$`
  ),
  period: new RegExp(`^Za okres od: ?${DATE} ?do: ?${DATE}$`),
  // The two bases are printed alone, above and below the flat coefficient
  basis: new RegExp(`^${NUMBER}$`),
  coefficient: new RegExp(`^Współczynnik dla lokalu: ?${NUMBER}$`),
  basisDescription: /^Współczynnik ustalony wg:\s*(.+)$/,
  itemResult: new RegExp(
    String.raw`^${RESULT_LABEL} \[naliczenie\]${RESULT_VALUE}`
  ),
  apartmentTotal: new RegExp(
    String.raw`^${RESULT_LABEL} \[lokal\]${RESULT_VALUE}`
  ),
  ownerTotal: new RegExp(
    String.raw`^${RESULT_LABEL} \[Klient\]${RESULT_VALUE}`
  ),
};
