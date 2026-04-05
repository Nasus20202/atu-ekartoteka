import { Page as PdfPage, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 32,
    color: '#111',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 4,
    alignItems: 'center',
  },
  tableRowHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 5,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  tableRowTotal: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingVertical: 5,
    marginTop: 2,
    alignItems: 'center',
  },
  cellLeft: {
    flex: 1,
    textAlign: 'left',
  },
  cellRight: {
    width: 72,
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
  muted: {
    color: '#6b7280',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  summaryCell: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    padding: 8,
  },
  summaryCellLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  summaryCellValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  red: {
    color: '#dc2626',
  },
  green: {
    color: '#16a34a',
  },
});

interface DocumentPageProps {
  children: ReactNode;
}

export function DocumentPage({ children }: DocumentPageProps) {
  return (
    <PdfPage size="A4" style={styles.page}>
      {children}
    </PdfPage>
  );
}

interface PdfHeaderProps {
  title: string;
  subtitle?: string;
}

export function PdfHeader({ title, subtitle }: PdfHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

interface SectionTitleProps {
  children: ReactNode;
}

export function SectionTitle({ children }: SectionTitleProps) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}
