import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export interface Config {
  siteUrl: string;
  saveButtonText: string;
  defaultMode: "visible" | "fast";
  stepDelay: number;
}

const DEFAULT_CONFIG: Config = {
  siteUrl: "",
  saveButtonText: "저장",
  defaultMode: "visible",
  stepDelay: 500,
};

// 프로젝트 루트: dist/config.js 기준으로 한 단계 위
const PROJECT_ROOT = resolve(__dirname, "..");

export function loadConfig(configPath?: string): Config {
  const path = configPath ?? resolve(PROJECT_ROOT, "config.json");

  if (!existsSync(path)) {
    return { ...DEFAULT_CONFIG };
  }

  const raw = JSON.parse(readFileSync(path, "utf-8"));
  return { ...DEFAULT_CONFIG, ...raw };
}
