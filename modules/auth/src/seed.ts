import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { auth } from "./server";

interface SeedUser {
  email: string;
  password: string;
  name: string;
  username: string;
  role: "admin" | "user";
}

const SEEDS: SeedUser[] = [
  {
    email: "dev@dev.com",
    password: "dev12345",
    name: "Desenvolvedor",
    username: "dev",
    role: "admin",
  },
  {
    email: "user@dev.com",
    password: "dev12345",
    name: "Usuário",
    username: "user",
    role: "user",
  },
];

const DUPLICATE_PATTERN = /already|exist|unique|duplicate/i;
const SCRIPT_KEY = "db:users";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const moduleAuthPkgPath = join(__dirname, "..", "package.json");
const rootPkgPath = join(__dirname, "..", "..", "..", "package.json");

async function seedUsers(): Promise<void> {
  for (const s of SEEDS) {
    try {
      await auth.api.createUser({
        body: {
          email: s.email,
          password: s.password,
          name: s.name,
          role: s.role,
          data: {
            username: s.username,
            displayUsername: s.username,
          },
        },
      });
      console.log(`[seed] criado: ${s.email} (${s.role})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (DUPLICATE_PATTERN.test(msg)) {
        console.log(`[seed] já existe: ${s.email}`);
        continue;
      }
      throw err;
    }
  }
}

function removeScript(pkgPath: string): void {
  const raw = readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw) as {
    scripts?: Record<string, string>;
    [k: string]: unknown;
  };
  if (!(pkg.scripts && SCRIPT_KEY in pkg.scripts)) {
    return;
  }
  delete pkg.scripts[SCRIPT_KEY];
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`[seed] script "${SCRIPT_KEY}" removido de ${pkgPath}`);
}

function selfDestruct(): void {
  removeScript(moduleAuthPkgPath);
  removeScript(rootPkgPath);
  rmSync(__filename, { force: true });
  console.log("[seed] script removido. Não rodar novamente.");
}

await seedUsers();
selfDestruct();
process.exit(0);
