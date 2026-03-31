import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export interface Config {
  siteUrl: string;
  menuSelector: string;
  saveButtonText: string;
  defaultMode: "visible" | "fast";
  stepDelay: number;
}

const DEFAULT_CONFIG: Config = {
  siteUrl: "",
  menuSelector: ".side-menu",
  saveButtonText: "저장",
  defaultMode: "visible",
  stepDelay: 500,
};

export function loadConfig(configPath?: string): Config {
  const path = configPath ?? resolve(process.cwd(), "config.json");

  if (!existsSync(path)) {
    return { ...DEFAULT_CONFIG };
  }

  const raw = JSON.parse(readFileSync(path, "utf-8"));
  return { ...DEFAULT_CONFIG, ...raw };
}
