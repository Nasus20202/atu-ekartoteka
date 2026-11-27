import { StyleSheet, Text, View } from '@react-pdf/renderer';

import { type PdfStyle, styles } from '@/components/pdf/primitives';

// Hyphenation follows English rules, which break Polish words wrongly
const keepWordsWhole = (word: string) => [word];

// Rows left on the page when a table would otherwise start with its heading only
const MIN_SPACE_AFTER_HEADING = 40;

const tableStyles = StyleSheet.create({
  table: { fontSize: 9 },
  cell: { paddingHorizontal: 2 },
});

export interface PdfColumn {
  header: string;
  /** Fixed width of a right-aligned column; without it the column fills */
  width?: number;
}

export interface PdfCell {
  /** The first line is the value, further lines are muted */
  lines: string[];
  style?: PdfStyle;
}

export interface PdfRow {
  key: string;
  cells: Array<string | PdfCell>;
  total?: boolean;
}

interface Props {
  columns: PdfColumn[];
  rows: PdfRow[];
}

const columnStyle = ({ width }: PdfColumn): PdfStyle =>
  width ? { width, textAlign: 'right' } : { flex: 1, textAlign: 'left' };

/** A table that repeats its headings on every page and never cuts a row. */
export function PdfTable({ columns, rows }: Props) {
  return (
    <View style={tableStyles.table}>
      <View
        style={styles.tableRowHeader}
        fixed
        minPresenceAhead={MIN_SPACE_AFTER_HEADING}
      >
        {columns.map((column) => (
          <Text
            key={column.header}
            hyphenationCallback={keepWordsWhole}
            style={[tableStyles.cell, columnStyle(column), styles.bold]}
          >
            {column.header}
          </Text>
        ))}
      </View>
      {rows.map((row) => (
        <View
          key={row.key}
          wrap={false}
          style={row.total ? styles.tableRowTotal : styles.tableRow}
        >
          {row.cells.map((value, index) => {
            const cell = typeof value === 'string' ? { lines: [value] } : value;
            return (
              <View
                key={columns[index].header}
                style={[tableStyles.cell, columnStyle(columns[index])]}
              >
                {cell.lines.map((line, lineIndex) => (
                  <Text
                    key={lineIndex}
                    hyphenationCallback={keepWordsWhole}
                    style={[
                      lineIndex > 0 ? styles.muted : {},
                      row.total ? styles.bold : {},
                      cell.style ?? {},
                    ]}
                  >
                    {line}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
