import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

import { projectRoot, readJsonFile, writeJsonFile } from "./utils";

export type StepName =
  | "rename"
  | "readme"
  | "cleanup"
  | "git_init"
  | "env_files"
  | "auth_secret"
  | "docker_up"
  | "db_migrate"
  | "db_seed"
  | "gh_repo"
  | "remote"
  | "commit"
  | "push"
  | "self_clean";

export interface SetupInputs {
  projectName: string;
  owner: string;
  visibility: "private" | "public";
  keepExamples: boolean;
  seedUsers: boolean;
}

export interface SetupState {
  version: 1;
  inputs: SetupInputs;
  completed: StepName[];
  lastError?: {
    step: StepName;
    message: string;
    timestamp: string;
  };
}

const STATE_PATH = resolve(projectRoot(), ".setup-state.json");

export function readState(): Promise<SetupState | null> {
  if (!existsSync(STATE_PATH)) {
    return Promise.resolve(null);
  }
  return readJsonFile<SetupState>(STATE_PATH);
}

export async function writeState(state: SetupState): Promise<void> {
  await writeJsonFile(STATE_PATH, state);
}

export async function clearState(): Promise<void> {
  await rm(STATE_PATH, { force: true });
}
