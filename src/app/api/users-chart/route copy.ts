/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery"; // ✅ Make sure you have your BigQuery client configured

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "7d";

  // Determine the date range dynamically
  const daysMap: Record<string, number> = {
    "3d": 3,
    "7d": 7,
    "30d": 30,
  };
  const days = daysMap[range] || 7;

  const query = `
    WITH users AS (
      SELECT
        JSON_VALUE(data, '$.email') AS email,
        TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)) AS created_at
      FROM \`keshah-app.firestore_export.users_raw_latest\`
      WHERE JSON_VALUE(data, '$.created_at._seconds') IS NOT NULL
    )
    SELECT
      FORMAT_TIMESTAMP('%Y-%m-%d', created_at) AS date,
      COUNT(*) AS users
    FROM users
    WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)
    GROUP BY date
    ORDER BY date ASC;
  `;

  try {
    const [rows] = await bigquery.query(query);

    // Return formatted data
    const formatted = rows.map((row: any) => ({
      date: row.date,
      users: Number(row.users),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("❌ Error fetching user chart data:", error);
    return NextResponse.json({ error: "Failed to fetch user chart data" }, { status: 500 });
  }
}
