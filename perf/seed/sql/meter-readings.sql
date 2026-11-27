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
  s.id || '-r' || v.line_no,
  s.id,
  v.line_no,
  v.device,
  s."apartmentId" || '-' || v.line_no,
  v.label,
  'm3',
  s."periodFrom",
  100,
  s."periodTo",
  100 + v.consumption,
  v.consumption
FROM
  "UtilitySettlement" AS s
  CROSS JOIN (
    VALUES
      (1, 'CO 01', 'CO mieszkania', 5.5),
      (2, 'CW 01', 'Ciepła woda', 14.2),
      (3, 'ZW 01', 'Zimna woda', 27.4)
  ) AS v (line_no, device, label, consumption)
WHERE
  s.id LIKE 'perf-us-%'
ON CONFLICT ("settlementId", "lineNo") DO NOTHING
