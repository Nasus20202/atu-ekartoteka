-- CreateEnum
CREATE TYPE "UtilitySettlementLineKind" AS ENUM ('ADVANCE', 'CONSUMPTION');

-- CreateTable
CREATE TABLE "UtilitySettlement" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "issuedOn" TIMESTAMP(3) NOT NULL,
    "printedOwner" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilitySettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilitySettlementSummary" (
    "id" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "settlementId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "consumption" DECIMAL(14,6) NOT NULL,
    "advanceQuantity" DECIMAL(14,6) NOT NULL,
    "difference" DECIMAL(14,6) NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "UtilitySettlementSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilitySettlementLine" (
    "id" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "settlementId" TEXT NOT NULL,
    "kind" "UtilitySettlementLineKind" NOT NULL,
    "description" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(14,6) NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "UtilitySettlementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "settlementId" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "startValue" DECIMAL(14,3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "endValue" DECIMAL(14,3) NOT NULL,
    "consumption" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualCostSettlement" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "issuedOn" TIMESTAMP(3) NOT NULL,
    "printedOwner" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualCostSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualCostSettlementItem" (
    "id" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "settlementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "basisDescription" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "communityAmount" DECIMAL(14,4) NOT NULL,
    "flatBasis" DECIMAL(14,4) NOT NULL,
    "communityBasis" DECIMAL(14,4) NOT NULL,
    "coefficient" DECIMAL(7,4) NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "AnnualCostSettlementItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UtilitySettlement_apartmentId_periodFrom_periodTo_key" ON "UtilitySettlement"("apartmentId", "periodFrom", "periodTo");

-- CreateIndex
CREATE UNIQUE INDEX "UtilitySettlementSummary_settlementId_lineNo_key" ON "UtilitySettlementSummary"("settlementId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "UtilitySettlementLine_settlementId_lineNo_key" ON "UtilitySettlementLine"("settlementId", "lineNo");

-- CreateIndex
CREATE INDEX "MeterReading_serialNumber_idx" ON "MeterReading"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MeterReading_settlementId_lineNo_key" ON "MeterReading"("settlementId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualCostSettlement_apartmentId_periodFrom_periodTo_key" ON "AnnualCostSettlement"("apartmentId", "periodFrom", "periodTo");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualCostSettlementItem_settlementId_lineNo_key" ON "AnnualCostSettlementItem"("settlementId", "lineNo");

-- CreateIndex
CREATE INDEX "Charge_updatedAt_idx" ON "Charge"("updatedAt");

-- AddForeignKey
ALTER TABLE "UtilitySettlement" ADD CONSTRAINT "UtilitySettlement_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilitySettlementSummary" ADD CONSTRAINT "UtilitySettlementSummary_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "UtilitySettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilitySettlementLine" ADD CONSTRAINT "UtilitySettlementLine_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "UtilitySettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "UtilitySettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualCostSettlement" ADD CONSTRAINT "AnnualCostSettlement_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualCostSettlementItem" ADD CONSTRAINT "AnnualCostSettlementItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "AnnualCostSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
