import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

import { $ } from "bun";

import { cleanupTaskExamples } from "../cleanup";
import { createEnvFiles, generateAuthSecret, readAuthSecret } from "../env";
import type { SetupState } from "./state";
import {
  gitCommitIfChanged,
  projectRoot,
  readJsonFile,
  writeJsonFile,
  writeTextFile,
} from "./utils";

const ROOT = projectRoot();

export async function stepRename(state: SetupState): Promise<void> {
  const pkgPath = resolve(ROOT, "package.json");
  const pkg = await readJsonFile<Record<string, unknown>>(pkgPath);
  pkg.name = state.inputs.projectName;
  await writeJsonFile(pkgPath, pkg);
}

export async function stepReadme(state: SetupState): Promise<void> {
  const readmePath = resolve(ROOT, "README.md");
  await writeTextFile(
    readmePath,
    `# ${state.inputs.projectName}\n\nDescreva seu projeto aqui.\n`
  );
}

export async function stepCleanup(state: SetupState): Promise<void> {
  if (state.inputs.keepExamples) {
    return;
  }
  await cleanupTaskExamples();
}

export async function stepGitInit(_state: SetupState): Promise<void> {
  const gitPath = resolve(ROOT, ".git");
  const { exitCode } = await $`git remote get-url origin`.nothrow().quiet();
  const isTemplateGit = existsSync(gitPath) && exitCode === 0;

  if (isTemplateGit) {
    await rm(gitPath, { recursive: true, force: true });
  }

  if (!existsSync(gitPath)) {
    await $`git init`.quiet();
  }
}

export async function stepEnvFiles(_state: SetupState): Promise<void> {
  await createEnvFiles();
}

export async function stepAuthSecret(_state: SetupState): Promise<void> {
  const current = await readAuthSecret();
  if (current.length < 32) {
    await generateAuthSecret();
  }
}

export async function stepDockerUp(_state: SetupState): Promise<void> {
  await $`docker compose up -d --wait postgres`.quiet();
}

export async function stepDbPush(_state: SetupState): Promise<void> {
  await $`bun run db:push`.quiet();
}

export async function stepDbSeed(state: SetupState): Promise<void> {
  if (!state.inputs.seedUsers) {
    return;
  }
  await $`bun run db:users`.quiet();
}

export async function stepGhRepo(state: SetupState): Promise<void> {
  const fullName = `${state.inputs.owner}/${state.inputs.projectName}`;
  const { exitCode } = await $`gh repo view ${fullName}`.nothrow().quiet();
  if (exitCode === 0) {
    return;
  }

  const flag = state.inputs.visibility === "private" ? "--private" : "--public";
  await $`gh repo create ${fullName} ${flag} --clone=false`.quiet();
}

export async function stepRemote(state: SetupState): Promise<void> {
  const fullName = `${state.inputs.owner}/${state.inputs.projectName}`;
  const { stdout: urlRaw } =
    await $`gh repo view ${fullName} --json url --jq .url`.quiet();
  const repoUrl = urlRaw.toString().trim();

  const { exitCode } = await $`git remote get-url origin`.nothrow().quiet();
  if (exitCode === 0) {
    await $`git remote set-url origin ${repoUrl}`.quiet();
  } else {
    await $`git remote add origin ${repoUrl}`.quiet();
  }
}

export async function stepCommit(_state: SetupState): Promise<void> {
  await gitCommitIfChanged("initial commit");
}

export async function stepPush(_state: SetupState): Promise<void> {
  await $`git branch -M main`.quiet();
  await $`git push -u origin main`.quiet();
}

export async function stepSelfClean(_state: SetupState): Promise<void> {
  const setupPath = resolve(ROOT, "scripts/setup.ts");
  const pkgPath = resolve(ROOT, "package.json");

  const pkg = await readJsonFile<Record<string, unknown>>(pkgPath);
  const scripts = pkg.scripts as Record<string, string> | undefined;
  if (scripts?.setup) {
    pkg.scripts = Object.fromEntries(
      Object.entries(scripts).filter(([key]) => key !== "setup")
    );
    await writeJsonFile(pkgPath, pkg);
  }

  await rm(setupPath, { force: true });

  const committed = await gitCommitIfChanged("chore: remove script de setup");
  if (committed) {
    await $`git push`.quiet();
  }
}
