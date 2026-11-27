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
  s.id || '-l' || v.line_no,
  s.id,
  v.line_no,
  v.kind::"UtilitySettlementLineKind",
  v.description,
  s."periodFrom",
  s."periodTo",
  v.quantity,
  v.price,
  v.quantity * v.price
FROM
  "UtilitySettlement" AS s
  CROSS JOIN (
    VALUES
      (1, 'ADVANCE', 'Zaliczka CW', 20.0, 32.0),
      (
        2,
        'CONSUMPTION',
        'Wyrównanie zaliczek CW',
        14.2,
        32.0
      ),
      (3, 'ADVANCE', 'Zaliczka ZW', 25.0, 12.0),
      (
        4,
        'CONSUMPTION',
        'Wyrównanie zaliczek ZW',
        27.4,
        12.0
      ),
      (5, 'ADVANCE', 'Zaliczka CO (m3)', 30.0, 6.0),
      (
        6,
        'CONSUMPTION',
        'Wyrównanie zaliczki CO',
        5.5,
        6.0
      )
  ) AS v (line_no, kind, description, quantity, price)
WHERE
  s.id LIKE 'perf-us-%'
ON CONFLICT ("settlementId", "lineNo") DO NOTHING
