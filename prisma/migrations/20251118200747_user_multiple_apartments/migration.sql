/*
  Warnings:

  - You are about to drop the column `apartmentId` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable (create join table first)
CREATE TABLE "_ApartmentToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ApartmentToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ApartmentToUser_B_index" ON "_ApartmentToUser"("B");

-- Migrate existing data: copy existing user-apartment relationships to the join table
INSERT INTO "_ApartmentToUser" ("A", "B")
SELECT "apartmentId", "id" FROM "User" WHERE "apartmentId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_apartmentId_fkey";

-- DropIndex
DROP INDEX "User_apartmentId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "apartmentId";

-- CreateTable
CREATE TABLE "_ApartmentToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ApartmentToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ApartmentToUser_B_index" ON "_ApartmentToUser"("B");

-- AddForeignKey
ALTER TABLE "_ApartmentToUser" ADD CONSTRAINT "_ApartmentToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApartmentToUser" ADD CONSTRAINT "_ApartmentToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
