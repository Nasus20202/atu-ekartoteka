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

interface PaymentTableProps {
  payment: Payment;
}

export function PaymentTable({ payment }: PaymentTableProps) {
  const monthlyData = [
    {
      name: 'Styczeń',
      payment: payment.januaryPayments,
      charge: payment.januaryCharges,
    },
    {
      name: 'Luty',
      payment: payment.februaryPayments,
      charge: payment.februaryCharges,
    },
    {
      name: 'Marzec',
      payment: payment.marchPayments,
      charge: payment.marchCharges,
    },
    {
      name: 'Kwiecień',
      payment: payment.aprilPayments,
      charge: payment.aprilCharges,
    },
    { name: 'Maj', payment: payment.mayPayments, charge: payment.mayCharges },
    {
      name: 'Czerwiec',
      payment: payment.junePayments,
      charge: payment.juneCharges,
    },
    {
      name: 'Lipiec',
      payment: payment.julyPayments,
      charge: payment.julyCharges,
    },
    {
      name: 'Sierpień',
      payment: payment.augustPayments,
      charge: payment.augustCharges,
    },
    {
      name: 'Wrzesień',
      payment: payment.septemberPayments,
      charge: payment.septemberCharges,
    },
    {
      name: 'Październik',
      payment: payment.octoberPayments,
      charge: payment.octoberCharges,
    },
    {
      name: 'Listopad',
      payment: payment.novemberPayments,
      charge: payment.novemberCharges,
    },
    {
      name: 'Grudzień',
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
          <TableCell className="text-right">-</TableCell>
          <TableCell className="text-right">-</TableCell>
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
        {monthlyData.map((month) => {
          const paymentsForMonth = month.payment;
          const chargesForMonth = month.charge;
          runningBalance += paymentsForMonth - chargesForMonth;
          return (
            <TableRow key={month.name}>
              <TableCell>{month.name}</TableCell>
              <TableCell className="text-right">
                {paymentsForMonth.toFixed(2)} zł
              </TableCell>
              <TableCell className="text-right">
                {chargesForMonth.toFixed(2)} zł
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
  );
}
