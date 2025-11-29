// app/api/weekly-survey/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";
import { projectId } from "@/lib/query";

export async function GET() {
  try {
    
    const query = `
      WITH parsed AS (
        SELECT
          CAST(JSON_VALUE(data, '$.day') AS INT64) AS week,

          -- Extract answers once
          CAST(JSON_VALUE(data, '$.answers.0') AS INT64) AS q1,
          CAST(JSON_VALUE(data, '$.answers.1') AS INT64) AS q2,
          CAST(JSON_VALUE(data, '$.answers.2') AS INT64) AS q3,
          CAST(JSON_VALUE(data, '$.answers.3') AS INT64) AS q4,
          CAST(JSON_VALUE(data, '$.answers.4') AS INT64) AS q5,
          CAST(JSON_VALUE(data, '$.answers.5') AS INT64) AS q6,
          CAST(JSON_VALUE(data, '$.answers.6') AS INT64) AS q7,

          -- Extract question texts once
          JSON_VALUE(data, '$.questions.0') AS q1_text,
          JSON_VALUE(data, '$.questions.1') AS q2_text,
          JSON_VALUE(data, '$.questions.2') AS q3_text,
          JSON_VALUE(data, '$.questions.3') AS q4_text,
          JSON_VALUE(data, '$.questions.4') AS q5_text,
          JSON_VALUE(data, '$.questions.5') AS q6_text,
          JSON_VALUE(data, '$.questions.6') AS q7_text
        FROM \`${projectId}.firestore_export.pchecka_raw_latest\`
      ),
      weekly_totals AS (
        SELECT week, COUNT(*) AS total_users
        FROM parsed
        GROUP BY week
      )
      SELECT
        p.week,
        wt.total_users,

        -- Question 1 stats
        ANY_VALUE(p.q1_text) AS q1_text,
        SUM(IF(p.q1 = 0, 1, 0)) AS q1_yes,
        SUM(IF(p.q1 = 1, 1, 0)) AS q1_no,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q1 = 0, 1, 0)), wt.total_users), 2) AS q1_pct_yes,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q1 = 1, 1, 0)), wt.total_users), 2) AS q1_pct_no,

        -- Question 2 stats
        ANY_VALUE(p.q2_text) AS q2_text,
        SUM(IF(p.q2 = 0, 1, 0)) AS q2_yes,
        SUM(IF(p.q2 = 1, 1, 0)) AS q2_no,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q2 = 0, 1, 0)), wt.total_users), 2) AS q2_pct_yes,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q2 = 1, 1, 0)), wt.total_users), 2) AS q2_pct_no,

        -- Question 3 stats
        ANY_VALUE(p.q3_text) AS q3_text,
        SUM(IF(p.q3 = 0, 1, 0)) AS q3_yes,
        SUM(IF(p.q3 = 1, 1, 0)) AS q3_no,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q3 = 0, 1, 0)), wt.total_users), 2) AS q3_pct_yes,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q3 = 1, 1, 0)), wt.total_users), 2) AS q3_pct_no,

        -- Question 4 stats
        ANY_VALUE(p.q4_text) AS q4_text,
        SUM(IF(p.q4 = 0, 1, 0)) AS q4_yes,
        SUM(IF(p.q4 = 1, 1, 0)) AS q4_no,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q4 = 0, 1, 0)), wt.total_users), 2) AS q4_pct_yes,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q4 = 1, 1, 0)), wt.total_users), 2) AS q4_pct_no,

        -- Question 5 stats
        ANY_VALUE(p.q5_text) AS q5_text,
        SUM(IF(p.q5 = 0, 1, 0)) AS q5_yes,
        SUM(IF(p.q5 = 1, 1, 0)) AS q5_no,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q5 = 0, 1, 0)), wt.total_users), 2) AS q5_pct_yes,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q5 = 1, 1, 0)), wt.total_users), 2) AS q5_pct_no,

        -- Question 6 stats
        ANY_VALUE(p.q6_text) AS q6_text,
        SUM(IF(p.q6 = 0, 1, 0)) AS q6_yes,
        SUM(IF(p.q6 = 1, 1, 0)) AS q6_no,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q6 = 0, 1, 0)), wt.total_users), 2) AS q6_pct_yes,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q6 = 1, 1, 0)), wt.total_users), 2) AS q6_pct_no,

        -- Question 7 stats
        ANY_VALUE(p.q7_text) AS q7_text,
        SUM(IF(p.q7 = 0, 1, 0)) AS q7_yes,
        SUM(IF(p.q7 = 1, 1, 0)) AS q7_no,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q7 = 0, 1, 0)), wt.total_users), 2) AS q7_pct_yes,
        ROUND(100 * SAFE_DIVIDE(SUM(IF(p.q7 = 1, 1, 0)), wt.total_users), 2) AS q7_pct_no

      FROM parsed p
      JOIN weekly_totals wt ON p.week = wt.week
      GROUP BY p.week, wt.total_users
      ORDER BY p.week;
    `;

    const [rows] = await bigquery.query({ query });
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching weekly survey:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
