import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { intro, log, outro } from "@clack/prompts";
import pc from "picocolors";

import {
  projectRoot,
  readTextFile,
  replaceInFile,
  writeTextFile,
} from "./lib/utils";

const root = projectRoot();
const AUTH_SECRET_PATTERN = /^BETTER_AUTH_SECRET=(.*)$/m;

export const SERVER_ENV_PATH = resolve(root, "apps/server/.env");
export const CLIENT_ENV_PATH = resolve(root, "apps/client/.env");

const SERVER_ENV_CONTENT = [
  "DATABASE_URL=postgresql://user:password@localhost:5432/db",
  "BETTER_AUTH_SECRET=",
  "BETTER_AUTH_URL=http://localhost:3000",
  "CORS_ORIGIN=http://localhost:3001",
  "LOG_LEVEL=debug",
  "DISABLE_PUBLIC_SIGNUP=false",
  "S3_ENDPOINT=http://localhost:9000",
  "S3_REGION=auto",
  "S3_BUCKET=alpha",
  "S3_ACCESS_KEY_ID=minioadmin",
  "S3_SECRET_ACCESS_KEY=minioadmin",
  "",
].join("\n");

const CLIENT_ENV_CONTENT = [
  "VITE_SERVER_URL=http://localhost:3000",
  "VITE_DEVTOOLS=true",
  "VITE_DISABLE_PUBLIC_SIGNUP=false",
  "",
].join("\n");

async function createEnvFile(
  envPath: string,
  content: string
): Promise<boolean> {
  if (existsSync(envPath)) {
    return false;
  }
  await writeTextFile(envPath, content);
  return true;
}

export async function createEnvFiles(): Promise<{
  serverCreated: boolean;
  clientCreated: boolean;
}> {
  const serverCreated = await createEnvFile(
    SERVER_ENV_PATH,
    SERVER_ENV_CONTENT
  );
  const clientCreated = await createEnvFile(
    CLIENT_ENV_PATH,
    CLIENT_ENV_CONTENT
  );
  return { serverCreated, clientCreated };
}

export async function readAuthSecret(): Promise<string> {
  if (!existsSync(SERVER_ENV_PATH)) {
    return "";
  }
  const content = await readTextFile(SERVER_ENV_PATH);
  const match = content.match(AUTH_SECRET_PATTERN);
  return match?.[1]?.trim() ?? "";
}

export async function generateAuthSecret(): Promise<string> {
  const secret = randomBytes(32).toString("base64");
  await replaceInFile(SERVER_ENV_PATH, [
    { from: AUTH_SECRET_PATTERN, to: `BETTER_AUTH_SECRET=${secret}` },
  ]);
  return secret;
}

async function main(): Promise<void> {
  process.chdir(root);
  intro(pc.bgCyan(pc.black(" Configurar .env ")));

  const { serverCreated, clientCreated } = await createEnvFiles();

  if (serverCreated) {
    log.success("apps/server/.env criado");
  } else {
    log.info("apps/server/.env já existe, mantendo");
  }

  if (clientCreated) {
    log.success("apps/client/.env criado");
  } else {
    log.info("apps/client/.env já existe, mantendo");
  }

  const currentSecret = await readAuthSecret();
  if (currentSecret.length < 32) {
    await generateAuthSecret();
    log.success("BETTER_AUTH_SECRET gerado");
  } else {
    log.info("BETTER_AUTH_SECRET mantido (já existente)");
  }

  outro("Ambiente configurado!");
}

if (import.meta.main) {
  await main();
}
