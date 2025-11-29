import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";
import { projectId } from "@/lib/query";
import { withCache } from "@/lib/cache-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    // Create unique cache key based on range
    const cacheKey = `users_chart_${range}`;

    const formatted = await withCache(
      cacheKey,
      async () => {

    // Map range to number of days
    const daysMap: Record<string, number> = {
      "3d": 3,
      "7d": 7,
      "30d": 30,
    };
    const days = daysMap[range] || 7;

    // Optimized query: inline JSON parsing with SAFE_CAST, filter last N days
    const query = `
      SELECT
        FORMAT_TIMESTAMP('%Y-%m-%d', TIMESTAMP_SECONDS(SAFE_CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64))) AS date,
        COUNT(*) AS users
      FROM \`${projectId}.analytics.users_latest\`
      WHERE JSON_VALUE(data, '$.created_at._seconds') IS NOT NULL
        AND TIMESTAMP_SECONDS(SAFE_CAST(JSON_VALUE(data, '$.created_at._seconds') AS INT64)) >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)
      GROUP BY date
      ORDER BY date ASC;
    `;

    const [rows] = await bigquery.query({ query });

        // Format data for frontend
        return rows.map((row: any) => ({
          date: row.date,
          users: Number(row.users),
        }));
      }
    );

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("❌ Error fetching user chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user chart data" },
      { status: 500 }
    );
  }
}
