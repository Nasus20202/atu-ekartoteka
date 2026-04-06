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
import type { Payment } from '@/lib/types';
import { MONTH_NAMES_PL } from '@/lib/utils';

interface PaymentTableProps {
  payment: Payment;
  apartmentId: string;
  disableLinks?: boolean;
}

export function PaymentTable({
  payment,
  apartmentId,
  disableLinks = false,
}: PaymentTableProps) {
  const monthlyData = [
    {
      name: MONTH_NAMES_PL[0],
      payment: payment.januaryPayments,
      charge: payment.januaryCharges,
    },
    {
      name: MONTH_NAMES_PL[1],
      payment: payment.februaryPayments,
      charge: payment.februaryCharges,
    },
    {
      name: MONTH_NAMES_PL[2],
      payment: payment.marchPayments,
      charge: payment.marchCharges,
    },
    {
      name: MONTH_NAMES_PL[3],
      payment: payment.aprilPayments,
      charge: payment.aprilCharges,
    },
    {
      name: MONTH_NAMES_PL[4],
      payment: payment.mayPayments,
      charge: payment.mayCharges,
    },
    {
      name: MONTH_NAMES_PL[5],
      payment: payment.junePayments,
      charge: payment.juneCharges,
    },
    {
      name: MONTH_NAMES_PL[6],
      payment: payment.julyPayments,
      charge: payment.julyCharges,
    },
    {
      name: MONTH_NAMES_PL[7],
      payment: payment.augustPayments,
      charge: payment.augustCharges,
    },
    {
      name: MONTH_NAMES_PL[8],
      payment: payment.septemberPayments,
      charge: payment.septemberCharges,
    },
    {
      name: MONTH_NAMES_PL[9],
      payment: payment.octoberPayments,
      charge: payment.octoberCharges,
    },
    {
      name: MONTH_NAMES_PL[10],
      payment: payment.novemberPayments,
      charge: payment.novemberCharges,
    },
    {
      name: MONTH_NAMES_PL[11],
      payment: payment.decemberPayments,
      charge: payment.decemberCharges,
    },
  ];

  const totalPayments = monthlyData.reduce(
    (sum, month) => sum + month.payment,
    0
  );
  const totalCharges = monthlyData.reduce(
    (sum, month) => sum + month.charge,
    0
  );

  let runningBalance = payment.openingBalance;

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
              {payment.openingSurplus.toFixed(2)} zł
            </TableCell>
            <TableCell className="text-right">
              {payment.openingDebt.toFixed(2)} zł
            </TableCell>
            <TableCell
              className={`text-right ${
                runningBalance < 0
                  ? 'text-red-600'
                  : runningBalance > 0
                    ? 'text-green-600'
                    : ''
              }`}
            >
              {runningBalance.toFixed(2)} zł
            </TableCell>
          </TableRow>
          {monthlyData.map((month, idx) => {
            const paymentsForMonth = month.payment;
            const chargesForMonth = month.charge;
            runningBalance += paymentsForMonth - chargesForMonth;
            const monthParam = `${payment.year}-${String(idx + 1).padStart(2, '0')}`;
            const href = `/dashboard/charges/${apartmentId}?month=${monthParam}`;
            const balanceColor =
              runningBalance < 0
                ? 'text-red-600'
                : runningBalance > 0
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
                    `${paymentsForMonth.toFixed(2)} zł`
                  ) : (
                    <Link href={href} className="block">
                      {paymentsForMonth.toFixed(2)} zł
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {disableLinks ? (
                    `${chargesForMonth.toFixed(2)} zł`
                  ) : (
                    <Link href={href} className="block">
                      {chargesForMonth.toFixed(2)} zł
                    </Link>
                  )}
                </TableCell>
                <TableCell className={`text-right ${balanceColor}`}>
                  {disableLinks ? (
                    `${runningBalance.toFixed(2)} zł`
                  ) : (
                    <Link href={href} className={`block ${balanceColor}`}>
                      {runningBalance.toFixed(2)} zł
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
              {totalPayments.toFixed(2)} zł
            </TableCell>
            <TableCell className="text-right font-medium">
              {totalCharges.toFixed(2)} zł
            </TableCell>
            <TableCell
              className={`text-right font-medium ${
                payment.closingBalance < 0
                  ? 'text-red-600'
                  : payment.closingBalance > 0
                    ? 'text-green-600'
                    : ''
              }`}
            >
              {payment.closingBalance.toFixed(2)} zł
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
