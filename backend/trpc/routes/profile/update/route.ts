import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth';
import { z } from 'zod';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format. Must be #RRGGBB');

export const updateProfileProcedure = protectedProcedure
  .input(z.object({
    name: z.string().min(1, 'Name is required').optional(),
    accentColor: hexColorSchema.optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('[UPDATE_PROFILE] Updating profile for user:', ctx.userId, input);
    
    const updates: Record<string, any> = {};
    
    if (input.name !== undefined) {
      updates.name = input.name;
    }
    
    if (input.accentColor !== undefined) {
      updates.accent_color = input.accentColor;
    }

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No updates provided',
      });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('user_id', ctx.userId);

    if (error) {
      console.error('[UPDATE_PROFILE] Error updating profile:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    }

    console.log('[UPDATE_PROFILE] Profile updated successfully');
    
    return {
      success: true,
      updates,
    };
  });
