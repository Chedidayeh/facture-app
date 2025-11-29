import { runUsersLatestSync } from "@/server/sync-service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sync/users-latest
 * Manually trigger the users_latest sync
 * Can be called from the admin panel or via cron jobs
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const session = await getSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const result = await runUsersLatestSync();

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("Sync API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/users-latest
 * Check sync status without running it
 */
export async function GET(request: NextRequest) {
  try {
    const { db } = await import("@/db");
    const SYNC_NAME = "users_latest_sync";

    const syncLog = await db.syncLog.findUnique({
      where: { syncName: SYNC_NAME },
    });

    if (!syncLog) {
      return NextResponse.json(
        {
          status: "never_run",
          lastExecutionTime: null,
          message: "Sync has never been executed",
        },
        { status: 200 }
      );
    }

    const timeDiffMinutes =
      (new Date().getTime() - syncLog.lastExecutionTime.getTime()) / (1000 * 60);
    const minutesUntilNextSync = Math.max(
      0,
      Math.ceil(5 - timeDiffMinutes)
    );

    return NextResponse.json(
      {
        status: syncLog.status,
        lastExecutionTime: syncLog.lastExecutionTime,
        recordsProcessed: syncLog.recordsProcessed,
        errorMessage: syncLog.errorMessage,
        minutesSinceLastSync: Math.floor(timeDiffMinutes),
        minutesUntilNextSync,
        canRunNow: minutesUntilNextSync === 0,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("Sync status API error:", error);

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
