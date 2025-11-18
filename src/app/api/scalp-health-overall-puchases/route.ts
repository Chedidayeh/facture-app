// app/api/scalp-health-overall/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery"; // your BigQuery client

export async function GET() {
  try {
    // Optimized BigQuery using CTE to parse JSON once
    const scalpHealthQuery = `
      WITH parsed AS (
        SELECT
          JSON_EXTRACT_SCALAR(data, '$.user_type') AS user_type,
          JSON_EXTRACT_SCALAR(data, '$.start_date.date') AS start_date,
          JSON_EXTRACT_SCALAR(data, '$.scalp_health_support_purchased') AS purchased
        FROM \`keshah-app.firestore_export.users_raw_latest\`
      )
      SELECT
        COUNT(*) AS total_users,
        COUNTIF(purchased = 'true') AS total_purchased,
        ROUND(
          SAFE_DIVIDE(COUNTIF(purchased = 'true'), COUNT(*)) * 100,
          2
        ) AS purchase_percentage
      FROM parsed
      WHERE user_type = 'freev2'
        AND start_date IS NOT NULL
        AND start_date != ''
    `;

    // Run the query
    const [rows] = await bigquery.query({ query: scalpHealthQuery });

    // Return formatted JSON response
    return NextResponse.json({
      scalpHealth: rows[0],
    });
  } catch (error) {
    console.error("Error fetching scalp health data:", error);
    return NextResponse.json(
      { error: "Failed to fetch scalp health data" },
      { status: 500 }
    );
  }
}
