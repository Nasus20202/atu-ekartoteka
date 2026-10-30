-- Parameters: $1 = tenant history years back
INSERT INTO "AppSetting" (key, value, "updatedAt")
VALUES ('tenantHistoryYearsBack', to_jsonb($1::int), NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW();
