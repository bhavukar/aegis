import { DLPEngine } from './dlp.js';
import { PolicyEngine } from './policy.js';

export interface ShieldConfig {
  mode: 'enforce' | 'audit' | 'permissive';
  redactSecrets: boolean;
  blockDestructive: boolean;
}

export class MCPShieldProxy {
  private dlp: DLPEngine;
  private policy: PolicyEngine;
  private config: ShieldConfig;

  constructor(config?: Partial<ShieldConfig>) {
    this.config = {
      mode: 'enforce',
      redactSecrets: true,
      blockDestructive: true,
      ...config
    };
    this.dlp = new DLPEngine();
    this.policy = new PolicyEngine();
  }

  public interceptRequest(jsonRpcMessage: any): { action: 'forward' | 'block' | 'redact'; message: any; reason?: string } {
    if (jsonRpcMessage?.method === 'tools/call') {
      const toolName = jsonRpcMessage.params?.name || 'unknown';
      const args = jsonRpcMessage.params?.arguments || {};

      // 1. Evaluate Security Policy
      const evalResult = this.policy.evaluate(toolName, args);
      if (evalResult.verdict === 'BLOCK' && this.config.blockDestructive) {
        return {
          action: 'block',
          message: {
            jsonrpc: '2.0',
            id: jsonRpcMessage.id,
            error: {
              code: -32001,
              message: `[AEGIS BLOCKED] ${evalResult.matchedRule?.reason || 'Violates security policy.'}`,
              data: { ruleId: evalResult.matchedRule?.id }
            }
          },
          reason: evalResult.matchedRule?.reason
        };
      }

      // 2. Perform DLP sanitization on outgoing arguments
      if (this.config.redactSecrets) {
        const raw = JSON.stringify(args);
        const { sanitized, redactedCount } = this.dlp.sanitize(raw);
        if (redactedCount > 0) {
          jsonRpcMessage.params.arguments = JSON.parse(sanitized);
          return { action: 'redact', message: jsonRpcMessage };
        }
      }
    }

    return { action: 'forward', message: jsonRpcMessage };
  }

  public interceptResponse(jsonRpcResponse: any): any {
    if (this.config.redactSecrets && jsonRpcResponse?.result) {
      const raw = JSON.stringify(jsonRpcResponse.result);
      const { sanitized } = this.dlp.sanitize(raw);
      jsonRpcResponse.result = JSON.parse(sanitized);
    }
    return jsonRpcResponse;
  }
}

export { MCPShieldProxy as AegisProxy };
export { DLPEngine, PolicyEngine };

