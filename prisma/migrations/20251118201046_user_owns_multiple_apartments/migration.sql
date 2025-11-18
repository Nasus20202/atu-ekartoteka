/*
  Warnings:

  - You are about to drop the column `apartmentId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable (add userId column to Apartment first)
ALTER TABLE "Apartment" ADD COLUMN "userId" TEXT;

-- Migrate existing data: move apartmentId from User to userId in Apartment
UPDATE "Apartment" SET "userId" = "User"."id"
FROM "User" 
WHERE "User"."apartmentId" = "Apartment"."id";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_apartmentId_fkey";

-- DropIndex
DROP INDEX "User_apartmentId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "apartmentId";

-- CreateIndex
CREATE INDEX "Apartment_userId_idx" ON "Apartment"("userId");

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
