import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, is_pt, created_at, updated_at')
    .eq('id', ctx.userId)
    .single();

  if (error || !user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    is_pt: user.is_pt,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
});
