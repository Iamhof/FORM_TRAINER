import { protectedProcedure } from '../../../create-context.js';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../../../../lib/auth.js';
import { z } from 'zod';
import { logger } from '../../../../../lib/logger.js';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format. Must be #RRGGBB');

export const updateProfileProcedure = protectedProcedure
  .input(z.object({
    name: z.string().min(1, 'Name is required').optional(),
    accentColor: hexColorSchema.optional(), // API accepts camelCase
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    heightCm: z.number().int().min(50).max(300).nullable().optional(),
    weightKg: z.number().min(20).max(500).nullable().optional(),
    age: z.number().int().min(10).max(120).nullable().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    logger.debug('[UPDATE_PROFILE] Updating profile for user:', ctx.userId, input);
    
    // Map API camelCase to database snake_case
    const updates: Record<string, any> = {};
    
    if (input.name !== undefined) {
      updates.name = input.name;
    }
    
    if (input.accentColor !== undefined) {
      updates.accent_color = input.accentColor; // Map camelCase to snake_case
    }

    if (input.gender !== undefined) {
      updates.gender = input.gender;
    }

    if (input.heightCm !== undefined) {
      updates.height_cm = input.heightCm;
    }

    if (input.weightKg !== undefined) {
      updates.weight_kg = input.weightKg;
    }

    if (input.age !== undefined) {
      updates.age = input.age;
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
      logger.error('[UPDATE_PROFILE] Error updating profile:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    }

    logger.debug('[UPDATE_PROFILE] Profile updated successfully');
    
    return {
      success: true,
      updates,
    };
  });
