import { z } from 'zod';
export declare const TransactionSchema: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodString;
    description: z.ZodString;
    amount: z.ZodNumber;
    category: z.ZodOptional<z.ZodString>;
    account: z.ZodString;
    type: z.ZodEnum<["income", "expense", "transfer"]>;
    materiality_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    date: string;
    description: string;
    amount: number;
    account: string;
    type: "income" | "expense" | "transfer";
    materiality_score: number;
    category?: string | undefined;
}, {
    id: string;
    date: string;
    description: string;
    amount: number;
    account: string;
    type: "income" | "expense" | "transfer";
    materiality_score: number;
    category?: string | undefined;
}>;
export declare const HedgiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    metadata: z.ZodObject<{
        agent: z.ZodString;
        timestamp: z.ZodString;
        processing_time_ms: z.ZodNumber;
        token_usage: z.ZodObject<{
            prompt_tokens: z.ZodNumber;
            completion_tokens: z.ZodNumber;
            total_tokens: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: Record<string, any>;
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}, {
    success: boolean;
    data: Record<string, any>;
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}>;
export declare const SMBExplainerInputSchema: z.ZodObject<{
    business_name: z.ZodString;
    month: z.ZodString;
    year: z.ZodNumber;
    rollups: z.ZodObject<{
        total_income: z.ZodNumber;
        total_expenses: z.ZodNumber;
        net_income: z.ZodNumber;
        top_categories: z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            amount: z.ZodNumber;
            percentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            amount: number;
            category: string;
            percentage: number;
        }, {
            amount: number;
            category: string;
            percentage: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        total_income: number;
        total_expenses: number;
        net_income: number;
        top_categories: {
            amount: number;
            category: string;
            percentage: number;
        }[];
    }, {
        total_income: number;
        total_expenses: number;
        net_income: number;
        top_categories: {
            amount: number;
            category: string;
            percentage: number;
        }[];
    }>;
    exemplar_transactions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        date: z.ZodString;
        description: z.ZodString;
        amount: z.ZodNumber;
        category: z.ZodOptional<z.ZodString>;
        account: z.ZodString;
        type: z.ZodEnum<["income", "expense", "transfer"]>;
        materiality_score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        type: "income" | "expense" | "transfer";
        materiality_score: number;
        category?: string | undefined;
    }, {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        type: "income" | "expense" | "transfer";
        materiality_score: number;
        category?: string | undefined;
    }>, "many">;
    previous_month_comparison: z.ZodObject<{
        income_change: z.ZodNumber;
        expense_change: z.ZodNumber;
        net_change: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        income_change: number;
        expense_change: number;
        net_change: number;
    }, {
        income_change: number;
        expense_change: number;
        net_change: number;
    }>;
}, "strip", z.ZodTypeAny, {
    business_name: string;
    month: string;
    year: number;
    rollups: {
        total_income: number;
        total_expenses: number;
        net_income: number;
        top_categories: {
            amount: number;
            category: string;
            percentage: number;
        }[];
    };
    exemplar_transactions: {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        type: "income" | "expense" | "transfer";
        materiality_score: number;
        category?: string | undefined;
    }[];
    previous_month_comparison: {
        income_change: number;
        expense_change: number;
        net_change: number;
    };
}, {
    business_name: string;
    month: string;
    year: number;
    rollups: {
        total_income: number;
        total_expenses: number;
        net_income: number;
        top_categories: {
            amount: number;
            category: string;
            percentage: number;
        }[];
    };
    exemplar_transactions: {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        type: "income" | "expense" | "transfer";
        materiality_score: number;
        category?: string | undefined;
    }[];
    previous_month_comparison: {
        income_change: number;
        expense_change: number;
        net_change: number;
    };
}>;
export declare const SMBExplainerResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    metadata: z.ZodObject<{
        agent: z.ZodString;
        timestamp: z.ZodString;
        processing_time_ms: z.ZodNumber;
        token_usage: z.ZodObject<{
            prompt_tokens: z.ZodNumber;
            completion_tokens: z.ZodNumber;
            total_tokens: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodObject<{
        summary: z.ZodString;
        key_insights: z.ZodArray<z.ZodString, "many">;
        recommendations: z.ZodArray<z.ZodString, "many">;
        financial_health_score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        key_insights: string[];
        recommendations: string[];
        financial_health_score: number;
    }, {
        summary: string;
        key_insights: string[];
        recommendations: string[];
        financial_health_score: number;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: {
        summary: string;
        key_insights: string[];
        recommendations: string[];
        financial_health_score: number;
    };
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}, {
    success: boolean;
    data: {
        summary: string;
        key_insights: string[];
        recommendations: string[];
        financial_health_score: number;
    };
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}>;
export declare const AuditPushInputSchema: z.ZodObject<{
    transactions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        date: z.ZodString;
        description: z.ZodString;
        amount: z.ZodNumber;
        category: z.ZodOptional<z.ZodString>;
        account: z.ZodString;
        type: z.ZodEnum<["income", "expense", "transfer"]>;
        materiality_score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        type: "income" | "expense" | "transfer";
        materiality_score: number;
        category?: string | undefined;
    }, {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        type: "income" | "expense" | "transfer";
        materiality_score: number;
        category?: string | undefined;
    }>, "many">;
    existing_rules: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        pattern: z.ZodString;
        category: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        category: string;
        pattern: string;
        confidence: number;
    }, {
        id: string;
        category: string;
        pattern: string;
        confidence: number;
    }>, "many">;
    duplicate_threshold: z.ZodDefault<z.ZodNumber>;
    uncategorized_threshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    transactions: {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        type: "income" | "expense" | "transfer";
        materiality_score: number;
        category?: string | undefined;
    }[];
    existing_rules: {
        id: string;
        category: string;
        pattern: string;
        confidence: number;
    }[];
    duplicate_threshold: number;
    uncategorized_threshold: number;
}, {
    transactions: {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        type: "income" | "expense" | "transfer";
        materiality_score: number;
        category?: string | undefined;
    }[];
    existing_rules: {
        id: string;
        category: string;
        pattern: string;
        confidence: number;
    }[];
    duplicate_threshold?: number | undefined;
    uncategorized_threshold?: number | undefined;
}>;
export declare const AuditPushResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    metadata: z.ZodObject<{
        agent: z.ZodString;
        timestamp: z.ZodString;
        processing_time_ms: z.ZodNumber;
        token_usage: z.ZodObject<{
            prompt_tokens: z.ZodNumber;
            completion_tokens: z.ZodNumber;
            total_tokens: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodObject<{
        issues: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["uncategorized", "misclassified", "duplicate"]>;
            transaction_ids: z.ZodArray<z.ZodString, "many">;
            confidence: z.ZodNumber;
            description: z.ZodString;
            suggested_fix: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            type: "uncategorized" | "misclassified" | "duplicate";
            confidence: number;
            transaction_ids: string[];
            suggested_fix: string;
        }, {
            description: string;
            type: "uncategorized" | "misclassified" | "duplicate";
            confidence: number;
            transaction_ids: string[];
            suggested_fix: string;
        }>, "many">;
        proposed_rules: z.ZodArray<z.ZodObject<{
            pattern: z.ZodString;
            category: z.ZodString;
            confidence: z.ZodNumber;
            impact_transactions: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            category: string;
            pattern: string;
            confidence: number;
            impact_transactions: number;
        }, {
            category: string;
            pattern: string;
            confidence: number;
            impact_transactions: number;
        }>, "many">;
        journal_entries: z.ZodArray<z.ZodObject<{
            description: z.ZodString;
            debits: z.ZodArray<z.ZodObject<{
                account: z.ZodString;
                amount: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                amount: number;
                account: string;
            }, {
                amount: number;
                account: string;
            }>, "many">;
            credits: z.ZodArray<z.ZodObject<{
                account: z.ZodString;
                amount: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                amount: number;
                account: string;
            }, {
                amount: number;
                account: string;
            }>, "many">;
            impact_amount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            description: string;
            debits: {
                amount: number;
                account: string;
            }[];
            credits: {
                amount: number;
                account: string;
            }[];
            impact_amount: number;
        }, {
            description: string;
            debits: {
                amount: number;
                account: string;
            }[];
            credits: {
                amount: number;
                account: string;
            }[];
            impact_amount: number;
        }>, "many">;
        total_impact: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        issues: {
            description: string;
            type: "uncategorized" | "misclassified" | "duplicate";
            confidence: number;
            transaction_ids: string[];
            suggested_fix: string;
        }[];
        proposed_rules: {
            category: string;
            pattern: string;
            confidence: number;
            impact_transactions: number;
        }[];
        journal_entries: {
            description: string;
            debits: {
                amount: number;
                account: string;
            }[];
            credits: {
                amount: number;
                account: string;
            }[];
            impact_amount: number;
        }[];
        total_impact: number;
    }, {
        issues: {
            description: string;
            type: "uncategorized" | "misclassified" | "duplicate";
            confidence: number;
            transaction_ids: string[];
            suggested_fix: string;
        }[];
        proposed_rules: {
            category: string;
            pattern: string;
            confidence: number;
            impact_transactions: number;
        }[];
        journal_entries: {
            description: string;
            debits: {
                amount: number;
                account: string;
            }[];
            credits: {
                amount: number;
                account: string;
            }[];
            impact_amount: number;
        }[];
        total_impact: number;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: {
        issues: {
            description: string;
            type: "uncategorized" | "misclassified" | "duplicate";
            confidence: number;
            transaction_ids: string[];
            suggested_fix: string;
        }[];
        proposed_rules: {
            category: string;
            pattern: string;
            confidence: number;
            impact_transactions: number;
        }[];
        journal_entries: {
            description: string;
            debits: {
                amount: number;
                account: string;
            }[];
            credits: {
                amount: number;
                account: string;
            }[];
            impact_amount: number;
        }[];
        total_impact: number;
    };
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}, {
    success: boolean;
    data: {
        issues: {
            description: string;
            type: "uncategorized" | "misclassified" | "duplicate";
            confidence: number;
            transaction_ids: string[];
            suggested_fix: string;
        }[];
        proposed_rules: {
            category: string;
            pattern: string;
            confidence: number;
            impact_transactions: number;
        }[];
        journal_entries: {
            description: string;
            debits: {
                amount: number;
                account: string;
            }[];
            credits: {
                amount: number;
                account: string;
            }[];
            impact_amount: number;
        }[];
        total_impact: number;
    };
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}>;
export declare const SavingsFinderInputSchema: z.ZodObject<{
    subscriptions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        amount: z.ZodNumber;
        frequency: z.ZodEnum<["monthly", "quarterly", "annually"]>;
        category: z.ZodString;
        last_used: z.ZodOptional<z.ZodString>;
        auto_renew: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        amount: number;
        category: string;
        name: string;
        frequency: "monthly" | "quarterly" | "annually";
        auto_renew: boolean;
        last_used?: string | undefined;
    }, {
        id: string;
        amount: number;
        category: string;
        name: string;
        frequency: "monthly" | "quarterly" | "annually";
        auto_renew: boolean;
        last_used?: string | undefined;
    }>, "many">;
    historical_pricing: z.ZodArray<z.ZodObject<{
        subscription_id: z.ZodString;
        date: z.ZodString;
        amount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: string;
        amount: number;
        subscription_id: string;
    }, {
        date: string;
        amount: number;
        subscription_id: string;
    }>, "many">;
    usage_data: z.ZodArray<z.ZodObject<{
        subscription_id: z.ZodString;
        last_activity: z.ZodString;
        usage_frequency: z.ZodEnum<["daily", "weekly", "monthly", "rarely", "never"]>;
    }, "strip", z.ZodTypeAny, {
        subscription_id: string;
        last_activity: string;
        usage_frequency: "never" | "monthly" | "daily" | "weekly" | "rarely";
    }, {
        subscription_id: string;
        last_activity: string;
        usage_frequency: "never" | "monthly" | "daily" | "weekly" | "rarely";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    subscriptions: {
        id: string;
        amount: number;
        category: string;
        name: string;
        frequency: "monthly" | "quarterly" | "annually";
        auto_renew: boolean;
        last_used?: string | undefined;
    }[];
    historical_pricing: {
        date: string;
        amount: number;
        subscription_id: string;
    }[];
    usage_data: {
        subscription_id: string;
        last_activity: string;
        usage_frequency: "never" | "monthly" | "daily" | "weekly" | "rarely";
    }[];
}, {
    subscriptions: {
        id: string;
        amount: number;
        category: string;
        name: string;
        frequency: "monthly" | "quarterly" | "annually";
        auto_renew: boolean;
        last_used?: string | undefined;
    }[];
    historical_pricing: {
        date: string;
        amount: number;
        subscription_id: string;
    }[];
    usage_data: {
        subscription_id: string;
        last_activity: string;
        usage_frequency: "never" | "monthly" | "daily" | "weekly" | "rarely";
    }[];
}>;
export declare const SavingsFinderResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    metadata: z.ZodObject<{
        agent: z.ZodString;
        timestamp: z.ZodString;
        processing_time_ms: z.ZodNumber;
        token_usage: z.ZodObject<{
            prompt_tokens: z.ZodNumber;
            completion_tokens: z.ZodNumber;
            total_tokens: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodObject<{
        flagged_subscriptions: z.ZodArray<z.ZodObject<{
            subscription_id: z.ZodString;
            issue_type: z.ZodEnum<["price_hike", "duplicate", "unused", "overpriced"]>;
            current_cost: z.ZodNumber;
            potential_savings: z.ZodNumber;
            recommendation: z.ZodString;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            subscription_id: string;
            issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
            current_cost: number;
            potential_savings: number;
            recommendation: string;
        }, {
            confidence: number;
            subscription_id: string;
            issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
            current_cost: number;
            potential_savings: number;
            recommendation: string;
        }>, "many">;
        total_potential_savings: z.ZodNumber;
        monthly_savings: z.ZodNumber;
        annual_savings: z.ZodNumber;
        action_items: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        flagged_subscriptions: {
            confidence: number;
            subscription_id: string;
            issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
            current_cost: number;
            potential_savings: number;
            recommendation: string;
        }[];
        total_potential_savings: number;
        monthly_savings: number;
        annual_savings: number;
        action_items: string[];
    }, {
        flagged_subscriptions: {
            confidence: number;
            subscription_id: string;
            issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
            current_cost: number;
            potential_savings: number;
            recommendation: string;
        }[];
        total_potential_savings: number;
        monthly_savings: number;
        annual_savings: number;
        action_items: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: {
        flagged_subscriptions: {
            confidence: number;
            subscription_id: string;
            issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
            current_cost: number;
            potential_savings: number;
            recommendation: string;
        }[];
        total_potential_savings: number;
        monthly_savings: number;
        annual_savings: number;
        action_items: string[];
    };
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}, {
    success: boolean;
    data: {
        flagged_subscriptions: {
            confidence: number;
            subscription_id: string;
            issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
            current_cost: number;
            potential_savings: number;
            recommendation: string;
        }[];
        total_potential_savings: number;
        monthly_savings: number;
        annual_savings: number;
        action_items: string[];
    };
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}>;
export declare const CashFlowRunwayInputSchema: z.ZodObject<{
    current_cash: z.ZodNumber;
    time_period: z.ZodObject<{
        start_date: z.ZodString;
        end_date: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start_date: string;
        end_date: string;
    }, {
        start_date: string;
        end_date: string;
    }>;
    cash_flows: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        type: z.ZodEnum<["inflow", "outflow"]>;
        amount: z.ZodNumber;
        category: z.ZodString;
        description: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: string;
        description: string;
        amount: number;
        category: string;
        type: "inflow" | "outflow";
        confidence: number;
    }, {
        date: string;
        description: string;
        amount: number;
        category: string;
        type: "inflow" | "outflow";
        confidence: number;
    }>, "many">;
    recurring_patterns: z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        amount: z.ZodNumber;
        frequency: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "annually"]>;
        next_occurrence: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        category: string;
        frequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
        next_occurrence: string;
    }, {
        amount: number;
        category: string;
        frequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
        next_occurrence: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    current_cash: number;
    time_period: {
        start_date: string;
        end_date: string;
    };
    cash_flows: {
        date: string;
        description: string;
        amount: number;
        category: string;
        type: "inflow" | "outflow";
        confidence: number;
    }[];
    recurring_patterns: {
        amount: number;
        category: string;
        frequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
        next_occurrence: string;
    }[];
}, {
    current_cash: number;
    time_period: {
        start_date: string;
        end_date: string;
    };
    cash_flows: {
        date: string;
        description: string;
        amount: number;
        category: string;
        type: "inflow" | "outflow";
        confidence: number;
    }[];
    recurring_patterns: {
        amount: number;
        category: string;
        frequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
        next_occurrence: string;
    }[];
}>;
export declare const CashFlowRunwayResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    metadata: z.ZodObject<{
        agent: z.ZodString;
        timestamp: z.ZodString;
        processing_time_ms: z.ZodNumber;
        token_usage: z.ZodObject<{
            prompt_tokens: z.ZodNumber;
            completion_tokens: z.ZodNumber;
            total_tokens: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }, {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }, {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodObject<{
        cash_bridge: z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            opening_balance: z.ZodNumber;
            inflows: z.ZodNumber;
            outflows: z.ZodNumber;
            net_change: z.ZodNumber;
            closing_balance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            date: string;
            net_change: number;
            opening_balance: number;
            inflows: number;
            outflows: number;
            closing_balance: number;
        }, {
            date: string;
            net_change: number;
            opening_balance: number;
            inflows: number;
            outflows: number;
            closing_balance: number;
        }>, "many">;
        burn_rate: z.ZodObject<{
            monthly: z.ZodNumber;
            daily: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            monthly: number;
            daily: number;
        }, {
            monthly: number;
            daily: number;
        }>;
        runway_months: z.ZodNumber;
        runway_date: z.ZodString;
        top_outflows: z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            amount: z.ZodNumber;
            percentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            amount: number;
            category: string;
            percentage: number;
        }, {
            amount: number;
            category: string;
            percentage: number;
        }>, "many">;
        risk_factors: z.ZodArray<z.ZodString, "many">;
        recommendations: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        recommendations: string[];
        cash_bridge: {
            date: string;
            net_change: number;
            opening_balance: number;
            inflows: number;
            outflows: number;
            closing_balance: number;
        }[];
        burn_rate: {
            monthly: number;
            daily: number;
        };
        runway_months: number;
        runway_date: string;
        top_outflows: {
            amount: number;
            category: string;
            percentage: number;
        }[];
        risk_factors: string[];
    }, {
        recommendations: string[];
        cash_bridge: {
            date: string;
            net_change: number;
            opening_balance: number;
            inflows: number;
            outflows: number;
            closing_balance: number;
        }[];
        burn_rate: {
            monthly: number;
            daily: number;
        };
        runway_months: number;
        runway_date: string;
        top_outflows: {
            amount: number;
            category: string;
            percentage: number;
        }[];
        risk_factors: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: {
        recommendations: string[];
        cash_bridge: {
            date: string;
            net_change: number;
            opening_balance: number;
            inflows: number;
            outflows: number;
            closing_balance: number;
        }[];
        burn_rate: {
            monthly: number;
            daily: number;
        };
        runway_months: number;
        runway_date: string;
        top_outflows: {
            amount: number;
            category: string;
            percentage: number;
        }[];
        risk_factors: string[];
    };
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}, {
    success: boolean;
    data: {
        recommendations: string[];
        cash_bridge: {
            date: string;
            net_change: number;
            opening_balance: number;
            inflows: number;
            outflows: number;
            closing_balance: number;
        }[];
        burn_rate: {
            monthly: number;
            daily: number;
        };
        runway_months: number;
        runway_date: string;
        top_outflows: {
            amount: number;
            category: string;
            percentage: number;
        }[];
        risk_factors: string[];
    };
    metadata: {
        agent: string;
        timestamp: string;
        processing_time_ms: number;
        token_usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    error?: string | undefined;
}>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type HedgiResponse = z.infer<typeof HedgiResponseSchema>;
export type SMBExplainerInput = z.infer<typeof SMBExplainerInputSchema>;
export type SMBExplainerResponse = z.infer<typeof SMBExplainerResponseSchema>;
export type AuditPushInput = z.infer<typeof AuditPushInputSchema>;
export type AuditPushResponse = z.infer<typeof AuditPushResponseSchema>;
export type SavingsFinderInput = z.infer<typeof SavingsFinderInputSchema>;
export type SavingsFinderResponse = z.infer<typeof SavingsFinderResponseSchema>;
export type CashFlowRunwayInput = z.infer<typeof CashFlowRunwayInputSchema>;
export type CashFlowRunwayResponse = z.infer<typeof CashFlowRunwayResponseSchema>;
export type AgentType = 'smb-explainer' | 'audit-push' | 'savings-finder' | 'cash-flow-runway';
export declare const AgentSchemas: {
    readonly 'smb-explainer': {
        readonly input: z.ZodObject<{
            business_name: z.ZodString;
            month: z.ZodString;
            year: z.ZodNumber;
            rollups: z.ZodObject<{
                total_income: z.ZodNumber;
                total_expenses: z.ZodNumber;
                net_income: z.ZodNumber;
                top_categories: z.ZodArray<z.ZodObject<{
                    category: z.ZodString;
                    amount: z.ZodNumber;
                    percentage: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    amount: number;
                    category: string;
                    percentage: number;
                }, {
                    amount: number;
                    category: string;
                    percentage: number;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                total_income: number;
                total_expenses: number;
                net_income: number;
                top_categories: {
                    amount: number;
                    category: string;
                    percentage: number;
                }[];
            }, {
                total_income: number;
                total_expenses: number;
                net_income: number;
                top_categories: {
                    amount: number;
                    category: string;
                    percentage: number;
                }[];
            }>;
            exemplar_transactions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                date: z.ZodString;
                description: z.ZodString;
                amount: z.ZodNumber;
                category: z.ZodOptional<z.ZodString>;
                account: z.ZodString;
                type: z.ZodEnum<["income", "expense", "transfer"]>;
                materiality_score: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                id: string;
                date: string;
                description: string;
                amount: number;
                account: string;
                type: "income" | "expense" | "transfer";
                materiality_score: number;
                category?: string | undefined;
            }, {
                id: string;
                date: string;
                description: string;
                amount: number;
                account: string;
                type: "income" | "expense" | "transfer";
                materiality_score: number;
                category?: string | undefined;
            }>, "many">;
            previous_month_comparison: z.ZodObject<{
                income_change: z.ZodNumber;
                expense_change: z.ZodNumber;
                net_change: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                income_change: number;
                expense_change: number;
                net_change: number;
            }, {
                income_change: number;
                expense_change: number;
                net_change: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            business_name: string;
            month: string;
            year: number;
            rollups: {
                total_income: number;
                total_expenses: number;
                net_income: number;
                top_categories: {
                    amount: number;
                    category: string;
                    percentage: number;
                }[];
            };
            exemplar_transactions: {
                id: string;
                date: string;
                description: string;
                amount: number;
                account: string;
                type: "income" | "expense" | "transfer";
                materiality_score: number;
                category?: string | undefined;
            }[];
            previous_month_comparison: {
                income_change: number;
                expense_change: number;
                net_change: number;
            };
        }, {
            business_name: string;
            month: string;
            year: number;
            rollups: {
                total_income: number;
                total_expenses: number;
                net_income: number;
                top_categories: {
                    amount: number;
                    category: string;
                    percentage: number;
                }[];
            };
            exemplar_transactions: {
                id: string;
                date: string;
                description: string;
                amount: number;
                account: string;
                type: "income" | "expense" | "transfer";
                materiality_score: number;
                category?: string | undefined;
            }[];
            previous_month_comparison: {
                income_change: number;
                expense_change: number;
                net_change: number;
            };
        }>;
        readonly response: z.ZodObject<{
            success: z.ZodBoolean;
            metadata: z.ZodObject<{
                agent: z.ZodString;
                timestamp: z.ZodString;
                processing_time_ms: z.ZodNumber;
                token_usage: z.ZodObject<{
                    prompt_tokens: z.ZodNumber;
                    completion_tokens: z.ZodNumber;
                    total_tokens: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                }, {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            }, {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            }>;
            error: z.ZodOptional<z.ZodString>;
        } & {
            data: z.ZodObject<{
                summary: z.ZodString;
                key_insights: z.ZodArray<z.ZodString, "many">;
                recommendations: z.ZodArray<z.ZodString, "many">;
                financial_health_score: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                summary: string;
                key_insights: string[];
                recommendations: string[];
                financial_health_score: number;
            }, {
                summary: string;
                key_insights: string[];
                recommendations: string[];
                financial_health_score: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            success: boolean;
            data: {
                summary: string;
                key_insights: string[];
                recommendations: string[];
                financial_health_score: number;
            };
            metadata: {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            error?: string | undefined;
        }, {
            success: boolean;
            data: {
                summary: string;
                key_insights: string[];
                recommendations: string[];
                financial_health_score: number;
            };
            metadata: {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            error?: string | undefined;
        }>;
    };
    readonly 'audit-push': {
        readonly input: z.ZodObject<{
            transactions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                date: z.ZodString;
                description: z.ZodString;
                amount: z.ZodNumber;
                category: z.ZodOptional<z.ZodString>;
                account: z.ZodString;
                type: z.ZodEnum<["income", "expense", "transfer"]>;
                materiality_score: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                id: string;
                date: string;
                description: string;
                amount: number;
                account: string;
                type: "income" | "expense" | "transfer";
                materiality_score: number;
                category?: string | undefined;
            }, {
                id: string;
                date: string;
                description: string;
                amount: number;
                account: string;
                type: "income" | "expense" | "transfer";
                materiality_score: number;
                category?: string | undefined;
            }>, "many">;
            existing_rules: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                pattern: z.ZodString;
                category: z.ZodString;
                confidence: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                id: string;
                category: string;
                pattern: string;
                confidence: number;
            }, {
                id: string;
                category: string;
                pattern: string;
                confidence: number;
            }>, "many">;
            duplicate_threshold: z.ZodDefault<z.ZodNumber>;
            uncategorized_threshold: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            transactions: {
                id: string;
                date: string;
                description: string;
                amount: number;
                account: string;
                type: "income" | "expense" | "transfer";
                materiality_score: number;
                category?: string | undefined;
            }[];
            existing_rules: {
                id: string;
                category: string;
                pattern: string;
                confidence: number;
            }[];
            duplicate_threshold: number;
            uncategorized_threshold: number;
        }, {
            transactions: {
                id: string;
                date: string;
                description: string;
                amount: number;
                account: string;
                type: "income" | "expense" | "transfer";
                materiality_score: number;
                category?: string | undefined;
            }[];
            existing_rules: {
                id: string;
                category: string;
                pattern: string;
                confidence: number;
            }[];
            duplicate_threshold?: number | undefined;
            uncategorized_threshold?: number | undefined;
        }>;
        readonly response: z.ZodObject<{
            success: z.ZodBoolean;
            metadata: z.ZodObject<{
                agent: z.ZodString;
                timestamp: z.ZodString;
                processing_time_ms: z.ZodNumber;
                token_usage: z.ZodObject<{
                    prompt_tokens: z.ZodNumber;
                    completion_tokens: z.ZodNumber;
                    total_tokens: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                }, {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            }, {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            }>;
            error: z.ZodOptional<z.ZodString>;
        } & {
            data: z.ZodObject<{
                issues: z.ZodArray<z.ZodObject<{
                    type: z.ZodEnum<["uncategorized", "misclassified", "duplicate"]>;
                    transaction_ids: z.ZodArray<z.ZodString, "many">;
                    confidence: z.ZodNumber;
                    description: z.ZodString;
                    suggested_fix: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    description: string;
                    type: "uncategorized" | "misclassified" | "duplicate";
                    confidence: number;
                    transaction_ids: string[];
                    suggested_fix: string;
                }, {
                    description: string;
                    type: "uncategorized" | "misclassified" | "duplicate";
                    confidence: number;
                    transaction_ids: string[];
                    suggested_fix: string;
                }>, "many">;
                proposed_rules: z.ZodArray<z.ZodObject<{
                    pattern: z.ZodString;
                    category: z.ZodString;
                    confidence: z.ZodNumber;
                    impact_transactions: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    category: string;
                    pattern: string;
                    confidence: number;
                    impact_transactions: number;
                }, {
                    category: string;
                    pattern: string;
                    confidence: number;
                    impact_transactions: number;
                }>, "many">;
                journal_entries: z.ZodArray<z.ZodObject<{
                    description: z.ZodString;
                    debits: z.ZodArray<z.ZodObject<{
                        account: z.ZodString;
                        amount: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        amount: number;
                        account: string;
                    }, {
                        amount: number;
                        account: string;
                    }>, "many">;
                    credits: z.ZodArray<z.ZodObject<{
                        account: z.ZodString;
                        amount: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        amount: number;
                        account: string;
                    }, {
                        amount: number;
                        account: string;
                    }>, "many">;
                    impact_amount: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    description: string;
                    debits: {
                        amount: number;
                        account: string;
                    }[];
                    credits: {
                        amount: number;
                        account: string;
                    }[];
                    impact_amount: number;
                }, {
                    description: string;
                    debits: {
                        amount: number;
                        account: string;
                    }[];
                    credits: {
                        amount: number;
                        account: string;
                    }[];
                    impact_amount: number;
                }>, "many">;
                total_impact: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                issues: {
                    description: string;
                    type: "uncategorized" | "misclassified" | "duplicate";
                    confidence: number;
                    transaction_ids: string[];
                    suggested_fix: string;
                }[];
                proposed_rules: {
                    category: string;
                    pattern: string;
                    confidence: number;
                    impact_transactions: number;
                }[];
                journal_entries: {
                    description: string;
                    debits: {
                        amount: number;
                        account: string;
                    }[];
                    credits: {
                        amount: number;
                        account: string;
                    }[];
                    impact_amount: number;
                }[];
                total_impact: number;
            }, {
                issues: {
                    description: string;
                    type: "uncategorized" | "misclassified" | "duplicate";
                    confidence: number;
                    transaction_ids: string[];
                    suggested_fix: string;
                }[];
                proposed_rules: {
                    category: string;
                    pattern: string;
                    confidence: number;
                    impact_transactions: number;
                }[];
                journal_entries: {
                    description: string;
                    debits: {
                        amount: number;
                        account: string;
                    }[];
                    credits: {
                        amount: number;
                        account: string;
                    }[];
                    impact_amount: number;
                }[];
                total_impact: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            success: boolean;
            data: {
                issues: {
                    description: string;
                    type: "uncategorized" | "misclassified" | "duplicate";
                    confidence: number;
                    transaction_ids: string[];
                    suggested_fix: string;
                }[];
                proposed_rules: {
                    category: string;
                    pattern: string;
                    confidence: number;
                    impact_transactions: number;
                }[];
                journal_entries: {
                    description: string;
                    debits: {
                        amount: number;
                        account: string;
                    }[];
                    credits: {
                        amount: number;
                        account: string;
                    }[];
                    impact_amount: number;
                }[];
                total_impact: number;
            };
            metadata: {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            error?: string | undefined;
        }, {
            success: boolean;
            data: {
                issues: {
                    description: string;
                    type: "uncategorized" | "misclassified" | "duplicate";
                    confidence: number;
                    transaction_ids: string[];
                    suggested_fix: string;
                }[];
                proposed_rules: {
                    category: string;
                    pattern: string;
                    confidence: number;
                    impact_transactions: number;
                }[];
                journal_entries: {
                    description: string;
                    debits: {
                        amount: number;
                        account: string;
                    }[];
                    credits: {
                        amount: number;
                        account: string;
                    }[];
                    impact_amount: number;
                }[];
                total_impact: number;
            };
            metadata: {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            error?: string | undefined;
        }>;
    };
    readonly 'savings-finder': {
        readonly input: z.ZodObject<{
            subscriptions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                amount: z.ZodNumber;
                frequency: z.ZodEnum<["monthly", "quarterly", "annually"]>;
                category: z.ZodString;
                last_used: z.ZodOptional<z.ZodString>;
                auto_renew: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                id: string;
                amount: number;
                category: string;
                name: string;
                frequency: "monthly" | "quarterly" | "annually";
                auto_renew: boolean;
                last_used?: string | undefined;
            }, {
                id: string;
                amount: number;
                category: string;
                name: string;
                frequency: "monthly" | "quarterly" | "annually";
                auto_renew: boolean;
                last_used?: string | undefined;
            }>, "many">;
            historical_pricing: z.ZodArray<z.ZodObject<{
                subscription_id: z.ZodString;
                date: z.ZodString;
                amount: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                date: string;
                amount: number;
                subscription_id: string;
            }, {
                date: string;
                amount: number;
                subscription_id: string;
            }>, "many">;
            usage_data: z.ZodArray<z.ZodObject<{
                subscription_id: z.ZodString;
                last_activity: z.ZodString;
                usage_frequency: z.ZodEnum<["daily", "weekly", "monthly", "rarely", "never"]>;
            }, "strip", z.ZodTypeAny, {
                subscription_id: string;
                last_activity: string;
                usage_frequency: "never" | "monthly" | "daily" | "weekly" | "rarely";
            }, {
                subscription_id: string;
                last_activity: string;
                usage_frequency: "never" | "monthly" | "daily" | "weekly" | "rarely";
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            subscriptions: {
                id: string;
                amount: number;
                category: string;
                name: string;
                frequency: "monthly" | "quarterly" | "annually";
                auto_renew: boolean;
                last_used?: string | undefined;
            }[];
            historical_pricing: {
                date: string;
                amount: number;
                subscription_id: string;
            }[];
            usage_data: {
                subscription_id: string;
                last_activity: string;
                usage_frequency: "never" | "monthly" | "daily" | "weekly" | "rarely";
            }[];
        }, {
            subscriptions: {
                id: string;
                amount: number;
                category: string;
                name: string;
                frequency: "monthly" | "quarterly" | "annually";
                auto_renew: boolean;
                last_used?: string | undefined;
            }[];
            historical_pricing: {
                date: string;
                amount: number;
                subscription_id: string;
            }[];
            usage_data: {
                subscription_id: string;
                last_activity: string;
                usage_frequency: "never" | "monthly" | "daily" | "weekly" | "rarely";
            }[];
        }>;
        readonly response: z.ZodObject<{
            success: z.ZodBoolean;
            metadata: z.ZodObject<{
                agent: z.ZodString;
                timestamp: z.ZodString;
                processing_time_ms: z.ZodNumber;
                token_usage: z.ZodObject<{
                    prompt_tokens: z.ZodNumber;
                    completion_tokens: z.ZodNumber;
                    total_tokens: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                }, {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            }, {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            }>;
            error: z.ZodOptional<z.ZodString>;
        } & {
            data: z.ZodObject<{
                flagged_subscriptions: z.ZodArray<z.ZodObject<{
                    subscription_id: z.ZodString;
                    issue_type: z.ZodEnum<["price_hike", "duplicate", "unused", "overpriced"]>;
                    current_cost: z.ZodNumber;
                    potential_savings: z.ZodNumber;
                    recommendation: z.ZodString;
                    confidence: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    confidence: number;
                    subscription_id: string;
                    issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
                    current_cost: number;
                    potential_savings: number;
                    recommendation: string;
                }, {
                    confidence: number;
                    subscription_id: string;
                    issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
                    current_cost: number;
                    potential_savings: number;
                    recommendation: string;
                }>, "many">;
                total_potential_savings: z.ZodNumber;
                monthly_savings: z.ZodNumber;
                annual_savings: z.ZodNumber;
                action_items: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                flagged_subscriptions: {
                    confidence: number;
                    subscription_id: string;
                    issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
                    current_cost: number;
                    potential_savings: number;
                    recommendation: string;
                }[];
                total_potential_savings: number;
                monthly_savings: number;
                annual_savings: number;
                action_items: string[];
            }, {
                flagged_subscriptions: {
                    confidence: number;
                    subscription_id: string;
                    issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
                    current_cost: number;
                    potential_savings: number;
                    recommendation: string;
                }[];
                total_potential_savings: number;
                monthly_savings: number;
                annual_savings: number;
                action_items: string[];
            }>;
        }, "strip", z.ZodTypeAny, {
            success: boolean;
            data: {
                flagged_subscriptions: {
                    confidence: number;
                    subscription_id: string;
                    issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
                    current_cost: number;
                    potential_savings: number;
                    recommendation: string;
                }[];
                total_potential_savings: number;
                monthly_savings: number;
                annual_savings: number;
                action_items: string[];
            };
            metadata: {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            error?: string | undefined;
        }, {
            success: boolean;
            data: {
                flagged_subscriptions: {
                    confidence: number;
                    subscription_id: string;
                    issue_type: "duplicate" | "price_hike" | "unused" | "overpriced";
                    current_cost: number;
                    potential_savings: number;
                    recommendation: string;
                }[];
                total_potential_savings: number;
                monthly_savings: number;
                annual_savings: number;
                action_items: string[];
            };
            metadata: {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            error?: string | undefined;
        }>;
    };
    readonly 'cash-flow-runway': {
        readonly input: z.ZodObject<{
            current_cash: z.ZodNumber;
            time_period: z.ZodObject<{
                start_date: z.ZodString;
                end_date: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                start_date: string;
                end_date: string;
            }, {
                start_date: string;
                end_date: string;
            }>;
            cash_flows: z.ZodArray<z.ZodObject<{
                date: z.ZodString;
                type: z.ZodEnum<["inflow", "outflow"]>;
                amount: z.ZodNumber;
                category: z.ZodString;
                description: z.ZodString;
                confidence: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                date: string;
                description: string;
                amount: number;
                category: string;
                type: "inflow" | "outflow";
                confidence: number;
            }, {
                date: string;
                description: string;
                amount: number;
                category: string;
                type: "inflow" | "outflow";
                confidence: number;
            }>, "many">;
            recurring_patterns: z.ZodArray<z.ZodObject<{
                category: z.ZodString;
                amount: z.ZodNumber;
                frequency: z.ZodEnum<["daily", "weekly", "monthly", "quarterly", "annually"]>;
                next_occurrence: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount: number;
                category: string;
                frequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
                next_occurrence: string;
            }, {
                amount: number;
                category: string;
                frequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
                next_occurrence: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            current_cash: number;
            time_period: {
                start_date: string;
                end_date: string;
            };
            cash_flows: {
                date: string;
                description: string;
                amount: number;
                category: string;
                type: "inflow" | "outflow";
                confidence: number;
            }[];
            recurring_patterns: {
                amount: number;
                category: string;
                frequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
                next_occurrence: string;
            }[];
        }, {
            current_cash: number;
            time_period: {
                start_date: string;
                end_date: string;
            };
            cash_flows: {
                date: string;
                description: string;
                amount: number;
                category: string;
                type: "inflow" | "outflow";
                confidence: number;
            }[];
            recurring_patterns: {
                amount: number;
                category: string;
                frequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
                next_occurrence: string;
            }[];
        }>;
        readonly response: z.ZodObject<{
            success: z.ZodBoolean;
            metadata: z.ZodObject<{
                agent: z.ZodString;
                timestamp: z.ZodString;
                processing_time_ms: z.ZodNumber;
                token_usage: z.ZodObject<{
                    prompt_tokens: z.ZodNumber;
                    completion_tokens: z.ZodNumber;
                    total_tokens: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                }, {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            }, {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            }>;
            error: z.ZodOptional<z.ZodString>;
        } & {
            data: z.ZodObject<{
                cash_bridge: z.ZodArray<z.ZodObject<{
                    date: z.ZodString;
                    opening_balance: z.ZodNumber;
                    inflows: z.ZodNumber;
                    outflows: z.ZodNumber;
                    net_change: z.ZodNumber;
                    closing_balance: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    date: string;
                    net_change: number;
                    opening_balance: number;
                    inflows: number;
                    outflows: number;
                    closing_balance: number;
                }, {
                    date: string;
                    net_change: number;
                    opening_balance: number;
                    inflows: number;
                    outflows: number;
                    closing_balance: number;
                }>, "many">;
                burn_rate: z.ZodObject<{
                    monthly: z.ZodNumber;
                    daily: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    monthly: number;
                    daily: number;
                }, {
                    monthly: number;
                    daily: number;
                }>;
                runway_months: z.ZodNumber;
                runway_date: z.ZodString;
                top_outflows: z.ZodArray<z.ZodObject<{
                    category: z.ZodString;
                    amount: z.ZodNumber;
                    percentage: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    amount: number;
                    category: string;
                    percentage: number;
                }, {
                    amount: number;
                    category: string;
                    percentage: number;
                }>, "many">;
                risk_factors: z.ZodArray<z.ZodString, "many">;
                recommendations: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                recommendations: string[];
                cash_bridge: {
                    date: string;
                    net_change: number;
                    opening_balance: number;
                    inflows: number;
                    outflows: number;
                    closing_balance: number;
                }[];
                burn_rate: {
                    monthly: number;
                    daily: number;
                };
                runway_months: number;
                runway_date: string;
                top_outflows: {
                    amount: number;
                    category: string;
                    percentage: number;
                }[];
                risk_factors: string[];
            }, {
                recommendations: string[];
                cash_bridge: {
                    date: string;
                    net_change: number;
                    opening_balance: number;
                    inflows: number;
                    outflows: number;
                    closing_balance: number;
                }[];
                burn_rate: {
                    monthly: number;
                    daily: number;
                };
                runway_months: number;
                runway_date: string;
                top_outflows: {
                    amount: number;
                    category: string;
                    percentage: number;
                }[];
                risk_factors: string[];
            }>;
        }, "strip", z.ZodTypeAny, {
            success: boolean;
            data: {
                recommendations: string[];
                cash_bridge: {
                    date: string;
                    net_change: number;
                    opening_balance: number;
                    inflows: number;
                    outflows: number;
                    closing_balance: number;
                }[];
                burn_rate: {
                    monthly: number;
                    daily: number;
                };
                runway_months: number;
                runway_date: string;
                top_outflows: {
                    amount: number;
                    category: string;
                    percentage: number;
                }[];
                risk_factors: string[];
            };
            metadata: {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            error?: string | undefined;
        }, {
            success: boolean;
            data: {
                recommendations: string[];
                cash_bridge: {
                    date: string;
                    net_change: number;
                    opening_balance: number;
                    inflows: number;
                    outflows: number;
                    closing_balance: number;
                }[];
                burn_rate: {
                    monthly: number;
                    daily: number;
                };
                runway_months: number;
                runway_date: string;
                top_outflows: {
                    amount: number;
                    category: string;
                    percentage: number;
                }[];
                risk_factors: string[];
            };
            metadata: {
                agent: string;
                timestamp: string;
                processing_time_ms: number;
                token_usage: {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
            };
            error?: string | undefined;
        }>;
    };
};
//# sourceMappingURL=schemas.d.ts.map