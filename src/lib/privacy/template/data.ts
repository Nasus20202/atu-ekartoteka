import { placeholder as p } from '@/lib/privacy/placeholders';

/** Sections 5–8: the data, its source, the purposes and whether it is required. */
export const DATA = `## Jakie dane przetwarzamy

Zależnie od tego, jak korzystasz z serwisu, przetwarzamy:

- **dane konta**: adres e-mail, hasło (przechowujemy wyłącznie jego bezpieczny skrót, nigdy samo hasło), imię i nazwisko, jeśli je podasz, rolę i status konta (na przykład „oczekuje na zatwierdzenie”), informację, czy potwierdziłeś adres e-mail, oraz datę założenia konta;
- **dane z logowania przez Google**: adres e-mail i imię z Twojego konta Google oraz informację, że Google potwierdziło ten adres. Hasła do konta Google nie dostajemy;
- **dane lokalu i rozliczeń**: imię i nazwisko lub nazwę właściciela, jego adres e-mail, adres lokalu (ulica, budynek, numer, kod pocztowy, miejscowość), identyfikatory właściciela i lokalu w systemie księgowym, udział we wspólnocie, okres przypisania lokalu, naliczenia, zawiadomienia o opłatach, wpłaty i salda;
- **dane techniczne**: dzienniki działania serwisu zapisują zdarzenia, na przykład udane i nieudane logowanie czy wysłanie wiadomości, razem z identyfikatorem konta i czasem. Nie zapisujemy w nich adresów e-mail, imion, haseł ani tokenów. ${p('Opisz, czy dostawca hostingu lub serwer pośredniczący zapisuje adresy IP odwiedzających i na jak długo, albo usuń to zdanie.')}
- **dane ze sprawdzenia Cloudflare Turnstile**: podczas logowania, rejestracji i przywracania hasła Twoja przeglądarka przekazuje dostawcy sprawdzenia dane potrzebne do odróżnienia człowieka od programu, w tym adres IP i cechy przeglądarki. ${p('Usuń ten punkt, jeśli sprawdzenie Turnstile jest w tym wdrożeniu wyłączone.')}

Nie przetwarzamy szczególnych kategorii danych w rozumieniu art. 9 RODO, na przykład danych o zdrowiu, ani danych o wyrokach. Dane o zadłużeniu lub nadpłacie za lokal to dane finansowe. Mają do nich dostęp użytkownik przypisany do danego lokalu i administratorzy serwisu.

## Skąd mamy Twoje dane

- **Od Ciebie**, jeśli założyłeś konto sam: adres e-mail, hasło i imię oraz nazwisko podajesz Ty. Jeśli logujesz się kontem Google, adres e-mail i imię przekazuje nam Google.
- **Z systemu księgowego**, jeśli jesteś właścicielem lub użytkownikiem lokalu: dane lokali, właścicieli i rozliczeń trafiają do serwisu z plików, które administrator serwisu importuje ręcznie z ${p('nazwa systemu księgowego lub innego źródła danych')}. Dotyczy to imienia i nazwiska lub nazwy właściciela, jego adresu e-mail, adresu lokalu, udziału, naliczeń, zawiadomień o opłatach, wpłat i sald.
- **Od administratora**, jeśli to on założył Ci konto: na adres e-mail z systemu księgowego wysyłamy wiadomość z tymczasowym hasłem, które musisz zmienić przy pierwszym logowaniu.
- **Od innej osoby**: Twój adres e-mail mógł wpisać ktoś inny, na przykład przez pomyłkę podczas rejestracji. Opisujemy to w sekcji „Dostałeś wiadomość, której się nie spodziewałeś”.

Dane nie pochodzą ze źródeł publicznie dostępnych.

## Po co i na jakiej podstawie

Każdy cel ma własną podstawę prawną według art. 6 ust. 1 RODO:

1. **Założenie i prowadzenie konta**: rejestracja, logowanie (także kontem Google), zmiana i przywracanie hasła, potwierdzenie adresu e-mail oraz zatwierdzenie konta przez administratora. Podstawa: wykonanie umowy o korzystanie z serwisu (lit. b).
2. **Udostępnienie rozliczeń lokalu**: pokazanie naliczeń, zawiadomień o opłatach, wpłat i sald. Podstawa: ${p('wskaż podstawę właściwą dla administratora: umowa z właścicielem lokalu (lit. b), obowiązek prawny wynikający z przepisów o własności lokali (lit. c) lub prawnie uzasadniony interes (lit. f)')}.
3. **Wiadomości e-mail o koncie**: potwierdzenie adresu, przywracanie hasła, informacja o zatwierdzeniu konta i o jego założeniu przez administratora. Podstawa: wykonanie umowy (lit. b). Nie wysyłamy wiadomości marketingowych.
4. **Powiadamianie administratorów o nowej rejestracji**, żeby mogli sprawdzić, kto prosi o dostęp do danych rozliczeniowych lokali. Podstawa: prawnie uzasadniony interes administratora (lit. f), czyli ochrona danych lokali przed dostępem osób niepowołanych.
5. **Bezpieczeństwo i niezawodność serwisu**: sprawdzenie Turnstile, wykrywanie nieudanych prób logowania, dzienniki zdarzeń i naprawa błędów. Podstawa: prawnie uzasadniony interes administratora (lit. f), czyli zapewnienie bezpieczeństwa danych, do którego obliguje też art. 32 RODO.
6. **Ustalenie, dochodzenie lub obrona roszczeń**. Podstawa: prawnie uzasadniony interes administratora (lit. f).

Nie opieramy żadnego z tych celów na Twojej zgodzie. Gdy przetwarzamy dane na podstawie prawnie uzasadnionego interesu, możesz się temu sprzeciwić. Piszemy o tym w sekcji „Twoje prawa”.

## Czy musisz podać dane

- **Konto**: adres e-mail i hasło albo logowanie kontem Google są potrzebne do założenia konta. Bez nich nie możemy go założyć. Imię i nazwisko podajesz dobrowolnie.
- **Dane lokalu i rozliczeń** nie pochodzą od Ciebie, tylko z systemu administratora. ${p('Jeśli przepisy lub umowa wymagają podania tych danych, wskaż to tutaj.')} Nie musisz mieć konta w serwisie. Jeśli go nie masz, rozliczenia dostaniesz w inny sposób: ${p('wskaż inny sposób kontaktu z administratorem lokalu')}.
- **Sprawdzenie Turnstile** jest warunkiem logowania, rejestracji i przywrócenia hasła, jeśli jest włączone. Gdy sprawdzenie Cię zablokuje, napisz do nas, a rozpatrzymy sprawę ręcznie.
`;
