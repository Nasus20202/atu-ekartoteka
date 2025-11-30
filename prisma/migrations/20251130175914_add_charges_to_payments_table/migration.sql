-- AlterTable
-- Step 1: Rename columns
ALTER TABLE "Payment"
    RENAME COLUMN "january" TO "januaryPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "february" TO "februaryPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "march" TO "marchPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "april" TO "aprilPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "may" TO "mayPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "june" TO "junePayments";
ALTER TABLE "Payment"
    RENAME COLUMN "july" TO "julyPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "august" TO "augustPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "september" TO "septemberPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "october" TO "octoberPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "november" TO "novemberPayments";
ALTER TABLE "Payment"
    RENAME COLUMN "december" TO "decemberPayments";

-- Step 2: Add new columns
ALTER TABLE "Payment"
    ADD COLUMN "januaryCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "februaryCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "marchCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "aprilCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "mayCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "juneCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "julyCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "augustCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "septemberCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "octoberCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "novemberCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "decemberCharges" DOUBLE PRECISION NOT NULL DEFAULT 0;
