import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery"; // your BigQuery client

export async function GET() {
  try {

    // --- Scalp Health Query ---
    const scalpHealthOverallQuery = `
    SELECT
      COUNT(*) AS total_users,
      COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.scalp_health_support_purchased') = 'true', 1, NULL)) AS total_purchased,
      ROUND(
        COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.scalp_health_support_purchased') = 'true', 1, NULL)) 
        / COUNT(*) * 100, 2
      ) AS purchase_percentage
    FROM \`keshah-app.firestore_export.users_raw_latest\`
    WHERE JSON_EXTRACT_SCALAR(data, '$.user_type') = 'freev2'
  `;

  const scalpHealthOverallQuery2 = `
  SELECT
    COUNT(*) AS total_users,
    COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.scalp_health_support_purchased') = 'true', 1, NULL)) AS total_purchased,
    ROUND(
      COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.scalp_health_support_purchased') = 'true', 1, NULL)) 
      / COUNT(*) * 100, 2
    ) AS purchase_percentage
  FROM \`keshah-app.firestore_export.users_raw_latest\`
  WHERE JSON_EXTRACT_SCALAR(data, '$.user_type') = 'freev2'
  AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
  AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') != ''
`;


    // Run both queries
    const [scalpHealthOverallQueryResult] = await bigquery.query({ query: scalpHealthOverallQuery2 });
    console.log("scalpHealthOverallQueryResult", scalpHealthOverallQueryResult)
    const data = {
      scalpHealth: scalpHealthOverallQueryResult[0],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching purchase funnel data:", error);
    return NextResponse.json({ error: "Failed to fetch funnel data" }, { status: 500 });
  }
}
