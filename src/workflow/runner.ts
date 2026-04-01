import { chromium, type Browser, type Page } from "playwright";
import type { WorkflowRow } from "../readers/normalize";
import type { Config } from "../config";
import { navigateToMenu } from "./navigator";
import { fillForm } from "./form-filler";
import { generateReport, type RowResult, type Report } from "./reporter";
import { mkdirSync } from "fs";
import { resolve } from "path";

export interface RunOptions {
  rows: WorkflowRow[];
  config: Config;
  mode: "visible" | "fast";
}

export async function runWorkflow(options: RunOptions): Promise<Report> {
  const { rows, config, mode } = options;
  const headless = mode === "fast";
  const stepDelay = mode === "fast" ? 0 : config.stepDelay;

  mkdirSync(resolve(process.cwd(), "errors"), { recursive: true });

  const browser: Browser = await chromium.launch({ headless });
  const context = await browser.newContext();

  // 광고 차단
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.includes("googleads") || url.includes("adservice") || url.includes("doubleclick") || url.includes("ad.plus")) {
      return route.abort();
    }
    return route.continue();
  });

  const page: Page = await context.newPage();

  await page.goto(config.siteUrl);
  await page.waitForLoadState("networkidle");

  const results: RowResult[] = [];

  for (const row of rows) {
    const menuPathStr = row.menuPath.join(" > ");

    if (row.error) {
      results.push({
        rowIndex: row.rowIndex,
        menuPath: menuPathStr,
        success: false,
        error: row.error,
      });
      continue;
    }

    try {
      // 1. 메뉴 네비게이션
      await navigateToMenu(page, row.menuPath, config.menuSelector, stepDelay);

      // 2. 폼 입력
      const fillResults = await fillForm(page, row.fields, stepDelay);
      const failedFields = fillResults.filter((f) => !f.success);

      if (failedFields.length > 0) {
        const screenshotPath = `errors/row${row.rowIndex}.png`;
        await page.screenshot({ path: resolve(process.cwd(), screenshotPath) });
        results.push({
          rowIndex: row.rowIndex,
          menuPath: menuPathStr,
          success: false,
          error: failedFields.map((f) => f.error).join(", "),
          screenshotPath,
        });
        continue;
      }

      // 3. 저장
      await page.getByText(config.saveButtonText, { exact: false }).first().click({ force: true });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(stepDelay);

      results.push({
        rowIndex: row.rowIndex,
        menuPath: menuPathStr,
        success: true,
      });
    } catch (e) {
      const screenshotPath = `errors/row${row.rowIndex}.png`;
      try {
        await page.screenshot({ path: resolve(process.cwd(), screenshotPath) });
      } catch {}

      const errorMessage = e instanceof Error ? e.message : String(e);

      // 세션 만료 감지 시 중단
      if (errorMessage.includes("login") || errorMessage.includes("session")) {
        results.push({
          rowIndex: row.rowIndex,
          menuPath: menuPathStr,
          success: false,
          error: "세션 만료 — 자동화 중단",
          screenshotPath,
        });
        break;
      }

      results.push({
        rowIndex: row.rowIndex,
        menuPath: menuPathStr,
        success: false,
        error: errorMessage,
        screenshotPath,
      });
    }
  }

  await browser.close();
  return generateReport(results);
}
