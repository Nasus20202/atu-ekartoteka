-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "privacyPolicy" TEXT;

-- NULL means "not configured"; the check passes for NULL.
ALTER TABLE "AppSettings"
  ADD CONSTRAINT "AppSettings_privacyPolicy_length" CHECK (char_length("privacyPolicy") <= 50000);
