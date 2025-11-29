// app/api/user-stats/hair-loss/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";
import { projectId } from "@/lib/query";
import { withCache } from "@/lib/cache-utils";

export async function GET() {
  try {
    const data = await withCache(
      "regrowth_treatment",
      async () => {
    
    // ✅ Hair Loss Reduction Report
    const hairLossReducedQuery = `
      SELECT
        COUNT(*) AS total_users,
        SUM(IF(JSON_VALUE(data, '$.hair_loss_reduced_reported_once') = 'true', 1, 0)) AS reported_reduction,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(JSON_VALUE(data, '$.hair_loss_reduced_reported_once') = 'true', 1, 0)), COUNT(*)), 2) AS reduction_percentage_of_total,
        SUM(IF(JSON_VALUE(data, '$.hair_loss_reduced_reported_once') = 'true' AND JSON_VALUE(data, '$.regrowth_treatment_purchased') = 'true', 1, 0)) AS purchased_regrowth,
        ROUND(
          100 * SAFE_DIVIDE(
            SUM(IF(JSON_VALUE(data, '$.hair_loss_reduced_reported_once') = 'true' AND JSON_VALUE(data, '$.regrowth_treatment_purchased') = 'true', 1, 0)),
            SUM(IF(JSON_VALUE(data, '$.hair_loss_reduced_reported_once') = 'true', 1, 0))
          ),
          2
        ) AS purchased_percentage_of_reduction,
        ROUND(
          100 * SAFE_DIVIDE(
            SUM(IF(JSON_VALUE(data, '$.hair_loss_reduced_reported_once') = 'true' AND JSON_VALUE(data, '$.regrowth_treatment_purchased') = 'true', 1, 0)),
            COUNT(*)
          ),
          2
        ) AS purchased_percentage_of_total
      FROM \`${projectId}.analytics.users_latest\`
      WHERE JSON_VALUE(data, '$.user_type') = 'freev2'
        AND JSON_VALUE(data, '$.start_date.date') IS NOT NULL
        AND JSON_VALUE(data, '$.start_date.date') != ''
    `;

    // ✅ Hair Loss Stoppage Report
    const hairLossStoppedQuery = `
      SELECT
        COUNT(*) AS total_users,
        SUM(IF(JSON_VALUE(data, '$.hair_loss_stoppage_reported_once') = 'true', 1, 0)) AS reported_hair_loss_stopped,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(JSON_VALUE(data, '$.hair_loss_stoppage_reported_once') = 'true', 1, 0)), COUNT(*)), 2) AS stopped_percentage_of_total,
        SUM(IF(JSON_VALUE(data, '$.hair_loss_stoppage_reported_once') = 'true' AND JSON_VALUE(data, '$.regrowth_treatment_purchased') = 'true', 1, 0)) AS purchased_regrowth,
        ROUND(
          100 * SAFE_DIVIDE(
            SUM(IF(JSON_VALUE(data, '$.hair_loss_stoppage_reported_once') = 'true' AND JSON_VALUE(data, '$.regrowth_treatment_purchased') = 'true', 1, 0)),
            SUM(IF(JSON_VALUE(data, '$.hair_loss_stoppage_reported_once') = 'true', 1, 0))
          ),
          2
        ) AS purchased_percentage_of_reduction,
        ROUND(
          100 * SAFE_DIVIDE(
            SUM(IF(JSON_VALUE(data, '$.hair_loss_stoppage_reported_once') = 'true' AND JSON_VALUE(data, '$.regrowth_treatment_purchased') = 'true', 1, 0)),
            COUNT(*)
          ),
          2
        ) AS purchased_percentage_of_total
      FROM \`${projectId}.analytics.users_latest\`
      WHERE JSON_VALUE(data, '$.user_type') = 'freev2'
        AND JSON_VALUE(data, '$.start_date.date') IS NOT NULL
        AND JSON_VALUE(data, '$.start_date.date') != ''
    `;

        // Run both queries in parallel
        const [[hairLossReduced], [hairLossStopped]] = await Promise.all([
          bigquery.query({ query: hairLossReducedQuery }),
          bigquery.query({ query: hairLossStoppedQuery }),
        ]);

        return {
          reduction: hairLossReduced[0],
          stopped: hairLossStopped[0],
        };
      }
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("BigQuery error:", error);
    return NextResponse.json({ error: "Failed to fetch hair loss stats" }, { status: 500 });
  }
}
