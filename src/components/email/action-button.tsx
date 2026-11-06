import { Button, Link, Section, Text } from 'react-email';

import { emailStyles } from '@/lib/email/email-theme';

interface Props {
  href: string;
  label: string;
}

export function ActionButton({ href, label }: Props) {
  return (
    <>
      <Section style={emailStyles.buttonWrap}>
        <Button href={href} style={emailStyles.button}>
          {label}
        </Button>
      </Section>
      <Text style={emailStyles.fallback} data-skip-in-text="true">
        Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:
        <br />
        <Link href={href} style={emailStyles.fallbackLink}>
          {href}
        </Link>
      </Text>
    </>
  );
}
