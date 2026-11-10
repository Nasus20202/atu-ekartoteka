import { placeholder as p } from '@/lib/privacy/placeholders';

/** Sections 16–18: cookies, security measures and changes to the policy. */
export const TECHNICAL = `## Pliki cookies i podobne technologie

Pliki cookies to niewielkie pliki zapisywane w Twojej przeglądarce. Podobnie działa pamięć lokalna przeglądarki (local storage): przechowuje niewielkie dane po stronie Twojego urządzenia.

Używamy wyłącznie tego, co niezbędne do działania serwisu lub do usługi, o którą prosisz:

- **sesja logowania i zabezpieczenie formularzy** (pliki cookies serwisu): utrzymują Cię zalogowanym i chronią formularze przed fałszowaniem żądań. Sesja wygasa po 30 dniach bez aktywności albo po wylogowaniu;
- **widok listy** (plik cookie, do roku): zapamiętuje, czy wolisz karty, czy tabelę;
- **motyw kolorystyczny**, jasny lub ciemny (pamięć lokalna przeglądarki): zapamiętuje Twój wybór;
- **sprawdzenie Turnstile** na stronach logowania, rejestracji i przywracania hasła: dostawca może zapisać w przeglądarce dane techniczne niezbędne do jego działania. ${p('Usuń ten punkt, jeśli Turnstile jest wyłączone.')}

Nie używamy marketingowych plików cookies i nie łączymy danych z różnych serwisów.

${p('Akapit opcjonalny, analityka: jeśli serwis korzysta z narzędzia analitycznego, opisz je tutaj: nazwę, cel, zbierane dane, okres przechowywania i to, że wymaga Twojej zgody przed zapisaniem informacji w urządzeniu. Jeśli nie korzystasz z analityki, usuń cały akapit.')}

**Jak zarządzać plikami cookies.** W ustawieniach przeglądarki możesz usunąć pliki cookies albo zablokować ich zapisywanie. Zablokowanie plików niezbędnych sprawi, że nie zalogujesz się do serwisu.

**Podstawa prawna.** Zapisywanie informacji w Twoim urządzeniu i odczytywanie ich reguluje art. 399 ustawy z 12 lipca 2024 r. – Prawo komunikacji elektronicznej. Zgoda nie jest potrzebna na to, co jest niezbędne do świadczenia usługi, o którą wyraźnie prosisz. Dlatego niezbędnych plików cookies nie wyłączamy na Twoje żądanie. Dane osobowe, które w nich się znajdują, przetwarzamy według zasad opisanych w tej polityce.

## Jak chronimy dane

Opisujemy tylko to, co serwis robi sam:

- Hasła przechowujemy wyłącznie jako skrót, którego nie da się odczytać.
- Linki do potwierdzenia adresu e-mail i do przywracania hasła są jednorazowe, wygasają, a w bazie przechowujemy tylko ich skróty.
- Uprawnienia sprawdzamy w bazie danych przy każdym żądaniu. Użytkownik widzi wyłącznie dane przypisanych mu lokali, a funkcje administracyjne są dostępne tylko dla administratorów.
- Połączenie z serwisem jest szyfrowane. Serwis nakazuje przeglądarce łączyć się wyłącznie przez HTTPS, ogranicza źródła ładowanych treści i zabrania osadzania serwisu na obcych stronach.
- Dzienniki zdarzeń oznaczają użytkowników identyfikatorem konta. Nie zawierają adresów e-mail, imion, haseł ani tokenów, a komunikaty błędów są z nich oczyszczane i skracane.
- ${p('Dodaj środki techniczne i organizacyjne tego wdrożenia: kopie zapasowe, szyfrowanie dysków, kontrolę dostępu do serwerów, umowy powierzenia i szkolenia osób z dostępem do danych. Jeśli nic nie dodajesz, usuń ten punkt.')}

W razie naruszenia ochrony danych zawiadomimy organ nadzorczy w ciągu 72 godzin, jeśli prawo tego wymaga. Jeśli naruszenie może powodować wysokie ryzyko dla Twoich praw lub wolności, zawiadomimy także Ciebie (art. 33 i 34 RODO).

## Zmiany tej polityki

Możemy ją zmieniać, na przykład gdy zmieni się sposób przetwarzania danych albo przepisy. Aktualna wersja jest zawsze dostępna w serwisie, w stopce każdej strony, pod nazwą „Polityka prywatności”. O istotnych zmianach powiadomimy Cię ${p('sposób powiadomienia, na przykład wiadomością e-mail albo komunikatem w serwisie')}.

Data wejścia w życie tej polityki: ${p('data wejścia w życie')}
`;
