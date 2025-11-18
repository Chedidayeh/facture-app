// app/api/user-stats/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET() {
    try {




        // Reported reduction only
        const hairLossReduced = ` SELECT
  COUNT(*) AS total_users,

  COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') = 'true') AS reported_reduction,

  ROUND(
    100 * SAFE_DIVIDE(
      COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') = 'true'),
      COUNT(*)
    ),
    2
  ) AS reduction_percentage_of_total,

  COUNTIF(
    JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') = 'true' AND
    JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true'
  ) AS purchased_regrowth,

  ROUND(
    100 * SAFE_DIVIDE(
      COUNTIF(
        JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') = 'true' AND
        JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true'
      ),
      COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') = 'true')
    ),
    2
  ) AS purchased_percentage_of_reduction,

  ROUND(
    100 * SAFE_DIVIDE(
      COUNTIF(
        JSON_EXTRACT_SCALAR(data, '$.hair_loss_reduced_reported_once') = 'true' AND
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

        // Reported success (stoppage)
        const hairLossStopped = ` SELECT
COUNT(*) AS total_users,
COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true') AS reported_hair_loss_stopped,
ROUND(
  100 * COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true') / COUNT(*),
  2
) AS stopped_percentage_of_total,

COUNTIF(
  JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true' AND
  JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true'
) AS purchased_regrowth,

ROUND(
  100 * COUNTIF(
    JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true' AND
    JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true'
  ) / COUNTIF(JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true'),
  2
) AS purchased_percentage_of_reduction,

ROUND(
  100 * COUNTIF(
    JSON_EXTRACT_SCALAR(data, '$.hair_loss_stoppage_reported_once') = 'true' AND
    JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true'
  ) / COUNT(*),
  2
) AS purchased_percentage_of_total
FROM \`keshah-app.firestore_export.users_raw_latest\`
WHERE JSON_EXTRACT_SCALAR(data, '$.user_type') = 'freev2'
AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') != ''
`


    // Run both queries
    const [finalResultHairLossReduced] = await bigquery.query({ query: hairLossReduced });
    const [finalResultHairLossStopped] = await bigquery.query({ query: hairLossStopped });

    // Return combined JSON response
    return NextResponse.json({
      reduction: finalResultHairLossReduced[0],
      stopped: finalResultHairLossStopped[0]
    });


    } catch (error: any) {
        console.error("BigQuery error:", error);
    }
}

