import { Section, Text } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';

import { emailColors, emailStyles } from '@/lib/email/email-theme';

const ROW_STYLE: CSSProperties = {
  margin: '0 0 6px 0',
  color: emailColors.foreground,
  fontSize: '14px',
  lineHeight: 1.5,
};

interface DetailsBoxProps {
  children: ReactNode;
}

export function DetailsBox({ children }: DetailsBoxProps) {
  return <Section style={emailStyles.details}>{children}</Section>;
}

interface DetailProps {
  label: string;
  value: string;
}

interface StackedDetailProps extends DetailProps {
  last?: boolean;
}

export function InlineDetail({ label, value }: DetailProps) {
  return (
    <Text style={ROW_STYLE}>
      <span style={{ color: emailColors.mutedForeground }}>{`${label}:`}</span>{' '}
      <strong>{value}</strong>
    </Text>
  );
}

export function StackedDetail({ label, value, last }: StackedDetailProps) {
  return (
    <Text
      style={{
        ...ROW_STYLE,
        fontSize: '15px',
        margin: last ? '0 0 6px 0' : '0 0 14px 0',
      }}
    >
      <span style={emailStyles.detailLabel}>{label}</span>{' '}
      <strong style={emailStyles.mono}>{value}</strong>
    </Text>
  );
}
