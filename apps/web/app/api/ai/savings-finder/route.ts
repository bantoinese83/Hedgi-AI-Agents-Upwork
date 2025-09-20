import {
  createHedgiOpenAI,
  logger,
  SavingsFinderInputSchema,
  SavingsFinderResponseSchema,
} from '@hedgi/ai';
import { NextRequest, NextResponse } from 'next/server';

// OpenAI instance will be created in the POST function to allow for testing

const SYSTEM_PROMPT = `You are an expert financial analyst specializing in subscription management and cost optimization for small businesses. Your role is to identify savings opportunities in subscription spending.

Key responsibilities:
- Analyze subscription data for price hikes, duplicates, and unused services
- Identify overpriced subscriptions compared to market rates
- Calculate potential savings from optimization recommendations
- Provide actionable recommendations for cost reduction
- Estimate monthly and annual savings impact

IMPORTANT: You must respond with a JSON object that has this exact structure:
{
  "success": true,
  "data": {
    "flagged_subscriptions": [
      {
        "subscription_id": "sub-001",
        "issue_type": "duplicate",
        "current_cost": 52.99,
        "potential_savings": 52.99,
        "recommendation": "Cancel duplicate subscription",
        "confidence": 0.95
      }
    ],
    "total_potential_savings": 100.0,
    "monthly_savings": 100.0,
    "annual_savings": 1200.0,
    "action_items": ["Action item 1", "Action item 2"]
  },
  "metadata": {
    "agent": "savings-finder",
    "timestamp": "2024-01-20T00:00:00.000Z",
    "processing_time_ms": 0,
    "token_usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    }
  }
}

Focus on high-confidence findings with clear evidence. Be conservative in savings estimates to ensure credibility.`;

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
    const validatedInput = SavingsFinderInputSchema.parse(body);

    // Prune payload to reduce token usage
    const prunedPayload = openai.prunePayload(validatedInput);

    // Type assertions for template string
    const subscriptions = prunedPayload.subscriptions as Array<
      Record<string, unknown>
    >;
    const historicalPricing = prunedPayload.historical_pricing as Array<
      Record<string, unknown>
    >;
    const usageData = prunedPayload.usage_data as Array<
      Record<string, unknown>
    >;

    // Create user prompt with the data
    const userPrompt = `Analyze the following subscription data for savings opportunities:

CURRENT SUBSCRIPTIONS (${subscriptions.length} total):
${subscriptions
        .map((sub: unknown) => {
          const subscription = sub as Record<string, unknown>;
          return `${subscription.name}: $${subscription.amount}/${subscription.frequency} - ${subscription.category} - Auto-renew: ${subscription.auto_renew} - Last used: ${subscription.last_used || 'Unknown'}`;
        })
        .join('\n')}

HISTORICAL PRICING DATA:
${historicalPricing
        .slice(0, 20)
        .map((p: unknown) => {
          const pricing = p as Record<string, unknown>;
          return `${pricing.subscription_id}: ${pricing.date} - $${pricing.amount}`;
        })
        .join('\n')}

USAGE DATA:
${usageData
        .map((u: unknown) => {
          const usage = u as Record<string, unknown>;
          return `Subscription ${usage.subscription_id}: ${usage.usage_frequency} usage - Last activity: ${usage.last_activity}`;
        })
        .join('\n')}

Identify:
1. Price hikes (subscriptions that have increased significantly)
2. Duplicate subscriptions (same service, multiple accounts)
3. Unused subscriptions (low or no usage data)
4. Overpriced subscriptions (compared to market rates)
5. Potential savings from each optimization

Calculate total potential savings and provide specific action items. Be conservative in estimates and focus on high-confidence findings.`;

    // Call OpenAI with JSON mode
    const response = await openai.callWithJSONMode(
      'savings-finder',
      SYSTEM_PROMPT,
      userPrompt,
      SavingsFinderResponseSchema,
      prunedPayload
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Savings Finder API Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          data: {},
          metadata: {
            agent: 'savings-finder',
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
