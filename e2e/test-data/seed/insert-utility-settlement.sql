-- Insert one utility settlement with its rows
-- Parameters: $1 = apartment id, $2 = header, $3 = summary rows, $4 = lines,
--             $5 = meter readings (all but $1 as JSON)
WITH
  settlement AS (
    INSERT INTO
      "UtilitySettlement" (
        id,
        "apartmentId",
        "periodFrom",
        "periodTo",
        "issuedOn",
        "printedOwner",
        "sourceFileName",
        "totalAmount",
        "createdAt",
        "updatedAt"
      )
    SELECT
      gen_random_uuid(),
      $1,
      header.*,
      NOW(),
      NOW()
    FROM
      jsonb_to_record($2::JSONB) AS header (
        "periodFrom" TIMESTAMP,
        "periodTo" TIMESTAMP,
        "issuedOn" TIMESTAMP,
        "printedOwner" TEXT,
        "sourceFileName" TEXT,
        "totalAmount" NUMERIC
      )
    RETURNING
      id
  ),
  summaries AS (
    INSERT INTO
      "UtilitySettlementSummary" (
        id,
        "settlementId",
        "lineNo",
        code,
        consumption,
        "advanceQuantity",
        difference,
        amount
      )
    SELECT
      gen_random_uuid(),
      settlement.id,
      entry.*
    FROM
      settlement,
      jsonb_to_recordset($3::JSONB) AS entry (
        "lineNo" INTEGER,
        code TEXT,
        consumption NUMERIC,
        "advanceQuantity" NUMERIC,
        difference NUMERIC,
        amount NUMERIC
      )
  ),
  lines AS (
    INSERT INTO
      "UtilitySettlementLine" (
        id,
        "settlementId",
        "lineNo",
        kind,
        description,
        "dateFrom",
        "dateTo",
        quantity,
        "unitPrice",
        amount
      )
    SELECT
      gen_random_uuid(),
      settlement.id,
      entry."lineNo",
      entry.kind::"UtilitySettlementLineKind",
      entry.description,
      entry."dateFrom",
      entry."dateTo",
      entry.quantity,
      entry."unitPrice",
      entry.amount
    FROM
      settlement,
      jsonb_to_recordset($4::JSONB) AS entry (
        "lineNo" INTEGER,
        kind TEXT,
        description TEXT,
        "dateFrom" TIMESTAMP,
        "dateTo" TIMESTAMP,
        quantity NUMERIC,
        "unitPrice" NUMERIC,
        amount NUMERIC
      )
  ),
  readings AS (
    INSERT INTO
      "MeterReading" (
        id,
        "settlementId",
        "lineNo",
        device,
        "serialNumber",
        label,
        unit,
        "startDate",
        "startValue",
        "endDate",
        "endValue",
        consumption
      )
    SELECT
      gen_random_uuid(),
      settlement.id,
      entry.*
    FROM
      settlement,
      jsonb_to_recordset($5::JSONB) AS entry (
        "lineNo" INTEGER,
        device TEXT,
        "serialNumber" TEXT,
        label TEXT,
        unit TEXT,
        "startDate" TIMESTAMP,
        "startValue" NUMERIC,
        "endDate" TIMESTAMP,
        "endValue" NUMERIC,
        consumption NUMERIC
      )
  )
SELECT
  id
FROM
  settlement
