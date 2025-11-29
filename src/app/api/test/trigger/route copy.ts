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


    const snapshot = await db.collection("Users").limit(100).get(); // <-- Limit to 5 documents
    console.log(`📦 Retrieved ${snapshot.size} documents for testing.`);

    let count = 0;

for (const doc of snapshot.docs) {
  const data = doc.data();
  // Add a temporary field to trigger BigQuery streaming
  data.__testt_trigger = new Date().toISOString();
  await db.collection("Users").doc(doc.id).set(data, { merge: true });
  count++;
}


    console.log(`✅ Successfully rewrote ${count} documents in "Users"`);

    return NextResponse.json({
      message: `✅ Test rewrite: ${count} documents in collection "Users"`,
    });
  } catch (err: any) {
    console.error("🔥 Error during Firestore rewrite:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}