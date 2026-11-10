import { placeholder as p } from '@/lib/privacy/placeholders';

/** Sections 9–12: recipients, transfers outside the EEA, retention, automated decisions. */
export const RECIPIENTS = `## Komu przekazujemy dane

Dane mogą trafić do:

- **administratorów serwisu**, czyli osób wskazanych przez administratora danych. Widzą dane kont i lokali, bo zatwierdzają konta, importują dane i pomagają użytkownikom;
- **dostawcy poczty e-mail**, który wysyła wiadomości z serwisu: ${p('nazwa dostawcy usługi poczty e-mail')};
- **dostawcy hostingu i infrastruktury**, na której działa serwis: ${p('nazwa dostawcy hostingu i innych usług infrastruktury')}. Dostawca przetwarza dane na naszą rzecz, na podstawie umowy powierzenia;
- **Cloudflare**, który dostarcza sprawdzenie Turnstile. Dostawca przetwarza dane na zasadach opisanych w swojej polityce prywatności. ${p('Usuń ten punkt, jeśli Turnstile jest wyłączone.')}
- **Google**, jeśli logujesz się kontem Google. Google przetwarza wtedy Twoje dane na własnych zasadach, opisanych w jego polityce prywatności. ${p('Usuń ten punkt, jeśli logowanie przez Google jest wyłączone.')}
- ${p('inni odbiorcy, na przykład dostawca monitoringu serwisu, kancelaria prawna, biuro rachunkowe; usuń ten punkt, jeśli ich nie ma')};
- **organów publicznych i sądów**, jeśli przepisy prawa nas do tego zobowiązują.

Nie sprzedajemy Twoich danych i nie przekazujemy ich w celach reklamowych.

## Czy dane trafiają poza Europejski Obszar Gospodarczy

Cloudflare i Google mogą przetwarzać dane także poza Europejskim Obszarem Gospodarczym, w szczególności w Stanach Zjednoczonych. Podstawą takiego przekazania jest ${p('wskaż zabezpieczenie, na przykład decyzję Komisji Europejskiej stwierdzającą odpowiedni stopień ochrony (Data Privacy Framework) dla odbiorcy, który się do niej przyłączył, albo standardowe klauzule umowne')}. Możesz poprosić nas o informację o tych zabezpieczeniach. ${p('Usuń lub zmień ten akapit, jeśli Turnstile i logowanie przez Google są wyłączone.')}

${p('Jeśli dostawca hostingu, poczty lub inny odbiorca ma siedzibę albo przetwarza dane poza EOG, wymień go tutaj i wskaż zabezpieczenie. Jeśli nie, usuń to zdanie.')}

## Jak długo przechowujemy dane

- **Dane konta**: do usunięcia konta, a po jego usunięciu ${p('okres, na przykład „nie dłużej niż 30 dni”, albo „usuwamy od razu”')}.
- **Dane lokali i rozliczeń**: ${p('okres wynikający z przepisów lub umowy, na przykład czas trwania prawa do lokalu i okres przedawnienia roszczeń')}.
- **Jednorazowe linki do potwierdzenia adresu e-mail i przywracania hasła**: wygasają, a serwis usuwa wygasłe i wykorzystane linki automatycznie, co godzinę.
- **Dzienniki zdarzeń**: ${p('okres przechowywania dzienników, na przykład „7 dni”')}.
- **Kopie zapasowe**: ${p('okres przechowywania kopii zapasowych albo usuń ten punkt, jeśli ich nie ma')}.

Po upływie tych okresów usuwamy dane albo je anonimizujemy. Wyjątek: przepisy wymagają dłuższego przechowywania albo dane są potrzebne do obrony roszczeń do czasu ich przedawnienia.

## Zautomatyzowane decyzje i profilowanie

Nie podejmujemy wobec Ciebie decyzji w sposób zautomatyzowany, w tym w drodze profilowania, które wywoływałyby skutki prawne albo w podobny sposób istotnie na Ciebie wpływały (art. 22 RODO). Konto w serwisie zatwierdza człowiek, czyli administrator.

Sprawdzenie Turnstile odróżnia człowieka od programu i działa automatycznie. Nie ocenia Cię jako osoby. Jeśli Cię zablokuje, napisz do nas, a sprawdzimy to ręcznie.
`;
