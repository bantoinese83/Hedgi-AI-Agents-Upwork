# Hedgi AI Agents API Documentation

This document provides comprehensive API documentation for all Hedgi AI Agents endpoints.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints require a valid OpenAI API key to be configured in the environment variables. The API key is used internally to make requests to OpenAI's GPT-4 service.

## Rate Limiting

All endpoints are protected by rate limiting:

- **Limit**: 10 requests per minute per IP address
- **Headers**: Rate limit information is included in response headers
- **Error**: Returns `429 Too Many Requests` when limit exceeded

## Common Response Format

All API endpoints return responses in the following format:

```typescript
{
  success: boolean;
  data: object;
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
  error?: string;
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid request data",
  "data": {},
  "metadata": {
    "agent": "agent-name",
    "timestamp": "2024-01-20T00:00:00.000Z",
    "processing_time_ms": 0,
    "token_usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    }
  }
}
```

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "data": {},
  "metadata": {
    "agent": "agent-name",
    "timestamp": "2024-01-20T00:00:00.000Z",
    "processing_time_ms": 0,
    "token_usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    }
  }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "data": {},
  "metadata": {
    "agent": "agent-name",
    "timestamp": "2024-01-20T00:00:00.000Z",
    "processing_time_ms": 0,
    "token_usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    }
  }
}
```

---

## AI Agents

### 1. SMB Explainer

**Endpoint**: `POST /api/ai/smb-explainer`

Analyzes monthly financial data and provides comprehensive summaries with insights and recommendations.

#### Request Body

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
  exemplar_transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    category?: string;
    account: string;
    type: 'income' | 'expense' | 'transfer';
    materiality_score: number;
  }>;
  previous_month_comparison: {
    income_change: number;
    expense_change: number;
    net_change: number;
  }
}
```

#### Response

```typescript
{
  success: true;
  data: {
    summary: string;
    key_insights: string[];
    recommendations: string[];
    financial_health_score: number; // 0-100
  };
  metadata: HedgiMetadata;
}
```

#### Example Request

```bash
curl -X POST http://localhost:3000/api/ai/smb-explainer \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Acme Corp",
    "month": "January",
    "year": 2024,
    "rollups": {
      "total_income": 50000,
      "total_expenses": 35000,
      "net_income": 15000,
      "top_categories": [
        {
          "category": "Revenue",
          "amount": 50000,
          "percentage": 100
        },
        {
          "category": "Office Expenses",
          "amount": 15000,
          "percentage": 30
        }
      ]
    },
    "exemplar_transactions": [
      {
        "id": "txn-001",
        "date": "2024-01-15",
        "description": "Client Payment - Project Alpha",
        "amount": 15000,
        "category": "Revenue",
        "account": "Checking",
        "type": "income",
        "materiality_score": 0.9
      }
    ],
    "previous_month_comparison": {
      "income_change": 15,
      "expense_change": 5,
      "net_change": 25
    }
  }'
```

---

### 2. Audit Push

**Endpoint**: `POST /api/ai/audit-push`

Identifies accounting issues, duplicates, and proposes corrections.

#### Request Body

```typescript
{
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    category?: string;
    account: string;
    type: 'income' | 'expense' | 'transfer';
    materiality_score: number;
  }>;
  existing_rules: Array<{
    id: string;
    pattern: string;
    category: string;
    confidence: number;
  }>;
  duplicate_threshold?: number; // default: 0.9
  uncategorized_threshold?: number; // default: 0.1
}
```

#### Response

```typescript
{
  success: true;
  data: {
    issues: Array<{
      type: 'uncategorized' | 'misclassified' | 'duplicate';
      transaction_ids: string[];
      confidence: number;
      description: string;
      suggested_fix: string;
    }>;
    proposed_rules: Array<{
      pattern: string;
      category: string;
      confidence: number;
      impact_transactions: number;
    }>;
    journal_entries: Array<{
      description: string;
      debits: Array<{
        account: string;
        amount: number;
      }>;
      credits: Array<{
        account: string;
        amount: number;
      }>;
      impact_amount: number;
    }>;
    total_impact: number;
  }
  metadata: HedgiMetadata;
}
```

---

### 3. Cash Flow Runway

**Endpoint**: `POST /api/ai/cash-flow-runway`

Calculates burn rate, runway projections, and cash flow analysis.

#### Request Body

```typescript
{
  current_cash: number;
  time_period: {
    start_date: string;
    end_date: string;
  }
  cash_flows: Array<{
    date: string;
    amount: number;
    type: 'inflow' | 'outflow';
    category: string;
    description: string;
  }>;
  recurring_patterns: Array<{
    pattern: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    category: string;
  }>;
}
```

#### Response

```typescript
{
  success: true;
  data: {
    cash_bridge: Array<{
      date: string;
      opening_balance: number;
      inflows: number;
      outflows: number;
      net_change: number;
      closing_balance: number;
    }>;
    burn_rate: {
      monthly: number;
      daily: number;
    };
    runway_months: number;
    runway_date: string;
    top_outflows: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    risk_factors: string[];
    recommendations: string[];
  };
  metadata: HedgiMetadata;
}
```

---

### 4. Savings Finder

**Endpoint**: `POST /api/ai/savings-finder`

Identifies subscription cost optimization opportunities.

#### Request Body

```typescript
{
  subscriptions: Array<{
    id: string;
    name: string;
    current_cost: number;
    billing_frequency: 'monthly' | 'quarterly' | 'yearly';
    category: string;
    vendor: string;
    start_date: string;
    usage_data?: {
      last_used: string;
      usage_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
      user_count: number;
    };
  }>;
  historical_pricing: Array<{
    subscription_id: string;
    date: string;
    cost: number;
    change_percentage: number;
  }>;
  usage_data: Array<{
    subscription_id: string;
    date: string;
    usage_metrics: Record<string, any>;
  }>;
}
```

#### Response

```typescript
{
  success: true;
  data: {
    flagged_subscriptions: Array<{
      subscription_id: string;
      issue_type: 'duplicate' | 'unused' | 'overpriced' | 'price_increase';
      current_cost: number;
      potential_savings: number;
      recommendation: string;
      confidence: number;
    }>;
    total_potential_savings: number;
    monthly_savings: number;
    annual_savings: number;
    action_items: string[];
  };
  metadata: HedgiMetadata;
}
```

---

## Health Check

**Endpoint**: `GET /api/health`

Provides system health information and status.

#### Response

```typescript
{
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  performance: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    timestamp: string;
  }
  rateLimit: {
    remaining: number;
    resetTime: number;
  }
  environment: {
    nodeVersion: string;
    platform: string;
    memory: {
      used: number; // MB
      total: number; // MB
    }
  }
}
```

---

## Testing

### Using Postman

Import the provided Postman collection from `tools/postman/Hedgi-AI-Agents.postman_collection.json`.

### Using cURL

See individual endpoint examples above, or use the test scripts:

```bash
# Simple API test
./scripts/test/simple-test.sh

# Comprehensive API test
./scripts/test/test-all-apis.sh
```

### Using Jest

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testPathPattern="smb-explainer.test.ts"

# Run with coverage
npm run test:coverage
```

---

## Rate Limiting Details

### Headers

Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

### Limits

- **Default**: 10 requests per minute per IP address
- **Window**: 1 minute rolling window
- **Scope**: Per IP address (client IP or X-Forwarded-For header)

### Exceeding Limits

When rate limit is exceeded:

- HTTP Status: `429 Too Many Requests`
- Response includes retry-after information
- Rate limit resets after the window period

---

## Error Codes

| Code | Description                               |
| ---- | ----------------------------------------- |
| 200  | Success                                   |
| 400  | Bad Request - Invalid input data          |
| 429  | Too Many Requests - Rate limit exceeded   |
| 500  | Internal Server Error - Server-side error |

---

## Support

For API support and questions:

- Check the [troubleshooting section](../README.md#troubleshooting)
- Review the [contributing guidelines](../CONTRIBUTING.md)
- Create an issue in the GitHub repository
