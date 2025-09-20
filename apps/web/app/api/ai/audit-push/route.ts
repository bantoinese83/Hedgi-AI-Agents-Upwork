import {
  AuditPushInputSchema,
  AuditPushResponseSchema,
  createHedgiOpenAI,
  logger,
} from '@hedgi/ai';
import { NextRequest, NextResponse } from 'next/server';

// OpenAI instance will be created in the POST function to allow for testing

const SYSTEM_PROMPT = `You are an expert accounting auditor specializing in transaction analysis and ledger corrections. Your role is to identify and propose fixes for accounting issues in small business financial data.

Key responsibilities:
- Detect uncategorized, misclassified, and duplicate transactions
- Analyze transaction patterns to identify potential categorization rules
- Propose journal entries for corrections with impact analysis
- Calculate total financial impact of proposed changes
- Ensure all recommendations follow proper accounting principles

IMPORTANT: You must respond with a JSON object that has this exact structure:
{
  "success": true,
  "data": {
    "issues": [
      {
        "type": "uncategorized",
        "transaction_ids": ["txn-001"],
        "confidence": 0.9,
        "description": "Transaction description",
        "suggested_fix": "Suggested fix"
      }
    ],
    "proposed_rules": [
      {
        "pattern": "pattern string",
        "category": "category name",
        "confidence": 0.8,
        "impact_transactions": 5
      }
    ],
    "journal_entries": [
      {
        "description": "Journal entry description",
        "debits": [{"account": "account", "amount": 100}],
        "credits": [{"account": "account", "amount": 100}],
        "impact_amount": 100
      }
    ],
    "total_impact": 100
  },
  "metadata": {
    "agent": "audit-push",
    "timestamp": "2024-01-20T00:00:00.000Z",
    "processing_time_ms": 0,
    "token_usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    }
  }
}

Focus on high-confidence issues with clear evidence. Prioritize accuracy over quantity of findings.`;

export async function POST(request: NextRequest) {
  try {
    // Validate API key and create OpenAI instance
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const openai = createHedgiOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      enableCostLogging: true,
    });

    const body = await request.json();

    // Validate input
    const validatedInput = AuditPushInputSchema.parse(body);

    // Prune payload to reduce token usage (limit to 1500 transactions, sorted by materiality)
    const prunedPayload = openai.prunePayload(validatedInput);

    // Type assertions for template string
    const transactions = prunedPayload.transactions as Array<
      Record<string, unknown>
    >;
    const existingRules = prunedPayload.existing_rules as Array<
      Record<string, unknown>
    >;

    // Create user prompt with the data
    const userPrompt = `Analyze the following transaction data for accounting issues:

TRANSACTION COUNT: ${transactions.length}
DUPLICATE THRESHOLD: ${prunedPayload.duplicate_threshold}
UNCATEGORIZED THRESHOLD: ${prunedPayload.uncategorized_threshold}

EXISTING RULES:
${existingRules
        .map((rule: unknown) => {
          const ruleObj = rule as Record<string, unknown>;
          return `- ${ruleObj.pattern} → ${ruleObj.category} (confidence: ${ruleObj.confidence})`;
        })
        .join('\n')}

SAMPLE TRANSACTIONS (first 20):
${transactions
        .slice(0, 20)
        .map((t: unknown) => {
          const transaction = t as Record<string, unknown>;
          return `${transaction.id}: ${transaction.date} - ${transaction.description} - $${transaction.amount} - ${transaction.category || 'UNCATEGORIZED'} - ${transaction.type}`;
        })
        .join('\n')}

Identify:
1. Uncategorized transactions (missing or low-confidence categories)
2. Misclassified transactions (wrong category based on description patterns)
3. Duplicate transactions (same amount, date, description)
4. Proposed categorization rules based on patterns
5. Journal entries needed for corrections

Focus on high-impact, high-confidence issues. Provide specific transaction IDs and clear reasoning for each finding.`;

    // Call OpenAI with JSON mode
    const response = await openai.callWithJSONMode(
      'audit-push',
      SYSTEM_PROMPT,
      userPrompt,
      AuditPushResponseSchema,
      prunedPayload
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Audit & Push API Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          data: {},
          metadata: {
            agent: 'audit-push',
            timestamp: new Date().toISOString(),
            processing_time_ms: 0,
            token_usage: {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
            },
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
