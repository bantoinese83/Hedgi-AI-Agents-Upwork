import { z } from 'zod';

// Helper function to validate date strings
const validateDateString = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const isValidDate = !isNaN(date.getTime());
  const hasValidFormat = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr);
  return isValidDate && hasValidFormat;
};

// Base transaction schema for all agents with comprehensive validation
export const TransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID cannot be empty'),
  date: z.string()
    .refine(validateDateString, 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY')
    .transform((dateStr) => {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0]; // Normalize to YYYY-MM-DD
    }),
  description: z.string().min(1, 'Description cannot be empty').max(500, 'Description too long'),
  amount: z.number().finite('Amount must be a finite number').min(-10000000, 'Amount too low').max(10000000, 'Amount too high'),
  category: z.string().optional(),
  account: z.string().min(1, 'Account cannot be empty'),
  type: z.enum(['income', 'expense', 'transfer']),
  materiality_score: z.number().min(0).max(1), // Precomputed materiality score
}).refine((data) => {
  // Additional validation: negative amounts should be expenses or transfers
  if (data.amount < 0 && data.type === 'income') {
    throw new Error('Negative amounts cannot be income transactions');
  }
  return true;
}, {
  message: 'Negative amounts must be expense or transfer transactions',
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

// 1. SMB Explainer Agent Schemas with edge case handling
export const SMBExplainerInputSchema = z.object({
  business_name: z.string().min(1, 'Business name cannot be empty').max(100, 'Business name too long'),
  month: z.string().min(1, 'Month cannot be empty').max(20, 'Month string too long'),
  year: z.number().min(1900, 'Year too old').max(2100, 'Year too far in future'),
  rollups: z.object({
    total_income: z.number().min(0, 'Total income cannot be negative'),
    total_expenses: z.number().min(0, 'Total expenses cannot be negative'),
    net_income: z.number(), // Can be negative
    top_categories: z.array(
      z.object({
        category: z.string().min(1, 'Category cannot be empty'),
        amount: z.number().min(0, 'Category amount cannot be negative'),
        percentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100'),
      })
    ).min(1, 'Must have at least one category').max(10, 'Too many categories'),
  }),
  exemplar_transactions: z.array(TransactionSchema)
    .min(0, 'Cannot have negative transactions')
    .max(10, 'Too many exemplar transactions')
    .refine((transactions) => {
      // Remove duplicates based on transaction ID
      const ids = transactions.map(t => t.id);
      return ids.length === new Set(ids).size;
    }, 'Duplicate transaction IDs found'),
  previous_month_comparison: z.object({
    income_change: z.number(), // Can be negative
    expense_change: z.number(), // Can be negative
    net_change: z.number(), // Can be negative
  }),
}).refine((data) => {
  // Validate that rollup calculations are approximately correct
  const calculatedNet = data.rollups.total_income - data.rollups.total_expenses;
  const difference = Math.abs(calculatedNet - data.rollups.net_income);
  const tolerance = Math.abs(calculatedNet) * 0.01; // 1% tolerance
  return difference <= tolerance;
}, {
  message: 'Rollup calculations do not match (net_income should equal total_income - total_expenses)',
});

export const SMBExplainerResponseSchema = HedgiResponseSchema.extend({
  data: z.object({
    summary: z.string(),
    key_insights: z.array(z.string()),
    recommendations: z.array(z.string()),
    financial_health_score: z.number().min(0).max(100),
  }),
});

// 2. Audit & Push Agent Schemas with comprehensive edge case handling
export const AuditPushInputSchema = z.object({
  transactions: z.array(TransactionSchema)
    .min(0, 'Cannot have negative transactions')
    .max(1500, 'Too many transactions (max 1500)')
    .refine((transactions) => {
      // Check for duplicates
      const ids = transactions.map(t => t.id);
      return ids.length === new Set(ids).size;
    }, 'Duplicate transaction IDs found')
    .refine((transactions) => {
      // Ensure we have transactions to process
      return transactions.length > 0;
    }, 'At least one transaction is required'),
  existing_rules: z.array(
    z.object({
      id: z.string().min(1, 'Rule ID cannot be empty'),
      pattern: z.string().min(1, 'Pattern cannot be empty').max(200, 'Pattern too long'),
      category: z.string().min(1, 'Category cannot be empty'),
      confidence: z.number().min(0, 'Confidence cannot be negative').max(1, 'Confidence cannot exceed 1'),
    })
  ).max(100, 'Too many existing rules (max 100)'),
  duplicate_threshold: z.number()
    .min(0, 'Duplicate threshold cannot be negative')
    .max(1, 'Duplicate threshold cannot exceed 1')
    .default(0.9),
  uncategorized_threshold: z.number()
    .min(0, 'Uncategorized threshold cannot be negative')
    .max(1, 'Uncategorized threshold cannot exceed 1')
    .default(0.1),
}).refine((data) => {
  // Validate that thresholds make sense together
  return data.duplicate_threshold >= data.uncategorized_threshold;
}, {
  message: 'Duplicate threshold must be greater than or equal to uncategorized threshold',
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
      id: z.string().min(1, 'Subscription ID cannot be empty'),
      name: z.string().min(1, 'Subscription name cannot be empty').max(100, 'Name too long'),
      amount: z.number().min(0, 'Amount cannot be negative'),
      frequency: z.enum(['monthly', 'quarterly', 'annually']),
      category: z.string().min(1, 'Category cannot be empty'),
      last_used: z.string().optional().refine((dateStr) => {
        if (!dateStr) return true;
        return validateDateString(dateStr);
      }, 'Invalid last_used date format'),
      auto_renew: z.boolean(),
    })
  )
    .min(1, 'At least one subscription is required')
    .max(200, 'Too many subscriptions (max 200)')
    .refine((subscriptions) => {
      // Check for duplicates
      const ids = subscriptions.map(s => s.id);
      return ids.length === new Set(ids).size;
    }, 'Duplicate subscription IDs found'),
  historical_pricing: z.array(
    z.object({
      subscription_id: z.string().min(1, 'Subscription ID cannot be empty'),
      date: z.string().refine(validateDateString, 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY'),
      amount: z.number().min(0, 'Amount cannot be negative'),
    })
  ).max(1000, 'Too many historical pricing records (max 1000)'),
  usage_data: z.array(
    z.object({
      subscription_id: z.string().min(1, 'Subscription ID cannot be empty'),
      last_activity: z.string().refine(validateDateString, 'Invalid last_activity date format'),
      usage_frequency: z.enum([
        'daily',
        'weekly',
        'monthly',
        'rarely',
        'never',
      ]),
    })
  ).max(200, 'Too many usage data records (max 200)'),
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
  current_cash: z.number().min(0, 'Current cash cannot be negative'),
  time_period: z.object({
    start_date: z.string().refine(validateDateString, 'Invalid start_date format'),
    end_date: z.string().refine(validateDateString, 'Invalid end_date format'),
  }).refine((data) => {
    return new Date(data.start_date) <= new Date(data.end_date);
  }, {
    message: 'Start date must be before or equal to end date',
  }),
  cash_flows: z.array(
    z.object({
      date: z.string().refine(validateDateString, 'Invalid cash flow date format'),
      type: z.enum(['inflow', 'outflow']),
      amount: z.number().min(0, 'Cash flow amount cannot be negative'),
      category: z.string().min(1, 'Category cannot be empty'),
      description: z.string().min(1, 'Description cannot be empty').max(200, 'Description too long'),
      confidence: z.number().min(0, 'Confidence cannot be negative').max(1, 'Confidence cannot exceed 1'),
    })
  )
    .min(0, 'Cannot have negative cash flows')
    .max(1000, 'Too many cash flows (max 1000)')
    .refine((flows) => {
      // Check for duplicates based on date, type, amount, and category
      const duplicates = new Set();
      flows.forEach(flow => {
        const key = `${flow.date}-${flow.type}-${flow.amount}-${flow.category}`;
        duplicates.add(key);
      });
      return duplicates.size === flows.length;
    }, 'Duplicate cash flows found'),
  recurring_patterns: z.array(
    z.object({
      category: z.string().min(1, 'Category cannot be empty'),
      amount: z.number().min(0, 'Amount cannot be negative'),
      frequency: z.enum([
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'annually',
      ]),
      next_occurrence: z.string().refine(validateDateString, 'Invalid next_occurrence date format'),
    })
  ).max(100, 'Too many recurring patterns (max 100)'),
}).refine((data) => {
  // Validate that time period makes sense
  const start = new Date(data.time_period.start_date);
  const end = new Date(data.time_period.end_date);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff >= 0 && daysDiff <= 365;
}, {
  message: 'Time period must be between 0 and 365 days',
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
