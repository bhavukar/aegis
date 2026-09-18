export type ActionVerdict = 'ALLOW' | 'BLOCK' | 'REQUIRE_CONFIRMATION';

export interface SecurityRule {
  id: string;
  name: string;
  pattern: RegExp;
  verdict: ActionVerdict;
  reason: string;
}

export const DEFAULT_SECURITY_RULES: SecurityRule[] = [
  {
    id: 'SEC-001',
    name: 'Root / Recursive Deletion',
    pattern: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f*|-f[a-zA-Z]*r[a-zA-Z]*)\s+(\/|~|\.\.|\*)/i,
    verdict: 'BLOCK',
    reason: 'Prevented destructive recursive deletion of root or home directory.'
  },
  {
    id: 'SEC-002',
    name: 'Database Table Drop',
    pattern: /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
    verdict: 'REQUIRE_CONFIRMATION',
    reason: 'High-risk SQL statement modifying schema or dropping tables.'
  },
  {
    id: 'SEC-003',
    name: 'Remote Code Pipe Execution',
    pattern: /\b(curl|wget)\s+.*\|\s*(bash|sh|zsh|python|perl)\b/i,
    verdict: 'BLOCK',
    reason: 'Remote code piped directly into shell interpreter.'
  },
  {
    id: 'SEC-004',
    name: 'Unrestricted Permissions',
    pattern: /\bchmod\s+777\b/i,
    verdict: 'REQUIRE_CONFIRMATION',
    reason: 'Granting universal read/write/execute permissions.'
  },
  {
    id: 'SEC-005',
    name: 'Force Push to Master/Main',
    pattern: /\bgit\s+push\s+.*(--force|-f)\s+.*(main|master)\b/i,
    verdict: 'BLOCK',
    reason: 'Force push to protected branch blocked.'
  }
];

export class PolicyEngine {
  private rules: SecurityRule[];

  constructor(customRules?: SecurityRule[]) {
    this.rules = customRules || DEFAULT_SECURITY_RULES;
  }

  public evaluate(toolName: string, args: Record<string, any>): {
    verdict: ActionVerdict;
    matchedRule?: SecurityRule;
  } {
    const rawArgs = JSON.stringify(args);

    for (const rule of this.rules) {
      if (rule.pattern.test(rawArgs)) {
        return {
          verdict: rule.verdict,
          matchedRule: rule
        };
      }
    }

    return { verdict: 'ALLOW' };
  }
}
