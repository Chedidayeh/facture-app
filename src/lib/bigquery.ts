import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID_MOETEZ,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY_MOETEZ 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY_MOETEZ)
    : undefined,
});

export default bigquery;
