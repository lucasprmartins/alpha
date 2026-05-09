import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { log } from "@clack/prompts";
import { $ } from "bun";
import pc from "picocolors";

import { commandExists, projectRoot } from "./utils";

const ROOT = projectRoot();
const MIN_BUN = { major: 1, minor: 3, patch: 13 };

export async function checkBunVersion(): Promise<void> {
  const { stdout } = await $`bun --version`.quiet();
  const version = stdout.toString().trim();
  const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);

  const ok =
    major > MIN_BUN.major ||
    (major === MIN_BUN.major && minor > MIN_BUN.minor) ||
    (major === MIN_BUN.major &&
      minor === MIN_BUN.minor &&
      patch >= MIN_BUN.patch);

  if (!ok) {
    throw new Error(
      `Bun >= ${MIN_BUN.major}.${MIN_BUN.minor}.${MIN_BUN.patch} requerido. Versão atual: ${version}`
    );
  }
}

export function checkNodeModules(): void {
  if (!existsSync(resolve(ROOT, "node_modules"))) {
    throw new Error(
      `node_modules não encontrado. Execute ${pc.cyan("bun install")} antes do setup.`
    );
  }
}

export async function checkGh(): Promise<void> {
  if (!(await commandExists("gh"))) {
    throw new Error(
      `GitHub CLI (gh) não instalado. Instale em ${pc.underline(pc.cyan("https://cli.github.com"))}.`
    );
  }

  const { exitCode } = await $`gh auth status`.nothrow().quiet();
  if (exitCode !== 0) {
    throw new Error(
      `GitHub CLI não autenticado. Execute ${pc.cyan("gh auth login")}.`
    );
  }
}

export async function checkDocker(): Promise<void> {
  if (!(await commandExists("docker"))) {
    throw new Error(
      `Docker não instalado. Instale em ${pc.underline(pc.cyan("https://www.docker.com/"))}.`
    );
  }

  const { exitCode } = await $`docker info`.nothrow().quiet();
  if (exitCode !== 0) {
    throw new Error(
      "Docker daemon não está respondendo. Inicie o Docker Desktop e tente novamente."
    );
  }
}

export async function runPreflight(): Promise<void> {
  checkNodeModules();
  log.success("node_modules presente");

  await Promise.all([
    checkBunVersion().then(() => log.success("Bun version OK")),
    checkGh().then(() => log.success("GitHub CLI autenticado")),
    checkDocker().then(() => log.success("Docker daemon ativo")),
  ]);
}
