import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { intro, log, outro } from "@clack/prompts";
import pc from "picocolors";

import { projectRoot, replaceInFile, writeTextFile } from "./lib/utils";

const root = projectRoot();
process.chdir(root);

const AUTH_SECRET_PATTERN = /^BETTER_AUTH_SECRET=.*$/m;

// ─── Criar arquivo .env para um app ─────────────────────────────────────────────

async function createEnvFile(
  appPath: string,
  content: string
): Promise<boolean> {
  const envPath = resolve(root, appPath);

  if (existsSync(envPath)) {
    log.info(`${appPath} já existe, mantendo`);
    return false;
  }

  await writeTextFile(envPath, content);
  log.success(`${appPath} criado`);
  return true;
}

// ─── Gerar secret para BETTER_AUTH ───────────────────────────────────────────────

async function generateAuthSecret(envPath: string): Promise<void> {
  const secret = randomBytes(32).toString("base64");
  await replaceInFile(envPath, [
    { from: AUTH_SECRET_PATTERN, to: `BETTER_AUTH_SECRET=${secret}` },
  ]);
  log.success("BETTER_AUTH_SECRET gerado");
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  intro(pc.bgCyan(pc.black(" Configurar .env ")));

  const serverCreated = await createEnvFile(
    "apps/server/.env",
    [
      "DATABASE_URL=postgresql://user:password@localhost:5432/db",
      "BETTER_AUTH_SECRET=",
      "BETTER_AUTH_URL=http://localhost:3000",
      "CORS_ORIGIN=http://localhost:3001",
      "LOG_LEVEL=debug",
      "",
    ].join("\n")
  );

  await createEnvFile(
    "apps/client/.env",
    ["VITE_SERVER_URL=http://localhost:3000", "VITE_DEVTOOLS=true", ""].join(
      "\n"
    )
  );

  if (serverCreated) {
    await generateAuthSecret(resolve(root, "apps/server/.env"));
  } else {
    log.info("BETTER_AUTH_SECRET mantido (já existente)");
  }

  outro("Ambiente configurado!");
}

await main();
