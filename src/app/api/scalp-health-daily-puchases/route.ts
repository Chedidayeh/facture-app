import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery"; // BigQuery client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    // Determine start date based on range
    const today = new Date();
    let startDate: string;

    switch (range) {
      case "7d":
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        break;
      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        startDate = lastMonth.toISOString().slice(0, 10);
        break;
      case "lastYear":
        const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        startDate = lastYear.toISOString().slice(0, 10);
        break;
      default:
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }

    // Optimized BigQuery
    const query = `
      WITH parsed AS (
        SELECT
          SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.created_at._seconds') AS INT64) AS created_at_seconds,
          JSON_EXTRACT_SCALAR(data, '$.scalp_health_support_purchased') AS purchased
        FROM \`keshah-app.firestore_export.users_raw_latest\`
      )
      SELECT
        DATE(TIMESTAMP_SECONDS(created_at_seconds)) AS date,
        COUNTIF(purchased = 'true') AS total_purchased
      FROM parsed
      WHERE created_at_seconds >= UNIX_SECONDS(TIMESTAMP('${startDate}'))
      GROUP BY date
      ORDER BY date ASC;
    `;

    const [rows] = await bigquery.query({ query });

    return NextResponse.json({
      scalpHealth: rows,
      startDate,
      range,
    });
  } catch (error) {
    console.error("Error fetching scalp health data:", error);
    return NextResponse.json({ error: "Failed to fetch scalp health data" }, { status: 500 });
  }
}
