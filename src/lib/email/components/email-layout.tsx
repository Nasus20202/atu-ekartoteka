import {
  Body,
  Head,
  Heading,
  Html,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

import { emailStyles } from '@/lib/email/email-theme';

export const EMAIL_BRAND = 'ATU Ekartoteka';
const EMAIL_LANGUAGE = 'pl';

interface Props {
  title: string;
  children: ReactNode;
}

export function EmailLayout({ title, children }: Props) {
  return (
    <Html lang={EMAIL_LANGUAGE}>
      <Head>
        <title>{title}</title>
      </Head>
      <Body style={emailStyles.body}>
        <Section align="center" style={emailStyles.outer}>
          <Section style={emailStyles.card}>
            <Section style={emailStyles.header}>{EMAIL_BRAND}</Section>
            <Section style={emailStyles.content}>
              <Heading as="h1" style={emailStyles.heading}>
                {title}
              </Heading>
              {children}
            </Section>
          </Section>
          <Text style={emailStyles.footer}>{EMAIL_BRAND}</Text>
        </Section>
      </Body>
    </Html>
  );
}
