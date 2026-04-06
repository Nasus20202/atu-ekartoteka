-- AlterTable
ALTER TABLE "HomeownersAssociation" ADD COLUMN     "apartmentsDataDate" TIMESTAMP(3),
ADD COLUMN     "chargesDataDate" TIMESTAMP(3),
ADD COLUMN     "footer" TEXT,
ADD COLUMN     "header" TEXT,
ADD COLUMN     "notificationsDataDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "openingDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "openingSurplus" DOUBLE PRECISION NOT NULL DEFAULT 0;
