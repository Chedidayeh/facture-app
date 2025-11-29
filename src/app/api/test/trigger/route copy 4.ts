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
    // Retrieve only 2 documents
    const snapshot = await db.collection("Users").limit(2).get();
    console.log(`📦 Retrieved ${snapshot.size} documents for testing.`);

    let count = 0;

    for (const doc of snapshot.docs) {
      // Update only existing field (e.g., user_type)
      await db.collection("Users").doc(doc.id).update({
        user_type: "freev2_updated",
        modified_at: admin.firestore.Timestamp.now(),
      });
      count++;
    }

    console.log(`✅ Successfully updated ${count} documents in "Users"`);

    return NextResponse.json({
      message: `✅ Test update: ${count} documents in collection "Users"`,
      updated: count,
    });
  } catch (err: any) {
    console.error("🔥 Error during Firestore update:", err);
    return NextResponse.json({ error: err.message }, { status: 500 }); return NextResponse.json({ error: err.message }, { status: 500 });
  } }
