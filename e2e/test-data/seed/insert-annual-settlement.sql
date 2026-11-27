-- Insert one annual cost settlement with its items
-- Parameters: $1 = apartment id, $2 = header, $3 = items (both as JSON)
WITH
  settlement AS (
    INSERT INTO
      "AnnualCostSettlement" (
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
  items AS (
    INSERT INTO
      "AnnualCostSettlementItem" (
        id,
        "settlementId",
        "lineNo",
        title,
        "basisDescription",
        "periodFrom",
        "periodTo",
        "communityAmount",
        "flatBasis",
        "communityBasis",
        coefficient,
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
        title TEXT,
        "basisDescription" TEXT,
        "periodFrom" TIMESTAMP,
        "periodTo" TIMESTAMP,
        "communityAmount" NUMERIC,
        "flatBasis" NUMERIC,
        "communityBasis" NUMERIC,
        coefficient NUMERIC,
        amount NUMERIC
      )
  )
SELECT
  id
FROM
  settlement
