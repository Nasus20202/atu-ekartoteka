export type ChargeData = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  dateFrom: Date;
  dateTo: Date;
};

export const formatPeriod = (period: string): string => {
  if (period.length === 6) {
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const monthNames = [
      'Styczeń',
      'Luty',
      'Marzec',
      'Kwiecień',
      'Maj',
      'Czerwiec',
      'Lipiec',
      'Sierpień',
      'Wrzesień',
      'Październik',
      'Listopad',
      'Grudzień',
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  return period;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
