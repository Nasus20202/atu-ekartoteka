-- CreateTable
CREATE TABLE "ChargeNotification" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL,
    "totalCharges" DOUBLE PRECISION NOT NULL,
    "closingBalance" DOUBLE PRECISION NOT NULL,
    "january" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "february" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "march" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "april" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "may" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "june" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "july" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "august" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "september" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "october" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "november" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "december" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChargeNotification_apartmentId_idx" ON "ChargeNotification"("apartmentId");

-- CreateIndex
CREATE INDEX "ChargeNotification_externalId_idx" ON "ChargeNotification"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ChargeNotification_apartmentId_lineNo_key" ON "ChargeNotification"("apartmentId", "lineNo");

-- CreateIndex
CREATE INDEX "Payment_apartmentId_idx" ON "Payment"("apartmentId");

-- CreateIndex
CREATE INDEX "Payment_year_idx" ON "Payment"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_apartmentId_year_key" ON "Payment"("apartmentId", "year");

-- AddForeignKey
ALTER TABLE "ChargeNotification" ADD CONSTRAINT "ChargeNotification_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
