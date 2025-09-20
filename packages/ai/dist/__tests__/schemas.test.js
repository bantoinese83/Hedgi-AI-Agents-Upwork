"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schemas_1 = require("../schemas");
describe('Schema Validation', () => {
    describe('TransactionSchema', () => {
        it('should validate valid transaction', () => {
            const validTransaction = {
                id: 'txn-123',
                date: '2024-01-01',
                description: 'Test transaction',
                amount: 100.5,
                category: 'Office Supplies',
                account: 'Checking',
                type: 'expense',
                materiality_score: 0.8,
            };
            expect(() => schemas_1.TransactionSchema.parse(validTransaction)).not.toThrow();
        });
        it('should reject invalid transaction type', () => {
            const invalidTransaction = {
                id: 'txn-123',
                date: '2024-01-01',
                description: 'Test transaction',
                amount: 100.5,
                category: 'Office Supplies',
                account: 'Checking',
                type: 'invalid',
                materiality_score: 0.8,
            };
            expect(() => schemas_1.TransactionSchema.parse(invalidTransaction)).toThrow();
        });
        it('should reject materiality score outside 0-1 range', () => {
            const invalidTransaction = {
                id: 'txn-123',
                date: '2024-01-01',
                description: 'Test transaction',
                amount: 100.5,
                category: 'Office Supplies',
                account: 'Checking',
                type: 'expense',
                materiality_score: 1.5,
            };
            expect(() => schemas_1.TransactionSchema.parse(invalidTransaction)).toThrow();
        });
    });
    describe('HedgiResponseSchema', () => {
        it('should validate valid HedgiResponse', () => {
            const validResponse = {
                success: true,
                data: { test: 'data' },
                metadata: {
                    agent: 'smb-explainer',
                    timestamp: '2024-01-01T00:00:00Z',
                    processing_time_ms: 1000,
                    token_usage: {
                        prompt_tokens: 100,
                        completion_tokens: 50,
                        total_tokens: 150,
                    },
                },
            };
            expect(() => schemas_1.HedgiResponseSchema.parse(validResponse)).not.toThrow();
        });
        it('should validate HedgiResponse with error', () => {
            const validResponse = {
                success: false,
                data: {},
                metadata: {
                    agent: 'smb-explainer',
                    timestamp: '2024-01-01T00:00:00Z',
                    processing_time_ms: 1000,
                    token_usage: {
                        prompt_tokens: 100,
                        completion_tokens: 0,
                        total_tokens: 100,
                    },
                },
                error: 'Test error message',
            };
            expect(() => schemas_1.HedgiResponseSchema.parse(validResponse)).not.toThrow();
        });
    });
    describe('SMBExplainerInputSchema', () => {
        it('should validate valid SMB Explainer input', () => {
            const validInput = {
                business_name: 'Test Business',
                month: 'January',
                year: 2024,
                rollups: {
                    total_income: 10000,
                    total_expenses: 8000,
                    net_income: 2000,
                    top_categories: [
                        { category: 'Revenue', amount: 10000, percentage: 100 },
                    ],
                },
                exemplar_transactions: [
                    {
                        id: 'txn-1',
                        date: '2024-01-01',
                        description: 'Test transaction',
                        amount: 100,
                        category: 'Office Supplies',
                        account: 'Checking',
                        type: 'expense',
                        materiality_score: 0.8,
                    },
                ],
                previous_month_comparison: {
                    income_change: 10,
                    expense_change: 5,
                    net_change: 15,
                },
            };
            expect(() => schemas_1.SMBExplainerInputSchema.parse(validInput)).not.toThrow();
        });
        it('should reject input with too many exemplar transactions', () => {
            const invalidInput = {
                business_name: 'Test Business',
                month: 'January',
                year: 2024,
                rollups: {
                    total_income: 10000,
                    total_expenses: 8000,
                    net_income: 2000,
                    top_categories: [
                        { category: 'Revenue', amount: 10000, percentage: 100 },
                    ],
                },
                exemplar_transactions: Array.from({ length: 15 }, (_, i) => ({
                    id: `txn-${i}`,
                    date: '2024-01-01',
                    description: 'Test transaction',
                    amount: 100,
                    category: 'Office Supplies',
                    account: 'Checking',
                    type: 'expense',
                    materiality_score: 0.8,
                })),
                previous_month_comparison: {
                    income_change: 10,
                    expense_change: 5,
                    net_change: 15,
                },
            };
            expect(() => schemas_1.SMBExplainerInputSchema.parse(invalidInput)).toThrow();
        });
    });
    describe('SMBExplainerResponseSchema', () => {
        it('should validate valid SMB Explainer response', () => {
            const validResponse = {
                success: true,
                data: {
                    summary: 'Test summary',
                    key_insights: ['Test insight 1', 'Test insight 2'],
                    recommendations: ['Test recommendation 1'],
                    financial_health_score: 85,
                },
                metadata: {
                    agent: 'smb-explainer',
                    timestamp: '2024-01-01T00:00:00Z',
                    processing_time_ms: 1000,
                    token_usage: {
                        prompt_tokens: 100,
                        completion_tokens: 50,
                        total_tokens: 150,
                    },
                },
            };
            expect(() => schemas_1.SMBExplainerResponseSchema.parse(validResponse)).not.toThrow();
        });
        it('should reject response with invalid health score', () => {
            const invalidResponse = {
                success: true,
                data: {
                    summary: 'Test summary',
                    key_insights: ['Test insight 1'],
                    recommendations: ['Test recommendation 1'],
                    financial_health_score: 150, // Invalid: > 100
                },
                metadata: {
                    agent: 'smb-explainer',
                    timestamp: '2024-01-01T00:00:00Z',
                    processing_time_ms: 1000,
                    token_usage: {
                        prompt_tokens: 100,
                        completion_tokens: 50,
                        total_tokens: 150,
                    },
                },
            };
            expect(() => schemas_1.SMBExplainerResponseSchema.parse(invalidResponse)).toThrow();
        });
    });
    describe('AuditPushInputSchema', () => {
        it('should validate valid Audit Push input', () => {
            const validInput = {
                transactions: [
                    {
                        id: 'txn-1',
                        date: '2024-01-01',
                        description: 'Test transaction',
                        amount: 100,
                        category: 'Office Supplies',
                        account: 'Checking',
                        type: 'expense',
                        materiality_score: 0.8,
                    },
                ],
                existing_rules: [
                    {
                        id: 'rule-1',
                        pattern: 'Office Supplies',
                        category: 'Office Expenses',
                        confidence: 0.9,
                    },
                ],
                duplicate_threshold: 0.9,
                uncategorized_threshold: 0.1,
            };
            expect(() => schemas_1.AuditPushInputSchema.parse(validInput)).not.toThrow();
        });
        it('should reject input with too many transactions', () => {
            const invalidInput = {
                transactions: Array.from({ length: 2000 }, (_, i) => ({
                    id: `txn-${i}`,
                    date: '2024-01-01',
                    description: 'Test transaction',
                    amount: 100,
                    category: 'Office Supplies',
                    account: 'Checking',
                    type: 'expense',
                    materiality_score: 0.8,
                })),
                existing_rules: [],
                duplicate_threshold: 0.9,
                uncategorized_threshold: 0.1,
            };
            expect(() => schemas_1.AuditPushInputSchema.parse(invalidInput)).toThrow();
        });
    });
    describe('SavingsFinderInputSchema', () => {
        it('should validate valid Savings Finder input', () => {
            const validInput = {
                subscriptions: [
                    {
                        id: 'sub-1',
                        name: 'Test Subscription',
                        amount: 29.99,
                        frequency: 'monthly',
                        category: 'Software',
                        last_used: '2024-01-01',
                        auto_renew: true,
                    },
                ],
                historical_pricing: [
                    {
                        subscription_id: 'sub-1',
                        date: '2024-01-01',
                        amount: 29.99,
                    },
                ],
                usage_data: [
                    {
                        subscription_id: 'sub-1',
                        last_activity: '2024-01-01',
                        usage_frequency: 'daily',
                    },
                ],
            };
            expect(() => schemas_1.SavingsFinderInputSchema.parse(validInput)).not.toThrow();
        });
        it('should reject invalid frequency', () => {
            const invalidInput = {
                subscriptions: [
                    {
                        id: 'sub-1',
                        name: 'Test Subscription',
                        amount: 29.99,
                        frequency: 'invalid',
                        category: 'Software',
                        last_used: '2024-01-01',
                        auto_renew: true,
                    },
                ],
                historical_pricing: [],
                usage_data: [],
            };
            expect(() => schemas_1.SavingsFinderInputSchema.parse(invalidInput)).toThrow();
        });
    });
    describe('CashFlowRunwayInputSchema', () => {
        it('should validate valid Cash Flow Runway input', () => {
            const validInput = {
                current_cash: 10000,
                time_period: {
                    start_date: '2024-01-01',
                    end_date: '2024-12-31',
                },
                cash_flows: [
                    {
                        date: '2024-01-01',
                        type: 'inflow',
                        amount: 5000,
                        category: 'Revenue',
                        description: 'Monthly revenue',
                        confidence: 0.9,
                    },
                ],
                recurring_patterns: [
                    {
                        category: 'Rent',
                        amount: 2000,
                        frequency: 'monthly',
                        next_occurrence: '2024-02-01',
                    },
                ],
            };
            expect(() => schemas_1.CashFlowRunwayInputSchema.parse(validInput)).not.toThrow();
        });
        it('should reject invalid cash flow type', () => {
            const invalidInput = {
                current_cash: 10000,
                time_period: {
                    start_date: '2024-01-01',
                    end_date: '2024-12-31',
                },
                cash_flows: [
                    {
                        date: '2024-01-01',
                        type: 'invalid',
                        amount: 5000,
                        category: 'Revenue',
                        description: 'Monthly revenue',
                        confidence: 0.9,
                    },
                ],
                recurring_patterns: [],
            };
            expect(() => schemas_1.CashFlowRunwayInputSchema.parse(invalidInput)).toThrow();
        });
    });
});
//# sourceMappingURL=schemas.test.js.map