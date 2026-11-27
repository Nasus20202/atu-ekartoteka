import { View } from '@react-pdf/renderer';

import { SectionTitle } from '@/components/pdf/primitives';

// Room for the table heading and its first row
const MIN_SPACE_FOR_ROWS = 60;

/**
 * A section title that moves to the next page with the table below it. It has to
 * be a sibling of earlier content: react-pdf never breaks before a first child.
 */
export function PdfSectionHeading({ children }: { children: string }) {
  return (
    <View wrap={false} minPresenceAhead={MIN_SPACE_FOR_ROWS}>
      <SectionTitle>{children}</SectionTitle>
    </View>
  );
}
