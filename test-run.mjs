import { readExcelFile } from './dist/readers/excel-reader.js';
import { normalizeRows } from './dist/readers/normalize.js';
import { loadConfig } from './dist/config.js';
import { runWorkflow } from './dist/workflow/runner.js';

const config = loadConfig();
const rawRows = readExcelFile('./templates/test-demoqa.xlsx');
const rows = normalizeRows(rawRows);

console.log(`📋 ${rows.length}건 데이터 로드 완료`);
console.log('🚀 워크플로우 실행 중...\n');

const report = await runWorkflow({ rows, config, mode: 'visible' });

console.log('\n📊 결과 리포트:');
console.log(report.toText());
