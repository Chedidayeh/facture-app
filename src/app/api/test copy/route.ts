// app/api/user-stats/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET() {
  try {



    const users_raw_latest = `SELECT data
FROM \`keshah-app.firestore_export.users_raw_latest\`
Limit 6
`;

    const pchecka_raw_latest = `SELECT data
FROM \`keshah-app.firestore_export.pchecka_raw_latest\`
Limit 20
`;

    const data2 = `
-- Total number of users
SELECT COUNT(*) AS total_users_with_fields
FROM \`keshah-app.firestore_export.users_raw_latest\` 
WHERE JSON_EXTRACT(data, '$.scalp_health_support_purchased') IS NOT NULL
   OR JSON_EXTRACT(data, '$.regrowth_treatment_purchased') IS NOT NULL;

`;

    const data3 = `-- Details for each user
SELECT
    JSON_EXTRACT_SCALAR(data, '$.scalp_health_support_purchased') AS scalp_health_support_purchased,
  JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') AS regrowth_treatment_purchased
FROM \`keshah-app.firestore_export.users_raw_latest\`
WHERE JSON_EXTRACT(data, '$.scalp_health_support_purchased') IS NOT NULL
   OR JSON_EXTRACT(data, '$.regrowth_treatment_purchased') IS NOT NULL;
`;

    const data4 = `
  SELECT
    JSON_EXTRACT_SCALAR(data, '$.wp_user.ID') AS user_id,
    JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') AS regrowth_treatment_purchased,
    JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') AS hair_loss_stoppage_reported_once,
    JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') AS hair_loss_reduced_reported_once
  FROM \`keshah-app.firestore_export.users_raw_latest\`
  WHERE JSON_EXTRACT(data, '$.hair_loss_stoppage_reported_once') IS NOT NULL
    OR JSON_EXTRACT(data, '$.hair_loss_reduced_reported_once') IS NOT NULL
    OR JSON_EXTRACT(data, '$.regrowth_treatment_purchased') IS NOT NULL
`;

    const data5 = `
WITH parsed AS (
  SELECT
    CAST(JSON_VALUE(data, '$.day') AS INT64) AS day,
    CAST(JSON_VALUE(data, '$.answers.0') AS INT64) AS q1,
    CAST(JSON_VALUE(data, '$.answers.1') AS INT64) AS q2,
    CAST(JSON_VALUE(data, '$.answers.2') AS INT64) AS q3,
    CAST(JSON_VALUE(data, '$.answers.3') AS INT64) AS q4,
    CAST(JSON_VALUE(data, '$.answers.4') AS INT64) AS q5,
    CAST(JSON_VALUE(data, '$.answers.5') AS INT64) AS q6,
    CAST(JSON_VALUE(data, '$.answers.6') AS INT64) AS q7
  FROM \`keshah-app.firestore_export.pchecka_raw_latest\`
)

SELECT
  day AS week,
  
  COUNTIF(q1 = 1) AS q1_yes,
  COUNTIF(q1 = 0) AS q1_no,
  ROUND(100 * COUNTIF(q1 = 1)/COUNT(*), 2) AS q1_pct_yes,
  ROUND(100 * COUNTIF(q1 = 0)/COUNT(*), 2) AS q1_pct_no,
  
  COUNTIF(q2 = 1) AS q2_yes,
  COUNTIF(q2 = 0) AS q2_no,
  ROUND(100 * COUNTIF(q2 = 1)/COUNT(*), 2) AS q2_pct_yes,
  ROUND(100 * COUNTIF(q2 = 0)/COUNT(*), 2) AS q2_pct_no,
  
  COUNTIF(q3 = 1) AS q3_yes,
  COUNTIF(q3 = 0) AS q3_no,
  ROUND(100 * COUNTIF(q3 = 1)/COUNT(*), 2) AS q3_pct_yes,
  ROUND(100 * COUNTIF(q3 = 0)/COUNT(*), 2) AS q3_pct_no,
  
  COUNTIF(q4 = 1) AS q4_yes,
  COUNTIF(q4 = 0) AS q4_no,
  ROUND(100 * COUNTIF(q4 = 1)/COUNT(*), 2) AS q4_pct_yes,
  ROUND(100 * COUNTIF(q4 = 0)/COUNT(*), 2) AS q4_pct_no,
  
  COUNTIF(q5 = 1) AS q5_yes,
  COUNTIF(q5 = 0) AS q5_no,
  ROUND(100 * COUNTIF(q5 = 1)/COUNT(*), 2) AS q5_pct_yes,
  ROUND(100 * COUNTIF(q5 = 0)/COUNT(*), 2) AS q5_pct_no,
  
  COUNTIF(q6 = 1) AS q6_yes,
  COUNTIF(q6 = 0) AS q6_no,
  ROUND(100 * COUNTIF(q6 = 1)/COUNT(*), 2) AS q6_pct_yes,
  ROUND(100 * COUNTIF(q6 = 0)/COUNT(*), 2) AS q6_pct_no,
  
  COUNTIF(q7 = 1) AS q7_yes,
  COUNTIF(q7 = 0) AS q7_no,
  ROUND(100 * COUNTIF(q7 = 1)/COUNT(*), 2) AS q7_pct_yes,
  ROUND(100 * COUNTIF(q7 = 0)/COUNT(*), 2) AS q7_pct_no

FROM parsed
GROUP BY week
ORDER BY week;
`;




      const test1 = 
`
SELECT
  COUNT(*) AS total_users
FROM
  \`keshah-app.firestore_export.users_raw_latest\`
WHERE JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') IS NOT NULL
  OR JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') IS NOT NULL
`;


        // Reported reduction only
        const test2 = 
` SELECT
COUNT(*) AS total_users,
COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') = 'true') AS reported_reduction
FROM \`keshah-app.firestore_export.users_raw_latest\`
WHERE JSON_EXTRACT_SCALAR(data, '$.user_type') = 'freev2'
AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') != ''
`


      const hairLossStopped = ` SELECT
  COUNT(*) AS total_users,

  COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true') AS reported_hair_loss_stopped,

  COUNTIF(
    JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true' AND
    JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true'
  ) AS purchased_regrowth,

  ROUND(
    100 * SAFE_DIVIDE(
      COUNTIF(
        JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true' AND
        JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true'
      ),
      COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true')
    ),
    2
  ) AS purchased_percentage_of_reduction,

  ROUND(
    100 * SAFE_DIVIDE(
      COUNTIF(
        JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true' AND
        JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true'
      ),
      COUNT(*)
    ),
    2
  ) AS purchased_percentage_of_total

FROM \`keshah-app.firestore_export.users_raw_latest\`

WHERE JSON_EXTRACT_SCALAR(data, '$.user_type') = 'freev2'
  AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
  AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') != ''

      `





    const result = await bigquery.query({ query: users_raw_latest });

    console.log("result", result)



    return NextResponse.json(result[0]);




  } catch (error: any) {
    console.error("BigQuery error:", error);
  }
}

