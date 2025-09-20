"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSchemas = exports.CashFlowRunwayResponseSchema = exports.CashFlowRunwayInputSchema = exports.SavingsFinderResponseSchema = exports.SavingsFinderInputSchema = exports.AuditPushResponseSchema = exports.AuditPushInputSchema = exports.SMBExplainerResponseSchema = exports.SMBExplainerInputSchema = exports.HedgiResponseSchema = exports.TransactionSchema = void 0;
const zod_1 = require("zod");
// Helper function to validate date strings
const validateDateString = (dateStr) => {
    const date = new Date(dateStr);
    const isValidDate = !isNaN(date.getTime());
    const hasValidFormat = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr);
    return isValidDate && hasValidFormat;
};
// Base transaction schema for all agents with comprehensive validation
exports.TransactionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Transaction ID cannot be empty'),
    date: zod_1.z.string()
        .refine(validateDateString, 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY')
        .transform((dateStr) => {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0]; // Normalize to YYYY-MM-DD
    }),
    description: zod_1.z.string().min(1, 'Description cannot be empty').max(500, 'Description too long'),
    amount: zod_1.z.number().finite('Amount must be a finite number').min(-10000000, 'Amount too low').max(10000000, 'Amount too high'),
    category: zod_1.z.string().optional(),
    account: zod_1.z.string().min(1, 'Account cannot be empty'),
    type: zod_1.z.enum(['income', 'expense', 'transfer']),
    materiality_score: zod_1.z.number().min(0).max(1), // Precomputed materiality score
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
// 1. SMB Explainer Agent Schemas with edge case handling
exports.SMBExplainerInputSchema = zod_1.z.object({
    business_name: zod_1.z.string().min(1, 'Business name cannot be empty').max(100, 'Business name too long'),
    month: zod_1.z.string().min(1, 'Month cannot be empty').max(20, 'Month string too long'),
    year: zod_1.z.number().min(1900, 'Year too old').max(2100, 'Year too far in future'),
    rollups: zod_1.z.object({
        total_income: zod_1.z.number().min(0, 'Total income cannot be negative'),
        total_expenses: zod_1.z.number().min(0, 'Total expenses cannot be negative'),
        net_income: zod_1.z.number(), // Can be negative
        top_categories: zod_1.z.array(zod_1.z.object({
            category: zod_1.z.string().min(1, 'Category cannot be empty'),
            amount: zod_1.z.number().min(0, 'Category amount cannot be negative'),
            percentage: zod_1.z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100'),
        })).min(1, 'Must have at least one category').max(10, 'Too many categories'),
    }),
    exemplar_transactions: zod_1.z.array(exports.TransactionSchema)
        .min(0, 'Cannot have negative transactions')
        .max(10, 'Too many exemplar transactions')
        .refine((transactions) => {
        // Remove duplicates based on transaction ID
        const ids = transactions.map(t => t.id);
        return ids.length === new Set(ids).size;
    }, 'Duplicate transaction IDs found'),
    previous_month_comparison: zod_1.z.object({
        income_change: zod_1.z.number(), // Can be negative
        expense_change: zod_1.z.number(), // Can be negative
        net_change: zod_1.z.number(), // Can be negative
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
exports.SMBExplainerResponseSchema = exports.HedgiResponseSchema.extend({
    data: zod_1.z.object({
        summary: zod_1.z.string(),
        key_insights: zod_1.z.array(zod_1.z.string()),
        recommendations: zod_1.z.array(zod_1.z.string()),
        financial_health_score: zod_1.z.number().min(0).max(100),
    }),
});
// 2. Audit & Push Agent Schemas with comprehensive edge case handling
exports.AuditPushInputSchema = zod_1.z.object({
    transactions: zod_1.z.array(exports.TransactionSchema)
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
    existing_rules: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1, 'Rule ID cannot be empty'),
        pattern: zod_1.z.string().min(1, 'Pattern cannot be empty').max(200, 'Pattern too long'),
        category: zod_1.z.string().min(1, 'Category cannot be empty'),
        confidence: zod_1.z.number().min(0, 'Confidence cannot be negative').max(1, 'Confidence cannot exceed 1'),
    })).max(100, 'Too many existing rules (max 100)'),
    duplicate_threshold: zod_1.z.number()
        .min(0, 'Duplicate threshold cannot be negative')
        .max(1, 'Duplicate threshold cannot exceed 1')
        .default(0.9),
    uncategorized_threshold: zod_1.z.number()
        .min(0, 'Uncategorized threshold cannot be negative')
        .max(1, 'Uncategorized threshold cannot exceed 1')
        .default(0.1),
}).refine((data) => {
    // Validate that thresholds make sense together
    return data.duplicate_threshold >= data.uncategorized_threshold;
}, {
    message: 'Duplicate threshold must be greater than or equal to uncategorized threshold',
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
        id: zod_1.z.string().min(1, 'Subscription ID cannot be empty'),
        name: zod_1.z.string().min(1, 'Subscription name cannot be empty').max(100, 'Name too long'),
        amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
        frequency: zod_1.z.enum(['monthly', 'quarterly', 'annually']),
        category: zod_1.z.string().min(1, 'Category cannot be empty'),
        last_used: zod_1.z.string().optional().refine((dateStr) => {
            if (!dateStr)
                return true;
            return validateDateString(dateStr);
        }, 'Invalid last_used date format'),
        auto_renew: zod_1.z.boolean(),
    }))
        .min(1, 'At least one subscription is required')
        .max(200, 'Too many subscriptions (max 200)')
        .refine((subscriptions) => {
        // Check for duplicates
        const ids = subscriptions.map(s => s.id);
        return ids.length === new Set(ids).size;
    }, 'Duplicate subscription IDs found'),
    historical_pricing: zod_1.z.array(zod_1.z.object({
        subscription_id: zod_1.z.string().min(1, 'Subscription ID cannot be empty'),
        date: zod_1.z.string().refine(validateDateString, 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY'),
        amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
    })).max(1000, 'Too many historical pricing records (max 1000)'),
    usage_data: zod_1.z.array(zod_1.z.object({
        subscription_id: zod_1.z.string().min(1, 'Subscription ID cannot be empty'),
        last_activity: zod_1.z.string().refine(validateDateString, 'Invalid last_activity date format'),
        usage_frequency: zod_1.z.enum([
            'daily',
            'weekly',
            'monthly',
            'rarely',
            'never',
        ]),
    })).max(200, 'Too many usage data records (max 200)'),
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
    current_cash: zod_1.z.number().min(0, 'Current cash cannot be negative'),
    time_period: zod_1.z.object({
        start_date: zod_1.z.string().refine(validateDateString, 'Invalid start_date format'),
        end_date: zod_1.z.string().refine(validateDateString, 'Invalid end_date format'),
    }).refine((data) => {
        return new Date(data.start_date) <= new Date(data.end_date);
    }, {
        message: 'Start date must be before or equal to end date',
    }),
    cash_flows: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string().refine(validateDateString, 'Invalid cash flow date format'),
        type: zod_1.z.enum(['inflow', 'outflow']),
        amount: zod_1.z.number().min(0, 'Cash flow amount cannot be negative'),
        category: zod_1.z.string().min(1, 'Category cannot be empty'),
        description: zod_1.z.string().min(1, 'Description cannot be empty').max(200, 'Description too long'),
        confidence: zod_1.z.number().min(0, 'Confidence cannot be negative').max(1, 'Confidence cannot exceed 1'),
    }))
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
    recurring_patterns: zod_1.z.array(zod_1.z.object({
        category: zod_1.z.string().min(1, 'Category cannot be empty'),
        amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
        frequency: zod_1.z.enum([
            'daily',
            'weekly',
            'monthly',
            'quarterly',
            'annually',
        ]),
        next_occurrence: zod_1.z.string().refine(validateDateString, 'Invalid next_occurrence date format'),
    })).max(100, 'Too many recurring patterns (max 100)'),
}).refine((data) => {
    // Validate that time period makes sense
    const start = new Date(data.time_period.start_date);
    const end = new Date(data.time_period.end_date);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 365;
}, {
    message: 'Time period must be between 0 and 365 days',
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