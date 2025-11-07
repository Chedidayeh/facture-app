import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_type = searchParams.get("user_type") || "all";
  const range = searchParams.get("range") || "lifetime";

  const startDateParam = searchParams.get("start_date"); // string | null
  let adjustedStartDate: string | null = null;

  if (startDateParam) {
    const start = new Date(startDateParam);
    start.setDate(start.getDate() - 1); // subtract 1 day
    adjustedStartDate = start.toISOString().slice(0, 10);
  }

  // Now use adjustedStartDate in your query
  const endDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const useCustomRange = adjustedStartDate !== null && endDate !== null;

  // Detect if we are in lifetime mode
  const isLifetime = range === "lifetime" && !useCustomRange;

  // Relative range days (+1 for edge cases)
  const rangeDays =
    !isLifetime && !useCustomRange
      ? parseInt(range.replace("d", "")) + 1
      : null;

  const userTypeCondition =
    user_type === "all"
      ? ""
      : `AND JSON_VALUE(data, '$.user_type') = '${user_type}'`;

  // Range filtering
  let rangeFilter = "";
  if (useCustomRange) {
    rangeFilter = `
      AND JSON_VALUE(data, '$.created_at._seconds') IS NOT NULL
      AND DATE(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)))
          BETWEEN DATE('${adjustedStartDate}') AND DATE('${endDate}')
    `;
  } else if (!isLifetime) {
    rangeFilter = `
      AND JSON_VALUE(data, '$.created_at._seconds') IS NOT NULL
      AND DATE(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)))
          BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL ${rangeDays} DAY) AND CURRENT_DATE()
    `;
  }

  const includeNullCreatedAt = isLifetime ? "DATE(created_at) IS NULL OR " : "";

  const query = `
WITH users AS (
  SELECT
    JSON_VALUE(data, '$.email') AS email,
    SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)) AS created_at,
    JSON_QUERY(data, '$.progress') AS progress
  FROM \`keshah-app.firestore_export.users_raw_latest\`
  WHERE JSON_QUERY(data, '$.progress') IS NOT NULL
    ${userTypeCondition}
    ${rangeFilter}
),

retention AS (
  SELECT
    -- Eligible users
    COUNTIF(${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)) AS eligible_day1,
    COUNTIF(${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 4 DAY)) AS eligible_day3,
    COUNTIF(${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)) AS eligible_day7,
    COUNTIF(${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 16 DAY)) AS eligible_day15,
    COUNTIF(${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY)) AS eligible_day30,
    COUNTIF(${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 61 DAY)) AS eligible_day60,
    COUNTIF(${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 91 DAY)) AS eligible_day90,

    -- Active users
    COUNTIF(JSON_QUERY(progress, '$.day1') IS NOT NULL AND (${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))) AS day1_active,
    COUNTIF(JSON_QUERY(progress, '$.day3') IS NOT NULL AND (${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 4 DAY))) AS day3_active,
    COUNTIF(JSON_QUERY(progress, '$.day7') IS NOT NULL AND (${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY))) AS day7_active,
    COUNTIF(JSON_QUERY(progress, '$.day15') IS NOT NULL AND (${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 16 DAY))) AS day15_active,
    COUNTIF(JSON_QUERY(progress, '$.day30') IS NOT NULL AND (${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY))) AS day30_active,
    COUNTIF(JSON_QUERY(progress, '$.day60') IS NOT NULL AND (${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 61 DAY))) AS day60_active,
    COUNTIF(JSON_QUERY(progress, '$.day90') IS NOT NULL AND (${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 91 DAY))) AS day90_active,

    -- Completed exercises retention
    COUNTIF((${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
      AND (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed') = 'true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day1')) FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day1')) AS ex)
    ) AS day1_completed_active,

    COUNTIF((${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 4 DAY))
      AND (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed') = 'true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day3')) FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day3')) AS ex)
    ) AS day3_completed_active,

    COUNTIF((${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY))
      AND (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed') = 'true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day7')) FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day7')) AS ex)
    ) AS day7_completed_active,

    COUNTIF((${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 16 DAY))
      AND (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed') = 'true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day15')) FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day15')) AS ex)
    ) AS day15_completed_active,

    COUNTIF((${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY))
      AND (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed') = 'true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day30')) FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day30')) AS ex)
    ) AS day30_completed_active,

    COUNTIF((${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 61 DAY))
      AND (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed') = 'true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day60')) FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day60')) AS ex)
    ) AS day60_completed_active,

    COUNTIF((${includeNullCreatedAt} DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL 91 DAY))
      AND (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed') = 'true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day90')) FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day90')) AS ex)
    ) AS day90_completed_active
  FROM users
)

SELECT
  ROUND(100 * (day1_active / NULLIF(eligible_day1, 0)), 2) AS day1_retention,
  eligible_day1 AS day1_users,
  ROUND(100 * (day3_active / NULLIF(eligible_day3, 0)), 2) AS day3_retention,
  eligible_day3 AS day3_users,
  ROUND(100 * (day7_active / NULLIF(eligible_day7, 0)), 2) AS day7_retention,
  eligible_day7 AS day7_users,
  ROUND(100 * (day15_active / NULLIF(eligible_day15, 0)), 2) AS day15_retention,
  eligible_day15 AS day15_users,
  ROUND(100 * (day30_active / NULLIF(eligible_day30, 0)), 2) AS day30_retention,
  eligible_day30 AS day30_users,
  ROUND(100 * (day60_active / NULLIF(eligible_day60, 0)), 2) AS day60_retention,
  eligible_day60 AS day60_users,
  ROUND(100 * (day90_active / NULLIF(eligible_day90, 0)), 2) AS day90_retention,
  eligible_day90 AS day90_users,

  ROUND(100 * (day1_completed_active / NULLIF(eligible_day1, 0)), 2) AS day1_completed_retention,
  ROUND(100 * (day3_completed_active / NULLIF(eligible_day3, 0)), 2) AS day3_completed_retention,
  ROUND(100 * (day7_completed_active / NULLIF(eligible_day7, 0)), 2) AS day7_completed_retention,
  ROUND(100 * (day15_completed_active / NULLIF(eligible_day15, 0)), 2) AS day15_completed_retention,
  ROUND(100 * (day30_completed_active / NULLIF(eligible_day30, 0)), 2) AS day30_completed_retention,
  ROUND(100 * (day60_completed_active / NULLIF(eligible_day60, 0)), 2) AS day60_completed_retention,
  ROUND(100 * (day90_completed_active / NULLIF(eligible_day90, 0)), 2) AS day90_completed_retention
FROM retention;
`;

  // Optional: calculate days in custom range
  let customRangeDays = null;
  if (useCustomRange) {
    const start = new Date(adjustedStartDate!);
    const end = new Date(endDate!);
    customRangeDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  const [rows] = await bigquery.query(query);

  return NextResponse.json({
    ...rows[0],
    customRangeDays,
    isCustomRange: useCustomRange,
  });
}
