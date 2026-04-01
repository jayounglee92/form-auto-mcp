# form-auto-mcp

MCP server for Claude Desktop that automates internal system form submissions using Playwright.

## Features

- Read data from Excel/CSV or Google Sheets and auto-fill forms
- Automated menu navigation (menu text click → page transition)
- Label/ID/Placeholder-based form field matching
- Visible mode (browser shown) / Fast mode (background) toggle
- Result report with success/failure counts + screenshots on failure

## Installation

### Prerequisites

- Node.js 18+

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "form-automation": {
      "command": "npx",
      "args": ["form-auto-mcp"]
    }
  }
}
```

Restart Claude Desktop. That's it — no clone, no build needed.

### Google Sheets (Optional)

Create a `.env` file:

```
GOOGLE_API_KEY=your_api_key
```

## Usage

In Claude Desktop, provide a site URL and attach an Excel file:

> "https://your-site.com 에 이 엑셀로 폼 입력해줘" (attach file)

### Google Sheets

> "https://your-site.com 에 이 구글 시트로 폼 입력해줘: [sheet URL]"

### Fast mode (headless)

> "빠르게 폼 입력해줘"

## Excel Format

Everything is controlled from the Excel file — menu path, form fields, and save button.

| 메뉴경로 | field1 | field2 | ... | 저장버튼 |
|---------|--------|--------|-----|---------|
| MenuA > SubMenuB | Value1 | Value2 | ... | Submit |

- **메뉴경로** (first column): menu path to click, separated by `>`
- **Form fields** (middle columns): column name = form label, ID, or placeholder on screen
- **저장버튼** (last column): text of the save/submit button to click
- See `templates/test-demoqa.xlsx` for a sample

## Quick Test (demoqa.com)

A sample Excel for [demoqa.com](https://demoqa.com) is included so you can try the automation right away.

**From Claude Desktop:**
> "https://demoqa.com/elements 에 templates/test-demoqa.xlsx 파일로 폼 입력해줘"

**Or from terminal (for developers):**

```bash
git clone https://github.com/jayounglee92/form-auto-mcp.git
cd form-auto-mcp
npm install
npm run build
node test-run.mjs
```

A browser window will open and fill out the Text Box form 3 times in a row.

## License

MIT
