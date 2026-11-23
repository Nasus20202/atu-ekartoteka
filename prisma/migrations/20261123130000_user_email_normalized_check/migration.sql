-- Enforce in the database that user emails are stored in the canonical form
-- used by the application (trimmed and lowercased, see normalizeEmail).
-- Existing rows were normalised by 20261102120000_normalize_user_emails; the
-- application normalises on every write, and this constraint makes a missed
-- code path fail loudly instead of creating a second account for one person.
ALTER TABLE "User"
  ADD CONSTRAINT "User_email_normalized_check"
  CHECK ("email" = lower(btrim("email")));
