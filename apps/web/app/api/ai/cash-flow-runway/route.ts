import {
  CashFlowRunwayInputSchema,
  CashFlowRunwayResponseSchema,
  createHedgiOpenAI,
  logger,
} from '@hedgi/ai';
import { NextRequest, NextResponse } from 'next/server';

// OpenAI instance will be created in the POST function to allow for testing

const SYSTEM_PROMPT = `You are an expert financial analyst specializing in cash flow management and runway analysis for small businesses. Your role is to provide accurate cash flow projections and runway calculations.

Key responsibilities:
- Analyze cash flow patterns and project future balances
- Calculate burn rate and runway based on historical data
- Identify top cash outflow categories and risk factors
- Provide recommendations for cash flow optimization
- Generate monthly cash bridge projections

IMPORTANT: You must respond with a JSON object that has this exact structure:
{
  "success": true,
  "data": {
    "cash_bridge": [
      {
        "date": "2024-01-31",
        "opening_balance": 100000,
        "inflows": 25000,
        "outflows": 20000,
        "net_change": 5000,
        "closing_balance": 105000
      }
    ],
    "burn_rate": {
      "monthly": 20000,
      "daily": 667
    },
    "runway_months": 5.0,
    "runway_date": "2024-06-30",
    "top_outflows": [
      {
        "category": "Payroll",
        "amount": 15000,
        "percentage": 75
      }
    ],
    "risk_factors": ["Risk factor 1", "Risk factor 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "metadata": {
    "agent": "cash-flow-runway",
    "timestamp": "2024-01-20T00:00:00.000Z",
    "processing_time_ms": 0,
    "token_usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    }
  }
}

Focus on conservative projections based on historical patterns. Use conservative estimates to ensure reliability.`;

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
    const validatedInput = CashFlowRunwayInputSchema.parse(body);

    // Prune payload to reduce token usage
    const prunedPayload = openai.prunePayload(validatedInput);

    // Type assertions for template string
    const timePeriod = prunedPayload.time_period as Record<string, unknown>;
    const cashFlows = prunedPayload.cash_flows as Array<
      Record<string, unknown>
    >;
    const recurringPatterns = prunedPayload.recurring_patterns as Array<
      Record<string, unknown>
    >;

    // Create user prompt with the data
    const userPrompt = `Analyze the following cash flow data for runway projections:

CURRENT CASH: $${(prunedPayload.current_cash as number).toLocaleString()}
ANALYSIS PERIOD: ${timePeriod.start_date} to ${timePeriod.end_date}

CASH FLOWS (${cashFlows.length} transactions):
${cashFlows
        .slice(0, 30)
        .map((cf: unknown) => {
          const cashFlow = cf as Record<string, unknown>;
          return `${cashFlow.date} - ${(cashFlow.type as string).toUpperCase()}: $${cashFlow.amount} - ${cashFlow.category} - ${cashFlow.description} (confidence: ${cashFlow.confidence})`;
        })
        .join('\n')}

RECURRING PATTERNS:
${recurringPatterns
        .map((p: unknown) => {
          const pattern = p as Record<string, unknown>;
          return `${pattern.category}: $${pattern.amount}/${pattern.frequency} - Next: ${pattern.next_occurrence}`;
        })
        .join('\n')}

Calculate:
1. Monthly cash bridge with daily projections
2. Burn rate (monthly and daily)
3. Runway in months and end date
4. Top 3 cash outflow categories
5. Risk factors and recommendations

Use historical patterns to project future cash flows. Be conservative in estimates and clearly identify assumptions.`;

    // Call OpenAI with JSON mode
    const response = await openai.callWithJSONMode(
      'cash-flow-runway',
      SYSTEM_PROMPT,
      userPrompt,
      CashFlowRunwayResponseSchema,
      prunedPayload
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Cash Flow Runway API Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          data: {},
          metadata: {
            agent: 'cash-flow-runway',
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
