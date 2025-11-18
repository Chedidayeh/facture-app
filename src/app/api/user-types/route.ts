// app/api/user-types/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

// Optional: Simple in-memory cache to avoid repeated queries
let cachedUserTypes: string[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Return cached result if available and not expired
    const now = Date.now();
    if (cachedUserTypes && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedUserTypes);
    }

    const query = `
      SELECT ARRAY_AGG(DISTINCT JSON_VALUE(data, '$.user_type')) AS user_types
      FROM \`keshah-app.firestore_export.users_raw_latest\`
      WHERE JSON_VALUE(data, '$.user_type') IS NOT NULL
    `;

    const [rows] = await bigquery.query({ query });
    const userTypes = rows[0]?.user_types || [];

    // Update cache
    cachedUserTypes = userTypes;
    cacheTimestamp = now;

    return NextResponse.json(userTypes);
  } catch (error) {
    console.error("Error fetching user types:", error);
    return NextResponse.json({ error: "Failed to fetch user types" }, { status: 500 });
  }
}
