import type { Page } from "playwright";

export interface NavigationStep {
  action: "click" | "waitForNavigation";
  text?: string;
}

export function buildNavigationSteps(menuPath: string[]): NavigationStep[] {
  const steps: NavigationStep[] = menuPath.map((text) => ({
    action: "click" as const,
    text,
  }));
  steps.push({ action: "waitForNavigation" });
  return steps;
}

export async function navigateToMenu(
  page: Page,
  menuPath: string[],
  stepDelay: number
): Promise<void> {
  const steps = buildNavigationSteps(menuPath);

  for (const step of steps) {
    if (step.action === "click" && step.text) {
      await page.getByText(step.text, { exact: false }).first().click({ force: true });
      await page.waitForTimeout(stepDelay);
    } else if (step.action === "waitForNavigation") {
      await page.waitForLoadState("networkidle");
    }
  }
}
