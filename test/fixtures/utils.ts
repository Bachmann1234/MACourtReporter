import * as fs from 'fs';
import * as path from 'path';

export function loadTextFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, name), 'utf8');
}
