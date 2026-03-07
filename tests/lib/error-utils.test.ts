import { describe, test, expect } from 'vitest';

import { narrowError } from '../../lib/error-utils.js';

describe('narrowError', () => {
  test('handles null error', () => {
    const result = narrowError(null);
    expect(result.message).toBe('Null error');
    expect(result.code).toBe('NULL_ERROR');
  });

  test('handles undefined error', () => {
    const result = narrowError(undefined);
    expect(result.message).toBe('Undefined error');
    expect(result.code).toBe('UNDEFINED_ERROR');
  });

  test('handles string error', () => {
    const result = narrowError('Connection timeout');
    expect(result.message).toBe('Connection timeout');
    expect(result.code).toBe('STRING_ERROR');
  });

  test('handles standard JavaScript Error', () => {
    const error = new Error('Something went wrong');
    const result = narrowError(error);
    expect(result.message).toBe('Something went wrong');
    expect(result.code).toBe('Error');
  });

  test('handles Supabase error', () => {
    const error = {
      message: 'RLS policy violation',
      code: '42501',
      details: 'Row-level security policy prevents access',
      status: 403,
    };
    const result = narrowError(error);
    expect(result.message).toBe('RLS policy violation');
    expect(result.code).toBe('42501');
    expect(result.status).toBe(403);
  });

  test('handles tRPC error', () => {
    const error = {
      message: 'Unauthorized access',
      code: 'UNAUTHORIZED',
      data: {
        code: 'UNAUTHORIZED',
        httpStatus: 401,
      },
    };
    const result = narrowError(error);
    expect(result.message).toBe('Unauthorized access');
    expect(result.code).toBe('UNAUTHORIZED');
    expect(result.status).toBe(401);
  });

  test('handles auth error', () => {
    const error = {
      message: 'Invalid credentials',
      name: 'AuthApiError',
      status: 400,
      __isAuthError: true,
    };
    const result = narrowError(error);
    expect(result.message).toBe('Invalid credentials');
    expect(result.code).toBe('AuthApiError');
    expect(result.status).toBe(400);
  });

  test('handles network error (TypeError)', () => {
    const error = new TypeError('Failed to fetch');
    const result = narrowError(error);
    expect(result.message).toBe('Failed to fetch');
    expect(result.code).toBe('NETWORK_ERROR');
  });

  test('handles object with message property', () => {
    const error = { message: 'Custom error', customField: 123 };
    const result = narrowError(error);
    expect(result.message).toBe('Custom error');
    expect(result.code).toBe('UNKNOWN_OBJECT_ERROR');
  });

  test('handles number as error', () => {
    const result = narrowError(404);
    expect(result.message).toBe('404');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  test('handles boolean as error', () => {
    const result = narrowError(false);
    expect(result.message).toBe('false');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  test('handles array as error', () => {
    const result = narrowError(['error', 'occurred']);
    expect(result.message).toContain('error');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  test('preserves original error', () => {
    const original = new Error('Test');
    const result = narrowError(original);
    expect(result.originalError).toBe(original);
  });

  test('handles Supabase error with hint field', () => {
    const error = {
      message: 'Database error',
      code: 'PGRST116',
      hint: 'Check your query syntax',
      status: 400,
    };
    const result = narrowError(error);
    expect(result.message).toBe('Database error');
    expect(result.details).toBe('Check your query syntax');
  });
});
