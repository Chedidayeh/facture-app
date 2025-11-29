/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2/options";
import {onDocumentWritten} from "firebase-functions/v2/firestore";

setGlobalOptions({ maxInstances: 100 });

import { BigQuery } from "@google-cloud/bigquery";
import * as admin from "firebase-admin";

admin.initializeApp();

const DATASET = "analytics";
const USERS_STAGING_TABLE = "users_staging";
// const USERS_LATEST_TABLE = "users_latest";
const USERS_LATEST_TABLE_V2 = "users_latest_v2";
const PROGRESS_STAGING_TABLE = "progress_check_answers_staging";
const PROGRESS_LATEST_TABLE = "progress_check_answers_latest";

// Initialize BigQuery once at module load time
const bigquery = new BigQuery();

// ============================================================
// Function 1: Stream all events to staging table (event log)
// ============================================================
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
        .table(USERS_STAGING_TABLE)
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

// Create a queue and batch updates every N operations or after a timeout
const updateQueue: Map<string, any> = new Map();
const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 5000; // 5 seconds

let batchTimer: NodeJS.Timeout | null = null;

async function flushBatch() {
  if (updateQueue.size === 0) return;

  const rows = Array.from(updateQueue.values());
  const mergeQuery = `
    MERGE \`${bigquery.projectId}.${DATASET}.${USERS_LATEST_TABLE_V2}\` T
    USING (
      ${rows
        .map(
          (_, i) => `
        SELECT
          @documentId_${i} as document_id,
          @data_${i} as data,
          TIMESTAMP(@timestamp_${i}) as timestamp
      `
        )
        .join(" UNION ALL ")}

    ) S
    ON T.document_id = S.document_id
    WHEN MATCHED THEN
      UPDATE SET data = S.data, timestamp = S.timestamp
    WHEN NOT MATCHED THEN
      INSERT (document_id, data, timestamp)
      VALUES (S.document_id, S.data, S.timestamp)
  `;

  const params: Record<string, any> = {};
  rows.forEach((row, i) => {
    params[`documentId_${i}`] = row.document_id;
    params[`data_${i}`] = row.data;
    params[`timestamp_${i}`] = row.timestamp;
  });

  await bigquery.query({ query: mergeQuery, params });
  updateQueue.clear();
}

// ============================================================
// Function 2: Direct upsert/delete to users_latest table
// Triggered on Users document changes
// ============================================================
exports.maintainUserLatest = onDocumentWritten(
  "Users/{id}",
  async (event) => {
    const documentId = event.params.id;
    const isDeleted = !event.data?.after.exists;

    try {
      if (isDeleted) {
        const deleteQuery = `DELETE FROM \`${bigquery.projectId}.${DATASET}.${USERS_LATEST_TABLE_V2}\` WHERE document_id = @documentId`;
        await bigquery.query({ query: deleteQuery, params: { documentId } });
        console.log(`✅ Deleted user ${documentId}`);
      } else if (event.data?.after.exists) {
        updateQueue.set(documentId, {
          document_id: documentId,
          data: JSON.stringify(event.data.after.data()),
          timestamp: new Date().toISOString(),
        });

        if (updateQueue.size >= BATCH_SIZE) {
          await flushBatch();
          console.log(`✅ Flushed batch with ${BATCH_SIZE} users`);
        } else {
          if (batchTimer) clearTimeout(batchTimer);
          batchTimer = setTimeout(() => {
            flushBatch().catch((err) => console.error("Batch flush error:", err));
          }, BATCH_TIMEOUT);
        }
      }
    } catch (err: any) {
      console.error(`❌ Error processing user ${documentId}:`, err);
      throw err;
    }
  }
);

// ============================================================
// Function 3: Stream ProgressCheckAnswers events to staging table
// ============================================================
exports.streamProgressCheckToBigQuery = onDocumentWritten(
  "ProgressCheckAnswers/{id}",
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
        .table(PROGRESS_STAGING_TABLE)
        .insert([row]);

      console.log(`✅ Stored progress check event ${eventId} for doc ${documentId}`);
    } catch (err: any) {
      if (err?.name === "PartialFailureError") {
        if (err?.errors?.[0]?.reason === "duplicate") {
          console.log("⚠️ Duplicate progress check event ignored:", eventId);
          return;
        }
      }
      console.error(`❌ Error storing progress check event:`, err);
      throw err;
    }
  }
);

// ============================================================
// Function 4: Maintain ProgressCheckAnswers latest table
// ============================================================
exports.maintainProgressCheckLatest = onDocumentWritten(
  "ProgressCheckAnswers/{id}",
  async (event) => {
    const documentId = event.params.id;
    const documentData = event.data?.after.data();
    const isDeleted = !event.data?.after.exists;

    try {
      if (isDeleted) {
        // DELETE case: Remove the document from latest table
        const deleteQuery = `
          DELETE FROM \`${bigquery.projectId}.${DATASET}.${PROGRESS_LATEST_TABLE}\`
          WHERE document_id = @documentId
        `;

        await bigquery.query({
          query: deleteQuery,
          params: { documentId },
        });

        console.log(`✅ Deleted progress check ${documentId} from ${PROGRESS_LATEST_TABLE}`);
      } else {
        // CREATE or UPDATE case: Insert or replace the document in latest table
        const row = {
          document_id: documentId,
          data: JSON.stringify(documentData),
          timestamp: new Date().toISOString(),
        };

        // Use insertAll with skipInvalidRows to handle both insert and update
        await bigquery
          .dataset(DATASET)
          .table(PROGRESS_LATEST_TABLE)
          .insert([row], { skipInvalidRows: true });

        console.log(`✅ Upserted progress check ${documentId} to ${PROGRESS_LATEST_TABLE}`);
      }
    } catch (err: any) {
      console.error(`❌ Error processing progress check ${documentId}:`, err);
    }
  }
);

