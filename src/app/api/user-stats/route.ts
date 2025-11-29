// app/api/user-stats/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";
import { projectId } from "@/lib/query";

export async function GET() {
  try {
    
    // -----------------------------
    // 1️⃣ Users who started today
    // -----------------------------
    const usersStartedTodayQuery = `
      SELECT
        COUNT(*) AS users_started_today
      FROM \`${projectId}.analytics.users_latest\`
      WHERE JSON_EXTRACT_SCALAR(data, '$.start_date.date') = FORMAT_DATE('%d/%m/%Y', CURRENT_DATE())
    `;

    // -----------------------------
    // 2️⃣ Total users
    // -----------------------------
    const totalUsersQuery = `
      SELECT
        COUNT(*) AS total_users
      FROM \`${projectId}.analytics.users_latest\`
    `;

    // -----------------------------
    // 3️⃣ Freev2 users who started
    // -----------------------------
    const freev2StartedUsersQuery = `
      SELECT
        COUNT(*) AS total_users
      FROM \`${projectId}.analytics.users_latest\`
      WHERE JSON_EXTRACT_SCALAR(data, '$.user_type') = 'freev2'
        AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
        AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') != ''
    `;

    // -----------------------------
    // 4️⃣ Users started last 7 days
    // -----------------------------
    const usersLast7DaysQuery = `
      SELECT
        COUNT(*) AS users_started_last_7_days
      FROM \`${projectId}.analytics.users_latest\`
      WHERE JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
        AND PARSE_DATE('%d/%m/%Y', JSON_EXTRACT_SCALAR(data, '$.start_date.date'))
            BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY) AND CURRENT_DATE()
    `;

    // -----------------------------
    // 5️⃣ Active users last 7 days
    // -----------------------------
    const activeUsersLast7DaysQuery = `
      WITH parsed_users AS (
        SELECT
          JSON_VALUE(data, '$.wp_user.ID') AS user_id,
          SAFE.PARSE_DATE('%d/%m/%Y', JSON_VALUE(data, '$.start_date.date')) AS start_date,
          JSON_EXTRACT(data, '$.progress') AS progress
        FROM \`${projectId}.analytics.users_latest\`
        WHERE JSON_EXTRACT(data, '$.progress') IS NOT NULL
      ),
      flatten_progress AS (
        SELECT
          user_id,
          DATE_ADD(start_date, INTERVAL CAST(SUBSTR(day_key,4) AS INT64) - 1 DAY) AS progress_date
        FROM parsed_users,
          UNNEST(JSON_KEYS(SAFE.PARSE_JSON(progress))) AS day_key
      ),
      active_users AS (
        SELECT DISTINCT user_id
        FROM flatten_progress
        WHERE progress_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
                                AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
      )
      SELECT COUNT(*) AS active_users_last_7_days
      FROM active_users
    `;

    // -----------------------------
    // 6️⃣ Total users grouped by type
    // -----------------------------
    const totalGroupedUsersQuery = `
      WITH total_count AS (
        SELECT COUNT(*) AS total_users
        FROM \`${projectId}.analytics.users_latest\`
      )
      SELECT
        JSON_EXTRACT_SCALAR(data, '$.user_type') AS user_type,
        COUNT(*) AS user_count,
        total_count.total_users
      FROM \`${projectId}.analytics.users_latest\`, total_count
      GROUP BY user_type, total_count.total_users
      ORDER BY user_count DESC
    `;

    // -----------------------------
    // Execute all queries concurrently
    // -----------------------------
    const [
      [usersTodayResult],
      [totalUsersResult],
      [freev2StartedUsersResult],
      [usersLast7DaysResult],
      [activeUsersResult],
      groupedUsersResult,
    ] = await Promise.all([
      bigquery.query({ query: usersStartedTodayQuery }),
      bigquery.query({ query: totalUsersQuery }),
      bigquery.query({ query: freev2StartedUsersQuery }),
      bigquery.query({ query: usersLast7DaysQuery }),
      bigquery.query({ query: activeUsersLast7DaysQuery }),
      bigquery.query({ query: totalGroupedUsersQuery }),
    ]);

    // -----------------------------
    // Prepare response
    // -----------------------------
    return NextResponse.json({
      success: true,
      data: {
        todayUsers: Number(usersTodayResult[0]?.users_started_today ?? 0),
        totalUsers: Number(totalUsersResult[0]?.total_users ?? 0),
        freev2StartedUsers: Number(freev2StartedUsersResult[0]?.total_users ?? 0),
        last7DaysUsers: Number(usersLast7DaysResult[0]?.users_started_last_7_days ?? 0),
        activeUsers: Number(activeUsersResult[0]?.active_users_last_7_days ?? 0),
        groupedUsers: groupedUsersResult[0].map((row: any) => ({
          user_type: row.user_type ?? "Unknown",
          user_count: Number(row.user_count ?? 0),
          total_users: Number(row.total_users ?? 0),
        })),
      },
    });
  } catch (error: any) {
    console.error("BigQuery error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
