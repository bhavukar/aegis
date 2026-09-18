# 🛡️ MCP-Shield

> **Zero-Trust Security Proxy & Data Loss Prevention (DLP) Firewall for Model Context Protocol (MCP) & Autonomous AI Agents.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Compatible-000000)](https://modelcontextprotocol.io/)

---

## ⚡ What is MCP-Shield?

When autonomous AI agents interact with local tools, APIs, and databases via the **Model Context Protocol (MCP)**, they operate with significant privileges. Prompt injections, rogue tool calls, or accidental hallucinations can lead to catastrophic data leaks, accidental table drops, or destructive shell execution.

**MCP-Shield** sits transparently between your AI Client (Claude Desktop, Cursor, Custom Agent Frameworks) and your MCP Servers. It performs **sub-millisecond stream inspection**, **dynamic DLP token redaction**, and **zero-trust AST policy enforcement** to stop rogue operations before they execute.

```mermaid
flowchart LR
    A[AI Agent / LLM Client] -->|JSON-RPC Tool Call| B[🛡️ MCP-Shield Proxy]
    B -->|1. Policy Check: Pass| C[DLP Engine]
    B -.->|1. Policy Check: Block| F[⛔ Immediate Rejection Response]
    C -->|2. Redact Leaked Secrets| D[Sanitized Request]
    D -->|3. Safe Forwarding| E[Target MCP Server]
    E -->|4. Tool Result Output| B
    B -->|5. DLP Outbound Scan| A
```

---

## ✨ Core Features

- 🛑 **Destructive Command Interception**: Intercepts dangerous operations like `rm -rf /`, `DROP TABLE`, `chmod 777`, `git push --force origin main`, and arbitrary network pipe execution (`curl | sh`).
- 🔐 **Zero-Latency In-Stream DLP**: Automatically scrubs and masks AWS access keys, OpenAI API tokens, GitHub personal tokens, JWTs, private SSH keys, and database connection strings.
- ⚡ **Zero-Overhead Transparent Proxy**: Wraps any standard `stdio` or `SSE` MCP server without modifying a single line of your existing server code.
- 🎯 **Configurable Enforcement Modes**:
  - `enforce`: Blocks risky requests instantly with structured JSON-RPC error codes.
  - `audit`: Logs violations silently without interrupting tool execution.
  - `permissive`: Sanitizes data in-place and passes modified arguments through.

---

## 🚀 Quickstart

### 1. Installation
```bash
npm install -g mcp-shield
```

### 2. Using with Claude Desktop or Cursor
In your `claude_desktop_config.json` or `cursor.json`, simply wrap your target MCP server:

```json
{
  "mcpServers": {
    "filesystem-secured": {
      "command": "mcp-shield",
      "args": ["--", "npx", "-y", "@modelcontextprotocol/server-filesystem", "/Users/me/Projects"]
    },
    "postgres-secured": {
      "command": "mcp-shield",
      "args": ["--mode=enforce", "--", "npx", "-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

### 3. Programmatic Node.js SDK
```typescript
import { MCPShieldProxy } from 'mcp-shield';

const shield = new MCPShieldProxy({
  mode: 'enforce',
  redactSecrets: true,
  blockDestructive: true
});

// Intercept incoming tool calls
const intercepted = shield.interceptRequest({
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

## 🛡️ Built-in DLP Patterns

| Secret / Threat Pattern | Action | Example Redaction |
| :--- | :--- | :--- |
| **AWS Access Key ID** | In-place Masking | `AKIA[REDACTED_AWS_KEY]` |
| **OpenAI API Key** | In-place Masking | `sk-proj-[REDACTED_OPENAI_KEY]` |
| **GitHub Token** | In-place Masking | `ghp_[REDACTED_GITHUB_TOKEN]` |
| **RSA / OpenSSH Private Key** | Total Masking | `-----BEGIN OPENSSH PRIVATE KEY-----\n[REDACTED_PRIVATE_KEY]...` |
| **PostgreSQL / MySQL URI** | Credential Masking | `postgres://user:***@localhost:5432/db` |
| **Destructive Shell Command** | Request Blocked | `rm -rf /` -> `Error -32001: Violates security policy` |
| **SQL Injection / Drop** | Request Blocked | `DROP TABLE users;` -> `Error -32001: Destructive SQL detected` |

---

## 🌐 Interactive Web Landing Page

The project includes an interactive web demo inspired by Japanese avant-garde minimalism (`pasur.co.jp`).

To launch the web interface locally:
```bash
npx serve web
# or open web/index.html in any browser
```

---

## 📜 License

MIT License © 2026 Bhavuk Arora
