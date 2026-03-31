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

```bash
git clone https://github.com/jayounglee92/form-auto-mcp.git
cd form-auto-mcp
npm install
npx playwright install chromium
npm run build
```

### Claude Desktop 설정

`claude_desktop_config.json`에 추가:

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

### 사이트 설정

`config.json` 파일을 프로젝트 루트에 생성:

```json
{
  "siteUrl": "https://your-internal-system.com",
  "menuSelector": ".side-menu",
  "saveButtonText": "저장",
  "defaultMode": "visible",
  "stepDelay": 500
}
```

### Google Sheets 사용 시 (선택)

`.env` 파일 생성:

```
GOOGLE_API_KEY=your_api_key
```

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
