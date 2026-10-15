// Shared configuration for the Stacks Browser server and its route modules.
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

export const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const argPort = process.argv.indexOf('--port');
export const PORT = Number(argPort > 0 ? process.argv[argPort + 1] : process.env.STACKS_PORT) || 4747;
// Listen on loopback only: the proxy, notes, exports and paid summaries must
// not be reachable from other machines on the network (cafes, shared offices).
// The default, localhost, means both loopback addresses, 127.0.0.1 and ::1
// (server.mjs). --host 0.0.0.0 (or STACKS_HOST) opts in to the network, e.g.
// for a tablet on a trusted network; the server then prints a warning.
const argHost = process.argv.indexOf('--host');
export const HOST = (argHost > 0 ? process.argv[argHost + 1] : process.env.STACKS_HOST) || 'localhost';
/** True for a name or address only this machine can reach. */
export const isLoopback = (h) => h === 'localhost' || h === '::1' || /^(::ffff:)?127(\.\d{1,3}){3}$/.test(h);
export const CACHE = process.env.STACKS_CACHE || join(homedir(), '.cache', 'open-stacks');
export const MODEL = process.env.STACKS_MODEL || 'claude-opus-5-5';
export const UA = 'OpenStacksBrowser/0.3 (personal research reader; https://github.com/quantified-uncertainty/cairn)';
export const hasKey = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
for (const d of ['', 'summaries']) mkdirSync(join(CACHE, d), { recursive: true });
