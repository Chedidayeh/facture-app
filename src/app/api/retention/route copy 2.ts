import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_type = searchParams.get("user_type") || "all";
  const range = searchParams.get("range") || "lifetime";
  // const range = "7d";

  const startDateParam = searchParams.get("start_date");
  let adjustedStartDate: string | null = null;

  if (startDateParam) {
    const start = new Date(startDateParam);
    start.setDate(start.getDate() - 1);
    adjustedStartDate = start.toISOString().slice(0, 10);
    console.log("Adjusted Start Date:", adjustedStartDate);
  }

  const endDate = new Date().toISOString().slice(0, 10);
  const useCustomRange = adjustedStartDate !== null && endDate !== null;
  const isLifetime = range === "lifetime" && !useCustomRange;

  const rangeDays =
    !isLifetime && !useCustomRange
      ? parseInt(range.replace("d", "")) + 1
      : null;


  let userTypeCondition = "";

  if (user_type === "all") {
    userTypeCondition = "";
  } else if (user_type === "eligible_true") {
    userTypeCondition = `AND JSON_VALUE(data, '$.eligible_for_special_regrowth_features') = 'true' AND JSON_VALUE(data, '$.user_type') = 'freev2'`;
  } else if (user_type === "eligible_false") {
    userTypeCondition = `AND JSON_VALUE(data, '$.eligible_for_special_regrowth_features') = 'false' AND JSON_VALUE(data, '$.user_type') = 'freev2'`;
  } else {
    // existing types like 'free', 'vip'
    userTypeCondition = `AND JSON_VALUE(data, '$.user_type') = '${user_type}'`;
  }

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

  const eligibilityDay = (days: number) =>
    `(DATE(created_at) IS NULL OR DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))`;

  // const eligibilityDay = (dayNumber: number) =>
  //   `(DATE(created_at) IS NULL OR DATE(created_at) <= DATE_SUB(CURRENT_DATE(), INTERVAL ${dayNumber} DAY))
  //    AND JSON_QUERY(progress, '$.day${dayNumber > 1 ? dayNumber - 1 : dayNumber}') IS NOT NULL`;

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
    COUNTIF(${eligibilityDay(1)}) AS eligible_day1,
    COUNTIF(${eligibilityDay(4)}) AS eligible_day3,
    COUNTIF(${eligibilityDay(8)}) AS eligible_day7,
    COUNTIF(${eligibilityDay(16)}) AS eligible_day15,
    COUNTIF(${eligibilityDay(31)}) AS eligible_day30,
    COUNTIF(${eligibilityDay(61)}) AS eligible_day60,
    COUNTIF(${eligibilityDay(91)}) AS eligible_day90,

    -- Active users
    COUNTIF(JSON_QUERY(progress, '$.day1') IS NOT NULL AND ${eligibilityDay(
      1
    )}) AS day1_active,
    COUNTIF(JSON_QUERY(progress, '$.day3') IS NOT NULL AND ${eligibilityDay(
      4
    )}) AS day3_active,
    COUNTIF(JSON_QUERY(progress, '$.day7') IS NOT NULL AND ${eligibilityDay(
      8
    )}) AS day7_active,
    COUNTIF(JSON_QUERY(progress, '$.day15') IS NOT NULL AND ${eligibilityDay(
      16
    )}) AS day15_active,
    COUNTIF(JSON_QUERY(progress, '$.day30') IS NOT NULL AND ${eligibilityDay(
      31
    )}) AS day30_active,
    COUNTIF(JSON_QUERY(progress, '$.day60') IS NOT NULL AND ${eligibilityDay(
      61
    )}) AS day60_active,
    COUNTIF(JSON_QUERY(progress, '$.day90') IS NOT NULL AND ${eligibilityDay(
      91
    )}) AS day90_active,

    -- Completed exercises
    COUNTIF(
      ${eligibilityDay(1)} AND 
      (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed')='true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day1'))
       FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day1')) AS ex)
    ) AS day1_completed_active,

    COUNTIF(
      ${eligibilityDay(4)} AND 
      (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed')='true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day3'))
       FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day3')) AS ex)
    ) AS day3_completed_active,

    COUNTIF(
      ${eligibilityDay(8)} AND 
      (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed')='true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day7'))
       FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day7')) AS ex)
    ) AS day7_completed_active,

    COUNTIF(
      ${eligibilityDay(16)} AND 
      (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed')='true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day15'))
       FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day15')) AS ex)
    ) AS day15_completed_active,

    COUNTIF(
      ${eligibilityDay(31)} AND 
      (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed')='true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day30'))
       FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day30')) AS ex)
    ) AS day30_completed_active,

    COUNTIF(
      ${eligibilityDay(61)} AND 
      (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed')='true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day60'))
       FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day60')) AS ex)
    ) AS day60_completed_active,

    COUNTIF(
      ${eligibilityDay(91)} AND 
      (SELECT COUNTIF(JSON_VALUE(ex, '$.is_completed')='true') = ARRAY_LENGTH(JSON_EXTRACT_ARRAY(progress, '$.day90'))
       FROM UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day90')) AS ex)
    ) AS day90_completed_active
  FROM users
),

day1_per_exercise AS (
  SELECT
    exercise_offset + 1 AS exercise_index,
    COUNTIF(${eligibilityDay(
      1
    )} AND JSON_VALUE(ex, '$.is_completed') = 'true') AS users_completed_exercise,
    COUNTIF(${eligibilityDay(1)}) AS eligible_users_with_exercise
  FROM users,
  UNNEST(JSON_EXTRACT_ARRAY(progress, '$.day1')) AS ex WITH OFFSET AS exercise_offset
  WHERE JSON_QUERY(progress, '$.day1') IS NOT NULL
    AND exercise_offset < 4
  GROUP BY exercise_offset
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
  ROUND(100 * (day90_completed_active / NULLIF(eligible_day90, 0)), 2) AS day90_completed_retention,
  
  -- Day 1 per-exercise completion breakdown
  (
    SELECT ARRAY_AGG(
      STRUCT(
        exercise_index,
        users_completed_exercise,
        eligible_users_with_exercise,
        ROUND(100 * (users_completed_exercise / NULLIF(eligible_users_with_exercise, 0)), 2) AS exercise_completion_percentage
      )
      ORDER BY exercise_index
    )
    FROM day1_per_exercise
  ) AS day1_exercise_completion
FROM retention;
`;

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
