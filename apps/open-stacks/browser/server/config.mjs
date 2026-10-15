// Shared configuration for the Stacks Browser server and its route modules.
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

export const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const argPort = process.argv.indexOf('--port');
export const PORT = Number(argPort > 0 ? process.argv[argPort + 1] : process.env.STACKS_PORT) || 4747;
export const CACHE = process.env.STACKS_CACHE || join(homedir(), '.cache', 'open-stacks');
export const MODEL = process.env.STACKS_MODEL || 'claude-opus-5-5';
export const UA = 'OpenStacksBrowser/0.3 (personal research reader; https://github.com/quantified-uncertainty/cairn)';
export const hasKey = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
for (const d of ['', 'summaries']) mkdirSync(join(CACHE, d), { recursive: true });
