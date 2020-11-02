import * as fs from 'fs';
import * as path from 'path';

function loadTextFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');
}

export { loadTextFixture as default };
