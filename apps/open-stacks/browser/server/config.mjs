// Shared configuration for the Stacks Browser server and its route modules.
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

export const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const argPort = process.argv.indexOf('--port');
export const PORT = Number(argPort > 0 ? process.argv[argPort + 1] : process.env.STACKS_PORT) || 4747;
// Listen on loopback only: the proxy, notes and paid summaries must not be
// reachable from other machines on the network (cafes, shared offices).
// STACKS_HOST=0.0.0.0 opts in, e.g. for a tablet on a trusted network.
export const HOST = process.env.STACKS_HOST || '127.0.0.1';
export const CACHE = process.env.STACKS_CACHE || join(homedir(), '.cache', 'open-stacks');
// Haiku by default: about 40x cheaper than Opus and fast enough to keep up with skimming.
export const MODEL = process.env.STACKS_MODEL || 'claude-haiku-5-5';
export const UA = 'OpenStacksBrowser/0.3 (personal research reader; https://github.com/quantified-uncertainty/cairn)';
export const hasKey = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
for (const d of ['', 'summaries']) mkdirSync(join(CACHE, d), { recursive: true });
