import { rm, unlink } from "node:fs/promises";
import { resolve } from "node:path";

import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  spinner,
} from "@clack/prompts";
import pc from "picocolors";

import { projectRoot, replaceInFile } from "./lib/utils";

const root = projectRoot();

// ─── Regex patterns ─────────────────────────────────────────────────

const IMPORT_TASK_ROUTER_RE =
  /import \{ taskRouter \} from "\.\/routers\/task";\n/;
const TASK_ROUTER_ENTRY_RE = /,?\s*task: taskRouter\s*,?/;
const SERVER_TRAILING_COMMA_RE = /,(\s*\})/;
const CLEANUP_SCRIPT_RE = /\s*"cleanup":\s*"bun run scripts\/cleanup\.ts",?\n?/;
const PKG_TRAILING_COMMA_RE = /,(\s*\})/;

const NAV_IMPORT_TASK_ICON_RE = /,?\s*CheckSquareOffsetIcon/;
const NAV_TASK_MENU_ITEM_RE =
  /,?\s*\{ label: "Tarefas", icon: CheckSquareOffsetIcon, to: "\/tasks" \}/;

// ─── Arquivos de exemplo do domínio Task ────────────────────────────

const TASK_FILES = [
  "domain/src/entities/Task.ts",
  "domain/src/entities/Task.test.ts",
  "domain/src/contracts/Task.ts",
  "domain/src/application/Task.ts",
  "domain/src/application/Task.test.ts",
  "modules/db/src/schema/task.ts",
  "modules/db/src/repositories/task.ts",
  "modules/api/src/routers/task.ts",
  "apps/client/src/routes/_auth/tasks.tsx",
];

const TASK_DIRS = ["apps/client/src/features/Task"];

// ─── Main ───────────────────────────────────────────────────────────

async function safeUnlink(path: string) {
  try {
    await unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function main() {
  intro(pc.bgCyan(pc.black(" Cleanup dos Exemplos ")));

  log.info(
    `Este script vai remover os arquivos de exemplo do domínio ${pc.cyan("Task")} e suas referências.`
  );

  const shouldContinue = await confirm({
    message: "Deseja apagar todos os arquivos de exemplo do domínio Task?",
  });

  if (isCancel(shouldContinue) || !shouldContinue) {
    cancel("Cleanup cancelado.");
    process.exit(0);
  }

  const s = spinner();
  s.start("Removendo arquivos de exemplo...");

  await Promise.all([
    ...TASK_FILES.map((file) => safeUnlink(resolve(root, file))),
    ...TASK_DIRS.map((dir) =>
      rm(resolve(root, dir), { recursive: true, force: true })
    ),
  ]);

  s.stop("Arquivos de exemplo removidos.");

  s.start("Restaurando referências...");

  await Promise.all([
    replaceInFile(resolve(root, "modules/api/src/server.ts"), [
      { from: IMPORT_TASK_ROUTER_RE, to: "" },
      { from: TASK_ROUTER_ENTRY_RE, to: "" },
      { from: SERVER_TRAILING_COMMA_RE, to: "$1" },
    ]),
    replaceInFile(resolve(root, "package.json"), [
      { from: CLEANUP_SCRIPT_RE, to: "\n" },
      { from: PKG_TRAILING_COMMA_RE, to: "$1" },
    ]),
    replaceInFile(resolve(root, "apps/client/src/routes/-navigation.ts"), [
      { from: NAV_IMPORT_TASK_ICON_RE, to: "" },
      { from: NAV_TASK_MENU_ITEM_RE, to: "" },
    ]),
  ]);

  s.stop("Referências restauradas.");

  s.start("Removendo script de cleanup...");
  await unlink(resolve(root, "scripts/cleanup.ts"));
  s.stop("Script de cleanup removido.");

  outro(
    pc.green("Cleanup concluído! Os exemplos foram removidos com sucesso.")
  );
}

await main();
