/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

import { BigQuery } from "@google-cloud/bigquery";
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY!),
});

import * as admin from "firebase-admin";

admin.initializeApp();

const DATASET = "analytics";
const TABLE = "users_staging";

exports.streamUserToBigQuery = onDocumentWritten(
  "Users/{id}",
  async (event) => {
    const documentId = event.params.id;
    const eventId = event.id;
    const timestamp = new Date().toISOString();

    let operation;
    let data;

    if (!event.data?.before.exists && event.data?.after.exists) {
      operation = "CREATE";
      data = event.data.after.data();
    } else if (event.data?.before.exists && event.data?.after.exists) {
      operation = "UPDATE";
      data = event.data.after.data();
    } else if (event.data?.before.exists && !event.data?.after.exists) {
      operation = "DELETE";
      data = event.data.before.data();
    }

    const row = {
      document_id: documentId,
      timestamp: timestamp,
      operation: operation,
      data: JSON.stringify(data),
      event_id: eventId,
    };

    try {
      await bigquery
        .dataset(DATASET)
        .table(TABLE)
        .insert([row]);

      console.log(`Stored event ${eventId} for doc ${documentId}`);
    } catch (err: any) {
      if (err?.name === "PartialFailureError") {
        if (err?.errors?.[0]?.reason === "duplicate") {
          console.log("Duplicate event ignored:", eventId);
          return;
        }
      }
      throw err;
    }
  }
);

