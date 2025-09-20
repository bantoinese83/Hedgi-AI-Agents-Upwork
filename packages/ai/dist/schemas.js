"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSchemas = exports.CashFlowRunwayResponseSchema = exports.CashFlowRunwayInputSchema = exports.SavingsFinderResponseSchema = exports.SavingsFinderInputSchema = exports.AuditPushResponseSchema = exports.AuditPushInputSchema = exports.SMBExplainerResponseSchema = exports.SMBExplainerInputSchema = exports.HedgiResponseSchema = exports.TransactionSchema = void 0;
const zod_1 = require("zod");
// Base transaction schema for all agents
exports.TransactionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    date: zod_1.z.string(),
    description: zod_1.z.string(),
    amount: zod_1.z.number(),
    category: zod_1.z.string().optional(),
    account: zod_1.z.string(),
    type: zod_1.z.enum(['income', 'expense', 'transfer']),
    materiality_score: zod_1.z.number().min(0).max(1), // Precomputed materiality score
});
// Base HedgiResponse schema that all agents must return
exports.HedgiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.record(zod_1.z.any()),
    metadata: zod_1.z.object({
        agent: zod_1.z.string(),
        timestamp: zod_1.z.string(),
        processing_time_ms: zod_1.z.number(),
        token_usage: zod_1.z.object({
            prompt_tokens: zod_1.z.number(),
            completion_tokens: zod_1.z.number(),
            total_tokens: zod_1.z.number(),
        }),
    }),
    error: zod_1.z.string().optional(),
});
// 1. SMB Explainer Agent Schemas
exports.SMBExplainerInputSchema = zod_1.z.object({
    business_name: zod_1.z.string(),
    month: zod_1.z.string(),
    year: zod_1.z.number(),
    rollups: zod_1.z.object({
        total_income: zod_1.z.number(),
        total_expenses: zod_1.z.number(),
        net_income: zod_1.z.number(),
        top_categories: zod_1.z.array(zod_1.z.object({
            category: zod_1.z.string(),
            amount: zod_1.z.number(),
            percentage: zod_1.z.number(),
        })),
    }),
    exemplar_transactions: zod_1.z.array(exports.TransactionSchema).max(10),
    previous_month_comparison: zod_1.z.object({
        income_change: zod_1.z.number(),
        expense_change: zod_1.z.number(),
        net_change: zod_1.z.number(),
    }),
});
exports.SMBExplainerResponseSchema = exports.HedgiResponseSchema.extend({
    data: zod_1.z.object({
        summary: zod_1.z.string(),
        key_insights: zod_1.z.array(zod_1.z.string()),
        recommendations: zod_1.z.array(zod_1.z.string()),
        financial_health_score: zod_1.z.number().min(0).max(100),
    }),
});
// 2. Audit & Push Agent Schemas
exports.AuditPushInputSchema = zod_1.z.object({
    transactions: zod_1.z.array(exports.TransactionSchema).max(1500),
    existing_rules: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        pattern: zod_1.z.string(),
        category: zod_1.z.string(),
        confidence: zod_1.z.number(),
    })),
    duplicate_threshold: zod_1.z.number().default(0.9),
    uncategorized_threshold: zod_1.z.number().default(0.1),
});
exports.AuditPushResponseSchema = exports.HedgiResponseSchema.extend({
    data: zod_1.z.object({
        issues: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.enum(['uncategorized', 'misclassified', 'duplicate']),
            transaction_ids: zod_1.z.array(zod_1.z.string()),
            confidence: zod_1.z.number(),
            description: zod_1.z.string(),
            suggested_fix: zod_1.z.string(),
        })),
        proposed_rules: zod_1.z.array(zod_1.z.object({
            pattern: zod_1.z.string(),
            category: zod_1.z.string(),
            confidence: zod_1.z.number(),
            impact_transactions: zod_1.z.number(),
        })),
        journal_entries: zod_1.z.array(zod_1.z.object({
            description: zod_1.z.string(),
            debits: zod_1.z.array(zod_1.z.object({
                account: zod_1.z.string(),
                amount: zod_1.z.number(),
            })),
            credits: zod_1.z.array(zod_1.z.object({
                account: zod_1.z.string(),
                amount: zod_1.z.number(),
            })),
            impact_amount: zod_1.z.number(),
        })),
        total_impact: zod_1.z.number(),
    }),
});
// 3. Savings Finder Agent Schemas
exports.SavingsFinderInputSchema = zod_1.z.object({
    subscriptions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        amount: zod_1.z.number(),
        frequency: zod_1.z.enum(['monthly', 'quarterly', 'annually']),
        category: zod_1.z.string(),
        last_used: zod_1.z.string().optional(),
        auto_renew: zod_1.z.boolean(),
    })),
    historical_pricing: zod_1.z.array(zod_1.z.object({
        subscription_id: zod_1.z.string(),
        date: zod_1.z.string(),
        amount: zod_1.z.number(),
    })),
    usage_data: zod_1.z.array(zod_1.z.object({
        subscription_id: zod_1.z.string(),
        last_activity: zod_1.z.string(),
        usage_frequency: zod_1.z.enum([
            'daily',
            'weekly',
            'monthly',
            'rarely',
            'never',
        ]),
    })),
});
exports.SavingsFinderResponseSchema = exports.HedgiResponseSchema.extend({
    data: zod_1.z.object({
        flagged_subscriptions: zod_1.z.array(zod_1.z.object({
            subscription_id: zod_1.z.string(),
            issue_type: zod_1.z.enum(['price_hike', 'duplicate', 'unused', 'overpriced']),
            current_cost: zod_1.z.number(),
            potential_savings: zod_1.z.number(),
            recommendation: zod_1.z.string(),
            confidence: zod_1.z.number(),
        })),
        total_potential_savings: zod_1.z.number(),
        monthly_savings: zod_1.z.number(),
        annual_savings: zod_1.z.number(),
        action_items: zod_1.z.array(zod_1.z.string()),
    }),
});
// 4. Cash-Flow Runway Agent Schemas
exports.CashFlowRunwayInputSchema = zod_1.z.object({
    current_cash: zod_1.z.number(),
    time_period: zod_1.z.object({
        start_date: zod_1.z.string(),
        end_date: zod_1.z.string(),
    }),
    cash_flows: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string(),
        type: zod_1.z.enum(['inflow', 'outflow']),
        amount: zod_1.z.number(),
        category: zod_1.z.string(),
        description: zod_1.z.string(),
        confidence: zod_1.z.number(), // For projected vs actual
    })),
    recurring_patterns: zod_1.z.array(zod_1.z.object({
        category: zod_1.z.string(),
        amount: zod_1.z.number(),
        frequency: zod_1.z.enum([
            'daily',
            'weekly',
            'monthly',
            'quarterly',
            'annually',
        ]),
        next_occurrence: zod_1.z.string(),
    })),
});
exports.CashFlowRunwayResponseSchema = exports.HedgiResponseSchema.extend({
    data: zod_1.z.object({
        cash_bridge: zod_1.z.array(zod_1.z.object({
            date: zod_1.z.string(),
            opening_balance: zod_1.z.number(),
            inflows: zod_1.z.number(),
            outflows: zod_1.z.number(),
            net_change: zod_1.z.number(),
            closing_balance: zod_1.z.number(),
        })),
        burn_rate: zod_1.z.object({
            monthly: zod_1.z.number(),
            daily: zod_1.z.number(),
        }),
        runway_months: zod_1.z.number(),
        runway_date: zod_1.z.string(),
        top_outflows: zod_1.z.array(zod_1.z.object({
            category: zod_1.z.string(),
            amount: zod_1.z.number(),
            percentage: zod_1.z.number(),
        })),
        risk_factors: zod_1.z.array(zod_1.z.string()),
        recommendations: zod_1.z.array(zod_1.z.string()),
    }),
});
exports.AgentSchemas = {
    'smb-explainer': {
        input: exports.SMBExplainerInputSchema,
        response: exports.SMBExplainerResponseSchema,
    },
    'audit-push': {
        input: exports.AuditPushInputSchema,
        response: exports.AuditPushResponseSchema,
    },
    'savings-finder': {
        input: exports.SavingsFinderInputSchema,
        response: exports.SavingsFinderResponseSchema,
    },
    'cash-flow-runway': {
        input: exports.CashFlowRunwayInputSchema,
        response: exports.CashFlowRunwayResponseSchema,
    },
};
//# sourceMappingURL=schemas.js.map