import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';
import { formatCurrency, MONTH_NAMES_PL } from '@/lib/utils';
import { toDecimal } from '@/lib/utils/decimal';
import {
  CHARGE_MONTH_FIELD_KEYS,
  getNonEmptyMonths,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';
import { sumDecimals } from '@/lib/utils/sum';

interface PaymentTableProps {
  payment: PaymentDtoSource;
  apartmentId: string;
  disableLinks?: boolean;
}

export function PaymentTable({
  payment,
  apartmentId,
  disableLinks = false,
}: PaymentTableProps) {
  const openingBalance = toDecimal(payment.openingBalance);
  const monthlyData = getNonEmptyMonths(payment).reduce<
    Array<{
      monthIndex: number;
      name: string;
      charges: typeof openingBalance;
      payments: typeof openingBalance;
      balance: typeof openingBalance;
    }>
  >((rows, month) => {
    const previousBalance = rows.at(-1)?.balance ?? openingBalance;

    rows.push({
      ...month,
      name: MONTH_NAMES_PL[month.monthIndex],
      balance: previousBalance.plus(month.payments).minus(month.charges),
    });

    return rows;
  }, []);
  const totalPayments = sumDecimals(
    PAYMENT_MONTH_FIELD_KEYS.map((key) => payment[key])
  );
  const totalCharges = sumDecimals(
    CHARGE_MONTH_FIELD_KEYS.map((key) => payment[key])
  );
  const closingBalance = toDecimal(payment.closingBalance);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Miesiąc</TableHead>
            <TableHead className="text-right">Wpłaty</TableHead>
            <TableHead className="text-right">Naliczenia</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Bilans otwarcia</TableCell>
            <TableCell className="text-right">
              {formatCurrency(payment.openingSurplus)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(payment.openingDebt)}
            </TableCell>
            <TableCell
              className={`text-right ${
                openingBalance.isNegative()
                  ? 'text-red-600'
                  : openingBalance.greaterThan(0)
                    ? 'text-green-600'
                    : ''
              }`}
            >
              {formatCurrency(openingBalance)}
            </TableCell>
          </TableRow>
          {monthlyData.map((month) => {
            const paymentsForMonth = month.payments;
            const chargesForMonth = month.charges;
            const monthParam = `${payment.year}-${String(month.monthIndex + 1).padStart(2, '0')}`;
            const href = `/dashboard/charges/${apartmentId}?month=${monthParam}`;
            const balanceColor = month.balance.isNegative()
              ? 'text-red-600'
              : month.balance.greaterThan(0)
                ? 'text-green-600'
                : '';
            return (
              <TableRow
                key={month.name}
                className={
                  disableLinks ? undefined : 'hover:bg-muted/50 cursor-pointer'
                }
              >
                <TableCell>
                  {disableLinks ? (
                    month.name
                  ) : (
                    <Link href={href} className="block">
                      {month.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {disableLinks ? (
                    formatCurrency(paymentsForMonth)
                  ) : (
                    <Link href={href} className="block">
                      {formatCurrency(paymentsForMonth)}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {disableLinks ? (
                    formatCurrency(chargesForMonth)
                  ) : (
                    <Link href={href} className="block">
                      {formatCurrency(chargesForMonth)}
                    </Link>
                  )}
                </TableCell>
                <TableCell className={`text-right ${balanceColor}`}>
                  {disableLinks ? (
                    formatCurrency(month.balance)
                  ) : (
                    <Link href={href} className={`block ${balanceColor}`}>
                      {formatCurrency(month.balance)}
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">Razem</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(totalPayments)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(totalCharges)}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${
                closingBalance.isNegative()
                  ? 'text-red-600'
                  : closingBalance.greaterThan(0)
                    ? 'text-green-600'
                    : ''
              }`}
            >
              {formatCurrency(closingBalance)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
