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
import { cn, formatCurrency, MONTH_NAMES_PL } from '@/lib/utils';
import { getSignedBalanceClass } from '@/lib/utils/balance-class';
import { getChargesHref } from '@/lib/utils/dashboard-links';
import { toDecimal } from '@/lib/utils/decimal';
import {
  getNonEmptyMonths,
  getPaymentTotals,
} from '@/lib/utils/payment-months';
import { monthIndexToPeriod } from '@/lib/utils/period';

interface PaymentTableProps {
  payment: PaymentDtoSource;
  apartmentId: string;
  disableLinks?: boolean;
  cutoffPeriod?: string | null;
}

export function PaymentTable({
  payment,
  apartmentId,
  disableLinks = false,
  cutoffPeriod,
}: PaymentTableProps) {
  const openingBalance = toDecimal(payment.openingBalance);
  const monthlyData = getNonEmptyMonths(payment, cutoffPeriod).reduce<
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
  const { totalPayments, totalCharges } = getPaymentTotals(payment);
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
              className={cn(
                'text-right',
                getSignedBalanceClass(openingBalance)
              )}
            >
              {formatCurrency(openingBalance)}
            </TableCell>
          </TableRow>
          {monthlyData.map((month) => {
            const paymentsForMonth = month.payments;
            const chargesForMonth = month.charges;
            const href = getChargesHref({
              apartmentId,
              period: monthIndexToPeriod(payment.year, month.monthIndex),
            });
            const balanceColor = getSignedBalanceClass(month.balance);
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
              className={cn(
                'text-right font-medium',
                getSignedBalanceClass(closingBalance)
              )}
            >
              {formatCurrency(closingBalance)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
