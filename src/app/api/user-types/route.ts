// app/api/user-types/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";
import { projectId } from "@/lib/query";
import { withCache } from "@/lib/cache-utils";

export async function GET() {
  try {
    const userTypes = await withCache(
      "user_types",
      async () => {
        const query = `
          SELECT ARRAY_AGG(DISTINCT JSON_VALUE(data, '$.user_type')) AS user_types
          FROM \`${projectId}.analytics.users_latest\`
          WHERE JSON_VALUE(data, '$.user_type') IS NOT NULL
        `;

        const [rows] = await bigquery.query({ query });
        return rows[0]?.user_types || [];
      }
    );

    return NextResponse.json(userTypes);
  } catch (error) {
    console.error("Error fetching user types:", error);
    return NextResponse.json({ error: "Failed to fetch user types" }, { status: 500 });
  }
}
