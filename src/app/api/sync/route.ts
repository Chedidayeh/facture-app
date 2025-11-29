import { NextResponse } from "next/server";
import { runUsersLatestSync, shouldRunSync } from "@/server/sync-service";

export async function GET() {
  try {
    // Check if sync should run
    const shouldRun = await shouldRunSync();
    
    if (!shouldRun) {
      return NextResponse.json({
        success: true,
        message: "Sync skipped - cooldown period not elapsed",
        shouldRun: false,
      });
    }

    // Run the sync
    const result = await runUsersLatestSync();
    
    return NextResponse.json({
      success: true,
      shouldRun: true,
      ...result,
    });
  } catch (error) {
    console.error("Sync API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
