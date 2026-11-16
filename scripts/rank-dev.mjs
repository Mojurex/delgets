// `npm run dev`: жижүүр багшийн системийн шинэ /rank хуудсыг demo өгөгдөлтэй асааж,
// браузерт нээнэ. Жижүүр багшийн системийн файлд юу ч өөрчлөхгүй.
//
// Төслийн хавтас өөр газар байвал:  RANK_PROJECT_DIR=/зам npm run dev
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const candidates = [
  process.env.RANK_PROJECT_DIR,
  path.join(os.homedir(), 'Downloads', 'Жижүүр багшийн '), // хавтасны нэрний төгсгөлд хоосон зай бий
  path.join(os.homedir(), 'Downloads', 'Жижүүр багшийн'),
].filter(Boolean);
const dir = candidates.find((d) => existsSync(path.join(d, 'server', 'rank', 'api.js')));
if (!dir) {
  console.error('Жижүүр багшийн төсөл олдсонгүй. RANK_PROJECT_DIR=/зам/хавтас npm run dev гэж ажиллуулна уу.');
  process.exit(1);
}

// delgets/.env.local дахь RANK_SOURCE_URL, RANK_SOURCE_KEY (байвал) → бодит өгөгдөл
function readEnvFile(file) {
  try {
    return Object.fromEntries(readFileSync(file, 'utf8').split('\n')
      .map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
  } catch { return {}; }
}
const here = path.dirname(fileURLToPath(import.meta.url));
const demo = process.argv.includes('--demo');
const fileEnv = demo ? {} : readEnvFile(path.join(here, '..', '.env.local'));
const pick = (k) => (demo ? '' : (process.env[k] || fileEnv[k] || ''));
const remote = pick('RANK_SOURCE_URL') && pick('RANK_SOURCE_KEY');
const supabase = pick('RANK_SOURCE_DB');

const dataDir = path.join(dir, 'data', 'demo');
const env = {
  ...process.env,
  IRTS_DATA_DIR: dataDir,
  DATABASE_URL: '',
  RANK_SOURCE_URL: pick('RANK_SOURCE_URL'),
  RANK_SOURCE_KEY: pick('RANK_SOURCE_KEY'),
  RANK_SOURCE_DB: supabase,
};
console.log(supabase ? 'Өгөгдөл: Supabase (зөвхөн унших)'
  : remote ? `Өгөгдөл: бодит API (${env.RANK_SOURCE_URL})` : 'Өгөгдөл: demo (туршилтын)');

// Demo өгөгдөл байхгүй бол нэг удаа үүсгэнэ
if (!existsSync(path.join(dataDir, 'pg'))) {
  console.log('Demo өгөгдөл үүсгэж байна…');
  const r = spawnSync(process.execPath, ['server/seed-demo.js'], { cwd: dir, env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function freePort(start) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(freePort(start + 1)));
    s.once('listening', () => s.close(() => resolve(start)));
    s.listen(start, '127.0.0.1');
  });
}
const port = await freePort(Number(process.env.PORT || 3000));
const url = `http://localhost:${port}/rank`;

const child = spawn(process.execPath, ['--watch', 'server/index.js'], {
  cwd: dir,
  env: { ...env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'inherit'],
});
let opened = false;
child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  if (!opened && /localhost:\d+/.test(String(chunk))) {
    opened = true;
    console.log(`\nРанк хуудас:   ${url}\nKiosk горим:   ${url}?kiosk=1\nЗогсоох: Ctrl+C\n`);
    if (process.platform === 'darwin' && !process.env.NO_OPEN) spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
  }
});
const stop = () => { child.kill('SIGTERM'); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('exit', (code) => process.exit(code ?? 0));
