import { logger } from './logger';
import { supabaseAdmin } from '../backend/lib/auth';

type AuditAction = 
  | 'user_login'
  | 'user_logout'
  | 'profile_update'
  | 'programme_create'
  | 'programme_delete'
  | 'programme_share'
  | 'programme_unshare'
  | 'pt_invite_sent'
  | 'pt_invite_accepted'
  | 'pt_invite_rejected'
  | 'pt_invite_cancelled'
  | 'client_removed'
  | 'workout_logged'
  | 'body_metrics_logged'
  | 'body_metrics_deleted'
  | 'leaderboard_opt_in'
  | 'leaderboard_opt_out'
  | 'leaderboard_profile_update';

interface AuditLogEntry {
  user_id: string;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Audit log service for tracking sensitive operations
 * Logs both to database (if audit_logs table exists) and to application logs
 */
class AuditLogService {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const sanitizedMetadata = entry.metadata ? logger.sanitize(entry.metadata) : undefined;

    // Always log to application logs
    logger.info('[AuditLog]', {
      userId: entry.user_id,
      action: entry.action,
      resourceType: entry.resource_type,
      resourceId: entry.resource_id,
      metadata: sanitizedMetadata,
    });

    // Try to log to database if audit_logs table exists
    try {
      // Check if audit_logs table exists by attempting to insert
      // If it doesn't exist, this will fail gracefully
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: entry.user_id,
          action: entry.action,
          resource_type: entry.resource_type || null,
          resource_id: entry.resource_id || null,
          metadata: sanitizedMetadata || null,
          ip_address: entry.ip_address || null,
          user_agent: entry.user_agent || null,
          created_at: new Date().toISOString(),
        });

      if (error && !error.message.includes('relation "audit_logs" does not exist')) {
        logger.warn('[AuditLog] Failed to write to database:', error);
      }
    } catch (error) {
      // Table doesn't exist, that's okay - we still logged to application logs
      logger.debug('[AuditLog] Audit logs table not found, skipping database write');
    }
  }

  /**
   * Helper to extract request metadata from tRPC context
   */
  extractRequestMetadata(ctx: { req?: Request; requestId?: string }): {
    ip_address?: string;
    user_agent?: string;
  } {
    if (!ctx.req) return {};

    const ipAddress = 
      ctx.req.headers.get('x-forwarded-for')?.split(',')[0] ||
      ctx.req.headers.get('x-real-ip') ||
      undefined;
    
    const userAgent = ctx.req.headers.get('user-agent') || undefined;

    return {
      ip_address: ipAddress,
      user_agent: userAgent,
    };
  }
}

export const auditLog = new AuditLogService();

