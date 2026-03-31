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
      const config = loadConfig();
      if (site_url) {
        config.siteUrl = site_url;
      }

      if (!config.siteUrl) {
        return {
          content: [{ type: "text", text: "오류: site_url이 설정되지 않았습니다. config.json 또는 파라미터로 지정해주세요." }],
        };
      }

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

      const rows = normalizeRows(rawRows);
      const report = await runWorkflow({ rows, config, mode });

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
