import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { Env } from '../config/env.schema';

export interface AiFields {
  vulnerability: string;
  threats: string;
  impact: string;
  affectedSystem: string;
  recommendations: string;
}

const EMPTY: AiFields = {
  vulnerability: '',
  threats: '',
  impact: '',
  affectedSystem: '',
  recommendations: '',
};

@Injectable()
export class AiAssistantService implements OnModuleInit {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly enabled: boolean;
  private readonly client: OpenAI | null;
  private readonly model: string;
  private readonly host: string;

  constructor(configService: ConfigService<Env, true>) {
    this.enabled = configService.get('AI_ENABLED', { infer: true });
    this.host = configService.get('OLLAMA_HOST', { infer: true });
    this.model = configService.get('OLLAMA_MODEL', { infer: true });
    if (this.enabled) {
      this.client = new OpenAI({
        apiKey: 'ollama',
        baseURL: `${this.host.replace(/\/+$/, '')}/v1`,
        maxRetries: 0,
        timeout: 300_000,
      });
    } else {
      this.client = null;
    }
  }

  onModuleInit(): void {
    if (this.enabled) {
      this.logger.log(`AI enrichment enabled: ollama at ${this.host}, model=${this.model}`);
    } else {
      this.logger.log('AI enrichment disabled (AI_ENABLED=false); returning empty AI fields');
    }
  }

  async generate(description: string): Promise<AiFields> {
    if (!this.client) {
      return { ...EMPTY };
    }
    const prompt = this.buildPrompt(description);
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You output only a single JSON object with the requested keys. No preamble, no code fences, no explanation. Do not include reasoning or thinking. Respond only with the JSON object. /no_think',
          },
          { role: 'user', content: `${prompt}\n\n/no_think` },
        ],
        temperature: 0.3,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      });
      const raw = response.choices[0]?.message.content ?? '';
      return this.parseJson(raw) ?? { ...EMPTY };
    } catch (err) {
      this.logger.warn(`ollama generate failed: ${this.describeError(err)}`);
      return { ...EMPTY };
    }
  }

  private describeError(err: unknown): string {
    if (typeof err !== 'object' || err === null) {
      return String(err);
    }
    const anyErr = err as { status?: number; message?: string; error?: unknown; code?: string };
    const parts: string[] = [];
    if (typeof anyErr.status === 'number') {
      parts.push(`status=${anyErr.status}`);
    }
    if (anyErr.code) {
      parts.push(`code=${anyErr.code}`);
    }
    if (anyErr.message) {
      parts.push(`msg="${anyErr.message}"`);
    }
    return parts.join(' ') || String(err);
  }

  private parseJson(raw: string): AiFields | null {
    if (!raw.trim()) {
      return null;
    }
    const cleaned = this.stripThinkingAndFences(raw).trim();
    if (!cleaned) {
      return null;
    }
    try {
      const parsed = JSON.parse(cleaned) as Partial<Record<keyof AiFields, unknown>>;
      return {
        vulnerability: this.str(parsed.vulnerability),
        threats: this.str(parsed.threats),
        impact: this.str(parsed.impact),
        affectedSystem: this.str(parsed.affectedSystem),
        recommendations: this.str(parsed.recommendations),
      };
    } catch {
      return null;
    }
  }

  private stripThinkingAndFences(raw: string): string {
    let out = raw;
    out = out.replace(/<think>[\s\S]*?<\/think>/gi, '');
    out = out.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    return out;
  }

  private str(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.map(String).join(', ');
    }
    return '';
  }

  private buildPrompt(description: string): string {
    return `Given this CVE description, return a JSON object with exactly these keys and nothing else:
{
  "vulnerability": "The concise name of the vulnerability class (e.g., 'Remote command execution', 'Buffer overflow'). Do not prefix with 'The vulnerability is'.",
  "threats": "One sentence naming the threat an attacker can carry out. Do not prefix with 'The threat is' or 'In simple terms'.",
  "impact": "One sentence in plain language describing the practical consequence to the user. Do not prefix with 'The impact is' or 'In simple terms'.",
  "affectedSystem": "A short comma-separated list of the affected systems or components.",
  "recommendations": "One or two sentences of concrete mitigation guidance in plain language. Do not prefix with 'I recommend' or 'In simple terms'."
}

CVE description: ${JSON.stringify(description)}`;
  }
}

export function hasAiContent(fields: AiFields): boolean {
  return Boolean(
    fields.vulnerability ||
    fields.threats ||
    fields.impact ||
    fields.affectedSystem ||
    fields.recommendations,
  );
}
