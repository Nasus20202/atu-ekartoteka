/*
  Warnings:

  - A unique constraint covering the columns `[apartmentId,period,externalLineNo,externalId]` on the table `Charge` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apartmentId,lineNo,externalId]` on the table `ChargeNotification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apartmentId,year,externalId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Charge_apartmentId_period_externalLineNo_key";

-- DropIndex
DROP INDEX "ChargeNotification_apartmentId_lineNo_key";

-- DropIndex
DROP INDEX "ChargeNotification_externalId_idx";

-- DropIndex
DROP INDEX "Payment_apartmentId_year_key";

-- CreateIndex
CREATE UNIQUE INDEX "Charge_apartmentId_period_externalLineNo_externalId_key" ON "Charge"("apartmentId", "period", "externalLineNo", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ChargeNotification_apartmentId_lineNo_externalId_key" ON "ChargeNotification"("apartmentId", "lineNo", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_apartmentId_year_externalId_key" ON "Payment"("apartmentId", "year", "externalId");
