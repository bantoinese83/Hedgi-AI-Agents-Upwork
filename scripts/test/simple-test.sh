#!/bin/bash

# Simple API Test Script for Hedgi AI Agents
BASE_URL="http://localhost:3000"

echo "🧪 Testing Hedgi AI Agents API Endpoints"
echo "========================================"
echo ""

# Test SMB Explainer
echo "1️⃣  Testing SMB Explainer API..."
smb_result=$(curl -s -X POST "$BASE_URL/api/ai/smb-explainer" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Test Business",
    "month": "January",
    "year": 2024,
    "rollups": {
      "total_income": 50000,
      "total_expenses": 35000,
      "net_income": 15000,
      "top_categories": [{"category": "Revenue", "amount": 50000, "percentage": 100}]
    },
    "exemplar_transactions": [{
      "id": "txn-001",
      "date": "2024-01-15",
      "description": "Client Payment",
      "amount": 5000,
      "category": "Revenue",
      "account": "Business Checking",
      "type": "income",
      "materiality_score": 0.95
    }],
    "previous_month_comparison": {
      "income_change": 12.5,
      "expense_change": 8.3,
      "net_change": 18.2
    }
  }' | jq -r '.success // false')

if [ "$smb_result" = "true" ]; then
    echo "✅ SMB Explainer API - PASSED"
else
    echo "❌ SMB Explainer API - FAILED"
fi

# Test Audit Push
echo "2️⃣  Testing Audit Push API..."
audit_result=$(curl -s -X POST "$BASE_URL/api/ai/audit-push" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [{
      "id": "txn-001",
      "date": "2024-01-15",
      "description": "Office Supplies",
      "amount": 150,
      "category": "Office Expenses",
      "account": "Business Checking",
      "type": "expense",
      "materiality_score": 0.8
    }],
    "existing_rules": [],
    "duplicate_threshold": 0.9,
    "uncategorized_threshold": 0.1
  }' | jq -r '.success // false')

if [ "$audit_result" = "true" ]; then
    echo "✅ Audit Push API - PASSED"
else
    echo "❌ Audit Push API - FAILED"
fi

# Test Cash Flow Runway
echo "3️⃣  Testing Cash Flow Runway API..."
cashflow_result=$(curl -s -X POST "$BASE_URL/api/ai/cash-flow-runway" \
  -H "Content-Type: application/json" \
  -d '{
    "current_cash": 100000,
    "time_period": {
      "start_date": "2024-01-01",
      "end_date": "2024-03-31"
    },
    "cash_flows": [{
      "date": "2024-01-15",
      "type": "inflow",
      "amount": 25000,
      "category": "Revenue",
      "description": "Client Payment",
      "confidence": 0.95
    }],
    "recurring_patterns": [{
      "category": "Payroll",
      "amount": 15000,
      "frequency": "monthly",
      "next_occurrence": "2024-03-31"
    }]
  }' | jq -r '.success // false')

if [ "$cashflow_result" = "true" ]; then
    echo "✅ Cash Flow Runway API - PASSED"
else
    echo "❌ Cash Flow Runway API - FAILED"
fi

# Test Savings Finder
echo "4️⃣  Testing Savings Finder API..."
savings_result=$(curl -s -X POST "$BASE_URL/api/ai/savings-finder" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptions": [{
      "id": "sub-001",
      "name": "Adobe Creative Cloud",
      "amount": 52.99,
      "frequency": "monthly",
      "category": "Software",
      "last_used": "2024-01-15",
      "auto_renew": true
    }],
    "historical_pricing": [{
      "subscription_id": "sub-001",
      "date": "2024-01-01",
      "amount": 52.99
    }],
    "usage_data": [{
      "subscription_id": "sub-001",
      "last_activity": "2024-01-15",
      "usage_frequency": "daily"
    }]
  }' | jq -r '.success // false')

if [ "$savings_result" = "true" ]; then
    echo "✅ Savings Finder API - PASSED"
else
    echo "❌ Savings Finder API - FAILED"
fi

echo ""
echo "📊 Test Results Summary"
echo "======================"

# Count passed tests
passed=0
[ "$smb_result" = "true" ] && ((passed++))
[ "$audit_result" = "true" ] && ((passed++))
[ "$cashflow_result" = "true" ] && ((passed++))
[ "$savings_result" = "true" ] && ((passed++))

echo "✅ Passed: $passed/4"

if [ $passed -eq 4 ]; then
    echo "🎉 All tests passed! Your Hedgi AI Agents are working perfectly!"
    exit 0
else
    echo "❌ Some tests failed. Please check the output above for details."
    exit 1
fi
