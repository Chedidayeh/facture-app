import { db } from "@/db";
import { query, query2 } from "@/lib/query";
import { BigQuery } from "@google-cloud/bigquery";
import { invalidateCache } from "@/lib/cache-utils";

const SYNC_NAME = "users_latest_sync";
const COOLDOWN_MINUTES = 5;

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID_MOETEZ || "test-bigquery-3dc1a",
});

/**
 * Checks if enough time has passed since the last sync
 */
export async function shouldRunSync(): Promise<boolean> {
  try {
    const lastSync = await db.syncLog.findUnique({
      where: { syncName: SYNC_NAME },
    });

    // If no previous sync, run it
    if (!lastSync) {
      return true;
    }

    // Calculate time difference in minutes
    const now = new Date();
    const timeDiffMinutes =
      (now.getTime() - lastSync.lastExecutionTime.getTime()) / (1000 * 60);

    // Run sync if cooldown has passed
    return timeDiffMinutes >= COOLDOWN_MINUTES;
  } catch (error) {
    console.error("Error checking sync status:", error);
    return false;
  }
}

/**
 * Executes the BigQuery merge operation
 */
async function executeBigQuerySync(): Promise<{ recordsProcessed: number }> {
  let totalRecordsProcessed = 0;

  // Execute first query
  const options1 = {
    query: query,
    location: "us-central1",
    useQueryCache: false,
  };

  const [job1] = await bigquery.createQueryJob(options1);
  await job1.getQueryResults();

  // Execute second query
  const options2 = {
    query: query2,
    location: "us-central1",
    useQueryCache: false,
  };

  const [job2] = await bigquery.createQueryJob(options2);
  await job2.getQueryResults();

  // Return stats (you can enhance this by capturing actual row counts)
  return { recordsProcessed: totalRecordsProcessed };
}

/**
 * Main sync function - checks cooldown and runs if needed
 */
export async function runUsersLatestSync(): Promise<{
  ranSync: boolean;
  message: string;
}> {
  const shouldRun = await shouldRunSync();

  if (!shouldRun) {
    const lastSync = await db.syncLog.findUnique({
      where: { syncName: SYNC_NAME },
    });

    const minutesUntilNextSync =
      Math.ceil(
        (COOLDOWN_MINUTES * 60 * 1000 -
          (new Date().getTime() -
            (lastSync?.lastExecutionTime.getTime() || 0))) /
          (60 * 1000)
      ) || 0;

    return {
      ranSync: false,
      message: `Sync already ran recently. Next sync available in ${minutesUntilNextSync} minutes.`,
    };
  }

  try {
    // Execute the BigQuery merge
    const { recordsProcessed } = await executeBigQuerySync();

    // Update sync log
    await db.syncLog.upsert({
      where: { syncName: SYNC_NAME },
      create: {
        syncName: SYNC_NAME,
        status: "success",
        recordsProcessed,
      },
      update: {
        status: "success",
        recordsProcessed,
        errorMessage: null,
      },
    });

    // Invalidate all caches after successful sync
    await invalidateCache({ syncName: SYNC_NAME });
    console.log("🗑️ All caches invalidated after successful sync");

    return {
      ranSync: true,
      message: `Sync completed successfully. Processed ${recordsProcessed} records.`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Log the error
    await db.syncLog.upsert({
      where: { syncName: SYNC_NAME },
      create: {
        syncName: SYNC_NAME,
        status: "failed",
        errorMessage,
      },
      update: {
        status: "failed",
        errorMessage,
      },
    });

    console.error("Sync failed:", error);
    throw new Error(`Sync failed: ${errorMessage}`);
  }
}
