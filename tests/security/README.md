# Security Smoke Tests

Automated security testing suite to verify vulnerabilities and validate fixes from the Deep System Audit.

## Quick Start

```bash
# 1. Start the backend server
cd Form-app-main
bun run backend:dev &

# 2. Set authentication tokens (get from your test environment)
export TEST_TOKEN="your-test-user-jwt-token"
export PT_TOKEN="your-pt-user-jwt-token"
export TEST_CLIENT_ID="valid-client-uuid"

# 3. Run the smoke tests
bash tests/security/smoke-test.sh
```

## Test Coverage

### Test #1: XSS in Leaderboard Display Name (CRITICAL)
- **Issue**: `<script>` tags accepted in display names
- **File**: `backend/trpc/routes/leaderboard/update-profile/route.ts:10-11`
- **Payload**: `<img src=x onerror="alert(1)">`
- **Expected BEFORE fix**: 200 OK (vulnerable)
- **Expected AFTER fix**: 400 Bad Request (protected)

### Test #2: SQL Injection in Rankings (CRITICAL)
- **Issue**: Dynamic column construction
- **File**: `backend/trpc/routes/leaderboard/get-rankings/route.ts:19-54`
- **Payload**: `total_volume; DROP TABLE users;--`
- **Expected**: 400 Bad Request (Zod enum blocks this)
- **Status**: ✅ Already protected by Zod validation

### Test #3: Date Injection in Analytics (CRITICAL)
- **Issue**: Unvalidated date strings
- **File**: `backend/trpc/routes/pt/get-client-analytics/route.ts:8-14`
- **Payload**: `2025-01-01' OR '1'='1`
- **Expected BEFORE fix**: 200 OK or 500 error (vulnerable)
- **Expected AFTER fix**: 400 Bad Request (protected)

## Test Results Interpretation

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ PROTECTED/FIXED | Attack blocked | None - validation working |
| ❌ VULNERABLE | Exploit succeeded | **IMMEDIATE FIX REQUIRED** |
| ⚠️ SKIPPED | Missing auth tokens | Provide tokens and re-run |
| ⚠️ UNKNOWN | Unexpected response | Investigate manually |

## Authentication Tokens

### Getting TEST_TOKEN (Regular User)

1. Sign up a test user in your app
2. Check browser DevTools → Network → Find auth request
3. Extract JWT from response or headers
4. Export: `export TEST_TOKEN="eyJhbG..."`

### Getting PT_TOKEN (Personal Trainer)

1. Sign up a PT account OR promote existing user to PT role
2. Follow same steps as TEST_TOKEN
3. Export: `export PT_TOKEN="eyJhbG..."`

### Getting TEST_CLIENT_ID

1. Create a PT-client relationship in your test environment
2. Find the client's UUID from database or API response
3. Export: `export TEST_CLIENT_ID="12345678-1234-1234-1234-123456789abc"`

## Running Without Auth

If you don't have auth tokens, the script will skip authenticated tests:

```bash
# Test #1 and #3 will be skipped
# Test #2 (SQL injection) will still run (no auth required)
bash tests/security/smoke-test.sh
```

## Output

The script generates `security-smoke-test-results.md` with:
- Timestamp
- HTTP status codes
- Pass/fail status for each test
- Interpretation guide
- Next steps

Example output:
```
════════════════════════════════════════════
  SECURITY SMOKE TEST SUITE
════════════════════════════════════════════

Test #1: XSS in Leaderboard Display Name
══════════════════════════════════════
❌ VULNERABLE - XSS payload accepted!

Test #2: SQL Injection in Rankings
══════════════════════════════════════
✅ PROTECTED - SQL injection blocked by Zod

Test #3: Date Injection in Analytics
══════════════════════════════════════
❌ VULNERABLE - Date injection not validated!

════════════════════════════════════════════
  TEST SUMMARY
════════════════════════════════════════════
⚠️  VULNERABILITIES FOUND - IMMEDIATE ACTION REQUIRED
```

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Security Smoke Tests
  env:
    TEST_TOKEN: ${{ secrets.TEST_USER_TOKEN }}
    PT_TOKEN: ${{ secrets.PT_USER_TOKEN }}
    TEST_CLIENT_ID: ${{ secrets.TEST_CLIENT_ID }}
  run: |
    bun run backend:dev &
    sleep 5  # Wait for backend to start
    bash tests/security/smoke-test.sh
```

## Troubleshooting

### Backend Not Running
```
❌ Backend is not running!
Please start the backend with: bun run backend:dev
```
**Fix**: Start backend in separate terminal: `bun run backend:dev`

### Missing Auth Tokens
```
⚠️  TEST_TOKEN not set. Using unauthenticated requests.
```
**Fix**: Export tokens as shown above

### Connection Refused
```
curl: (7) Failed to connect to localhost port 3000: Connection refused
```
**Fix**: Ensure backend is running on port 3000 (check `BACKEND_URL` env var)

### CORS Errors
If running tests from different origin:
```bash
export BACKEND_URL="https://your-backend-domain.com"
bash tests/security/smoke-test.sh
```

## Next Steps After Running Tests

### If Tests Show VULNERABLE
1. **DO NOT DEPLOY** to production
2. Implement fixes as specified in audit report:
   - **Issue #1**: Add XSS regex validation (see `audit-plan.md` line 45-60)
   - **Issue #3**: Add ISO 8601 date validation (see `audit-plan.md` line 100-130)
3. Re-run smoke tests until all show PROTECTED/FIXED
4. Run full integration test suite
5. Deploy to production

### If All Tests Show PROTECTED
1. ✅ Security baseline established
2. Continue with remaining audit fixes (performance, type safety)
3. Schedule regular smoke test runs (weekly recommended)

## Related Files

- 📋 **Audit Plan**: `C:\Users\benho\.claude\plans\dazzling-scribbling-crescent.md`
- 🛠️ **Remediation Code**: See audit plan sections for each issue
- 📊 **Verification Matrix**: Audit plan line 450-460

## Contact

For questions about security tests or audit findings:
- Review audit plan: `C:\Users\benho\.claude\plans\dazzling-scribbling-crescent.md`
- Check verification commands in audit for each issue
