/*
  Warnings:

  - Added the required column `homeownersAssociationId` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Apartment" ADD COLUMN     "homeownersAssociationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "HomeownersAssociation" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeownersAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeownersAssociation_externalId_key" ON "HomeownersAssociation"("externalId");

-- CreateIndex
CREATE INDEX "HomeownersAssociation_externalId_idx" ON "HomeownersAssociation"("externalId");

-- CreateIndex
CREATE INDEX "Apartment_homeownersAssociationId_idx" ON "Apartment"("homeownersAssociationId");

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_homeownersAssociationId_fkey" FOREIGN KEY ("homeownersAssociationId") REFERENCES "HomeownersAssociation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
