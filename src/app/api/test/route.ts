import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET(request: Request) {
  const test3 = `
WITH users_with_feature AS (
  SELECT
    JSON_VALUE(data, '$.email') AS email,
    CAST(SAFE.TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)) AS STRING) AS created_at,
    JSON_VALUE(data, '$.eligible_for_special_regrowth_features') AS eligible_for_special_regrowth_features
    FROM \`keshah-app.firestore_export.users_raw_latest\`
  WHERE JSON_VALUE(data, '$.eligible_for_special_regrowth_features') IS NOT NULL
      AND JSON_QUERY(data, '$.progress.day1') IS NOT NULL

)

SELECT
  COUNTIF(eligible_for_special_regrowth_features = 'true') AS total_true,
  COUNTIF(eligible_for_special_regrowth_features = 'false') AS total_false
FROM users_with_feature;

`;

  const [rows] = await bigquery.query(test3);
  return NextResponse.json(rows[0]);
}
