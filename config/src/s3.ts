import { S3Client } from "bun";
import { env } from "./env";

let client: S3Client | undefined;

export function s3(): S3Client {
  if (client) {
    return client;
  }

  if (
    !(
      env.S3_ENDPOINT &&
      env.S3_BUCKET &&
      env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY
    )
  ) {
    throw new Error(
      "S3 não configurado: defina S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY"
    );
  }

  client = new S3Client({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
  });

  return client;
}
