import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

import {
  cancel,
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

import {
  commandExists,
  gitCommitIfChanged,
  projectRoot,
  readJsonFile,
  writeJsonFile,
  writeTextFile,
} from "./lib/utils";

const root = projectRoot();
process.chdir(root);

const VALID_NAME = /^[a-z0-9][a-z0-9._-]*$/;

function exitIfCancelled<T>(value: T | symbol): asserts value is T {
  if (isCancel(value)) {
    cancel("Setup cancelado.");
    process.exit(0);
  }
}

// ─── Verificar se gh CLI está instalado e autenticado ────────────────────────────

async function checkGhCli(): Promise<void> {
  const installed = await commandExists("gh");

  if (!installed) {
    log.error("O GitHub CLI (gh) não está instalado.");
    log.info(`Instale em: ${pc.underline(pc.cyan("https://cli.github.com"))}`);
    cancel("Setup cancelado.");
    process.exit(1);
  }

  const { exitCode } = await $`gh auth status`.nothrow().quiet();

  if (exitCode !== 0) {
    log.error("O GitHub CLI não está autenticado.");
    log.info(`Execute: ${pc.cyan("gh auth login")}`);
    cancel("Setup cancelado.");
    process.exit(1);
  }

  log.success("GitHub CLI instalado e autenticado");
}

// ─── Solicitar nome do projeto ───────────────────────────────────────────────────

async function promptProjectName(): Promise<string> {
  const name = await text({
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

  exitIfCancelled(name);

  log.success(`Projeto: ${pc.cyan(name)}`);
  return name;
}

// ─── Limpar README.md ────────────────────────────────────────────────────────────

async function resetReadme(projectName: string): Promise<void> {
  const readmePath = resolve(root, "README.md");
  await writeTextFile(
    readmePath,
    `# ${projectName}\n\nDescreva seu projeto aqui.\n`
  );
  log.success("README.md atualizado");
}

// ─── Renomear projeto no package.json ────────────────────────────────────────────

async function renamePackage(
  pkgPath: string,
  projectName: string
): Promise<void> {
  const pkg = await readJsonFile<Record<string, unknown>>(pkgPath);
  pkg.name = projectName;
  await writeJsonFile(pkgPath, pkg);
  log.success(`package.json renomeado para ${pc.cyan(projectName)}`);
}

// ─── Preparar repositório git ────────────────────────────────────────────────────

async function prepareGitRepo(): Promise<void> {
  const gitPath = resolve(root, ".git");
  const { exitCode } = await $`git remote get-url origin`.nothrow().quiet();
  const isTemplateGit = existsSync(gitPath) && exitCode === 0;

  if (isTemplateGit) {
    await rm(gitPath, { recursive: true, force: true });
    await $`git init`.quiet();
    log.success("Git do template removido e novo repositório iniciado");
    return;
  }

  if (existsSync(gitPath)) {
    log.info("Repositório git já iniciado, mantendo");
    return;
  }

  await $`git init`.quiet();
  log.success("Novo repositório git iniciado");
}

// ─── Selecionar organização do GitHub ────────────────────────────────────────────

async function promptOwner(): Promise<string> {
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

  interface OwnerOption {
    value: string;
    label: string;
    hint?: string;
  }

  const options: OwnerOption[] = [
    { value: username, label: username, hint: "conta pessoal" },
    ...orgsList.map((org) => ({ value: org, label: org })),
  ];

  const owner = await select({
    message: "Onde criar o repositório?",
    options,
  });

  exitIfCancelled(owner);

  return owner;
}

// ─── Criar ou conectar repositório no GitHub ─────────────────────────────────────

async function ensureGitHubRepo(fullName: string): Promise<void> {
  const { exitCode } = await $`gh repo view ${fullName}`.nothrow().quiet();
  const repoExists = exitCode === 0;

  if (repoExists) {
    log.info(`Repositório ${pc.cyan(fullName)} já existe no GitHub`);
    return;
  }

  const visibility = await select({
    message: "Visibilidade do repositório:",
    options: [
      { value: "private", label: "Privado" },
      { value: "public", label: "Público" },
    ],
  });

  exitIfCancelled(visibility);

  const s = spinner();
  s.start(`Criando repositório ${fullName}...`);

  const flag = visibility === "private" ? "--private" : "--public";
  await $`gh repo create ${fullName} ${flag} --clone=false`.quiet();

  s.stop(`Repositório ${pc.cyan(fullName)} criado`);
}

// ─── Configurar remote origin ────────────────────────────────────────────────────

async function configureRemote(fullName: string): Promise<void> {
  const { stdout: urlRaw } =
    await $`gh repo view ${fullName} --json url --jq .url`.quiet();
  const repoUrl = urlRaw.toString().trim();

  const { exitCode } = await $`git remote get-url origin`.nothrow().quiet();

  if (exitCode === 0) {
    await $`git remote set-url origin ${repoUrl}`.quiet();
    log.info(`Remote origin atualizado para ${pc.cyan(repoUrl)}`);
    return;
  }

  await $`git remote add origin ${repoUrl}`.quiet();
  log.success(`Remote origin configurado para ${pc.cyan(repoUrl)}`);
}

// ─── Criar commit inicial ────────────────────────────────────────────────────────

async function createInitialCommit(): Promise<void> {
  const s = spinner();
  s.start("Criando commit inicial...");

  const committed = await gitCommitIfChanged("initial commit");

  if (committed) {
    s.stop("Commit inicial criado");
  } else {
    s.stop("Nenhuma alteração para commitar");
  }
}

// ─── Enviar para o GitHub ────────────────────────────────────────────────────────

async function pushToGitHub(): Promise<void> {
  const s = spinner();
  s.start("Enviando para o GitHub...");

  await $`git branch -M main`.quiet();
  await $`git push -u origin main`.quiet();

  s.stop("Push realizado com sucesso");
}

// ─── Remover script de setup e limpar package.json ───────────────────────────────

async function cleanupSetup(pkgPath: string): Promise<void> {
  const setupPath = resolve(root, "scripts/setup.ts");
  const pkg = await readJsonFile<Record<string, unknown>>(pkgPath);
  const scripts = pkg.scripts as Record<string, string> | undefined;

  if (scripts?.setup) {
    const { setup: _, ...remaining } = scripts;
    pkg.scripts = remaining;
    await writeJsonFile(pkgPath, pkg);
    log.success('Script "setup" removido do package.json');
  }

  if (existsSync(setupPath)) {
    await rm(setupPath);
  }

  const committed = await gitCommitIfChanged("chore: remove script de setup");

  if (committed) {
    await $`git push`.quiet();
  }

  log.success("Limpeza do setup concluída");
}

// ─── Exibir resumo final ─────────────────────────────────────────────────────────

function showSummary(projectName: string, fullName: string): void {
  note(
    [
      `${pc.cyan("Projeto:")}    ${projectName}`,
      `${pc.cyan("GitHub:")}     ${fullName}`,
      "",
      `${pc.dim("Próximos passos:")}`,
      "  bun env",
      "  bun dev",
    ].join("\n"),
    "Setup concluído"
  );

  outro(pc.green("Tudo pronto! Bom código! 🚀"));
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  intro(pc.bgCyan(pc.black(" Setup do Template ")));

  await checkGhCli();

  const projectName = await promptProjectName();
  const pkgPath = resolve(root, "package.json");

  await resetReadme(projectName);
  await renamePackage(pkgPath, projectName);
  await prepareGitRepo();

  const owner = await promptOwner();
  const fullName = `${owner}/${projectName}`;
  log.success(`Destino: ${pc.cyan(fullName)}`);

  await ensureGitHubRepo(fullName);
  await configureRemote(fullName);
  await createInitialCommit();
  await pushToGitHub();
  await cleanupSetup(pkgPath);

  showSummary(projectName, fullName);
}

await main();
