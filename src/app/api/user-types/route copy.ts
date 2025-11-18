import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET() {
  const query = `
    SELECT DISTINCT
      JSON_VALUE(data, '$.user_type') AS user_type
    FROM
      \`keshah-app.firestore_export.users_raw_latest\`
    WHERE
      JSON_VALUE(data, '$.user_type') IS NOT NULL
    ORDER BY
      user_type;
  `;

  const [rows] = await bigquery.query(query);
  return NextResponse.json(rows);
}
