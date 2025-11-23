-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('CREDENTIALS', 'GOOGLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authMethod" "AuthMethod" DEFAULT 'CREDENTIALS',
ALTER COLUMN "password" DROP NOT NULL;
