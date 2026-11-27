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
  s.id || '-i' || v.line_no,
  s.id,
  v.line_no,
  'ROZLICZENIE KOSZTÓW - ' || upper(v.basis),
  v.basis,
  s."periodFrom",
  s."periodTo",
  v.community_amount,
  v.flat_basis,
  v.community_basis,
  v.coefficient,
  v.community_amount * v.coefficient
FROM
  "AnnualCostSettlement" AS s
  CROSS JOIN (
    VALUES
      (
        1,
        'Wyrównanie zaliczek CW',
        -1000.0,
        3600.0,
        36000.0,
        0.1
      ),
      (
        2,
        'Wyrównanie zaliczki CO (m3)',
        -800.0,
        2400.0,
        32000.0,
        0.075
      ),
      (
        3,
        'Opłata za miejsce parkingowe',
        -400.0,
        300.0,
        3000.0,
        0.1
      ),
      (
        4,
        'Utrzymanie dźwigu',
        120.0,
        120.0,
        2400.0,
        0.05
      )
  ) AS v (
    line_no,
    basis,
    community_amount,
    flat_basis,
    community_basis,
    coefficient
  )
WHERE
  s.id LIKE 'perf-as-%'
ON CONFLICT ("settlementId", "lineNo") DO NOTHING
