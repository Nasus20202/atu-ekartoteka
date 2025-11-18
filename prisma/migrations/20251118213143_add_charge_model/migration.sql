-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalLineNo" INTEGER NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Charge_apartmentId_idx" ON "Charge"("apartmentId");

-- CreateIndex
CREATE INDEX "Charge_period_idx" ON "Charge"("period");

-- CreateIndex
CREATE INDEX "Charge_dateFrom_idx" ON "Charge"("dateFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Charge_apartmentId_period_externalLineNo_key" ON "Charge"("apartmentId", "period", "externalLineNo");

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
