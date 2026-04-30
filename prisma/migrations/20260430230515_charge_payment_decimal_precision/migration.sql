/*
  Warnings:

  - You are about to alter the column `quantity` on the `Charge` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `unitPrice` on the `Charge` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `totalAmount` on the `Charge` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `quantity` on the `ChargeNotification` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `unitPrice` on the `ChargeNotification` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `totalAmount` on the `ChargeNotification` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `openingBalance` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `closingBalance` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `januaryPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `februaryPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `marchPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `aprilPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `mayPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `junePayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `julyPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `augustPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `septemberPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `octoberPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `novemberPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `decemberPayments` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `januaryCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `februaryCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `marchCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `aprilCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `mayCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `juneCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `julyCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `augustCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `septemberCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `octoberCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `novemberCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `decemberCharges` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `openingDebt` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.
  - You are about to alter the column `openingSurplus` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,4)`.

*/
-- AlterTable
ALTER TABLE "Charge" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "ChargeNotification" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "openingBalance" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "closingBalance" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "januaryPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "februaryPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "marchPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "aprilPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "mayPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "junePayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "julyPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "augustPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "septemberPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "octoberPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "novemberPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "decemberPayments" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "januaryCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "februaryCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "marchCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "aprilCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "mayCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "juneCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "julyCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "augustCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "septemberCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "octoberCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "novemberCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "decemberCharges" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "openingDebt" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "openingSurplus" SET DATA TYPE DECIMAL(14,4);
