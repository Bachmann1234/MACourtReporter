import * as fs from 'node:fs';
import * as path from 'node:path';

export default function loadTextFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');
}
