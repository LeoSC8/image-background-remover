#!/bin/bash

# PayPal Sandbox Setup Script
# This script helps you create PayPal products and billing plans via API

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check required variables
if [ -z "$PAYPAL_CLIENT_ID" ] || [ -z "$PAYPAL_SECRET" ]; then
  echo "Error: PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set in .env.local"
  exit 1
fi

PAYPAL_API_BASE="https://api-m.sandbox.paypal.com"

# Get access token
echo "Getting PayPal access token..."
ACCESS_TOKEN=$(curl -s -X POST "$PAYPAL_API_BASE/v1/oauth2/token" \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "$PAYPAL_CLIENT_ID:$PAYPAL_SECRET" \
  -d "grant_type=client_credentials" | jq -r '.access_token')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "Error: Failed to get access token"
  exit 1
fi

echo "Access token obtained successfully"

# Create Product for Premium
echo ""
echo "Creating Premium product..."
PREMIUM_PRODUCT=$(curl -s -X POST "$PAYPAL_API_BASE/v1/catalogs/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Premium Membership",
    "description": "Premium membership with 100 monthly credits",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }')

PREMIUM_PRODUCT_ID=$(echo $PREMIUM_PRODUCT | jq -r '.id')
echo "Premium Product ID: $PREMIUM_PRODUCT_ID"

# Create Product for VIP
echo ""
echo "Creating VIP product..."
VIP_PRODUCT=$(curl -s -X POST "$PAYPAL_API_BASE/v1/catalogs/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "VIP Membership",
    "description": "VIP membership with unlimited credits",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }')

VIP_PRODUCT_ID=$(echo $VIP_PRODUCT | jq -r '.id')
echo "VIP Product ID: $VIP_PRODUCT_ID"

# Create Billing Plan for Premium
echo ""
echo "Creating Premium billing plan..."
PREMIUM_PLAN=$(curl -s -X POST "$PAYPAL_API_BASE/v1/billing/plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"product_id\": \"$PREMIUM_PRODUCT_ID\",
    \"name\": \"Premium Monthly Plan\",
    \"description\": \"Premium membership - \$1.99/month\",
    \"billing_cycles\": [{
      \"frequency\": {
        \"interval_unit\": \"MONTH\",
        \"interval_count\": 1
      },
      \"tenure_type\": \"REGULAR\",
      \"sequence\": 1,
      \"total_cycles\": 0,
      \"pricing_scheme\": {
        \"fixed_price\": {
          \"value\": \"1.99\",
          \"currency_code\": \"USD\"
        }
      }
    }],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    }
  }")

PREMIUM_PLAN_ID=$(echo $PREMIUM_PLAN | jq -r '.id')
echo "Premium Plan ID: $PREMIUM_PLAN_ID"

# Create Billing Plan for VIP
echo ""
echo "Creating VIP billing plan..."
VIP_PLAN=$(curl -s -X POST "$PAYPAL_API_BASE/v1/billing/plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"product_id\": \"$VIP_PRODUCT_ID\",
    \"name\": \"VIP Monthly Plan\",
    \"description\": \"VIP membership - \$4.99/month\",
    \"billing_cycles\": [{
      \"frequency\": {
        \"interval_unit\": \"MONTH\",
        \"interval_count\": 1
      },
      \"tenure_type\": \"REGULAR\",
      \"sequence\": 1,
      \"total_cycles\": 0,
      \"pricing_scheme\": {
        \"fixed_price\": {
          \"value\": \"4.99\",
          \"currency_code\": \"USD\"
        }
      }
    }],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    }
  }")

VIP_PLAN_ID=$(echo $VIP_PLAN | jq -r '.id')
echo "VIP Plan ID: $VIP_PLAN_ID"

# Output summary
echo ""
echo "=========================================="
echo "PayPal Setup Complete!"
echo "=========================================="
echo ""
echo "Add these to your .env.local:"
echo ""
echo "NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID=$PREMIUM_PLAN_ID"
echo "NEXT_PUBLIC_PAYPAL_VIP_PLAN_ID=$VIP_PLAN_ID"
echo ""
echo "Also add to wrangler.jsonc vars section:"
echo ""
echo "\"NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID\": \"$PREMIUM_PLAN_ID\","
echo "\"NEXT_PUBLIC_PAYPAL_VIP_PLAN_ID\": \"$VIP_PLAN_ID\""
echo ""
