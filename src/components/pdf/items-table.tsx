import { Text, View } from '@react-pdf/renderer';

import { styles } from '@/components/pdf/primitives';
import { formatCurrency } from '@/lib/utils';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';

export interface PdfItem {
  id: string;
  description: string;
  quantity: DecimalLike;
  unit: string;
  unitPrice: DecimalLike;
  totalAmount: DecimalLike;
}

/** Description / quantity / unit price / total table with a "Razem" row. */
export function PdfItemsTable({
  items,
  total,
}: {
  items: PdfItem[];
  total: DecimalLike;
}) {
  return (
    <View>
      <View style={styles.tableRowHeader}>
        <Text style={[styles.cellLeft, styles.bold]}>Opis</Text>
        <Text style={[styles.cellRight, styles.bold]}>Ilość</Text>
        <Text style={[styles.cellRight, styles.bold]}>Cena jedn.</Text>
        <Text style={[styles.cellRight, styles.bold]}>Razem</Text>
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.tableRow}>
          <Text style={styles.cellLeft}>{item.description}</Text>
          <Text style={styles.cellRight}>
            {toDecimal(item.quantity).toString()} {item.unit}
          </Text>
          <Text style={styles.cellRight}>{formatCurrency(item.unitPrice)}</Text>
          <Text style={styles.cellRight}>
            {formatCurrency(item.totalAmount)}
          </Text>
        </View>
      ))}

      <View style={styles.tableRowTotal}>
        <Text style={[styles.cellLeft, styles.bold]}>Razem</Text>
        <Text style={styles.cellRight} />
        <Text style={styles.cellRight} />
        <Text style={[styles.cellRight, styles.bold]}>
          {formatCurrency(total)}
        </Text>
      </View>
    </View>
  );
}
