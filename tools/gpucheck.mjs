import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const flags = process.argv.slice(2);
const profile = mkdtempSync(path.join(tmpdir(), 'gpuchk-'));
const c = spawn(edge, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', ...flags, 'about:blank'], { stdio: 'ignore' });
const pf = path.join(profile, 'DevToolsActivePort');
for (let i = 0; i < 100 && !existsSync(pf); i++) await new Promise(r => setTimeout(r, 100));
const port = readFileSync(pf, 'utf8').split('\n')[0];
const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id === 1) {
    const g = m.result.gpu;
    console.log('devices:', JSON.stringify(g.devices.map(d => [d.vendorString, d.deviceString, d.driverVersion, d.active, d.luid, d.vendorId, d.deviceId])), 'aux:', JSON.stringify(g.auxAttributes||{}).slice(0,0));
    
    console.log('driverBugWorkarounds:', (g.driverBugWorkarounds||[]).slice(0,10));
    c.kill(); process.exit(0);
  }
};
ws.send(JSON.stringify({ id: 1, method: 'SystemInfo.getInfo' }));
