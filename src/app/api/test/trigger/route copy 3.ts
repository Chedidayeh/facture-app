import { NextResponse } from "next/server";
import admin from "firebase-admin";

// --- Ensure service account key exists
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing in environment variables.");
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in environment variables");
}

// --- Parse service account safely
let serviceAccount: any;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
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
    // Get all documents
    const snapshot = await db.collection("Users").get();
    console.log(`📦 Retrieved ${snapshot.size} documents for testing.`);

    let deleteCount = 0;
    let keepCount = 0;

    // Delete all docs except first 100
    for (let i = 0; i < snapshot.docs.length; i++) {
      if (i >= 99) {
        // Delete documents after the first 100
        await db.collection("Users").doc(snapshot.docs[i].id).delete();
        deleteCount++;
      } else {
        keepCount++;
      }
    }

    console.log(`✅ Kept ${keepCount} documents, deleted ${deleteCount} documents`);

    return NextResponse.json({
      message: `✅ Kept ${keepCount} documents, deleted ${deleteCount} documents from collection "Users"`,
      kept: keepCount,
      deleted: deleteCount,
    });
  } catch (err: any) {
    console.error("🔥 Error during cleanup:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}