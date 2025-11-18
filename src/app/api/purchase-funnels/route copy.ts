// app/api/purchase-funnels/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery"; // your BigQuery client

export async function GET() {
    try {


    // --- Regrowth Treatment Query ---
    const regrowthTreatmentQuery = `
      SELECT
        COUNT(*) AS total_users,
        COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.regrowth_reported_reduction') = 'true', 1, NULL)) AS reported_reduction,
        COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.regrowth_reported_reduction') = 'true' 
                 AND JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true', 1, NULL)) AS purchased_reduction,
        COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.regrowth_reported_success') = 'true', 1, NULL)) AS reported_success,
        COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.regrowth_reported_success') = 'true' 
                 AND JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true', 1, NULL)) AS purchased_success,
        COUNT(IF(JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') = 'true', 1, NULL)) AS total_purchased
      FROM \`keshah-app.firestore_export.users_raw_latest\`
      WHERE JSON_EXTRACT(data, '$.regrowth_treatment_purchased') IS NOT NULL
         OR JSON_EXTRACT(data, '$.regrowth_reported_reduction') IS NOT NULL
         OR JSON_EXTRACT(data, '$.regrowth_reported_success') IS NOT NULL;
    `;

    // Run both queries
    const [regrowthResult] = await bigquery.query({ query: regrowthTreatmentQuery });
    console.log("regrowthResult",regrowthResult[0])
    // Format data for frontend
    const data = {
      regrowthTreatment: regrowthResult[0],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching purchase funnel data:", error);
    return NextResponse.json({ error: "Failed to fetch funnel data" }, { status: 500 });
  }
}
