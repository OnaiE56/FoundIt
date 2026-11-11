import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(projectRoot, 'frontend');
const destination = path.join(projectRoot, 'public');

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, force: true });
