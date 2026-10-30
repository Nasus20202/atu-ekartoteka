export interface PolishPluralForms {
  one: string;
  few: string;
  many: string;
}

const FEW_MIN_LAST_DIGIT = 2;
const FEW_MAX_LAST_DIGIT = 4;
const TEENS_MIN = 12;
const TEENS_MAX = 14;

export const APARTMENT_FORMS: PolishPluralForms = {
  one: 'mieszkanie',
  few: 'mieszkania',
  many: 'mieszkań',
};

export const CHARGE_FORMS: PolishPluralForms = {
  one: 'naliczenie',
  few: 'naliczenia',
  many: 'naliczeń',
};

export const HOA_ACCUSATIVE_FORMS: PolishPluralForms = {
  one: 'wspólnotę',
  few: 'wspólnoty',
  many: 'wspólnot',
};

export function pluralizePl(count: number, forms: PolishPluralForms): string {
  if (count === 1) return forms.one;

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  const isFew =
    lastDigit >= FEW_MIN_LAST_DIGIT &&
    lastDigit <= FEW_MAX_LAST_DIGIT &&
    (lastTwoDigits < TEENS_MIN || lastTwoDigits > TEENS_MAX);

  return isFew ? forms.few : forms.many;
}

export function formatCountPl(count: number, forms: PolishPluralForms): string {
  return `${count} ${pluralizePl(count, forms)}`;
}
