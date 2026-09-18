# Aegis

> **Zero-Trust Security Proxy & In-Stream Data Loss Prevention (DLP) Firewall for Autonomous Tool Chains and APIs.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Protocol Native](https://img.shields.io/badge/MCP-Native-000000)](https://modelcontextprotocol.io/)

---

## What is Aegis?

When autonomous AI agents interact with local tools, APIs, and databases, they operate with broad system privileges. Prompt injections, rogue tool calls, or accidental hallucinations can lead to credential leakage, accidental table drops, or destructive shell execution.

**Aegis** sits transparently between your AI Client (Claude Desktop, Cursor, Custom Agent Frameworks) and your tool servers. It performs **sub-millisecond stream inspection**, **dynamic DLP token redaction**, and **zero-trust AST policy enforcement** to stop rogue operations before execution.

```mermaid
flowchart LR
    A["AI Agent / LLM Client"] -->|"JSON-RPC Tool Call"| B["Aegis Proxy"]
    B -->|"1. Policy Check: Pass"| C["DLP Engine"]
    B -.->|"1. Policy Check: Block"| F["Immediate Rejection Response"]
    C -->|"2. Redact Leaked Secrets"| D["Sanitized Request"]
    D -->|"3. Safe Forwarding"| E["Target Tool Server"]
    E -->|"4. Tool Result Output"| B
    B -->|"5. DLP Outbound Scan"| A
```

---

## Core Capabilities

- **Destructive Command Interception**: Intercepts dangerous operations like `rm -rf /`, `DROP TABLE`, `chmod 777`, `git push --force origin main`, and arbitrary network pipe execution (`curl | sh`).
- **Zero-Latency In-Stream DLP**: Automatically scrubs and masks AWS access keys, OpenAI API tokens, GitHub personal tokens, JWTs, private SSH keys, and database connection strings in-flight.
- **Zero-Overhead Transparent Proxy**: Wraps any standard `stdio` or `SSE` server without modifying existing server code.
- **Configurable Enforcement Modes**:
  - `enforce`: Blocks risky requests instantly with structured JSON-RPC error codes.
  - `audit`: Logs violations silently without interrupting tool execution.
  - `permissive`: Sanitizes data in-place and passes modified arguments through.

---

## Quickstart

### 1. Installation
```bash
npm install -g aegis-proxy
```

### 2. Using with Claude Desktop or Cursor
In your `claude_desktop_config.json` or `cursor.json`, wrap your target tool server:

```json
{
  "mcpServers": {
    "filesystem-secured": {
      "command": "aegis",
      "args": ["--", "npx", "-y", "@modelcontextprotocol/server-filesystem", "/Users/me/Projects"]
    },
    "postgres-secured": {
      "command": "aegis",
      "args": ["--mode=enforce", "--", "npx", "-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

### 3. Programmatic Node.js SDK
```typescript
import { AegisProxy } from 'aegis-proxy';

const aegis = new AegisProxy({
  mode: 'enforce',
  redactSecrets: true,
  blockDestructive: true
});

// Intercept incoming tool calls
const intercepted = aegis.interceptRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'execute_command',
    arguments: { command: 'rm -rf /var/log && echo sk-proj-1234567890abcdef' }
  }
});

console.log(intercepted);
// -> { action: 'block', reason: 'Destructive recursive directory removal detected.' }
```

---

## Built-in DLP Patterns

| Secret / Threat Pattern | Action | Example Redaction |
| :--- | :--- | :--- |
| **AWS Access Key ID** | In-place Masking | `AKIA[REDACTED_AWS_KEY]` |
| **OpenAI API Key** | In-place Masking | `sk-proj-[REDACTED_OPENAI_KEY]` |
| **GitHub Token** | In-place Masking | `ghp_[REDACTED_GITHUB_TOKEN]` |
| **SSH Private Key** | Total Redaction | `[REDACTED_PRIVATE_KEY]` |
| **PostgreSQL / MySQL URI** | Password Strip | `postgres://user:[REDACTED]@host/db` |
| **Bearer / JWT Header** | In-place Masking | `Bearer eyJ...[REDACTED_JWT]` |

---

## Default Guardrail Policies

1. **Filesystem Guard**: Blocks recursive directory deletions (`rm -rf`, `del /s /q`) on system paths (`/`, `/etc`, `/usr`, `/var`, `C:\Windows`).
2. **SQL Guard**: Blocks table/database drop statements (`DROP TABLE`, `DROP DATABASE`, `TRUNCATE`) unless explicitly whitelisted.
3. **Git Guard**: Prevents force pushing to protected branches (`main`, `master`, `production`).
4. **Shell Execution Guard**: Prevents direct piped network execution (`curl | bash`, `wget | sh`).

---

## Architecture

```
aegis/
├── bin/
│   └── mcp-shield.js      # CLI Binary Entrypoint
├── src/
│   ├── dlp.ts             # Regex-based High-Throughput Token Scrubber
│   ├── policy.ts          # AST & Command Intent Evaluator
│   ├── index.ts           # AegisProxy Core Class & Typings
│   └── cli.ts             # Stdio Streaming Proxy Loop
├── web/                   # Dark Luxury Obsidian Demo Workbench
└── package.json
```

---

## License

MIT License. Designed and engineered by Bhavuk Arora.
