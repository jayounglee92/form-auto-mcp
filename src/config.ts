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

// 프로젝트 루트: 환경변수 우선, 없으면 dist/ 기준 한 단계 위
const PROJECT_ROOT = process.env.FORM_AUTO_MCP_ROOT ?? resolve(__dirname, "..");

export function loadConfig(configPath?: string): Config {
  const path = configPath ?? resolve(PROJECT_ROOT, "config.json");

  console.error(`[form-auto-mcp] config path: ${path}, exists: ${existsSync(path)}`);

  if (!existsSync(path)) {
    return { ...DEFAULT_CONFIG };
  }

  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const config = { ...DEFAULT_CONFIG, ...raw };
  console.error(`[form-auto-mcp] loaded config:`, JSON.stringify(config));
  return config;
}
