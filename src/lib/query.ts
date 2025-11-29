export const projectId = process.env.GCP_PROJECT_ID_MOETEZ || "test-bigquery-3dc1a";

export const query = `
-- 1) Merge latest changes from staging → latest table
MERGE \`${projectId}.analytics.users_latest\` AS T
USING (
  -- Get the latest event per document_id from staging
  SELECT
    document_id,
    ARRAY_AGG(
      STRUCT(timestamp, data, operation, event_id)
      ORDER BY timestamp DESC
      LIMIT 1
    )[OFFSET(0)] AS latest
  FROM \`${projectId}.analytics.users_staging\`
  GROUP BY document_id
) AS S
ON T.document_id = S.document_id

--  DELETE operation for existing rows
WHEN MATCHED 
  AND S.latest.operation = 'DELETE'
  AND S.latest.timestamp > T.timestamp
THEN DELETE

--  UPDATE operation for existing rows
WHEN MATCHED
  AND S.latest.operation = 'UPDATE'
  AND S.latest.timestamp > T.timestamp
THEN UPDATE SET
  timestamp = S.latest.timestamp,
  data = S.latest.data,
  operation = S.latest.operation,
  event_id = S.latest.event_id

--  INSERT new rows (CREATE or missing rows)
WHEN NOT MATCHED THEN
  INSERT (document_id, timestamp, data, operation, event_id)
  VALUES (
    S.document_id,
    S.latest.timestamp,
    S.latest.data,
    S.latest.operation,
    S.latest.event_id
  );

-- 2) Clear staging table after merge
TRUNCATE TABLE \`${projectId}.analytics.users_staging\`;
`;
