/*
  Warnings:

  - You are about to drop the column `externalId` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `Charge` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `ChargeNotification` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalOwnerId,externalApartmentId]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apartmentId,period,externalLineNo]` on the table `Charge` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apartmentId,lineNo]` on the table `ChargeNotification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apartmentId,year]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalApartmentId` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `externalOwnerId` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Apartment_externalId_idx";

-- DropIndex
DROP INDEX "Apartment_externalId_key";

-- DropIndex
DROP INDEX "Charge_apartmentId_period_externalLineNo_externalId_key";

-- DropIndex
DROP INDEX "ChargeNotification_apartmentId_lineNo_externalId_key";

-- DropIndex
DROP INDEX "Payment_apartmentId_year_externalId_key";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "externalId",
ADD COLUMN     "externalApartmentId" TEXT NOT NULL,
ADD COLUMN     "externalOwnerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Charge" DROP COLUMN "externalId";

-- AlterTable
ALTER TABLE "ChargeNotification" DROP COLUMN "externalId";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "externalId";

-- CreateIndex
CREATE INDEX "Apartment_externalOwnerId_idx" ON "Apartment"("externalOwnerId");

-- CreateIndex
CREATE INDEX "Apartment_externalApartmentId_idx" ON "Apartment"("externalApartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_externalOwnerId_externalApartmentId_key" ON "Apartment"("externalOwnerId", "externalApartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Charge_apartmentId_period_externalLineNo_key" ON "Charge"("apartmentId", "period", "externalLineNo");

-- CreateIndex
CREATE UNIQUE INDEX "ChargeNotification_apartmentId_lineNo_key" ON "ChargeNotification"("apartmentId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_apartmentId_year_key" ON "Payment"("apartmentId", "year");
