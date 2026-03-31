# form-auto-mcp

MCP server for Claude Desktop that automates internal system form submissions using Playwright.

## Features

- Read data from Excel/CSV or Google Sheets and auto-fill forms
- Automated menu navigation (sidebar menu click → page transition)
- Label-based form field matching (Excel column name = form label text)
- Visible mode (browser shown) / Fast mode (background) toggle
- Result report with success/failure counts + screenshots on failure

## Installation

### Prerequisites

- Node.js 18+

### Setup

```bash
git clone https://github.com/jayounglee92/form-auto-mcp.git
cd form-auto-mcp
npm install
npx playwright install chromium
npm run build
```

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "form-automation": {
      "command": "node",
      "args": ["/path/to/form-auto-mcp/dist/index.js"]
    }
  }
}
```

### Site Configuration

Create `config.json` in the project root:

```json
{
  "siteUrl": "https://your-internal-system.com",
  "menuSelector": ".side-menu",
  "saveButtonText": "저장",
  "defaultMode": "visible",
  "stepDelay": 500
}
```

### Google Sheets (Optional)

Create a `.env` file:

```
GOOGLE_API_KEY=your_api_key
```

## Usage

### Fill forms from Excel

In Claude Desktop:
> "이 엑셀 파일로 폼 입력해줘" (attach file)

### Fill forms from Google Sheets

> "이 구글 시트로 폼 입력해줘: [sheet URL]"

### Fast mode (headless)

> "빠르게 폼 입력해줘"

## Excel Format

| 메뉴경로 | Label1 | Label2 | ... |
|---------|--------|--------|-----|
| MenuA > SubMenuB | Value1 | Value2 | ... |

- First column: `메뉴경로` (menu path, separated by `>`)
- Remaining columns: column name = form label text on screen
- See `templates/sample.xlsx` for a sample

## License

MIT
