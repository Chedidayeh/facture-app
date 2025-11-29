import { NextResponse } from "next/server";
import admin from "firebase-admin";

// --- Ensure service account key exists
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error(
    "❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing in environment variables."
  );
  throw new Error(
    "Missing FIREBASE_SERVICE_ACCOUNT_KEY in environment variables"
  );
}

// --- Parse service account safely
let serviceAccount: any;
try {
  serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );
} catch (error) {
  console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
  throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format");
}

// --- Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  console.log("🚀 Initializing Firebase Admin...");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.log("ℹ️ Firebase Admin already initialized.");
}

const db = admin.firestore();

// Helper function to update collection
async function updateCollection(
  collectionName: string,
): Promise<{
  count: number;
  errors: number;
  logs: any[];
  duration: string;
  startTime: number;
  endTime: number;
}> {
  const collectionStartTime = Date.now();
  console.log(
    `\n📋 Starting batch update for "${collectionName}" at ${new Date().toISOString()}`
  );

  const snapshot = await db.collection(collectionName).get();
  console.log(`📦 Retrieved ${snapshot.size} documents from "${collectionName}"`);

  let count = 0;
  let errors = 0;
  const logs: any[] = [];

  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();

      // Add timestamp to trigger BigQuery streaming
      data.new_test = new Date().toISOString();

      await db.collection(collectionName).doc(doc.id).set(data, { merge: true });
      count++;

      // Log every update
      const logEntry = {
        index: count,
        documentId: doc.id,
        collection: collectionName,
        timestamp: data.new_test,
        status: "✅ SUCCESS",
        updatedAt: new Date().toISOString(),
      };

      logs.push(logEntry);

      // Log every 100 updates
      if (count % 100 === 0) {
        console.log(
          `📊 Progress: ${count}/${snapshot.size} documents updated in "${collectionName}"`
        );
      }
    } catch (docErr: any) {
      errors++;
      console.error(`❌ Error updating doc ${doc.id}:`, docErr.message);
      logs.push({
        index: count + errors,
        documentId: doc.id,
        collection: collectionName,
        status: "❌ FAILED",
        error: docErr.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const collectionEndTime = Date.now();
  const duration = ((collectionEndTime - collectionStartTime) / 1000).toFixed(2);

  console.log(
    `✅ Successfully updated ${count}/${snapshot.size} documents in "${collectionName}"`
  );
  console.log(`⏱️ Duration for "${collectionName}": ${duration} seconds`);
  console.log(`📋 Errors in "${collectionName}": ${errors}`);

  return {
    count,
    errors,
    logs,
    duration,
    startTime: collectionStartTime,
    endTime: collectionEndTime,
  };
}

export async function GET() {
  try {
    const mainStartTime = Date.now();
    console.log(
      `\n🚀 Starting dual collection update at ${new Date().toISOString()}`
    );

    // Update both collections in parallel (fetch ALL documents)
    const [usersResult] = await Promise.all([
      updateCollection("Users"),
      // updateCollection("ProgressCheckAnswers"),
    ]);

    const mainEndTime = Date.now();
    const totalDuration = ((mainEndTime - mainStartTime) / 1000).toFixed(2);

    console.log(`\n✅ All collections updated successfully!`);
    console.log(`⏱️ Total time: ${totalDuration} seconds`);

    return NextResponse.json({
      success: true,
      summary: {
        totalCollections: 2,
        totalDuration: `${totalDuration}s`,
        startedAt: new Date(mainStartTime).toISOString(),
        completedAt: new Date(mainEndTime).toISOString(),
        collections: {
          Users: {
            totalDocuments: usersResult.count,
            successfulUpdates: usersResult.count,
            failedUpdates: usersResult.errors,
            duration: `${usersResult.duration}s`,
            startedAt: new Date(usersResult.startTime).toISOString(),
            completedAt: new Date(usersResult.endTime).toISOString(),
          },
          // ProgressCheckAnswers: {
          //   totalDocuments: progressResult.count,
          //   successfulUpdates: progressResult.count,
          //   failedUpdates: progressResult.errors,
          //   duration: `${progressResult.duration}s`,
          //   startedAt: new Date(progressResult.startTime).toISOString(),
          //   completedAt: new Date(progressResult.endTime).toISOString(),
          // },
        },
      },
      logs: {
        users: usersResult.logs,
        // progressCheckAnswers: progressResult.logs,
      },
    });
  } catch (err: any) {
    console.error("🔥 Error during batch update:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
