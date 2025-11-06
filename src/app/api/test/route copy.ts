import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_type = searchParams.get("user_type") || "all";
  const range = searchParams.get("range") || "90d";

  const userTypeCondition =
    user_type === "all"
      ? ""
      : `AND JSON_VALUE(data, '$.user_type') = '${user_type}'`;

  // Define which days to include for each range
  const dayMap: Record<string, string[]> = {
    "3d": ["day1", "day3"],
    "7d": ["day1", "day3", "day7"],
    "15d": ["day1", "day3", "day7", "day15"],
    "30d": ["day1", "day3", "day7", "day15", "day30"],
    "60d": ["day1", "day3", "day7", "day15", "day30", "day60"],
    "90d": ["day1", "day3", "day7", "day15", "day30", "day60", "day90"],
  };

  const selectedDays = dayMap[range] || dayMap["7d"];
  
  // Get the range in days for filtering eligible users
  const rangeInDays = parseInt(range.replace("d", ""));

  // Build dynamic SELECT expressions
  const selectClauses: string[] = [];
  const completedClauses: string[] = [];

  for (const day of selectedDays) {
    selectClauses.push(`
      ROUND(100 * (${day}_active / NULLIF(eligible_${day}, 0)), 2) AS ${day}_retention,
      eligible_${day} AS ${day}_users
    `);

    completedClauses.push(`
      ROUND(100 * (${day}_completed_active / NULLIF(eligible_${day}, 0)), 2) AS ${day}_completed_retention
    `);
  }

  // Join clauses for the final SELECT
  const dynamicSelect = [...selectClauses, ...completedClauses].join(",\n");

  // ✅ Build final SQL query dynamically
  const query = `
WITH users AS (
  SELECT
    JSON_VALUE(data, '$.email') AS email,
    SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)) AS created_at,
    JSON_QUERY(data, '$.progress') AS progress
  FROM
    \`keshah-app.firestore_export.users_raw_latest\`
  WHERE
    JSON_QUERY(data, '$.progress') IS NOT NULL
    ${userTypeCondition}
),

retention AS (
  SELECT
    -- Eligible users (created within the selected range)
    ${selectedDays
      .map(
        (day) => {
          const dayThreshold = getDayThreshold(day);
          return `COUNTIF((DATE(created_at) IS NULL OR (DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL ${dayThreshold} DAY) AND DATE(created_at) > DATE_SUB(CURRENT_DATE(), INTERVAL ${rangeInDays + 1} DAY)))) AS eligible_${day}`;
        }
      )
      .join(",\n")},

    -- Active users (created within the selected range)
    ${selectedDays
      .map(
        (day) =>
          `COUNTIF(JSON_QUERY(progress, '$.${day}') IS NOT NULL AND (DATE(created_at) IS NULL OR (DATE(created_at) > DATE_SUB(CURRENT_DATE(), INTERVAL ${rangeInDays} DAY) AND DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL ${
            day.replace("day", "") === "1" ? "1" : parseInt(day.replace("day", "")) + 1
          } DAY)))) AS ${day}_active`
      )
      .join(",\n")},

    -- Completed exercises retention (created within the selected range)
    ${selectedDays
      .map(
        (day) => `
    COUNTIF(
      (DATE(created_at) IS NULL OR (DATE(created_at) > DATE_SUB(CURRENT_DATE(), INTERVAL ${rangeInDays} DAY) AND DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL ${
        day.replace("day", "") === "1" ? "1" : parseInt(day.replace("day", "")) + 1
      } DAY)))
      AND (
        SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed') = 'true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.${day}'))
        FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.${day}')) AS ex
      )
    ) AS ${day}_completed_active`
      )
      .join(",\n")}
  FROM users
)

SELECT
  ${dynamicSelect}
FROM retention;
`;

  // ✅ Execute query
  const [rows] = await bigquery.query(query);
  return NextResponse.json(rows[0]);
}

// Helper function to get the minimum days required for a metric
const getDayThreshold = (day: string): number => {
  const dayNum = parseInt(day.replace("day", ""));
  return dayNum - 1; // day1 = 0 days old, day7 = 6 days old
};
