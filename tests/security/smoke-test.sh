#!/bin/bash

# Security Smoke Test Suite
# Tests for vulnerabilities identified in the Deep System Audit
#
# Prerequisites:
# 1. Backend server running: bun run backend:dev
# 2. Test user authenticated with valid tokens
#
# Usage:
#   bash tests/security/smoke-test.sh
#
# Expected Results (BEFORE fixes):
#   - Test #1 (XSS): 200 OK (VULNERABLE)
#   - Test #2 (SQL Injection): 400 Bad Request (PROTECTED by Zod)
#   - Test #3 (Date Injection): 200 OK or 500 error (VULNERABLE)
#
# Expected Results (AFTER fixes):
#   - Test #1 (XSS): 400 Bad Request (FIXED)
#   - Test #2 (SQL Injection): 400 Bad Request (PROTECTED)
#   - Test #3 (Date Injection): 400 Bad Request (FIXED)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
RESULTS_FILE="security-smoke-test-results.md"

# Check if backend is running
echo -e "${BLUE}🔍 Checking if backend is running at $BACKEND_URL...${NC}"
if ! curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo -e "${YELLOW}Please start the backend with: bun run backend:dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}\n"

# Check for authentication tokens
if [ -z "$TEST_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  TEST_TOKEN not set. Using unauthenticated requests.${NC}"
    echo -e "${YELLOW}   Set TEST_TOKEN environment variable for authenticated tests.${NC}\n"
fi

if [ -z "$PT_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  PT_TOKEN not set. PT-specific tests will be skipped.${NC}\n"
fi

# Initialize results file
cat > "$RESULTS_FILE" << 'EOF'
# Security Smoke Test Results

**Date:** $(date)
**Backend URL:** $BACKEND_URL

## Test Results

| Test | Vulnerability | Status | HTTP Code | Details |
|------|--------------|--------|-----------|---------|
EOF

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  SECURITY SMOKE TEST SUITE${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

# ============================================================================
# TEST #1: XSS IN LEADERBOARD DISPLAY NAME
# ============================================================================

echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo -e "${YELLOW}Test #1: XSS in Leaderboard Display Name${NC}"
echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo -e "Issue: #1 (CRITICAL)"
echo -e "File: backend/trpc/routes/leaderboard/update-profile/route.ts:10-11\n"

XSS_PAYLOAD='<img src=x onerror="alert(1)">'
echo -e "Payload: ${RED}$XSS_PAYLOAD${NC}\n"

if [ -z "$TEST_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Skipped (no TEST_TOKEN)${NC}\n"
    TEST1_STATUS="SKIPPED"
    TEST1_CODE="N/A"
else
    echo -e "Sending request..."
    TEST1_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BACKEND_URL/trpc/leaderboard.updateProfile" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TEST_TOKEN" \
      -d "{\"display_name\": \"$XSS_PAYLOAD\"}")

    TEST1_CODE=$(echo "$TEST1_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    TEST1_BODY=$(echo "$TEST1_RESPONSE" | sed '/HTTP_CODE:/d')

    echo -e "HTTP Status: $TEST1_CODE"
    echo -e "Response: $TEST1_BODY\n"

    if [ "$TEST1_CODE" = "200" ]; then
        echo -e "${RED}❌ VULNERABLE${NC} - XSS payload accepted!"
        echo -e "${RED}   Malicious JavaScript stored in database.${NC}"
        TEST1_STATUS="VULNERABLE"
    elif [ "$TEST1_CODE" = "400" ]; then
        echo -e "${GREEN}✅ PROTECTED${NC} - XSS payload rejected (400 Bad Request)"
        TEST1_STATUS="FIXED"
    else
        echo -e "${YELLOW}⚠️  UNEXPECTED${NC} - HTTP $TEST1_CODE"
        TEST1_STATUS="UNKNOWN"
    fi
fi

echo -e "\n${BLUE}Expected BEFORE fix:${NC} 200 OK (accepts payload)"
echo -e "${BLUE}Expected AFTER fix:${NC}  400 Bad Request (rejects payload)\n"

# ============================================================================
# TEST #2: SQL INJECTION IN LEADERBOARD RANKINGS
# ============================================================================

echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo -e "${YELLOW}Test #2: SQL Injection in Rankings${NC}"
echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo -e "Issue: #2 (CRITICAL)"
echo -e "File: backend/trpc/routes/leaderboard/get-rankings/route.ts:19-54\n"

SQL_PAYLOAD='total_volume; DROP TABLE users;--'
echo -e "Payload: ${RED}$SQL_PAYLOAD${NC}\n"

echo -e "Sending request..."
TEST2_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BACKEND_URL/trpc/leaderboard.getRankings" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"$SQL_PAYLOAD\"}")

TEST2_CODE=$(echo "$TEST2_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
TEST2_BODY=$(echo "$TEST2_RESPONSE" | sed '/HTTP_CODE:/d')

echo -e "HTTP Status: $TEST2_CODE"
echo -e "Response: $TEST2_BODY\n"

if [ "$TEST2_CODE" = "400" ]; then
    echo -e "${GREEN}✅ PROTECTED${NC} - SQL injection blocked by Zod enum validation"
    TEST2_STATUS="PROTECTED"
elif [ "$TEST2_CODE" = "200" ]; then
    echo -e "${RED}❌ VULNERABLE${NC} - SQL injection may have executed!"
    TEST2_STATUS="VULNERABLE"
else
    echo -e "${YELLOW}⚠️  UNEXPECTED${NC} - HTTP $TEST2_CODE"
    TEST2_STATUS="UNKNOWN"
fi

echo -e "\n${BLUE}Expected:${NC} 400 Bad Request (Zod enum validation blocks this)\n"

# ============================================================================
# TEST #3: DATE INJECTION IN CLIENT ANALYTICS
# ============================================================================

echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo -e "${YELLOW}Test #3: Date Injection in Analytics${NC}"
echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo -e "Issue: #3 (CRITICAL)"
echo -e "File: backend/trpc/routes/pt/get-client-analytics/route.ts:8-14\n"

DATE_PAYLOAD="2025-01-01' OR '1'='1"
echo -e "Payload: ${RED}$DATE_PAYLOAD${NC}\n"

if [ -z "$PT_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Skipped (no PT_TOKEN)${NC}\n"
    TEST3_STATUS="SKIPPED"
    TEST3_CODE="N/A"
else
    # Need a valid client ID - using placeholder
    CLIENT_ID="${TEST_CLIENT_ID:-00000000-0000-0000-0000-000000000000}"

    echo -e "Sending request..."
    TEST3_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BACKEND_URL/trpc/pt.getClientAnalytics" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PT_TOKEN" \
      -d "{\"clientId\": \"$CLIENT_ID\", \"startDate\": \"$DATE_PAYLOAD\"}")

    TEST3_CODE=$(echo "$TEST3_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    TEST3_BODY=$(echo "$TEST3_RESPONSE" | sed '/HTTP_CODE:/d')

    echo -e "HTTP Status: $TEST3_CODE"
    echo -e "Response: $TEST3_BODY\n"

    if [ "$TEST3_CODE" = "400" ]; then
        echo -e "${GREEN}✅ PROTECTED${NC} - Date injection blocked (400 Bad Request)"
        TEST3_STATUS="FIXED"
    elif [ "$TEST3_CODE" = "200" ] || [ "$TEST3_CODE" = "500" ]; then
        echo -e "${RED}❌ VULNERABLE${NC} - Date injection not validated!"
        TEST3_STATUS="VULNERABLE"
    else
        echo -e "${YELLOW}⚠️  UNEXPECTED${NC} - HTTP $TEST3_CODE"
        TEST3_STATUS="UNKNOWN"
    fi
fi

echo -e "\n${BLUE}Expected BEFORE fix:${NC} 200 OK or 500 error (malformed date)"
echo -e "${BLUE}Expected AFTER fix:${NC}  400 Bad Request (date validation)\n"

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TEST SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

# Update results file
cat >> "$RESULTS_FILE" << EOF
| #1   | XSS Display Name | $TEST1_STATUS | $TEST1_CODE | Leaderboard profile update |
| #2   | SQL Injection | $TEST2_STATUS | $TEST2_CODE | Enum validation working |
| #3   | Date Injection | $TEST3_STATUS | $TEST3_CODE | PT client analytics |

## Interpretation

**VULNERABLE**: Exploit succeeded - immediate fix required
**PROTECTED/FIXED**: Attack blocked - validation working
**SKIPPED**: Test not run (missing auth tokens)
**UNKNOWN**: Unexpected response code

## Next Steps

1. Review vulnerable endpoints immediately
2. Implement fixes as specified in the audit report:
   - Issue #1: Add XSS regex validation to display_name field
   - Issue #3: Add ISO 8601 date validation with Zod

3. Re-run this smoke test after fixes to verify remediation
4. Deploy fixes to production only after all tests show PROTECTED/FIXED status

## How to Run

\`\`\`bash
# Set auth tokens
export TEST_TOKEN="your-test-user-token"
export PT_TOKEN="your-pt-user-token"
export TEST_CLIENT_ID="valid-client-uuid"

# Start backend
bun run backend:dev &

# Run smoke tests
bash tests/security/smoke-test.sh
\`\`\`
EOF

echo -e "Test Results:"
echo -e "  #1 (XSS):          $TEST1_STATUS (HTTP $TEST1_CODE)"
echo -e "  #2 (SQL Injection): $TEST2_STATUS (HTTP $TEST2_CODE)"
echo -e "  #3 (Date Injection): $TEST3_STATUS (HTTP $TEST3_CODE)\n"

echo -e "${GREEN}Results saved to: $RESULTS_FILE${NC}\n"

# Exit code
if [[ "$TEST1_STATUS" == "VULNERABLE" ]] || [[ "$TEST3_STATUS" == "VULNERABLE" ]]; then
    echo -e "${RED}⚠️  VULNERABILITIES FOUND - IMMEDIATE ACTION REQUIRED${NC}"
    exit 1
elif [[ "$TEST1_STATUS" == "SKIPPED" ]] && [[ "$TEST3_STATUS" == "SKIPPED" ]]; then
    echo -e "${YELLOW}⚠️  Tests skipped - set TEST_TOKEN and PT_TOKEN to run${NC}"
    exit 2
else
    echo -e "${GREEN}✅ All enabled tests passed${NC}"
    exit 0
fi
