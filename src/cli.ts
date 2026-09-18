#!/usr/bin/env node
import { MCPShieldProxy } from './index.js';
import * as readline from 'readline';

console.error('[MCP-SHIELD] Zero-Trust Security Proxy & DLP Firewall initialized.');

const proxy = new MCPShieldProxy({
  mode: 'enforce',
  redactSecrets: true,
  blockDestructive: true
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    const result = proxy.interceptRequest(msg);
    if (result.action === 'block') {
      console.error(`\x1b[31m[MCP-SHIELD-ALERT] Intercepted and blocked: ${result.reason}\x1b[0m`);
      console.log(JSON.stringify(result.message));
    } else {
      console.log(JSON.stringify(result.message));
    }
  } catch (e) {
    console.log(line);
  }
});
