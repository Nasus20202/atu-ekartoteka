import { placeholder as p } from '@/lib/privacy/placeholders';

/** Sections 1–4: summary, readers, controller and the optional processor part. */
export const OVERVIEW = `# Polityka prywatności

Ta polityka wyjaśnia, jak przetwarzamy dane osobowe w serwisie e-kartoteki ${p('adres serwisu')}. Robimy to zgodnie z rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z 27 kwietnia 2016 r. (RODO) oraz polskimi przepisami o ochronie danych osobowych. Piszemy możliwie prosto, a szczegóły prawne podajemy tam, gdzie RODO tego wymaga.

## W skrócie

- Administratorem Twoich danych jest ${p('pełna nazwa administratora')}, ${p('adres siedziby administratora')}. Napisz do nas: ${p('adres e-mail do spraw danych osobowych')}.
- Przetwarzamy dane potrzebne do założenia konta i pokazania Ci naliczeń oraz wpłat za Twój lokal: adres e-mail, imię i nazwisko, dane lokalu i rozliczeń oraz podstawowe dane techniczne o działaniu serwisu.
- Robimy to, żeby prowadzić Twoje konto, udostępniać rozliczenia lokalu, wysyłać wiadomości o koncie, chronić serwis przed nadużyciami i wypełniać obowiązki wynikające z przepisów.
- Nie sprzedajemy danych, nie profilujemy Cię i nie podejmujemy wobec Ciebie zautomatyzowanych decyzji. Nie używamy reklamowych ani śledzących plików cookies.
- Masz prawo dostępu do danych, ich poprawiania, usunięcia, ograniczenia przetwarzania, przeniesienia i sprzeciwu oraz prawo do skargi do Prezesa Urzędu Ochrony Danych Osobowych. Jak z nich skorzystać, piszemy w sekcji „Jak skorzystać z praw”.

## Dla kogo jest ta polityka

Serwis trafia do różnych osób w różny sposób, dlatego w tej polityce oznaczamy, co dotyczy którego przypadku:

1. **Założyłeś konto sam.** Zarejestrowałeś się adresem e-mail i hasłem albo kontem Google. Dane konta podałeś nam Ty.
2. **Konto założył Ci administrator.** Jesteś właścicielem lub użytkownikiem lokalu, a administrator utworzył konto na podstawie danych z systemu księgowego i wysłał Ci wiadomość z tymczasowym hasłem. Część danych pochodzi wtedy nie od Ciebie. Opisujemy to w sekcji „Skąd mamy Twoje dane”.
3. **Dostałeś wiadomość, której się nie spodziewałeś.** Ktoś mógł wpisać Twój adres e-mail w serwisie. Co wtedy zrobić, wyjaśniamy w sekcji „Dostałeś wiadomość, której się nie spodziewałeś”.

## Administrator danych i kontakt

Administratorem danych osobowych jest ${p('pełna nazwa administratora i forma prawna')}, z siedzibą pod adresem ${p('adres siedziby')} (${p('numer NIP lub KRS; usuń nawias, jeśli nie dotyczy')}).

W sprawach dotyczących danych osobowych napisz na adres ${p('adres e-mail do spraw danych osobowych')} albo wyślij list na adres ${p('adres korespondencyjny, jeśli inny niż siedziby')}.

${p('Wskaż dane inspektora ochrony danych albo usuń ten akapit, jeśli administrator nie wyznaczył inspektora.')}

## Gdy tylko przetwarzamy dane na zlecenie

${p('Ta sekcja dotyczy tylko sytuacji, gdy operator serwisu przetwarza dane lokali i rozliczeń na zlecenie innego podmiotu, na przykład wspólnoty mieszkaniowej. Jeśli operator sam jest administratorem tych danych, usuń całą sekcję.')}

Jeśli przetwarzamy dane na zlecenie, administratorem danych lokali, właścicieli i rozliczeń jest ${p('nazwa podmiotu, który zlecił przetwarzanie')}. My przetwarzamy je wyłącznie na jego polecenie i na podstawie umowy powierzenia (art. 28 RODO). Wniosek o poprawienie lub usunięcie tych danych kieruj do tego podmiotu: ${p('dane kontaktowe podmiotu, który zlecił przetwarzanie')}. Jeśli napiszesz do nas, przekażemy mu Twój wniosek. Za dane konta w serwisie, takie jak adres e-mail i hasło, odpowiadamy sami.
`;
