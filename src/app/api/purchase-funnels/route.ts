import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery"; // your BigQuery client
import { projectId } from "@/lib/query";
import { withCache } from "@/lib/cache-utils";

export async function GET() {
  try {
    const purchaseFunnel = await withCache("purchase_funnels", async () => {
      const purchaseFunnelQuery = `
-- Step 1: Extract needed JSON fields once per row
WITH extracted AS (
  SELECT
    JSON_EXTRACT_SCALAR(data, '$.regrowth_reported_reduction') AS reported_reduction,
    JSON_EXTRACT_SCALAR(data, '$.regrowth_reported_success') AS reported_success,
    JSON_EXTRACT_SCALAR(data, '$.regrowth_treatment_purchased') AS treatment_purchased
  FROM \`${projectId}.analytics.users_latest\`
  WHERE JSON_EXTRACT(data, '$.regrowth_reported_reduction') IS NOT NULL
     OR JSON_EXTRACT(data, '$.regrowth_reported_success') IS NOT NULL
     OR JSON_EXTRACT(data, '$.regrowth_treatment_purchased') IS NOT NULL
)

-- Step 2: Aggregate counts
SELECT
  COUNT(*) AS total_users,
  
  -- Users who reported reduction
  COUNTIF(reported_reduction = 'true') AS reported_reduction,
  
  -- Users who reported reduction AND purchased
  COUNTIF(reported_reduction = 'true' AND treatment_purchased = 'true') AS purchased_reduction,
  
  -- Users who reported success
  COUNTIF(reported_success = 'true') AS reported_success,
  
  -- Users who reported success AND purchased
  COUNTIF(reported_success = 'true' AND treatment_purchased = 'true') AS purchased_success,
  
  -- Users who purchased treatment
  COUNTIF(treatment_purchased = 'true') AS total_purchased
FROM extracted;
`;

      // Run the query
      const [rows] = await bigquery.query({ query: purchaseFunnelQuery });
      return rows[0];
    });

    // Return response
    return NextResponse.json({ purchaseFunnel });
  } catch (error) {
    console.error("Error fetching purchase funnel data:", error);
    return NextResponse.json(
      { error: "Failed to fetch funnel data" },
      { status: 500 }
    );
  }
}
