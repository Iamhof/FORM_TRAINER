import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../../../create-context.js';
import { getProfileByUserId } from '../../../../lib/auth.js';

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  const profile = await getProfileByUserId(ctx.userId);

  if (!profile) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Profile not found',
    });
  }

  // Map database snake_case to API camelCase
  return {
    id: profile.id,
    email: profile.email ?? ctx.userEmail ?? '',
    name: profile.name ?? '',
    is_pt: profile.is_pt,
    role: profile.role,
    accentColor: profile.accent_color ?? '#A855F7', // Map DB snake_case to API camelCase
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
});

