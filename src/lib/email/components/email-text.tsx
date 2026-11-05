import { Text } from '@react-email/components';
import type { ReactNode } from 'react';

import { emailStyles } from '@/lib/email/email-theme';

interface Props {
  children: ReactNode;
}

export function Paragraph({ children }: Props) {
  return <Text style={emailStyles.copy}>{children}</Text>;
}

export function Note({ children }: Props) {
  return <Text style={emailStyles.note}>{children}</Text>;
}

export function greeting(name: string | undefined, punctuation = ','): string {
  return `Witaj${name ? ` ${name}` : ''}${punctuation}`;
}
