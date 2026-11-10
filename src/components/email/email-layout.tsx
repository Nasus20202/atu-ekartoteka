import type { ReactNode } from 'react';
import { Body, Head, Heading, Html, Link, Section, Text } from 'react-email';

import { appUrl } from '@/lib/email/app-url';
import { emailStyles } from '@/lib/email/email-theme';

export const EMAIL_BRAND = 'ATU Ekartoteka';
const EMAIL_LANGUAGE = 'pl';
const VIEWPORT = 'width=device-width, initial-scale=1.0';
export const EMAIL_PRIVACY_LINK_TEXT = 'Polityka prywatności';

interface Props {
  title: string;
  children: ReactNode;
}

export function EmailLayout({ title, children }: Props) {
  return (
    <Html lang={EMAIL_LANGUAGE}>
      <Head>
        <meta name="viewport" content={VIEWPORT} />
        <title>{title}</title>
      </Head>
      <Body style={emailStyles.body}>
        <Section align="center" style={emailStyles.outer}>
          <Section style={emailStyles.card}>
            <Section style={emailStyles.header} data-skip-in-text="true">
              {EMAIL_BRAND}
            </Section>
            <Section style={emailStyles.content}>
              <Heading as="h1" style={emailStyles.heading}>
                {title}
              </Heading>
              {children}
            </Section>
          </Section>
          <Text style={emailStyles.footer}>
            {EMAIL_BRAND}
            {' · '}
            <Link href={appUrl('/privacy')} style={emailStyles.footerLink}>
              {EMAIL_PRIVACY_LINK_TEXT}
            </Link>
          </Text>
        </Section>
      </Body>
    </Html>
  );
}
