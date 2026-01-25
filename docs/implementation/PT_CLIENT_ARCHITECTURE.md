# PT/Client Feature Architecture Plan

## Overview
This document outlines the architecture for adding Personal Trainer (PT) and Client relationship features to your fitness app using your current tRPC + Supabase setup.

---

## 1. Database Schema Changes

### New Tables to Create

#### A. `user_roles` Table
Tracks whether a user is a regular user, PT, or both.

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'pt')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "Users can read own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);
```

**Why:** A user can be both a client AND a PT. This table allows flexible role assignment.

---

#### B. `pt_client_relationships` Table
Manages the connection between PTs and their clients.

```sql
CREATE TABLE pt_client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pt_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pt_id, client_id),
  CHECK (pt_id != client_id)
);

CREATE INDEX idx_pt_client_pt_id ON pt_client_relationships(pt_id);
CREATE INDEX idx_pt_client_client_id ON pt_client_relationships(client_id);
CREATE INDEX idx_pt_client_status ON pt_client_relationships(status);

ALTER TABLE pt_client_relationships ENABLE ROW LEVEL SECURITY;

-- PTs can see their client relationships
CREATE POLICY "PTs can manage their clients" ON pt_client_relationships
  FOR ALL USING (auth.uid() = pt_id);

-- Clients can see their PT relationships
CREATE POLICY "Clients can see their PTs" ON pt_client_relationships
  FOR SELECT USING (auth.uid() = client_id);

-- Clients can update their relationship status (accept/decline)
CREATE POLICY "Clients can update relationship status" ON pt_client_relationships
  FOR UPDATE USING (auth.uid() = client_id);

-- Trigger for updated_at
CREATE TRIGGER update_pt_client_relationships_updated_at
  BEFORE UPDATE ON pt_client_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Why:** 
- `status` tracks invitation lifecycle: pending → active (or inactive if declined)
- Separate policies allow PTs to manage and clients to view/accept
- Prevents self-assignment with CHECK constraint

---

#### C. Update `programmes` Table
Add fields to support PT-created programmes shared with clients.

```sql
-- Add new columns to existing programmes table
ALTER TABLE programmes
  ADD COLUMN created_by_pt_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN shared_with_client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN is_template BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_programmes_created_by_pt ON programmes(created_by_pt_id);
CREATE INDEX idx_programmes_shared_with_client ON programmes(shared_with_client_id);

-- Update RLS policies for programmes
DROP POLICY IF EXISTS "Users can manage own programmes" ON programmes;

-- Users can see their own programmes
CREATE POLICY "Users can see own programmes" ON programmes
  FOR SELECT USING (user_id = auth.uid());

-- Users can see programmes shared with them by their PT
CREATE POLICY "Clients can see PT-shared programmes" ON programmes
  FOR SELECT USING (
    shared_with_client_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM pt_client_relationships 
      WHERE pt_id = created_by_pt_id 
      AND client_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Users can create their own programmes
CREATE POLICY "Users can create own programmes" ON programmes
  FOR INSERT WITH CHECK (user_id = auth.uid() AND created_by_pt_id IS NULL);

-- PTs can create programmes for their clients
CREATE POLICY "PTs can create programmes for clients" ON programmes
  FOR INSERT WITH CHECK (
    created_by_pt_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM pt_client_relationships 
      WHERE pt_id = auth.uid() 
      AND client_id = shared_with_client_id 
      AND status = 'active'
    )
  );

-- Users can update/delete their own programmes
CREATE POLICY "Users can manage own programmes" ON programmes
  FOR UPDATE USING (user_id = auth.uid() AND created_by_pt_id IS NULL);

CREATE POLICY "Users can delete own programmes" ON programmes
  FOR DELETE USING (user_id = auth.uid() AND created_by_pt_id IS NULL);

-- PTs can update/delete programmes they created for clients
CREATE POLICY "PTs can manage client programmes" ON programmes
  FOR UPDATE USING (created_by_pt_id = auth.uid());

CREATE POLICY "PTs can delete client programmes" ON programmes
  FOR DELETE USING (created_by_pt_id = auth.uid());
```

**Why:**
- `created_by_pt_id`: Tracks which PT created the programme (NULL for self-created)
- `shared_with_client_id`: Links programme to specific client
- `is_template`: Allows PTs to save reusable programme templates
- Complex RLS policies ensure:
  - Clients see their own + PT-shared programmes
  - PTs can only share with active clients
  - Users maintain control over self-created programmes

---

#### D. `client_progress_sharing` Table
Controls what progress data clients share with their PT.

```sql
CREATE TABLE client_progress_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pt_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_workouts BOOLEAN DEFAULT TRUE,
  share_analytics BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, pt_id)
);

CREATE INDEX idx_progress_sharing_client_id ON client_progress_sharing(client_id);
CREATE INDEX idx_progress_sharing_pt_id ON client_progress_sharing(pt_id);

ALTER TABLE client_progress_sharing ENABLE ROW LEVEL SECURITY;

-- Clients control their sharing settings
CREATE POLICY "Clients can manage sharing settings" ON client_progress_sharing
  FOR ALL USING (auth.uid() = client_id);

-- PTs can view sharing settings
CREATE POLICY "PTs can view sharing settings" ON client_progress_sharing
  FOR SELECT USING (auth.uid() = pt_id);

-- Trigger for updated_at
CREATE TRIGGER update_progress_sharing_updated_at
  BEFORE UPDATE ON client_progress_sharing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Why:** Privacy control - clients decide what data their PT can see.

---

#### E. Update `workouts` and `analytics` RLS Policies

```sql
-- Update workouts policies to allow PT access
DROP POLICY IF EXISTS "Users can manage own workouts" ON workouts;

CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL USING (user_id = auth.uid());

-- PTs can view client workouts if sharing is enabled
CREATE POLICY "PTs can view client workouts" ON workouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_progress_sharing cps
      JOIN pt_client_relationships pcr ON pcr.pt_id = cps.pt_id AND pcr.client_id = cps.client_id
      WHERE cps.pt_id = auth.uid()
      AND cps.client_id = workouts.user_id
      AND cps.share_workouts = TRUE
      AND pcr.status = 'active'
    )
  );

-- Update analytics policies to allow PT access
DROP POLICY IF EXISTS "Users can manage own analytics" ON analytics;

CREATE POLICY "Users can manage own analytics" ON analytics
  FOR ALL USING (user_id = auth.uid());

-- PTs can view client analytics if sharing is enabled
CREATE POLICY "PTs can view client analytics" ON analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_progress_sharing cps
      JOIN pt_client_relationships pcr ON pcr.pt_id = cps.pt_id AND pcr.client_id = cps.client_id
      WHERE cps.pt_id = auth.uid()
      AND cps.client_id = analytics.user_id
      AND cps.share_analytics = TRUE
      AND pcr.status = 'active'
    )
  );
```

**Why:** PTs can only view client data if:
1. Active PT-client relationship exists
2. Client has enabled sharing for that data type

---

## 2. Updated TypeScript Types

Add these to `types/database.ts`:

```typescript
export type UserRole = 'client' | 'pt';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export type RelationshipStatus = 'pending' | 'active' | 'inactive';

export interface PTClientRelationship {
  id: string;
  pt_id: string;
  client_id: string;
  status: RelationshipStatus;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientProgressSharing {
  id: string;
  client_id: string;
  pt_id: string;
  share_workouts: boolean;
  share_analytics: boolean;
  created_at: string;
  updated_at: string;
}

// Update existing Programme interface
export interface Programme {
  id: string;
  user_id: string;
  name: string;
  days: number;
  weeks: number;
  exercises: ProgrammeExercise[];
  created_by_pt_id: string | null;
  shared_with_client_id: string | null;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

// Extended types for UI
export interface PTClientRelationshipWithUser extends PTClientRelationship {
  client?: User;
  pt?: User;
}

export interface ProgrammeWithCreator extends Programme {
  creator?: User;
}
```

---

## 3. tRPC Procedures

### A. PT Role Management

**File:** `backend/trpc/routes/pt/register/route.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabase } from '../../../../../lib/supabase';

export const registerAsPTProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    // Check if already a PT
    const { data: existing } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('role', 'pt')
      .single();

    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is already registered as a PT',
      });
    }

    // Add PT role
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: ctx.userId,
        role: 'pt',
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering as PT:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register as PT',
      });
    }

    return data;
  });
```

---

### B. Client Invitation

**File:** `backend/trpc/routes/pt/invite-client/route.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabase } from '../../../../../lib/supabase';

export const inviteClientProcedure = protectedProcedure
  .input(
    z.object({
      clientEmail: z.string().email(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // Verify user is a PT
    const { data: ptRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('role', 'pt')
      .single();

    if (!ptRole) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only PTs can invite clients',
      });
    }

    // Find client by email
    const { data: client, error: clientError } = await supabase
      .from('users')
      .select('*')
      .eq('email', input.clientEmail)
      .single();

    if (clientError || !client) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found with that email',
      });
    }

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('pt_client_relationships')
      .select('*')
      .eq('pt_id', ctx.userId)
      .eq('client_id', client.id)
      .single();

    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Relationship already exists',
      });
    }

    // Create invitation
    const { data: relationship, error } = await supabase
      .from('pt_client_relationships')
      .insert({
        pt_id: ctx.userId,
        client_id: client.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create invitation',
      });
    }

    // Create default sharing settings
    await supabase
      .from('client_progress_sharing')
      .insert({
        client_id: client.id,
        pt_id: ctx.userId,
        share_workouts: true,
        share_analytics: true,
      });

    return relationship;
  });
```

---

### C. Client Response to Invitation

**File:** `backend/trpc/routes/client/respond-invitation/route.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabase } from '../../../../../lib/supabase';

export const respondToInvitationProcedure = protectedProcedure
  .input(
    z.object({
      relationshipId: z.string().uuid(),
      accept: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { relationshipId, accept } = input;

    // Verify relationship exists and is for this user
    const { data: relationship } = await supabase
      .from('pt_client_relationships')
      .select('*')
      .eq('id', relationshipId)
      .eq('client_id', ctx.userId)
      .eq('status', 'pending')
      .single();

    if (!relationship) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invitation not found',
      });
    }

    // Update status
    const { data, error } = await supabase
      .from('pt_client_relationships')
      .update({
        status: accept ? 'active' : 'inactive',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', relationshipId)
      .select()
      .single();

    if (error) {
      console.error('Error responding to invitation:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to respond to invitation',
      });
    }

    return data;
  });
```

---

### D. List Clients (for PT)

**File:** `backend/trpc/routes/pt/list-clients/route.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabase } from '../../../../../lib/supabase';

export const listClientsProcedure = protectedProcedure
  .input(
    z.object({
      status: z.enum(['pending', 'active', 'inactive']).optional(),
    }).optional()
  )
  .query(async ({ ctx, input }) => {
    let query = supabase
      .from('pt_client_relationships')
      .select(`
        *,
        client:users!client_id(id, email, name, created_at)
      `)
      .eq('pt_id', ctx.userId)
      .order('created_at', { ascending: false });

    if (input?.status) {
      query = query.eq('status', input.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch clients',
      });
    }

    return data || [];
  });
```

---

### E. Create Programme for Client (PT)

**File:** `backend/trpc/routes/pt/create-client-programme/route.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabase } from '../../../../../lib/supabase';

const exerciseSchema = z.object({
  day: z.number(),
  exerciseId: z.string(),
  sets: z.number(),
  reps: z.string(),
  rest: z.number(),
});

export const createClientProgrammeProcedure = protectedProcedure
  .input(
    z.object({
      clientId: z.string().uuid(),
      name: z.string().min(1),
      days: z.number().min(1),
      weeks: z.number().min(1),
      exercises: z.array(exerciseSchema),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { clientId, name, days, weeks, exercises } = input;

    // Verify PT-client relationship is active
    const { data: relationship } = await supabase
      .from('pt_client_relationships')
      .select('*')
      .eq('pt_id', ctx.userId)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single();

    if (!relationship) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No active relationship with this client',
      });
    }

    // Create programme
    const { data: programme, error } = await supabase
      .from('programmes')
      .insert({
        user_id: clientId,
        created_by_pt_id: ctx.userId,
        shared_with_client_id: clientId,
        name,
        days,
        weeks,
        exercises,
      })
      .select()
      .single();

    if (error || !programme) {
      console.error('Error creating client programme:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create programme',
      });
    }

    return programme;
  });
```

---

### F. View Client Progress (PT)

**File:** `backend/trpc/routes/pt/client-progress/route.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabase } from '../../../../../lib/supabase';

export const getClientProgressProcedure = protectedProcedure
  .input(
    z.object({
      clientId: z.string().uuid(),
    })
  )
  .query(async ({ ctx, input }) => {
    // Verify relationship and sharing settings
    const { data: sharing } = await supabase
      .from('client_progress_sharing')
      .select(`
        *,
        relationship:pt_client_relationships!inner(status)
      `)
      .eq('pt_id', ctx.userId)
      .eq('client_id', input.clientId)
      .single();

    if (!sharing || sharing.relationship.status !== 'active') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No access to client data',
      });
    }

    const result: any = {
      clientId: input.clientId,
      workouts: null,
      analytics: null,
    };

    // Fetch workouts if shared
    if (sharing.share_workouts) {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', input.clientId)
        .order('completed_at', { ascending: false })
        .limit(20);

      result.workouts = workouts || [];
    }

    // Fetch analytics if shared
    if (sharing.share_analytics) {
      const { data: analytics } = await supabase
        .from('analytics')
        .select('*')
        .eq('user_id', input.clientId)
        .order('date', { ascending: false })
        .limit(100);

      result.analytics = analytics || [];
    }

    return result;
  });
```

---

### G. Update Sharing Settings (Client)

**File:** `backend/trpc/routes/client/update-sharing/route.ts`

```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabase } from '../../../../../lib/supabase';

export const updateSharingSettingsProcedure = protectedProcedure
  .input(
    z.object({
      ptId: z.string().uuid(),
      shareWorkouts: z.boolean(),
      shareAnalytics: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { ptId, shareWorkouts, shareAnalytics } = input;

    const { data, error } = await supabase
      .from('client_progress_sharing')
      .update({
        share_workouts: shareWorkouts,
        share_analytics: shareAnalytics,
      })
      .eq('client_id', ctx.userId)
      .eq('pt_id', ptId)
      .select()
      .single();

    if (error) {
      console.error('Error updating sharing settings:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update sharing settings',
      });
    }

    return data;
  });
```

---

### H. List Pending Invitations (Client)

**File:** `backend/trpc/routes/client/list-invitations/route.ts`

```typescript
import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { supabase } from '../../../../../lib/supabase';

export const listInvitationsProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const { data, error } = await supabase
      .from('pt_client_relationships')
      .select(`
        *,
        pt:users!pt_id(id, email, name)
      `)
      .eq('client_id', ctx.userId)
      .eq('status', 'pending')
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch invitations',
      });
    }

    return data || [];
  });
```

---

## 4. Update App Router

**File:** `backend/trpc/app-router.ts`

Add the new procedures to your router:

```typescript
import { router } from './create-context';
import { hiProcedure } from './routes/example/hi/route';
import { signupProcedure } from './routes/auth/signup/route';
import { signinProcedure } from './routes/auth/signin/route';
import { meProcedure } from './routes/auth/me/route';
import { createProgrammeProcedure } from './routes/programmes/create/route';
import { listProgrammesProcedure } from './routes/programmes/list/route';
import { getProgrammeProcedure } from './routes/programmes/get/route';
import { deleteProgrammeProcedure } from './routes/programmes/delete/route';
import { logWorkoutProcedure } from './routes/workouts/log/route';
import { workoutHistoryProcedure } from './routes/workouts/history/route';
import { getAnalyticsProcedure } from './routes/analytics/get/route';
import { syncAnalyticsProcedure } from './routes/analytics/sync/route';

// PT procedures
import { registerAsPTProcedure } from './routes/pt/register/route';
import { inviteClientProcedure } from './routes/pt/invite-client/route';
import { listClientsProcedure } from './routes/pt/list-clients/route';
import { createClientProgrammeProcedure } from './routes/pt/create-client-programme/route';
import { getClientProgressProcedure } from './routes/pt/client-progress/route';

// Client procedures
import { respondToInvitationProcedure } from './routes/client/respond-invitation/route';
import { updateSharingSettingsProcedure } from './routes/client/update-sharing/route';
import { listInvitationsProcedure } from './routes/client/list-invitations/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  auth: router({
    signup: signupProcedure,
    signin: signinProcedure,
    me: meProcedure,
  }),
  programmes: router({
    create: createProgrammeProcedure,
    list: listProgrammesProcedure,
    get: getProgrammeProcedure,
    delete: deleteProgrammeProcedure,
  }),
  workouts: router({
    log: logWorkoutProcedure,
    history: workoutHistoryProcedure,
  }),
  analytics: router({
    get: getAnalyticsProcedure,
    sync: syncAnalyticsProcedure,
  }),
  pt: router({
    register: registerAsPTProcedure,
    inviteClient: inviteClientProcedure,
    listClients: listClientsProcedure,
    createClientProgramme: createClientProgrammeProcedure,
    getClientProgress: getClientProgressProcedure,
  }),
  client: router({
    respondToInvitation: respondToInvitationProcedure,
    updateSharing: updateSharingSettingsProcedure,
    listInvitations: listInvitationsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
```

---

## 5. Key Architecture Decisions Explained

### Why tRPC Instead of RLS?

**Your current setup uses tRPC for business logic + RLS for data security.** This is the BEST approach because:

✅ **tRPC handles:**
- Complex business logic (e.g., "verify PT-client relationship before creating programme")
- Multi-table operations
- Validation and error handling
- Easy to test and debug

✅ **RLS provides:**
- Database-level security (defense in depth)
- Protection even if tRPC has bugs
- Automatic filtering of queries

### Can You Switch to Pure RLS Later?

**Yes, but you don't need to.** Your current hybrid approach is industry best practice:

```
User Request → tRPC (business logic) → Supabase (RLS security check) → Data
```

Even if you add more complex RLS policies, keep tRPC for business logic. RLS is your safety net, not your primary logic layer.

---

## 6. Implementation Roadmap

### Phase 1: Database Setup (30 mins)
1. Run all SQL commands in Supabase SQL Editor
2. Verify tables created in Table Editor
3. Test RLS policies with sample data

### Phase 2: Backend (2-3 hours)
1. Update `types/database.ts` with new types
2. Create all tRPC procedure files
3. Update `app-router.ts`
4. Test with API client (Postman/Insomnia)

### Phase 3: Frontend (4-6 hours)
1. Create PT registration screen
2. Create client invitation flow
3. Update programme list to show PT-shared programmes
4. Create PT dashboard to view clients
5. Create client settings for sharing preferences
6. Add invitation notifications

### Phase 4: Testing (2 hours)
1. Test PT registration
2. Test invitation flow (send, accept, decline)
3. Test programme sharing
4. Test progress viewing with different sharing settings
5. Test data isolation between users

---

## 7. Example User Flows

### Flow 1: PT Invites Client
```
1. PT clicks "Become a PT" → registerAsPT()
2. PT enters client email → inviteClient(email)
3. Client sees notification → listInvitations()
4. Client accepts → respondToInvitation(id, true)
5. Relationship status: pending → active
```

### Flow 2: PT Creates Programme for Client
```
1. PT views client list → listClients()
2. PT clicks "Create Programme" for client
3. PT designs programme → createClientProgramme(clientId, ...)
4. Programme saved with:
   - user_id = client's ID
   - created_by_pt_id = PT's ID
   - shared_with_client_id = client's ID
5. Client sees programme in their list (RLS allows it)
```

### Flow 3: PT Views Client Progress
```
1. PT clicks on client → getClientProgress(clientId)
2. Backend checks:
   - Active relationship exists?
   - Sharing enabled for workouts/analytics?
3. Returns only data client has shared
4. PT sees filtered progress data
```

---

## 8. Security Considerations

### Data Isolation
- ✅ RLS ensures users can only see their own data
- ✅ PT can only see client data if relationship is active + sharing enabled
- ✅ Clients can revoke access anytime by changing sharing settings

### Privacy Controls
- ✅ Clients control what data PTs see (workouts, analytics, or both)
- ✅ Clients can decline invitations
- ✅ Clients can end relationships (set status to inactive)

### Validation
- ✅ tRPC validates all inputs with Zod schemas
- ✅ Database constraints prevent invalid data (CHECK, UNIQUE, FOREIGN KEY)
- ✅ RLS provides defense in depth

---

## 9. Future Enhancements

### Easy Additions
- Programme templates (PT saves reusable programmes)
- Messaging between PT and client
- Progress photos sharing
- Workout feedback/comments from PT
- Client goals tracking

### Advanced Features
- Multiple PT support (client has multiple PTs)
- PT teams (multiple PTs share clients)
- Payment integration (subscription for PT services)
- Video exercise library
- Nutrition tracking

---

## Summary

This architecture gives you:

1. **Flexible Roles**: Users can be clients, PTs, or both
2. **Secure Sharing**: Clients control what data PTs see
3. **Scalable**: Easy to add features like messaging, payments, etc.
4. **Production-Ready**: Proper security with RLS + tRPC validation
5. **Future-Proof**: Can add advanced features without major refactoring

The hybrid tRPC + RLS approach is perfect for your use case and is how most production apps are built. You get the best of both worlds: flexible business logic + database-level security.
