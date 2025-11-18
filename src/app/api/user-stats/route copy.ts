// app/api/user-stats/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET() {
  try {
    // ✅ Users who started today
    const usersStartedTodayQuery = `
      SELECT
        COUNT(*) AS users_started_today
      FROM
        \`keshah-app.firestore_export.users_raw_latest\`
      WHERE
        JSON_EXTRACT_SCALAR(data, '$.start_date.date') = FORMAT_DATE('%d/%m/%Y', CURRENT_DATE())
    `;

    const totalGroupedUsersQuery = `
      SELECT
        JSON_EXTRACT_SCALAR(data, '$.user_type') AS user_type,
        COUNT(*) AS user_count,
        (SELECT COUNT(*) 
         FROM \`keshah-app.firestore_export.users_raw_latest\`) AS total_users
      FROM
        \`keshah-app.firestore_export.users_raw_latest\`
      GROUP BY user_type
      ORDER BY user_count DESC;
    `;

    const freev2StartedUsers = `
    SELECT
      COUNT(*) AS total_users,        
    FROM \`keshah-app.firestore_export.users_raw_latest\`
    WHERE JSON_EXTRACT_SCALAR(data, '$.user_type') = 'freev2'
    AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
    AND JSON_EXTRACT_SCALAR(data, '$.start_date.date') != ''
  `;

    // ✅ Total users
    const totalUsersQuery = `
      SELECT
        COUNT(*) AS total_users
      FROM
        \`keshah-app.firestore_export.users_raw_latest\`
    `;

    // ✅ Users started in the last 7 days
    const usersLast7DaysQuery = `
      SELECT
        COUNT(*) AS users_started_last_7_days
      FROM
        \`keshah-app.firestore_export.users_raw_latest\`
      WHERE
        JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
        AND PARSE_DATE('%d/%m/%Y', JSON_EXTRACT_SCALAR(data, '$.start_date.date'))
          BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY) AND CURRENT_DATE()
    `;

    const active_users_last_7_days = `WITH parsed_users AS (
      SELECT
        -- Unique user identifier
        JSON_VALUE(data, '$.wp_user.ID') AS user_id,
        
        -- Parse start_date
        PARSE_DATE('%d/%m/%Y', JSON_VALUE(data, '$.start_date.date')) AS start_date,
        
        -- Extract progress JSON as STRING
        JSON_EXTRACT(data, '$.progress') AS progress_json_str
      FROM
        \`keshah-app.firestore_export.users_raw_latest\`
    
      WHERE
        JSON_EXTRACT(data, '$.progress') IS NOT NULL
    ),
    
    flatten_progress AS (
      SELECT
        user_id,
        start_date,
        day_key,
        -- Map dayX → actual date
        DATE_ADD(start_date, INTERVAL CAST(SUBSTR(day_key,4) AS INT64) - 1 DAY) AS progress_date
      FROM parsed_users,
      -- Convert STRING to JSON and get keys
      UNNEST(JSON_KEYS(SAFE.PARSE_JSON(progress_json_str))) AS day_key
    ),
    
    active_users AS (
      SELECT DISTINCT user_id
      FROM flatten_progress
      -- Only keep progress in the last 7 days
      WHERE progress_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
                              AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
    )
    
    SELECT COUNT(*) AS active_users_last_7_days
    FROM active_users;
    
    
    
    `

    // ✅ Active users in the last 2 days
    const activeUsersQuery = `
      WITH user_progress AS (
        SELECT
          JSON_EXTRACT_SCALAR(data, '$.wp_user.ID') AS user_id,
          SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.created_at._seconds') AS INT64) AS created_seconds,
          JSON_EXTRACT_ARRAY(data, '$.progress.days') AS progress_days
        FROM
          \`keshah-app.firestore_export.users_raw_latest\`
      ),
      recent_progress AS (
        SELECT
          user_id,
          ARRAY_LENGTH(
            ARRAY(
              SELECT day
              FROM UNNEST(progress_days) AS day
              WHERE SAFE_CAST(JSON_EXTRACT_SCALAR(day, '$.modified_at._seconds') AS INT64)
                >= UNIX_SECONDS(TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 2 DAY))
            )
          ) AS recent_days_count
        FROM user_progress
      )
      SELECT
        COUNT(DISTINCT user_id) AS active_users
      FROM user_progress up
      LEFT JOIN recent_progress rp USING(user_id)
      WHERE
        SAFE_CAST(created_seconds AS INT64) >= UNIX_SECONDS(TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 2 DAY))
        OR recent_days_count > 0
    `;


    // ✅ NEW — Inactive users in the last 7 days
    const inactiveUsers7DaysQuery = `
      WITH recent_users AS (
        SELECT
          JSON_EXTRACT_SCALAR(data, '$.wp_user.ID') AS user_id,
          PARSE_DATE('%d/%m/%Y', JSON_EXTRACT_SCALAR(data, '$.start_date.date')) AS start_date,
          JSON_EXTRACT_ARRAY(data, '$.progress.days') AS progress_days
        FROM
          \`keshah-app.firestore_export.users_raw_latest\`
        WHERE
          JSON_EXTRACT_SCALAR(data, '$.start_date.date') IS NOT NULL
          AND PARSE_DATE('%d/%m/%Y', JSON_EXTRACT_SCALAR(data, '$.start_date.date'))
            BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY) AND CURRENT_DATE()
      ),
      user_activity AS (
        SELECT
          user_id,
          ARRAY_LENGTH(
            ARRAY(
              SELECT day
              FROM UNNEST(progress_days) AS day
              WHERE SAFE_CAST(JSON_EXTRACT_SCALAR(day, '$.modified_at._seconds') AS INT64)
                >= UNIX_SECONDS(TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY))
            )
          ) AS recent_activity_count
        FROM recent_users
      )
      SELECT
        COUNT(*) AS total_recent_users,
        COUNTIF(recent_activity_count = 0 OR recent_activity_count IS NULL) AS inactive_users_7_days,
        SAFE_DIVIDE(
          COUNTIF(recent_activity_count = 0 OR recent_activity_count IS NULL),
          COUNT(*)
        ) * 100 AS inactive_users_percent_7_days
      FROM user_activity;
    `;


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
      bigquery.query({ query: freev2StartedUsers }),
      bigquery.query({ query: usersLast7DaysQuery }),
      bigquery.query({ query: active_users_last_7_days }),
      bigquery.query({ query: totalGroupedUsersQuery }),
    ]);

    console.log(freev2StartedUsersResult[0].total_users)


    return NextResponse.json({
      success: true,
      data: {
        todayUsers: Number(usersTodayResult[0]?.users_started_today ?? 0),
        totalUsers: Number(totalUsersResult[0]?.total_users ?? 0),
        freev2StartedUsers: Number(freev2StartedUsersResult[0]?.total_users ?? 0),
        last7DaysUsers: Number(usersLast7DaysResult[0]?.users_started_last_7_days ?? 0),
        activeUsers: Number(activeUsersResult[0].active_users_last_7_days ?? 0),
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
