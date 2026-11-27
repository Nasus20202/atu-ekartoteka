/**
 * The emails of a voting: the admin's notice, and the one-time link that casts
 * an owner's vote.
 */

import type { APIRequestContext, Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import {
  createVotingTenant,
  type VotingTenant,
} from '../utils/create-voting-tenant';
import { expectDeliveredEmail } from '../utils/email-assertions';
import {
  extractLink,
  loginWithTurnstile,
  waitForMail,
} from '../utils/mock-server';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';
import {
  answerQuestion,
  apartmentBallot,
  countBallots,
  createDraftVoting,
  publishVoting,
} from '../utils/voting';
import {
  createVotingHoa,
  deleteVotingHoa,
  type VotingHoa,
} from '../utils/voting-hoa';

const CONFIRMATION_SUBJECT = 'Potwierdź swój głos';
const NOTIFICATION_SUBJECT = 'Nowe głosowanie w Twojej wspólnocie';
const CONFIRM_PATH = '/dashboard/votings/confirm/';
const QUESTION = 'Czy zgadzasz się na remont dachu?';

test.describe('Voting emails', () => {
  let hoa: VotingHoa;

  // The notice goes to every owner of the association, so none is shared
  test.beforeEach(async () => {
    hoa = await createVotingHoa();
  });

  test.afterEach(async () => {
    await deleteVotingHoa(hoa);
  });

  /** A published voting and its owner of two apartments. */
  async function publishedVoting(admin: Page) {
    const tenant = await createVotingTenant(2, {
      hoaExternalId: hoa.externalId,
    });
    const title = `Uchwała E2E ${Date.now()}`;
    await loginWithTurnstile(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
    const votingId = await createDraftVoting(admin, {
      hoaName: hoa.externalId,
      title,
      questions: [QUESTION],
    });
    await publishVoting(admin);
    return { tenant, title, votingId };
  }

  /** Sends the filled in ballot and returns the email with its link. */
  async function requestLink(
    owner: Page,
    request: APIRequestContext,
    { email }: VotingTenant,
    contains: string
  ) {
    await owner.getByRole('button', { name: /Dalej/ }).click();
    await expect(owner.getByText('Sprawdź swoją skrzynkę email')).toBeVisible();
    return waitForMail(request, email, {
      subject: CONFIRMATION_SUBJECT,
      contains,
    });
  }

  async function confirm(owner: Page, link: string) {
    await owner.goto(link);
    await owner.getByRole('button', { name: 'Potwierdź i zagłosuj' }).click();
    await expect(owner.getByText('Dziękujemy, głos oddany')).toBeVisible();
  }

  test('an owner follows the notice and votes with the emailed link', async ({
    page,
    browser,
    request,
  }) => {
    test.slow();
    const { tenant, title, votingId } = await publishedVoting(page);

    await page.getByRole('button', { name: 'Powiadom użytkowników' }).click();
    await expect(
      page.getByRole('checkbox', { name: tenant.name })
    ).toBeChecked();
    await page.getByRole('button', { name: 'Wyślij (1)' }).click();
    await expect(page.getByText('Wysłano: 1')).toBeVisible();
    const notice = await waitForMail(request, tenant.email, {
      subject: NOTIFICATION_SUBJECT,
    });
    expectDeliveredEmail(notice, {
      to: tenant.email,
      subject: NOTIFICATION_SUBJECT,
      both: [title, 'Prosimy o oddanie głosu'],
      html: ['Przejdź do głosowania'],
      linkPath: `/dashboard/votings/${votingId}`,
    });

    const context = await browser.newContext();
    const owner = await context.newPage();
    try {
      await loginWithTurnstile(owner, tenant.email, tenant.password);
      await owner.goto(extractLink(notice, `/dashboard/votings/${votingId}`));
      await answerQuestion(apartmentBallot(owner, 'V1'), 1, 'Za');
      await answerQuestion(apartmentBallot(owner, 'V2'), 1, 'Przeciw');
      const mail = await requestLink(owner, request, tenant, '/V2');
      const link = extractLink(mail, CONFIRM_PATH);
      expectDeliveredEmail(mail, {
        to: tenant.email,
        subject: CONFIRMATION_SUBJECT,
        both: [title, '/V1', '/V2', `1. ${QUESTION} – Przeciw`],
        html: ['Potwierdź głos'],
        linkPath: new URL(link).pathname,
      });
      // Nothing is stored until the link is opened and confirmed
      expect(await countBallots(votingId)).toBe(0);

      // Opening the link only shows the answers; the button casts the vote
      await owner.goto(link);
      await expect(
        owner.getByRole('heading', { name: /^Lokal .*\/V[12]$/ })
      ).toHaveCount(2);
      expect(await countBallots(votingId)).toBe(0);
      await confirm(owner, link);
      expect(await countBallots(votingId)).toBe(2);

      // The link works once
      await owner.goto(link);
      await expect(
        owner.getByText(/Ten link jest nieprawidłowy/)
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('an owner votes one apartment now and the other later', async ({
    page,
    browser,
    request,
  }) => {
    test.slow();
    const { tenant, votingId } = await publishedVoting(page);
    const context = await browser.newContext();
    const owner = await context.newPage();
    try {
      await loginWithTurnstile(owner, tenant.email, tenant.password);

      // Each email names only the apartment it will cast a vote for
      for (const [apartment, other, stored] of [
        ['/V1', '/V2', 1],
        ['/V2', '/V1', 2],
      ] as const) {
        await owner.goto(`/dashboard/votings/${votingId}`);
        await answerQuestion(
          apartmentBallot(owner, apartment.slice(1)),
          1,
          'Za'
        );
        const mail = await requestLink(owner, request, tenant, apartment);
        expect(mail.text).not.toContain(other);
        await confirm(owner, extractLink(mail, CONFIRM_PATH));
        expect(await countBallots(votingId)).toBe(stored);
      }
    } finally {
      await context.close();
    }
  });
});
