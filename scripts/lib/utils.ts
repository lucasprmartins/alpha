import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { $ } from "bun";

export async function commandExists(command: string): Promise<boolean> {
  const { exitCode } = await $`command -v ${command}`.nothrow().quiet();
  if (exitCode === 0) {
    return true;
  }
  const { exitCode: exitCode2 } = await $`where ${command}`.nothrow().quiet();
  return exitCode2 === 0;
}

export function readTextFile(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

export async function writeTextFile(
  path: string,
  content: string
): Promise<void> {
  await writeFile(path, content);
}

export function readJsonFile<T = unknown>(path: string): Promise<T> {
  return readFile(path, "utf-8").then((c) => JSON.parse(c) as T);
}

export async function writeJsonFile(
  path: string,
  data: unknown
): Promise<void> {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

export async function replaceInFile(
  path: string,
  replacements: Array<{ from: string | RegExp; to: string }>
): Promise<void> {
  let content = await readTextFile(path);
  for (const { from, to } of replacements) {
    if (typeof from === "string") {
      content = content.replaceAll(from, to);
    } else {
      content = content.replace(from, to);
    }
  }
  await writeTextFile(path, content);
}

export async function gitCommitIfChanged(message: string): Promise<boolean> {
  await $`git add -A`.quiet();
  const { exitCode } = await $`git diff --cached --quiet`.nothrow().quiet();
  if (exitCode === 0) {
    return false;
  }
  await $`git commit -m ${message}`.quiet();
  return true;
}

export function projectRoot(): string {
  return resolve(import.meta.dir, "../..");
}
