-- Polish, numeric-aware collation for the text columns sorted by Prisma:
-- "2" before "10" and "Ł" right after "L".
CREATE COLLATION IF NOT EXISTS "pl_numeric" (
    provider = icu,
    locale = 'pl-u-kn-true'
);

-- Apartment labels, addresses and owner names are ordered as text.
ALTER TABLE "Apartment"
    ALTER COLUMN "address" TYPE TEXT COLLATE "pl_numeric",
    ALTER COLUMN "building" TYPE TEXT COLLATE "pl_numeric",
    ALTER COLUMN "number" TYPE TEXT COLLATE "pl_numeric",
    ALTER COLUMN "owner" TYPE TEXT COLLATE "pl_numeric";

-- Users are sorted by name too; emails keep the default collation.
ALTER TABLE "User"
    ALTER COLUMN "name" TYPE TEXT COLLATE "pl_numeric";
