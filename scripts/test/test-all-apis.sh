#!/bin/bash

# Comprehensive API Test Script for Hedgi AI Agents
# This script tests all four API endpoints with realistic data

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Hedgi AI Agents API Endpoints"
echo "========================================"
echo ""

# Function to test an API endpoint
test_endpoint() {
    local endpoint=$1
    local name=$2
    local data=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        success=$(echo "$body" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            echo -e "${GREEN}✅ PASSED${NC}"
            return 0
        else
            echo -e "${RED}❌ FAILED - API returned success: false${NC}"
            echo "Response: $body" | jq .
            return 1
        fi
    else
        echo -e "${RED}❌ FAILED - HTTP $http_code${NC}"
        echo "Response: $body" | jq .
        return 1
    fi
}

# Test 1: SMB Explainer API
echo "1️⃣  SMB Explainer API"
smb_data='{
  "business_name": "Tech Startup Inc",
  "month": "January",
  "year": 2024,
  "rollups": {
    "total_income": 75000,
    "total_expenses": 45000,
    "net_income": 30000,
    "top_categories": [
      {"category": "Software Sales", "amount": 60000, "percentage": 80},
      {"category": "Consulting", "amount": 15000, "percentage": 20}
    ]
  },
  "exemplar_transactions": [
    {
      "id": "txn-001",
      "date": "2024-01-15",
      "description": "Enterprise Software License - Q1 2024",
      "amount": 25000,
      "category": "Software Sales",
      "account": "Business Checking",
      "type": "income",
      "materiality_score": 0.95
    }
  ],
  "previous_month_comparison": {
    "income_change": 25.0,
    "expense_change": 12.5,
    "net_change": 35.0
  }
}'

test_endpoint "/api/ai/smb-explainer" "SMB Explainer" "$smb_data"
smb_result=$?

echo ""

# Test 2: Audit Push API
echo "2️⃣  Audit Push API"
audit_data='{
  "transactions": [
    {
      "id": "txn-001",
      "date": "2024-01-15",
      "description": "Office Supplies - Staples",
      "amount": 150,
      "category": "Office Expenses",
      "account": "Business Checking",
      "type": "expense",
      "materiality_score": 0.8
    },
    {
      "id": "txn-002",
      "date": "2024-01-15",
      "description": "Office Supplies - Staples",
      "amount": 150,
      "category": "Office Expenses",
      "account": "Business Checking",
      "type": "expense",
      "materiality_score": 0.8
    },
    {
      "id": "txn-003",
      "date": "2024-01-20",
      "description": "Unknown Transaction",
      "amount": 500,
      "category": "",
      "account": "Business Checking",
      "type": "expense",
      "materiality_score": 0.9
    }
  ],
  "existing_rules": [
    {
      "id": "rule-001",
      "pattern": "Office Supplies",
      "category": "Office Expenses",
      "confidence": 0.9
    }
  ],
  "duplicate_threshold": 0.9,
  "uncategorized_threshold": 0.1
}'

test_endpoint "/api/ai/audit-push" "Audit Push" "$audit_data"
audit_result=$?

echo ""

# Test 3: Cash Flow Runway API
echo "3️⃣  Cash Flow Runway API"
cashflow_data='{
  "current_cash": 100000,
  "time_period": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31"
  },
  "cash_flows": [
    {
      "date": "2024-01-15",
      "type": "inflow",
      "amount": 25000,
      "category": "Revenue",
      "description": "Client Payment - Q1 Project",
      "confidence": 0.95
    },
    {
      "date": "2024-01-31",
      "type": "outflow",
      "amount": 15000,
      "category": "Payroll",
      "description": "Monthly Payroll",
      "confidence": 0.9
    }
  ],
  "recurring_patterns": [
    {
      "category": "Payroll",
      "amount": 15000,
      "frequency": "monthly",
      "next_occurrence": "2024-03-31"
    }
  ]
}'

test_endpoint "/api/ai/cash-flow-runway" "Cash Flow Runway" "$cashflow_data"
cashflow_result=$?

echo ""

# Test 4: Savings Finder API
echo "4️⃣  Savings Finder API"
savings_data='{
  "subscriptions": [
    {
      "id": "sub-001",
      "name": "Adobe Creative Cloud",
      "amount": 52.99,
      "frequency": "monthly",
      "category": "Software",
      "last_used": "2024-01-15",
      "auto_renew": true
    },
    {
      "id": "sub-002",
      "name": "Adobe Creative Cloud",
      "amount": 52.99,
      "frequency": "monthly",
      "category": "Software",
      "last_used": "2024-01-10",
      "auto_renew": true
    },
    {
      "id": "sub-003",
      "name": "Unused App",
      "amount": 29.99,
      "frequency": "monthly",
      "category": "Productivity",
      "last_used": "2023-11-15",
      "auto_renew": true
    }
  ],
  "historical_pricing": [
    {
      "subscription_id": "sub-001",
      "date": "2024-01-01",
      "amount": 52.99
    },
    {
      "subscription_id": "sub-001",
      "date": "2023-12-01",
      "amount": 49.99
    }
  ],
  "usage_data": [
    {
      "subscription_id": "sub-001",
      "last_activity": "2024-01-15",
      "usage_frequency": "daily"
    },
    {
      "subscription_id": "sub-002",
      "last_activity": "2024-01-10",
      "usage_frequency": "daily"
    },
    {
      "subscription_id": "sub-003",
      "last_activity": "2023-11-15",
      "usage_frequency": "never"
    }
  ]
}'

test_endpoint "/api/ai/savings-finder" "Savings Finder" "$savings_data"
savings_result=$?

echo ""

# Summary
echo "📊 Test Results Summary"
echo "======================"
total_tests=4
passed_tests=0

[ $smb_result -eq 0 ] && ((passed_tests++))
[ $audit_result -eq 0 ] && ((passed_tests++))
[ $cashflow_result -eq 0 ] && ((passed_tests++))
[ $savings_result -eq 0 ] && ((passed_tests++))

echo "✅ Passed: $passed_tests/$total_tests"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 All tests passed! Your Hedgi AI Agents are working perfectly!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the output above for details.${NC}"
    exit 1
fi
