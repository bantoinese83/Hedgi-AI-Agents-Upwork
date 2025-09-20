import {
  createHedgiOpenAI,
  defaultRateLimiter,
  logger,
  performanceMonitor,
  SMBExplainerInputSchema,
  SMBExplainerResponseSchema,
} from '@hedgi/ai';
import { NextRequest, NextResponse } from 'next/server';

// OpenAI instance will be created in the POST function to allow for testing

const SYSTEM_PROMPT = `You are an expert financial analyst specializing in small business accounting. Your role is to provide clear, actionable monthly financial summaries for SMB owners.

Key responsibilities:
- Analyze monthly financial data and provide plain-English insights
- Identify key trends, patterns, and anomalies
- Offer practical recommendations for business improvement
- Calculate a financial health score (0-100) based on multiple factors
- Present information in a way that non-accountants can understand

IMPORTANT: You must respond with a JSON object that has this exact structure:
{
  "success": true,
  "data": {
    "summary": "Your monthly financial summary here",
    "key_insights": ["insight 1", "insight 2", "insight 3"],
    "recommendations": ["recommendation 1", "recommendation 2"],
    "financial_health_score": 85
  },
  "metadata": {
    "agent": "smb-explainer",
    "timestamp": "2024-01-20T00:00:00.000Z",
    "processing_time_ms": 0,
    "token_usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    }
  }
}

Focus on actionable insights rather than just data presentation.`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    // Validate API key and create OpenAI instance
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const openai = createHedgiOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      enableCostLogging: true,
    });
    // Rate limiting
    const clientIP =
      request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!defaultRateLimiter.isAllowed(clientIP)) {
      error = 'Rate limit exceeded';
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          data: {},
          metadata: {
            agent: 'smb-explainer',
            timestamp: new Date().toISOString(),
            processing_time_ms: 0,
            token_usage: {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
            },
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedInput = SMBExplainerInputSchema.parse(body);

    // Prune payload to reduce token usage
    const prunedPayload = openai.prunePayload(validatedInput);

    // Type assertions for template string
    const rollups = prunedPayload.rollups as Record<string, unknown>;
    const exemplarTransactions = prunedPayload.exemplar_transactions as Array<
      Record<string, unknown>
    >;
    const previousMonthComparison =
      prunedPayload.previous_month_comparison as Record<string, unknown>;
    const topCategories = rollups.top_categories as Array<
      Record<string, unknown>
    >;

    // Create user prompt with the data
    const userPrompt = `Analyze the following monthly financial data for ${prunedPayload.business_name} (${prunedPayload.month} ${prunedPayload.year}):

ROLLUPS:
- Total Income: $${(rollups.total_income as number).toLocaleString()}
- Total Expenses: $${(rollups.total_expenses as number).toLocaleString()}
- Net Income: $${(rollups.net_income as number).toLocaleString()}
- Top Categories: ${topCategories
        .map((c: unknown) => {
          const category = c as Record<string, unknown>;
          return `${category.category}: $${(category.amount as number).toLocaleString()} (${category.percentage}%)`;
        })
        .join(', ')}

EXEMPLAR TRANSACTIONS:
${exemplarTransactions
        .map((t: unknown) => {
          const transaction = t as Record<string, unknown>;
          return `${transaction.date} - ${transaction.description} - $${transaction.amount} (${transaction.category || 'Uncategorized'})`;
        })
        .join('\n')}

PREVIOUS MONTH COMPARISON:
- Income Change: ${(previousMonthComparison.income_change as number) > 0 ? '+' : ''}${previousMonthComparison.income_change}%
- Expense Change: ${(previousMonthComparison.expense_change as number) > 0 ? '+' : ''}${previousMonthComparison.expense_change}%
- Net Change: ${(previousMonthComparison.net_change as number) > 0 ? '+' : ''}${previousMonthComparison.net_change}%

Provide a comprehensive monthly summary with key insights, recommendations, and a financial health score.`;

    // Call OpenAI with JSON mode
    const response = await openai.callWithJSONMode(
      'smb-explainer',
      SYSTEM_PROMPT,
      userPrompt,
      SMBExplainerResponseSchema,
      prunedPayload
    );

    success = true;
    return NextResponse.json(response);
  } catch (err) {
    logger.error('SMB Explainer API Error:', err);
    error = err instanceof Error ? err.message : 'Unknown error';

    if (err instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          data: {},
          metadata: {
            agent: 'smb-explainer',
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
  } finally {
    // Log performance metrics
    const responseTime = Date.now() - startTime;
    performanceMonitor.logRequest(
      'smb-explainer',
      responseTime,
      success,
      error
    );
  }
}
