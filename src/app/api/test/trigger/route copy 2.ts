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
    // Generate a new user matching BigQuery schema
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      password: null,
      is_deleted: false,
      providerId: "google.com",
      created_at: admin.firestore.Timestamp.now(),
      modified_at: admin.firestore.Timestamp.now(),
      wp_user: {
        purchase_types: [],
        user_email: `test-${Date.now()}@example.com`,
        ID: `user_${Date.now()}`,
        display_name: "Test User",
      },
      selected_gender: "not_specified",
      first_session_done: false,
      free_trial_wall_showed_once: false,
      user_type: "freev2",
      treatment_stage: "FREE_STOPPAGE",
      free_to_freev2_migrated: true,
      free_to_freev2_migrated_at: admin.firestore.Timestamp.now(),
    };

    // Add document to Users collection (auto-generates ID)
    const docRef = await db.collection("Users").add(newUser);
    console.log(`✅ Successfully added new user with ID: ${docRef.id}`);

    return NextResponse.json({
      message: `✅ New user created with ID: ${docRef.id}`,
      userId: docRef.id,
      userData: newUser,
    });
  } catch (err: any) {
    console.error("🔥 Error during user creation:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}