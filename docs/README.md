# Hedgi AI Agents Documentation

## Overview

Hedgi AI Agents is a comprehensive suite of AI-powered financial analysis tools designed specifically for small and medium businesses (SMBs). The platform provides intelligent insights, automated analysis, and actionable recommendations to help businesses optimize their financial operations.

## Architecture

### Monorepo Structure

- **`apps/web`**: Next.js web application with API routes
- **`packages/ai`**: Shared AI utilities, schemas, and OpenAI integration
- **`scripts/`**: Development and testing utilities
- **`tools/`**: Postman collections and AI prompts
- **`docs/`**: Documentation and guides

### Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4 with JSON mode
- **Validation**: Zod schemas
- **Language**: TypeScript
- **Package Manager**: npm workspaces

## API Endpoints

### 1. SMB Explainer

**Endpoint**: `POST /api/ai/smb-explainer`

Analyzes monthly financial data and provides comprehensive summaries with insights and recommendations.

**Request Body**:

```typescript
{
  business_name: string;
  month: string;
  year: number;
  rollups: {
    total_income: number;
    total_expenses: number;
    net_income: number;
    top_categories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  }
  exemplar_transactions: Array<Transaction>;
  previous_month_comparison: {
    income_change: number;
    expense_change: number;
    net_change: number;
  }
}
```

**Response**:

```typescript
{
  success: true
  data: {
    summary: string
    key_insights: string[]
    recommendations: string[]
    financial_health_score: number
  }
  metadata: HedgiMetadata
}
```

### 2. Audit Push

**Endpoint**: `POST /api/ai/audit-push`

Identifies accounting issues, duplicates, and proposes corrections.

**Request Body**:

```typescript
{
  transactions: Transaction[]
  existing_rules: CategorizationRule[]
  duplicate_threshold: number
  uncategorized_threshold: number
}
```

**Response**:

```typescript
{
  success: true
  data: {
    issues: AuditIssue[]
    proposed_rules: CategorizationRule[]
    journal_entries: JournalEntry[]
    total_impact: number
  }
  metadata: HedgiMetadata
}
```

### 3. Cash Flow Runway

**Endpoint**: `POST /api/ai/cash-flow-runway`

Calculates burn rate, runway projections, and cash flow analysis.

**Request Body**:

```typescript
{
  current_cash: number
  time_period: {
    start_date: string
    end_date: string
  }
  cash_flows: CashFlow[]
  recurring_patterns: RecurringPattern[]
}
```

**Response**:

```typescript
{
  success: true
  data: {
    cash_bridge: CashBridgeEntry[]
    burn_rate: {
      monthly: number
      daily: number
    }
    runway_months: number
    runway_date: string
    top_outflows: OutflowCategory[]
    risk_factors: string[]
    recommendations: string[]
  }
  metadata: HedgiMetadata
}
```

### 4. Savings Finder

**Endpoint**: `POST /api/ai/savings-finder`

Identifies subscription cost optimization opportunities.

**Request Body**:

```typescript
{
  subscriptions: Subscription[]
  historical_pricing: PricingHistory[]
  usage_data: UsageData[]
}
```

**Response**:

```typescript
{
  success: true
  data: {
    flagged_subscriptions: FlaggedSubscription[]
    total_potential_savings: number
    monthly_savings: number
    annual_savings: number
    action_items: string[]
  }
  metadata: HedgiMetadata
}
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see [ENVIRONMENT.md](../ENVIRONMENT.md) for detailed instructions)
4. Start development server: `npm run dev`

### Testing

- Run API tests: `npm run test:api`
- Run comprehensive tests: `npm run test:api:full`

### Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
OPENAI_MODEL=gpt-4o
ENABLE_COST_LOGGING=true
```

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Setup

Ensure all environment variables are properly configured in your production environment.

## Contributing

1. Follow the existing code structure and patterns
2. Add tests for new features
3. Update documentation as needed
4. Follow TypeScript best practices
5. Use conventional commit messages

## License

MIT License - see LICENSE file for details.
