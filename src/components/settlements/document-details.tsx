import type { SettlementOriginDto } from '@/lib/settlements/dto/settlement-view-dto';
import { formatDay } from '@/lib/settlements/rules/format';

interface Props {
  origin: SettlementOriginDto | null;
  printedOwner: string;
}

export function DocumentDetails({ origin, printedOwner }: Props) {
  if (!origin) return null;

  const details = [
    ['Data wystawienia', formatDay(origin.issuedOn)],
    ['Właściciel w dokumencie', printedOwner],
    ['Plik źródłowy', origin.sourceFileName],
  ];

  return (
    <dl
      aria-label="Dane dokumentu"
      className="flex flex-wrap gap-x-8 gap-y-2 text-sm"
    >
      {details.map(([term, value]) => (
        <div key={term} className="min-w-0">
          <dt className="text-muted-foreground">{term}</dt>
          <dd className="break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
