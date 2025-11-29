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

export async function GET() {
  try {
    const startTime = Date.now();
    console.log(
      `⏱️ Starting update at ${new Date().toISOString()}`
    );

    // Retrieve 100 documents with user_type === "freev2"
    const snapshot = await db
      .collection("Users")
      .where("user_type", "==", "viiip")
      .limit(100)
      .get();

    console.log(
      `📦 Retrieved ${snapshot.size} documents with user_type = "freev2"`
    );

    let count = 0;
    let errors = 0;
    const logs: any[] = [];

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const oldUserType = data.user_type;

        // Update user_type from "freev2" to "vip"
        await db.collection("Users").doc(doc.id).update({
          user_type: "vip",
          modified_at: admin.firestore.Timestamp.now(),
          __testt_trigger: new Date().toISOString(),
        });

        count++;

        // Log every update
        const logEntry = {
          index: count,
          documentId: doc.id,
          email: data.email || "N/A",
          previousUserType: oldUserType,
          newUserType: "vip",
          status: "✅ SUCCESS",
          updatedAt: new Date().toISOString(),
        };

        logs.push(logEntry);

        // Log every 10 updates
        if (count % 10 === 0) {
          console.log(
            `📊 Progress: ${count}/${snapshot.size} documents updated from freev2 → vip`
          );
        }
      } catch (docErr: any) {
        errors++;
        console.error(`❌ Error updating doc ${doc.id}:`, docErr.message);
        logs.push({
          index: count + errors,
          documentId: doc.id,
          status: "❌ FAILED",
          error: docErr.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(
      `✅ Successfully updated ${count} documents: freev2 → vip`
    );
    console.log(`⏱️ Total time: ${duration} seconds`);
    console.log(`📋 Errors: ${errors}`);

    return NextResponse.json({
      success: true,
      summary: {
        totalDocumentsFound: snapshot.size,
        limit: 100,
        successfulUpdates: count,
        failedUpdates: errors,
        duration: `${duration}s`,
        filter: {
          user_type: "freev2",
        },
        update: {
          from: "freev2",
          to: "vip",
        },
        updatedFields: {
          user_type: "vip",
          modified_at: "Timestamp.now()",
          __testt_trigger: "ISO timestamp",
        },
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date(endTime).toISOString(),
      },
      logs: logs,
    });
  } catch (err: any) {
    console.error("🔥 Error during Firestore update:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
