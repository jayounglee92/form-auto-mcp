# Form Auto MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Desktop에서 자연어로 요청하면 Playwright가 내부 시스템의 메뉴 탐색 → 폼 입력 → 저장을 자동 수행하는 MCP 서버

**Architecture:** Node.js MCP 서버가 엑셀/Google Sheets에서 데이터를 읽고, Playwright로 브라우저를 제어하여 메뉴 네비게이션 + 라벨 기반 폼 입력 + 저장을 반복 실행. 각 PC에서 로컬 프로세스로 동작.

**Tech Stack:** Node.js, TypeScript, @modelcontextprotocol/sdk, Playwright, xlsx (SheetJS), googleapis

---

## File Structure

```
form-auto-mcp/
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── config.example.json          # 사이트별 설정 템플릿
├── docs/
│   ├── specs/                   # 설계 문서
│   └── plans/                   # 구현 계획
├── src/
│   ├── index.ts                 # MCP 서버 진입점 + 도구 등록
│   ├── readers/
│   │   ├── excel-reader.ts      # 엑셀/CSV 파일 읽기
│   │   ├── sheets-reader.ts     # Google Sheets 읽기
│   │   └── normalize.ts         # 데이터 정규화 (공통 형태로 변환)
│   ├── workflow/
│   │   ├── runner.ts            # 워크플로우 실행기 (행 반복 루프)
│   │   ├── navigator.ts         # 메뉴 네비게이션 (경로 파싱 → 클릭)
│   │   ├── form-filler.ts       # 라벨 기반 필드 입력
│   │   └── reporter.ts          # 결과 리포트 생성
│   └── config.ts                # 설정 파일 로드
├── templates/
│   └── sample.xlsx              # 엑셀 템플릿
├── errors/                      # 실패 스크린샷 저장 (gitignore)
└── tests/
    ├── readers/
    │   ├── excel-reader.test.ts
    │   ├── sheets-reader.test.ts
    │   └── normalize.test.ts
    ├── workflow/
    │   ├── navigator.test.ts
    │   ├── form-filler.test.ts
    │   └── reporter.test.ts
    └── fixtures/
        ├── sample.xlsx          # 테스트용 엑셀
        └── sample.csv           # 테스트용 CSV
```

---

### Task 1: 프로젝트 초기 세팅

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `config.example.json`

- [ ] **Step 1: package.json 생성**

```bash
cd /Users/jayounglee/git/form-auto-mcp
npm init -y
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install @modelcontextprotocol/sdk playwright xlsx googleapis zod
npm install -D typescript @types/node vitest
```

- [ ] **Step 3: tsconfig.json 생성**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: .gitignore 생성**

Create `.gitignore`:
```
node_modules/
dist/
errors/
.env
*.log
```

- [ ] **Step 5: .env.example 생성**

Create `.env.example`:
```
# Google Sheets API (optional)
GOOGLE_API_KEY=your_google_api_key_here
```

- [ ] **Step 6: config.example.json 생성**

Create `config.example.json`:
```json
{
  "siteUrl": "https://internal-system.example.com",
  "menuSelector": ".side-menu",
  "saveButtonText": "저장",
  "defaultMode": "visible",
  "stepDelay": 500
}
```

- [ ] **Step 7: package.json에 scripts 추가**

`package.json`에 추가:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 8: Playwright 브라우저 설치**

```bash
npx playwright install chromium
```

- [ ] **Step 9: 커밋**

```bash
git add package.json package-lock.json tsconfig.json .gitignore .env.example config.example.json docs/
git commit -m "chore: 프로젝트 초기 세팅 (MCP + Playwright + TypeScript)"
```

---

### Task 2: 설정 파일 로드

**Files:**
- Create: `src/config.ts`
- Test: `tests/config.test.ts` (없어도 무방 — 단순 로드)

- [ ] **Step 1: src/config.ts 작성**

```typescript
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/config.ts
git commit -m "feat: 설정 파일 로드 모듈"
```

---

### Task 3: 데이터 정규화 모듈

**Files:**
- Create: `src/readers/normalize.ts`
- Create: `tests/readers/normalize.test.ts`

- [ ] **Step 1: 테스트 작성**

Create `tests/readers/normalize.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { normalizeRows, type RawRow, type WorkflowRow } from "../../src/readers/normalize";

describe("normalizeRows", () => {
  it("메뉴경로와 필드를 분리한다", () => {
    const raw: RawRow[] = [
      { "메뉴경로": "프로젝트 > 일정관리", "프로젝트명": "3월 리뷰", "설명": "주간보고" },
    ];

    const result = normalizeRows(raw);

    expect(result).toEqual([
      {
        rowIndex: 1,
        menuPath: ["프로젝트", "일정관리"],
        fields: { "프로젝트명": "3월 리뷰", "설명": "주간보고" },
      },
    ]);
  });

  it("빈 값 필드는 제외한다", () => {
    const raw: RawRow[] = [
      { "메뉴경로": "운영 > 공지", "제목": "테스트", "비고": "" },
    ];

    const result = normalizeRows(raw);

    expect(result[0].fields).toEqual({ "제목": "테스트" });
  });

  it("메뉴경로가 없으면 에러를 포함한다", () => {
    const raw: RawRow[] = [
      { "프로젝트명": "3월 리뷰" } as RawRow,
    ];

    const result = normalizeRows(raw);

    expect(result[0].error).toBe("메뉴경로가 비어 있습니다");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run tests/readers/normalize.test.ts
```
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

Create `src/readers/normalize.ts`:
```typescript
export interface RawRow {
  메뉴경로: string;
  [key: string]: string;
}

export interface WorkflowRow {
  rowIndex: number;
  menuPath: string[];
  fields: Record<string, string>;
  error?: string;
}

export function normalizeRows(rows: RawRow[]): WorkflowRow[] {
  return rows.map((row, i) => {
    const menuPathRaw = row["메뉴경로"]?.trim();

    if (!menuPathRaw) {
      return {
        rowIndex: i + 1,
        menuPath: [],
        fields: {},
        error: "메뉴경로가 비어 있습니다",
      };
    }

    const menuPath = menuPathRaw.split(">").map((s) => s.trim());

    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === "메뉴경로") continue;
      if (value && value.trim() !== "") {
        fields[key] = value.trim();
      }
    }

    return { rowIndex: i + 1, menuPath, fields };
  });
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run tests/readers/normalize.test.ts
```
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/readers/normalize.ts tests/readers/normalize.test.ts
git commit -m "feat: 데이터 정규화 모듈 (메뉴경로 파싱 + 필드 분리)"
```

---

### Task 4: 엑셀/CSV 리더

**Files:**
- Create: `src/readers/excel-reader.ts`
- Create: `tests/readers/excel-reader.test.ts`
- Create: `tests/fixtures/sample.xlsx`
- Create: `tests/fixtures/sample.csv`

- [ ] **Step 1: 테스트용 CSV fixture 생성**

Create `tests/fixtures/sample.csv`:
```
메뉴경로,프로젝트명,설명,비고
프로젝트 > 일정관리,3월 리뷰,주간보고 작성,완료
프로젝트 > 산출물,기획서 v2,최종본 업로드,-
```

- [ ] **Step 2: 테스트 작성**

Create `tests/readers/excel-reader.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { readExcelFile } from "../../src/readers/excel-reader";
import { resolve } from "path";

describe("readExcelFile", () => {
  it("CSV 파일을 읽어 RawRow 배열로 반환한다", () => {
    const filePath = resolve(__dirname, "../fixtures/sample.csv");
    const rows = readExcelFile(filePath);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      "메뉴경로": "프로젝트 > 일정관리",
      "프로젝트명": "3월 리뷰",
      "설명": "주간보고 작성",
      "비고": "완료",
    });
  });

  it("존재하지 않는 파일이면 에러를 던진다", () => {
    expect(() => readExcelFile("/nonexistent/file.xlsx")).toThrow();
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
npx vitest run tests/readers/excel-reader.test.ts
```
Expected: FAIL

- [ ] **Step 4: 구현**

Create `src/readers/excel-reader.ts`:
```typescript
import * as XLSX from "xlsx";
import type { RawRow } from "./normalize";

export function readExcelFile(filePath: string): RawRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet);
  return rows;
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npx vitest run tests/readers/excel-reader.test.ts
```
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/readers/excel-reader.ts tests/readers/excel-reader.test.ts tests/fixtures/
git commit -m "feat: 엑셀/CSV 리더 모듈"
```

---

### Task 5: Google Sheets 리더

**Files:**
- Create: `src/readers/sheets-reader.ts`
- Create: `tests/readers/sheets-reader.test.ts`

- [ ] **Step 1: 테스트 작성 (API 모킹)**

Create `tests/readers/sheets-reader.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseSheetUrl, convertToRawRows } from "../../src/readers/sheets-reader";

describe("parseSheetUrl", () => {
  it("Google Sheets URL에서 spreadsheetId를 추출한다", () => {
    const url = "https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit#gid=0";
    const id = parseSheetUrl(url);
    expect(id).toBe("1aBcDeFgHiJkLmNoPqRsTuVwXyZ");
  });

  it("잘못된 URL이면 에러를 던진다", () => {
    expect(() => parseSheetUrl("https://example.com")).toThrow("유효한 Google Sheets URL이 아닙니다");
  });
});

describe("convertToRawRows", () => {
  it("2차원 배열을 RawRow 배열로 변환한다", () => {
    const values = [
      ["메뉴경로", "프로젝트명", "설명"],
      ["프로젝트 > 일정관리", "3월 리뷰", "주간보고"],
      ["운영 > 공지", "4월 일정", "휴무 안내"],
    ];

    const rows = convertToRawRows(values);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      "메뉴경로": "프로젝트 > 일정관리",
      "프로젝트명": "3월 리뷰",
      "설명": "주간보고",
    });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run tests/readers/sheets-reader.test.ts
```
Expected: FAIL

- [ ] **Step 3: 구현**

Create `src/readers/sheets-reader.ts`:
```typescript
import { google } from "googleapis";
import type { RawRow } from "./normalize";

export function parseSheetUrl(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error("유효한 Google Sheets URL이 아닙니다");
  }
  return match[1];
}

export function convertToRawRows(values: string[][]): RawRow[] {
  const [headers, ...dataRows] = values;
  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ?? "";
    });
    return obj as RawRow;
  });
}

export async function readGoogleSheet(sheetUrl: string): Promise<RawRow[]> {
  const spreadsheetId = parseSheetUrl(sheetUrl);
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY 환경변수가 설정되지 않았습니다");
  }

  const sheets = google.sheets({ version: "v4", auth: apiKey });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A:Z",
  });

  const values = response.data.values;
  if (!values || values.length < 2) {
    throw new Error("시트에 데이터가 없습니다");
  }

  return convertToRawRows(values);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run tests/readers/sheets-reader.test.ts
```
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/readers/sheets-reader.ts tests/readers/sheets-reader.test.ts
git commit -m "feat: Google Sheets 리더 모듈"
```

---

### Task 6: 메뉴 네비게이터

**Files:**
- Create: `src/workflow/navigator.ts`
- Create: `tests/workflow/navigator.test.ts`

- [ ] **Step 1: 테스트 작성**

Create `tests/workflow/navigator.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildNavigationSteps } from "../../src/workflow/navigator";

describe("buildNavigationSteps", () => {
  it("메뉴 경로를 클릭 스텝으로 변환한다", () => {
    const steps = buildNavigationSteps(["프로젝트", "일정관리"]);
    expect(steps).toEqual([
      { action: "click", text: "프로젝트" },
      { action: "click", text: "일정관리" },
      { action: "waitForNavigation" },
    ]);
  });

  it("단일 메뉴도 처리한다", () => {
    const steps = buildNavigationSteps(["대시보드"]);
    expect(steps).toEqual([
      { action: "click", text: "대시보드" },
      { action: "waitForNavigation" },
    ]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run tests/workflow/navigator.test.ts
```
Expected: FAIL

- [ ] **Step 3: 구현**

Create `src/workflow/navigator.ts`:
```typescript
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
  menuSelector: string,
  stepDelay: number
): Promise<void> {
  const steps = buildNavigationSteps(menuPath);

  for (const step of steps) {
    if (step.action === "click" && step.text) {
      const menuArea = page.locator(menuSelector);
      await menuArea.getByText(step.text, { exact: false }).click();
      await page.waitForTimeout(stepDelay);
    } else if (step.action === "waitForNavigation") {
      await page.waitForLoadState("networkidle");
    }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run tests/workflow/navigator.test.ts
```
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/workflow/navigator.ts tests/workflow/navigator.test.ts
git commit -m "feat: 메뉴 네비게이터 (경로 파싱 → 클릭 스텝)"
```

---

### Task 7: 폼 필러 (라벨 기반 입력)

**Files:**
- Create: `src/workflow/form-filler.ts`
- Create: `tests/workflow/form-filler.test.ts`

- [ ] **Step 1: 테스트 작성**

Create `tests/workflow/form-filler.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildFillActions } from "../../src/workflow/form-filler";

describe("buildFillActions", () => {
  it("필드 맵을 fill 액션 배열로 변환한다", () => {
    const fields = { "프로젝트명": "3월 리뷰", "설명": "주간보고" };
    const actions = buildFillActions(fields);

    expect(actions).toEqual([
      { label: "프로젝트명", value: "3월 리뷰" },
      { label: "설명", value: "주간보고" },
    ]);
  });

  it("빈 필드맵이면 빈 배열을 반환한다", () => {
    const actions = buildFillActions({});
    expect(actions).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run tests/workflow/form-filler.test.ts
```
Expected: FAIL

- [ ] **Step 3: 구현**

Create `src/workflow/form-filler.ts`:
```typescript
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run tests/workflow/form-filler.test.ts
```
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/workflow/form-filler.ts tests/workflow/form-filler.test.ts
git commit -m "feat: 폼 필러 (라벨 기반 필드 입력)"
```

---

### Task 8: 결과 리포터

**Files:**
- Create: `src/workflow/reporter.ts`
- Create: `tests/workflow/reporter.test.ts`

- [ ] **Step 1: 테스트 작성**

Create `tests/workflow/reporter.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { generateReport, type RowResult } from "../../src/workflow/reporter";

describe("generateReport", () => {
  it("성공/실패 건수를 집계한다", () => {
    const results: RowResult[] = [
      { rowIndex: 1, menuPath: "프로젝트 > 일정관리", success: true },
      { rowIndex: 2, menuPath: "프로젝트 > 산출물", success: true },
      { rowIndex: 3, menuPath: "운영 > 공지", success: false, error: "메뉴 못 찾음", screenshotPath: "errors/row3.png" },
    ];

    const report = generateReport(results);

    expect(report.total).toBe(3);
    expect(report.successCount).toBe(2);
    expect(report.failCount).toBe(1);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0].rowIndex).toBe(3);
  });

  it("모두 성공이면 failures가 비어있다", () => {
    const results: RowResult[] = [
      { rowIndex: 1, menuPath: "프로젝트 > 일정관리", success: true },
    ];

    const report = generateReport(results);

    expect(report.failCount).toBe(0);
    expect(report.failures).toEqual([]);
  });

  it("리포트를 텍스트로 포맷한다", () => {
    const results: RowResult[] = [
      { rowIndex: 1, menuPath: "프로젝트 > 일정관리", success: true },
      { rowIndex: 2, menuPath: "운영 > 공지", success: false, error: "라벨 못 찾음" },
    ];

    const text = generateReport(results).toText();

    expect(text).toContain("완료: 1건");
    expect(text).toContain("실패: 1건");
    expect(text).toContain("2행");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run tests/workflow/reporter.test.ts
```
Expected: FAIL

- [ ] **Step 3: 구현**

Create `src/workflow/reporter.ts`:
```typescript
export interface RowResult {
  rowIndex: number;
  menuPath: string;
  success: boolean;
  error?: string;
  screenshotPath?: string;
}

export interface Report {
  total: number;
  successCount: number;
  failCount: number;
  successes: RowResult[];
  failures: RowResult[];
  toText: () => string;
}

export function generateReport(results: RowResult[]): Report {
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  const toText = (): string => {
    const lines: string[] = [];
    lines.push(`완료: ${successes.length}건 / 실패: ${failures.length}건`);
    lines.push("");

    if (successes.length > 0) {
      lines.push("성공:");
      for (const r of successes) {
        lines.push(` ${r.rowIndex}행 - ${r.menuPath} → 완료`);
      }
      lines.push("");
    }

    if (failures.length > 0) {
      lines.push("실패:");
      for (const r of failures) {
        let line = ` ${r.rowIndex}행 - ${r.menuPath} → ${r.error}`;
        if (r.screenshotPath) {
          line += ` (스크린샷: ${r.screenshotPath})`;
        }
        lines.push(line);
      }
    }

    return lines.join("\n");
  };

  return {
    total: results.length,
    successCount: successes.length,
    failCount: failures.length,
    successes,
    failures,
    toText,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run tests/workflow/reporter.test.ts
```
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/workflow/reporter.ts tests/workflow/reporter.test.ts
git commit -m "feat: 결과 리포터 (성공/실패 집계 + 텍스트 포맷)"
```

---

### Task 9: 워크플로우 러너

**Files:**
- Create: `src/workflow/runner.ts`

- [ ] **Step 1: 구현**

Create `src/workflow/runner.ts`:
```typescript
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
      await page.getByText(config.saveButtonText, { exact: false }).click();
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/workflow/runner.ts
git commit -m "feat: 워크플로우 러너 (메뉴 탐색 → 폼 입력 → 저장 반복)"
```

---

### Task 10: MCP 서버 진입점

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: 구현**

Create `src/index.ts`:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config";
import { readExcelFile } from "./readers/excel-reader";
import { readGoogleSheet } from "./readers/sheets-reader";
import { normalizeRows } from "./readers/normalize";
import { runWorkflow } from "./workflow/runner";

const server = new McpServer({
  name: "form-auto-mcp",
  version: "1.0.0",
});

server.tool(
  "run-workflow",
  "엑셀 또는 Google Sheets 데이터를 읽어 내부 시스템 폼을 자동으로 입력합니다",
  {
    source_type: z.enum(["excel", "google_sheets"]).describe("데이터 소스 유형"),
    file_path: z.string().optional().describe("엑셀/CSV 파일 경로 (source_type이 excel일 때)"),
    sheet_url: z.string().optional().describe("Google Sheets URL (source_type이 google_sheets일 때)"),
    site_url: z.string().optional().describe("내부 시스템 URL (미지정 시 config 사용)"),
    mode: z.enum(["visible", "fast"]).default("visible").describe("실행 모드: visible(브라우저 표시) | fast(백그라운드)"),
  },
  async ({ source_type, file_path, sheet_url, site_url, mode }) => {
    try {
      // 1. 설정 로드
      const config = loadConfig();
      if (site_url) {
        config.siteUrl = site_url;
      }

      if (!config.siteUrl) {
        return {
          content: [{ type: "text", text: "오류: site_url이 설정되지 않았습니다. config.json 또는 파라미터로 지정해주세요." }],
        };
      }

      // 2. 데이터 읽기
      let rawRows;
      if (source_type === "excel") {
        if (!file_path) {
          return {
            content: [{ type: "text", text: "오류: file_path가 필요합니다." }],
          };
        }
        rawRows = readExcelFile(file_path);
      } else {
        if (!sheet_url) {
          return {
            content: [{ type: "text", text: "오류: sheet_url이 필요합니다." }],
          };
        }
        rawRows = await readGoogleSheet(sheet_url);
      }

      // 3. 정규화
      const rows = normalizeRows(rawRows);

      // 4. 워크플로우 실행
      const report = await runWorkflow({ rows, config, mode });

      // 5. 결과 반환
      return {
        content: [{ type: "text", text: report.toText() }],
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return {
        content: [{ type: "text", text: `오류 발생: ${errorMessage}` }],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/jayounglee/git/form-auto-mcp && npm run build
```
Expected: dist/ 폴더에 컴파일된 JS 파일 생성

- [ ] **Step 3: 커밋**

```bash
git add src/index.ts
git commit -m "feat: MCP 서버 진입점 (run-workflow 도구 등록)"
```

---

### Task 11: 엑셀 템플릿 + README

**Files:**
- Create: `templates/sample.xlsx` (스크립트로 생성)
- Create: `README.md`

- [ ] **Step 1: 엑셀 템플릿 생성 스크립트**

```bash
cd /Users/jayounglee/git/form-auto-mcp
node -e "
const XLSX = require('xlsx');
const data = [
  ['메뉴경로', '프로젝트명', '설명', '비고'],
  ['프로젝트 > 일정관리', '(여기에 입력)', '(여기에 입력)', ''],
];
const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'templates/sample.xlsx');
console.log('sample.xlsx created');
"
```

- [ ] **Step 2: README.md 작성**

Create `README.md`:
```markdown
# form-auto-mcp

Claude Desktop에서 자연어로 요청하면 내부 시스템 폼을 자동으로 입력하는 MCP 서버입니다.

## 기능

- 엑셀/CSV 또는 Google Sheets에서 데이터를 읽어 폼 자동 입력
- 메뉴 네비게이션 (사이드 메뉴 클릭 → 페이지 이동) 자동화
- 라벨 기반 폼 필드 매칭 (엑셀 열 이름 = 폼 라벨)
- 보기 모드 (브라우저 표시) / 빠른 모드 (백그라운드) 선택
- 성공/실패 결과 리포트 + 실패 시 스크린샷

## 설치

### 사전 요구사항

- Node.js 18 이상

### 설치 방법

git clone https://github.com/jayounglee92/form-auto-mcp.git
cd form-auto-mcp
npm install
npx playwright install chromium
npm run build

### Claude Desktop 설정

`claude_desktop_config.json`에 추가:

{
  "mcpServers": {
    "form-automation": {
      "command": "node",
      "args": ["/path/to/form-auto-mcp/dist/index.js"]
    }
  }
}

### 사이트 설정

`config.json` 파일을 프로젝트 루트에 생성:

{
  "siteUrl": "https://your-internal-system.com",
  "menuSelector": ".side-menu",
  "saveButtonText": "저장",
  "defaultMode": "visible",
  "stepDelay": 500
}

### Google Sheets 사용 시 (선택)

`.env` 파일 생성:

GOOGLE_API_KEY=your_api_key

## 사용법

### 엑셀 데이터로 폼 입력

Claude Desktop에서:
> "이 엑셀 파일로 폼 입력해줘" (파일 첨부)

### Google Sheets로 폼 입력

> "이 구글 시트로 폼 입력해줘: [시트 URL]"

### 빠른 모드

> "빠르게 폼 입력해줘"

## 엑셀 작성 규칙

| 메뉴경로 | 라벨1 | 라벨2 | ... |
|---------|-------|-------|-----|
| 메뉴A > 하위메뉴B | 값1 | 값2 | ... |

- 첫 번째 열: `메뉴경로` (> 로 구분)
- 나머지 열: 열 이름 = 화면의 폼 라벨 텍스트
- `templates/sample.xlsx` 참고
```

- [ ] **Step 3: 커밋**

```bash
mkdir -p templates
git add templates/sample.xlsx README.md
git commit -m "docs: README + 엑셀 템플릿 추가"
```

---

### Task 12: GitHub 레포 생성 및 푸시

**Files:** (없음, git 작업만)

- [ ] **Step 1: GitHub 레포 생성**

```bash
cd /Users/jayounglee/git/form-auto-mcp
gh repo create jayounglee92/form-auto-mcp --public --source=. --remote=origin --description "Claude Desktop MCP server for automating internal system form submissions"
```

- [ ] **Step 2: 전체 푸시**

```bash
git push -u origin main
```

- [ ] **Step 3: 확인**

```bash
gh repo view jayounglee92/form-auto-mcp --web
```

---

## 구현 순서 요약

| Task | 내용 | 의존성 |
|------|------|--------|
| 1 | 프로젝트 초기 세팅 | 없음 |
| 2 | 설정 파일 로드 | Task 1 |
| 3 | 데이터 정규화 | Task 1 |
| 4 | 엑셀/CSV 리더 | Task 3 |
| 5 | Google Sheets 리더 | Task 3 |
| 6 | 메뉴 네비게이터 | Task 1 |
| 7 | 폼 필러 | Task 1 |
| 8 | 결과 리포터 | Task 1 |
| 9 | 워크플로우 러너 | Task 6, 7, 8 |
| 10 | MCP 서버 진입점 | Task 2, 4, 5, 9 |
| 11 | 엑셀 템플릿 + README | Task 10 |
| 12 | GitHub 레포 생성 및 푸시 | Task 11 |

병렬 가능: Task 3~8은 독립적이므로 동시 진행 가능.
