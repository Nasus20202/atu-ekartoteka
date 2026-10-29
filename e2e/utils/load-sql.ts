import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const SQL_DIR = fileURLToPath(new URL('../test-data/seed', import.meta.url));

export function loadSql(filename: string): string {
  return fs.readFileSync(path.join(SQL_DIR, filename), 'utf-8');
}
