import { execSync } from "node:child_process";

let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
}

const data = JSON.parse(input || "{}");
const parts = [];

// Current dir
const cwd = data?.workspace?.current_dir || data?.cwd;
if (cwd) {
  const base = cwd.replace(/\\/g, "/").split("/").pop();
  parts.push(`◇  ${base}`);
}

// Git branch + status
let branch = "no-git";
try {
  branch = execSync("git branch --show-current", { encoding: "utf-8" }).trim();
} catch (_) {
  // git não disponível
}

let gitStatus = "";
try {
  const status = execSync("git status --porcelain", {
    encoding: "utf-8",
  }).trim();
  if (status) {
    const changed = status.split("\n").length;
    gitStatus = `  ●  △ ${changed}`;
  } else {
    gitStatus = "  ○";
  }
} catch (_) {
  // git não disponível
}

parts.push(`⎇  ${branch}${gitStatus}`);

// Session timer
const duration = data?.cost?.total_duration_ms;
if (duration != null) {
  const elapsed = Math.floor(duration / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const time =
    hours > 0 ? `${hours}h${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
  parts.push(`⏱  ${time}`);
}

// Model
const model = data?.model?.display_name || "Claude";
parts.push(`♦  ${model}`);

// Context usage
const pct = data?.context_window?.used_percentage;
if (pct != null) {
  const total = 10;
  const filled = Math.round((pct / 100) * total);
  const empty = total - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  parts.push(`◈  ${bar} ${Math.round(pct)}%`);
}

process.stdout.write(parts.join("  ⋮  "));
