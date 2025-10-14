import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { hashPassword, generateToken, supabaseAdmin } from '../../../../lib/auth';

export const signupProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    const { email, password, name } = input;

    console.log('[SIGNUP] Starting signup for email:', email);
    console.log('[SIGNUP] Service role key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('[SIGNUP] Error checking existing user:', JSON.stringify(checkError, null, 2));
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database error while checking user',
      });
    }

    if (existingUser) {
      console.log('[SIGNUP] User already exists:', email);
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    }

    console.log('[SIGNUP] Hashing password...');
    const passwordHash = await hashPassword(password);

    console.log('[SIGNUP] Inserting user into database...');
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        is_pt: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[SIGNUP] Error creating user:');
      console.error('[SIGNUP] Error code:', error.code);
      console.error('[SIGNUP] Error message:', error.message);
      console.error('[SIGNUP] Error details:', JSON.stringify(error.details, null, 2));
      console.error('[SIGNUP] Error hint:', error.hint);
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create user: ${error.message}`,
      });
    }

    if (!newUser) {
      console.error('[SIGNUP] No user returned after insert');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user: No data returned',
      });
    }

    console.log('[SIGNUP] User created successfully:', newUser.id);

    const token = generateToken({ userId: newUser.id, email: newUser.email });

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    };
  });
