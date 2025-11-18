import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery"; // your BigQuery client

export async function GET(request: Request) {
    try {

        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "7d";

        // Determine the start date dynamically
        const today = new Date();
        let startDate: string;



        switch (range) {
            case "7d":
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case "lastMonth":
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                startDate = lastMonth.toISOString();
                break;
            case "lastYear":
                const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                startDate = lastYear.toISOString();
                break;
            default:
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        }

        const scalpHealthQuery = `
            SELECT
            DATE(TIMESTAMP_SECONDS(SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.created_at._seconds') AS INT64))) AS date,
            COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.scalp_health_support_purchased') = 'true', 1, NULL)) AS total_purchased,
            FROM \`keshah-app.firestore_export.users_raw_latest\`
            WHERE SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.created_at._seconds') AS INT64) 
                >= UNIX_SECONDS(TIMESTAMP("${startDate}"))
            GROUP BY date
            ORDER BY date ASC;
            `;





        // Run both queries
        const [scalpHealthResult] = await bigquery.query({ query: scalpHealthQuery });
        console.log(scalpHealthResult)
        // Format data for frontend
        const data = {
            scalpHealth: scalpHealthResult,
        };


        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching purchase funnel data:", error);
        return NextResponse.json({ error: "Failed to fetch funnel data" }, { status: 500 });
    }
}
