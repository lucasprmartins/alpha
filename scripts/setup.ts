import { parseArgs } from "node:util";

import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import { $ } from "bun";
import pc from "picocolors";

import { runPreflight } from "./lib/preflight";
import {
  clearState,
  readState,
  type SetupInputs,
  type SetupState,
  type StepName,
  writeState,
} from "./lib/state";
import {
  stepAuthSecret,
  stepCleanup,
  stepCommit,
  stepDbMigrate,
  stepDbSeed,
  stepDockerUp,
  stepEnvFiles,
  stepGhRepo,
  stepGitInit,
  stepPush,
  stepReadme,
  stepRemote,
  stepRename,
  stepSelfClean,
} from "./lib/steps";
import { projectRoot } from "./lib/utils";

const VALID_NAME = /^[a-z0-9][a-z0-9._-]*$/;

const ALL_STEPS: Array<{
  name: StepName;
  fn: (s: SetupState) => Promise<void>;
}> = [
  { name: "rename", fn: stepRename },
  { name: "readme", fn: stepReadme },
  { name: "cleanup", fn: stepCleanup },
  { name: "git_init", fn: stepGitInit },
  { name: "env_files", fn: stepEnvFiles },
  { name: "auth_secret", fn: stepAuthSecret },
  { name: "docker_up", fn: stepDockerUp },
  { name: "db_migrate", fn: stepDbMigrate },
  { name: "db_seed", fn: stepDbSeed },
  { name: "gh_repo", fn: stepGhRepo },
  { name: "remote", fn: stepRemote },
  { name: "commit", fn: stepCommit },
  { name: "push", fn: stepPush },
  { name: "self_clean", fn: stepSelfClean },
];

function exitIfCancelled<T>(value: T | symbol): asserts value is T {
  if (isCancel(value)) {
    cancel("Setup cancelado.");
    process.exit(0);
  }
}

async function collectInputs(): Promise<SetupInputs> {
  const projectName = await text({
    message: "Qual o nome do novo projeto?",
    placeholder: "meu-projeto",
    validate(value = "") {
      if (value.length === 0) {
        return "O nome é obrigatório.";
      }
      if (!VALID_NAME.test(value)) {
        return "Use apenas letras minúsculas, números, hífens, pontos e underscores.";
      }
    },
  });
  exitIfCancelled(projectName);

  const [{ stdout: userRaw }, { stdout: orgsRaw }] = await Promise.all([
    $`gh api user --jq .login`.quiet(),
    $`gh api user/orgs --jq .[].login`.quiet(),
  ]);

  const username = userRaw.toString().trim();
  const orgsList = orgsRaw
    .toString()
    .trim()
    .split("\n")
    .filter((o) => o.length > 0);

  const owner = await select({
    message: "Onde criar o repositório?",
    options: [
      { value: username, label: username, hint: "conta pessoal" },
      ...orgsList.map((org) => ({ value: org, label: org })),
    ],
  });
  exitIfCancelled(owner);

  const visibility = await select<"private" | "public">({
    message: "Visibilidade do repositório:",
    options: [
      { value: "private", label: "Privado" },
      { value: "public", label: "Público" },
    ],
  });
  exitIfCancelled(visibility);

  const keepExamples = await confirm({
    message: "Manter o domínio de exemplo (Task)?",
    initialValue: false,
  });
  exitIfCancelled(keepExamples);

  const seedUsers = await confirm({
    message: "Criar usuários iniciais (admin + comum) após aplicar schema?",
    initialValue: true,
  });
  exitIfCancelled(seedUsers);

  return {
    projectName,
    owner,
    visibility,
    keepExamples,
    seedUsers,
  };
}

async function runStep(
  name: StepName,
  state: SetupState,
  fn: (s: SetupState) => Promise<void>
): Promise<void> {
  if (state.completed.includes(name)) {
    log.info(pc.dim(`[skip] ${name}`));
    return;
  }

  const s = spinner();
  s.start(name);
  try {
    await fn(state);
    state.completed.push(name);
    state.lastError = undefined;
    await writeState(state);
    s.stop(`${name} ${pc.green("✓")}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    state.lastError = {
      step: name,
      message,
      timestamp: new Date().toISOString(),
    };
    await writeState(state);
    s.stop(`${name} ${pc.red("✗")}`);
    log.error(`Falhou em [${pc.cyan(name)}]: ${message}`);
    log.info(
      `Estado salvo em ${pc.dim(".setup-state.json")}. ${pc.cyan("bun setup")} retoma | ${pc.cyan("bun setup --reset")} recomeça.`
    );
    process.exit(1);
  }
}

function showSummary(inputs: SetupInputs): void {
  const fullName = `${inputs.owner}/${inputs.projectName}`;
  note(
    [
      `${pc.cyan("Projeto:")}    ${inputs.projectName}`,
      `${pc.cyan("GitHub:")}     ${fullName}`,
      `${pc.cyan("Local:")}      :3000 (server) / :3001 (client)`,
      "",
      `${pc.dim("Próximo passo:")}`,
      "  bun dev",
    ].join("\n"),
    "Setup concluído"
  );
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { reset: { type: "boolean" } },
    strict: false,
  });

  process.chdir(projectRoot());
  intro(pc.bgCyan(pc.black(" Setup do Template ")));

  if (values.reset) {
    await clearState();
    log.info(".setup-state.json removido (--reset)");
  }

  await runPreflight();

  let state = await readState();
  if (state) {
    log.warn(
      `Retomando setup — ${state.completed.length}/${ALL_STEPS.length} passos concluídos`
    );
    if (state.lastError) {
      log.warn(
        `Última falha: [${state.lastError.step}] ${state.lastError.message}`
      );
    }
  } else {
    const inputs = await collectInputs();
    state = {
      version: 1,
      inputs,
      completed: [],
    };
    await writeState(state);
  }

  for (const { name, fn } of ALL_STEPS) {
    await runStep(name, state, fn);
  }

  await clearState();
  showSummary(state.inputs);
  outro(pc.green("Tudo pronto! Bom código!"));
}

await main();
