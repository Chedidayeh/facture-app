import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET(request: Request) {
  const test3 = `
WITH users_with_feature AS (
  SELECT
    JSON_VALUE(data, '$.email') AS email,
    CAST(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)) AS STRING) AS created_at,
    JSON_VALUE(data, '$.eligible_for_special_regrowth_features') AS eligible_for_special_regrowth_features
    FROM \`keshah-app.analytics.users_latest\`
  WHERE JSON_VALUE(data, '$.eligible_for_special_regrowth_features') IS NOT NULL
      AND JSON_QUERY(data, '$.progress.day1') IS NOT NULL

)

SELECT
  COUNTIF(eligible_for_special_regrowth_features = 'true') AS total_true,
  COUNTIF(eligible_for_special_regrowth_features = 'false') AS total_false
FROM users_with_feature;

`;

  const test = `
WITH filtered_users AS (
  SELECT
    JSON_VALUE(data, '$.email') AS email,
    SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)) AS created_at,
    JSON_VALUE(data, '$.eligible_for_special_regrowth_features') AS eligible_for_special_regrowth_features,
    JSON_VALUE(data, '$.user_type') AS user_type,
    JSON_VALUE(data, '$.userLocalTimeZone') AS userLocalTimeZone
    FROM \`keshah-app.analytics.users_latest\`
  WHERE JSON_VALUE(data, '$.eligible_for_special_regrowth_features') = 'true'
    AND JSON_VALUE(data, '$.user_type') = 'freev2'
    AND DATE(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64))) 
        BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY) AND CURRENT_DATE()
)

SELECT
  COUNT(*) AS total_users,
  ARRAY_AGG(STRUCT(email, created_at, userLocalTimeZone)) AS users
FROM filtered_users;

`;

  const test2 = `

  -- Optimized query with partition pruning, reduced JSON parsing, and faster exercise checks
WITH extracted AS (
  SELECT
    -- Basic fields
    JSON_VALUE(data, '$.email') AS email,
    JSON_VALUE(data, '$.wp_user.ID') AS user_id,

    -- Convert Firestore timestamp
    SAFE.TIMESTAMP_SECONDS(
      CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)
    ) AS created_at,

    JSON_VALUE(data, '$.eligible_for_special_regrowth_features') AS eligible_flag,
    JSON_VALUE(data, '$.user_type') AS user_type,
    JSON_VALUE(data, '$.userLocalTimeZone') AS userLocalTimeZone,

    -- Founder event
    JSON_VALUE(data, '$.founder_onboarding_reserved_spot_calendar_event') AS founder_event,

    -- Extract day1 progress as an ARRAY
    JSON_EXTRACT_ARRAY(JSON_QUERY(data, '$.progress.day1')) AS day1_array
    FROM \`keshah-app.analytics.users_latest\`
  -- PARTITION PRUNING (only scan today/yesterday)
  WHERE DATE(
    SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64))
  ) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY) AND CURRENT_DATE()
)

, filtered AS (
  SELECT *
  FROM extracted
  WHERE
    eligible_flag = 'true'
    AND user_type = 'freev2'
    AND founder_event IS NULL
    AND day1_array IS NOT NULL
    -- Faster completion check: ensure no exercise is incomplete
    AND NOT EXISTS (
      SELECT 1
      FROM UNNEST(day1_array) ex
      WHERE JSON_VALUE(ex, '$.is_completed') != 'true'
        OR JSON_VALUE(ex, '$.is_completed') IS NULL
    )
)

SELECT
  COUNT(*) AS total_users,
  ARRAY_AGG(
    STRUCT(
      user_id,
      email,
      created_at,
      userLocalTimeZone
    )
  ) AS users
FROM filtered;



`;

  const test4 = `
SELECT
  JSON_VALUE(ex, '$.is_completed') AS is_completed_value
    FROM \`keshah-app.analytics.users_latest\` AS u
CROSS JOIN UNNEST(JSON_EXTRACT_ARRAY(JSON_QUERY(u.data, '$.progress.day1'), '$')) AS ex
WHERE JSON_QUERY(u.data, '$.progress.day1') IS NOT NULL
LIMIT 1;

`;

  const [rows] = await bigquery.query(test2);
  return NextResponse.json(rows[0]);
}
