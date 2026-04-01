import type { Page } from "playwright";

export interface FillAction {
  label: string;
  value: string;
}

export interface FillResult {
  label: string;
  success: boolean;
  error?: string;
}

export function buildFillActions(fields: Record<string, string>): FillAction[] {
  return Object.entries(fields).map(([label, value]) => ({ label, value }));
}

export async function fillForm(
  page: Page,
  fields: Record<string, string>,
  stepDelay: number
): Promise<FillResult[]> {
  const actions = buildFillActions(fields);
  const results: FillResult[] = [];

  for (const { label, value } of actions) {
    try {
      // 1차: getByLabel
      const byLabel = page.getByLabel(label);
      if ((await byLabel.count()) > 0) {
        await byLabel.fill(value);
      }
      // 2차: id 기반 (input/textarea만 대상)
      else if ((await page.locator(`input#${label}, textarea#${label}`).count()) > 0) {
        await page.locator(`input#${label}, textarea#${label}`).first().fill(value);
      }
      // 3차: placeholder 기반
      else if ((await page.getByPlaceholder(label).count()) > 0) {
        await page.getByPlaceholder(label).fill(value);
      } else {
        throw new Error("not found");
      }
      await page.waitForTimeout(stepDelay);
      results.push({ label, success: true });
    } catch (e) {
      results.push({
        label,
        success: false,
        error: `"${label}" 필드를 찾을 수 없음`,
      });
    }
  }

  return results;
}
