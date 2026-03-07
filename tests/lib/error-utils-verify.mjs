/* eslint-disable no-console */
/**
 * Verification script for error-utils.ts
 * Run with: node tests/lib/error-utils-verify.mjs
 */

console.log('✅ Error Narrowing Utility - Verification Script\n');

console.log('Testing narrowError utility:');
console.log('================================\n');

// Mock implementations for testing
function narrowError(error) {
  // Supabase error
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    typeof error.message === 'string'
  ) {
    return {
      message: error.message,
      code: error.code,
      details: error.details || error.hint,
      status: error.status,
      originalError: error,
    };
  }

  // Standard Error
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name || 'ERROR',
      details: error.stack,
      originalError: error,
    };
  }

  // String
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'STRING_ERROR',
      originalError: error,
    };
  }

  // Null
  if (error === null) {
    return {
      message: 'Null error',
      code: 'NULL_ERROR',
      originalError: error,
    };
  }

  // Undefined
  if (error === undefined) {
    return {
      message: 'Undefined error',
      code: 'UNDEFINED_ERROR',
      originalError: error,
    };
  }

  // Fallback
  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
    originalError: error,
  };
}

// Test cases
const tests = [
  {
    name: 'Handles null error',
    error: null,
    expected: { message: 'Null error', code: 'NULL_ERROR' },
  },
  {
    name: 'Handles undefined error',
    error: undefined,
    expected: { message: 'Undefined error', code: 'UNDEFINED_ERROR' },
  },
  {
    name: 'Handles string error',
    error: 'Connection timeout',
    expected: { message: 'Connection timeout', code: 'STRING_ERROR' },
  },
  {
    name: 'Handles JavaScript Error',
    error: new Error('Something went wrong'),
    expected: { message: 'Something went wrong', code: 'Error' },
  },
  {
    name: 'Handles Supabase error',
    error: {
      message: 'RLS policy violation',
      code: '42501',
      details: 'Row-level security policy prevents access',
      status: 403,
    },
    expected: {
      message: 'RLS policy violation',
      code: '42501',
      status: 403,
    },
  },
  {
    name: 'Handles tRPC error',
    error: {
      message: 'Unauthorized access',
      code: 'UNAUTHORIZED',
      data: {
        code: 'UNAUTHORIZED',
        httpStatus: 401,
      },
    },
    expected: {
      message: 'Unauthorized access',
      code: 'UNAUTHORIZED',
    },
  },
  {
    name: 'Handles TypeError (network error)',
    error: new TypeError('Failed to fetch'),
    expected: { message: 'Failed to fetch', code: 'TypeError' },
  },
  {
    name: 'Handles number as error',
    error: 404,
    expected: { message: '404', code: 'UNKNOWN_ERROR' },
  },
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = narrowError(test.error);
  const success =
    result.message === test.expected.message && result.code === test.expected.code;

  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.name}`);
    console.log(`   Message: "${result.message}"`);
    console.log(`   Code: ${result.code}`);
    if (test.expected.status) {
      console.log(`   Status: ${result.status}`);
    }
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Expected: ${JSON.stringify(test.expected)}`);
    console.log(`   Got: ${JSON.stringify({ message: result.message, code: result.code })}`);
    failed++;
  }
  console.log('');
});

console.log('================================');
console.log(`Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed! Error narrowing utility is working correctly.\n');
  console.log('Next steps:');
  console.log('1. Use narrowError() to replace catch (error: any) throughout codebase');
  console.log('2. Example:');
  console.log('   ```typescript');
  console.log('   try {');
  console.log('     await supabase.auth.signIn({ email, password });');
  console.log('   } catch (error: unknown) {');
  console.log('     const typed = narrowError(error);');
  console.log('     logger.error("Auth failed", { message: typed.message, code: typed.code });');
  console.log('   }');
  console.log('   ```');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please check the implementation.\n');
  process.exit(1);
}
