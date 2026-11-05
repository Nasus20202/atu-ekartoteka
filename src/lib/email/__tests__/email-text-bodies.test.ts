import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  accountActivationMessage,
  accountApprovedMessage,
  newUserAdminMessage,
  passwordResetMessage,
  verificationMessage,
} from '@/lib/email/email-messages';

const APP_URL = 'https://ekartoteka.example.com';

describe('plain-text email bodies', () => {
  beforeEach(() => {
    vi.stubEnv('APP_URL', APP_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('verification', () => {
    expect(verificationMessage('tok-1', 'Anna').text).toMatchInlineSnapshot(`
      "Witaj Anna!

      Dziękujemy za rejestrację. Aby dokończyć proces rejestracji, potwierdź swój adres email.

      Kliknij poniższy link, aby potwierdzić swój adres email:
      https://ekartoteka.example.com/verify-email?token=tok-1

      Link wygaśnie za 24 godziny.

      Jeśli nie rejestrowałeś się w naszym serwisie, zignoruj tę wiadomość.

      --
      ATU Ekartoteka
      "
    `);
  });

  it('password reset', () => {
    expect(passwordResetMessage('tok-2', 'Anna').text).toMatchInlineSnapshot(`
      "Resetowanie hasła

      Witaj Anna,

      Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.

      Kliknij poniższy link, aby ustawić nowe hasło:
      https://ekartoteka.example.com/reset-password?token=tok-2

      Link wygaśnie za 1 godzinę.

      Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.

      --
      ATU Ekartoteka
      "
    `);
  });

  it('account approved', () => {
    expect(accountApprovedMessage('Anna').text).toMatchInlineSnapshot(`
      "Twoje konto zostało zatwierdzone

      Witaj Anna,

      Administrator zatwierdził Twoje konto. Możesz teraz zalogować się do systemu.

      Zaloguj się tutaj:
      https://ekartoteka.example.com/login

      Dziękujemy za cierpliwość!

      --
      ATU Ekartoteka
      "
    `);
  });

  it('account activation', () => {
    expect(
      accountActivationMessage('anna@example.com', 'Temp-Pass-1', 'Anna').text
    ).toMatchInlineSnapshot(`
      "Twoje konto zostało utworzone

      Witaj Anna,

      Administrator utworzył dla Ciebie konto w systemie. Możesz zalogować się używając poniższych danych:

      Email: anna@example.com
      Tymczasowe hasło: Temp-Pass-1

      Po zalogowaniu zostaniesz poproszony o ustawienie nowego hasła.

      Zaloguj się tutaj:
      https://ekartoteka.example.com/login

      Jeśli nie spodziewałeś się tego maila, możesz go zignorować.

      --
      ATU Ekartoteka
      "
    `);
  });

  it('new user notification for admins', () => {
    expect(
      newUserAdminMessage('anna@example.com', 'Anna Nowak', '2026-01-02 10:00')
        .text
    ).toMatchInlineSnapshot(`
      "Nowa rejestracja użytkownika

      Nowy użytkownik zarejestrował się w systemie i oczekuje na zatwierdzenie.

      Dane użytkownika:
      - Imię i nazwisko: Anna Nowak
      - Email: anna@example.com
      - Data rejestracji: 2026-01-02 10:00

      Aby zatwierdzić lub odrzucić użytkownika, przejdź do panelu administracyjnego:
      https://ekartoteka.example.com/admin/users

      ---
      To jest automatyczna wiadomość. Nie odpowiadaj na ten email.

      --
      ATU Ekartoteka
      "
    `);
  });
});
