import { z } from 'zod';

// Base transaction schema for all agents
export const TransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  category: z.string().optional(),
  account: z.string(),
  type: z.enum(['income', 'expense', 'transfer']),
  materiality_score: z.number().min(0).max(1), // Precomputed materiality score
});

// Base HedgiResponse schema that all agents must return
export const HedgiResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.any()),
  metadata: z.object({
    agent: z.string(),
    timestamp: z.string(),
    processing_time_ms: z.number(),
    token_usage: z.object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    }),
  }),
  error: z.string().optional(),
});

// 1. SMB Explainer Agent Schemas
export const SMBExplainerInputSchema = z.object({
  business_name: z.string(),
  month: z.string(),
  year: z.number(),
  rollups: z.object({
    total_income: z.number(),
    total_expenses: z.number(),
    net_income: z.number(),
    top_categories: z.array(
      z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
      })
    ),
  }),
  exemplar_transactions: z.array(TransactionSchema).max(10),
  previous_month_comparison: z.object({
    income_change: z.number(),
    expense_change: z.number(),
    net_change: z.number(),
  }),
});

export const SMBExplainerResponseSchema = HedgiResponseSchema.extend({
  data: z.object({
    summary: z.string(),
    key_insights: z.array(z.string()),
    recommendations: z.array(z.string()),
    financial_health_score: z.number().min(0).max(100),
  }),
});

// 2. Audit & Push Agent Schemas
export const AuditPushInputSchema = z.object({
  transactions: z.array(TransactionSchema).max(1500),
  existing_rules: z.array(
    z.object({
      id: z.string(),
      pattern: z.string(),
      category: z.string(),
      confidence: z.number(),
    })
  ),
  duplicate_threshold: z.number().default(0.9),
  uncategorized_threshold: z.number().default(0.1),
});

export const AuditPushResponseSchema = HedgiResponseSchema.extend({
  data: z.object({
    issues: z.array(
      z.object({
        type: z.enum(['uncategorized', 'misclassified', 'duplicate']),
        transaction_ids: z.array(z.string()),
        confidence: z.number(),
        description: z.string(),
        suggested_fix: z.string(),
      })
    ),
    proposed_rules: z.array(
      z.object({
        pattern: z.string(),
        category: z.string(),
        confidence: z.number(),
        impact_transactions: z.number(),
      })
    ),
    journal_entries: z.array(
      z.object({
        description: z.string(),
        debits: z.array(
          z.object({
            account: z.string(),
            amount: z.number(),
          })
        ),
        credits: z.array(
          z.object({
            account: z.string(),
            amount: z.number(),
          })
        ),
        impact_amount: z.number(),
      })
    ),
    total_impact: z.number(),
  }),
});

// 3. Savings Finder Agent Schemas
export const SavingsFinderInputSchema = z.object({
  subscriptions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      frequency: z.enum(['monthly', 'quarterly', 'annually']),
      category: z.string(),
      last_used: z.string().optional(),
      auto_renew: z.boolean(),
    })
  ),
  historical_pricing: z.array(
    z.object({
      subscription_id: z.string(),
      date: z.string(),
      amount: z.number(),
    })
  ),
  usage_data: z.array(
    z.object({
      subscription_id: z.string(),
      last_activity: z.string(),
      usage_frequency: z.enum([
        'daily',
        'weekly',
        'monthly',
        'rarely',
        'never',
      ]),
    })
  ),
});

export const SavingsFinderResponseSchema = HedgiResponseSchema.extend({
  data: z.object({
    flagged_subscriptions: z.array(
      z.object({
        subscription_id: z.string(),
        issue_type: z.enum(['price_hike', 'duplicate', 'unused', 'overpriced']),
        current_cost: z.number(),
        potential_savings: z.number(),
        recommendation: z.string(),
        confidence: z.number(),
      })
    ),
    total_potential_savings: z.number(),
    monthly_savings: z.number(),
    annual_savings: z.number(),
    action_items: z.array(z.string()),
  }),
});

// 4. Cash-Flow Runway Agent Schemas
export const CashFlowRunwayInputSchema = z.object({
  current_cash: z.number(),
  time_period: z.object({
    start_date: z.string(),
    end_date: z.string(),
  }),
  cash_flows: z.array(
    z.object({
      date: z.string(),
      type: z.enum(['inflow', 'outflow']),
      amount: z.number(),
      category: z.string(),
      description: z.string(),
      confidence: z.number(), // For projected vs actual
    })
  ),
  recurring_patterns: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
      frequency: z.enum([
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'annually',
      ]),
      next_occurrence: z.string(),
    })
  ),
});

export const CashFlowRunwayResponseSchema = HedgiResponseSchema.extend({
  data: z.object({
    cash_bridge: z.array(
      z.object({
        date: z.string(),
        opening_balance: z.number(),
        inflows: z.number(),
        outflows: z.number(),
        net_change: z.number(),
        closing_balance: z.number(),
      })
    ),
    burn_rate: z.object({
      monthly: z.number(),
      daily: z.number(),
    }),
    runway_months: z.number(),
    runway_date: z.string(),
    top_outflows: z.array(
      z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
      })
    ),
    risk_factors: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

// Union types for type safety
export type Transaction = z.infer<typeof TransactionSchema>;
export type HedgiResponse = z.infer<typeof HedgiResponseSchema>;
export type SMBExplainerInput = z.infer<typeof SMBExplainerInputSchema>;
export type SMBExplainerResponse = z.infer<typeof SMBExplainerResponseSchema>;
export type AuditPushInput = z.infer<typeof AuditPushInputSchema>;
export type AuditPushResponse = z.infer<typeof AuditPushResponseSchema>;
export type SavingsFinderInput = z.infer<typeof SavingsFinderInputSchema>;
export type SavingsFinderResponse = z.infer<typeof SavingsFinderResponseSchema>;
export type CashFlowRunwayInput = z.infer<typeof CashFlowRunwayInputSchema>;
export type CashFlowRunwayResponse = z.infer<
  typeof CashFlowRunwayResponseSchema
>;

// Agent type definitions
export type AgentType =
  | 'smb-explainer'
  | 'audit-push'
  | 'savings-finder'
  | 'cash-flow-runway';

export const AgentSchemas = {
  'smb-explainer': {
    input: SMBExplainerInputSchema,
    response: SMBExplainerResponseSchema,
  },
  'audit-push': {
    input: AuditPushInputSchema,
    response: AuditPushResponseSchema,
  },
  'savings-finder': {
    input: SavingsFinderInputSchema,
    response: SavingsFinderResponseSchema,
  },
  'cash-flow-runway': {
    input: CashFlowRunwayInputSchema,
    response: CashFlowRunwayResponseSchema,
  },
} as const;
