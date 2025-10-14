import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { verifyPassword, generateToken, supabaseAdmin } from '../../../../lib/auth';

export const signinProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { email, password } = input;

    console.log('[SIGNIN] Attempting signin for:', email);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('email', email)
      .single();

    if (error) {
      console.error('[SIGNIN] Database error:', error);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    if (!user) {
      console.log('[SIGNIN] User not found');
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    console.log('[SIGNIN] User found, verifying password');
    console.log('[SIGNIN] User has password_hash:', !!user.password_hash);
    console.log('[SIGNIN] Password hash type:', typeof user.password_hash);
    console.log('[SIGNIN] Password hash length:', user.password_hash?.length || 0);
    console.log('[SIGNIN] Password hash starts with:', user.password_hash?.substring(0, 4));

    if (!user.password_hash) {
      console.error('[SIGNIN] User has no password hash!');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Account configuration error. Please contact support.',
      });
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      console.log('[SIGNIN] Password verification failed');
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    console.log('[SIGNIN] Password verified, generating token');
    const token = generateToken({ userId: user.id, email: user.email });
    console.log('[SIGNIN] Token generated successfully');

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  });
