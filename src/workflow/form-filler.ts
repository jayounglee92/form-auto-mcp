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
      const field = page.getByLabel(label);
      await field.fill(value);
      await page.waitForTimeout(stepDelay);
      results.push({ label, success: true });
    } catch (e) {
      results.push({
        label,
        success: false,
        error: `"${label}" 라벨을 찾을 수 없음`,
      });
    }
  }

  return results;
}
