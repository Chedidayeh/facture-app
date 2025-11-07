import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_type = searchParams.get("user_type") || "all";
  const range = searchParams.get("range") || "90d";

  // Extract number of days from "7d", "30d", etc.
  const rangeDays = parseInt(range.replace("d", "")) || 90;

  const userTypeCondition =
    user_type === "all" ? "" : `AND JSON_VALUE(data, '$.user_type') = '${user_type}'`;

const TEST_90D_PROGRESS_QUERY = `
WITH recent_users AS (
  SELECT
    JSON_VALUE(data, '$.email') AS email,
    SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)) AS created_at,
    JSON_QUERY(data, '$.progress') AS full_progress,
    JSON_QUERY(data, '$.progress.day1') IS NOT NULL AS has_day1,
    JSON_QUERY(data, '$.progress.day3') IS NOT NULL AS has_day3,
    JSON_QUERY(data, '$.progress.day7') IS NOT NULL AS has_day7,
    JSON_QUERY(data, '$.progress.day15') IS NOT NULL AS has_day15,
    JSON_QUERY(data, '$.progress.day30') IS NOT NULL AS has_day30,
    JSON_QUERY(data, '$.progress.day60') IS NOT NULL AS has_day60,
    JSON_QUERY(data, '$.progress.day90') IS NOT NULL AS has_day90
  FROM \`keshah-app.firestore_export.users_raw_latest\`
  WHERE
    JSON_QUERY(data, '$.progress') IS NOT NULL
    AND DATE(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64))) 
        BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 9999 DAY)
        AND CURRENT_DATE()
)

SELECT
  COUNT(*) AS total_users_in_range,
  COUNTIF(has_day1) AS users_with_day1,
  COUNTIF(has_day3) AS users_with_day3,
  COUNTIF(has_day7) AS users_with_day7,
  COUNTIF(has_day15) AS users_with_day15,
  COUNTIF(has_day30) AS users_with_day30,
  COUNTIF(has_day60) AS users_with_day60,
  COUNTIF(has_day90) AS users_with_day90,
  ROUND(100 * COUNTIF(has_day1) / COUNT(*), 2) AS pct_day1,
  ROUND(100 * COUNTIF(has_day3) / COUNT(*), 2) AS pct_day3,
  ROUND(100 * COUNTIF(has_day7) / COUNT(*), 2) AS pct_day7,
  ROUND(100 * COUNTIF(has_day15) / COUNT(*), 2) AS pct_day15,
  ROUND(100 * COUNTIF(has_day30) / COUNT(*), 2) AS pct_day30,
  ROUND(100 * COUNTIF(has_day60) / COUNT(*), 2) AS pct_day60,
  ROUND(100 * COUNTIF(has_day90) / COUNT(*), 2) AS pct_day90
FROM recent_users;

`;


  const [rows] = await bigquery.query(TEST_90D_PROGRESS_QUERY);
  return NextResponse.json(rows[0]);
}
