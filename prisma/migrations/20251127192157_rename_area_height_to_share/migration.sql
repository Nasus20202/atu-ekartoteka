/*
  Warnings:

  - You are about to rename the column `area` on the `Apartment` table.
  - You are about to rename the column `height` on the `Apartment` table.

*/
-- AlterTable
ALTER TABLE "Apartment" RENAME COLUMN "area" TO "shareNumerator";
ALTER TABLE "Apartment" RENAME COLUMN "height" TO "shareDenominator";
