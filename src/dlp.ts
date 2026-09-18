export interface DLPPattern {
  name: string;
  regex: RegExp;
  mask: (match: string) => string;
}

export const DEFAULT_DLP_PATTERNS: DLPPattern[] = [
  {
    name: 'AWS Access Key',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    mask: (m) => `[REDACTED_AWS_KEY_${m.slice(0, 4)}...***]`
  },
  {
    name: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9T3BlbkFJ]{20,}/g,
    mask: () => '[REDACTED_OPENAI_KEY]'
  },
  {
    name: 'GitHub Token',
    regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/g,
    mask: () => '[REDACTED_GITHUB_TOKEN]'
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    mask: () => '[REDACTED_PRIVATE_KEY_BLOCK]'
  },
  {
    name: 'Generic JWT',
    regex: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
    mask: () => '[REDACTED_JWT_TOKEN]'
  },
  {
    name: 'Password in Connection String',
    regex: /(postgres|mysql|mongodb|redis):\/\/[^:\s]+:([^@\s]+)@/g,
    mask: (m) => m.replace(/:([^@\s]+)@/, ':***@')
  }
];

export class DLPEngine {
  private patterns: DLPPattern[];

  constructor(customPatterns?: DLPPattern[]) {
    this.patterns = customPatterns || DEFAULT_DLP_PATTERNS;
  }

  public sanitize(text: string): { sanitized: string; redactedCount: number; matchedTypes: string[] } {
    let result = text;
    let count = 0;
    const matched = new Set<string>();

    for (const pattern of this.patterns) {
      const matches = result.match(pattern.regex);
      if (matches) {
        count += matches.length;
        matched.add(pattern.name);
        result = result.replace(pattern.regex, pattern.mask);
      }
    }

    return {
      sanitized: result,
      redactedCount: count,
      matchedTypes: Array.from(matched)
    };
  }
}
