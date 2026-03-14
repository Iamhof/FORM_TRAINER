import crypto from "crypto";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { supabaseAdmin } from "@/backend/lib/auth";
import { appRouter } from "@/backend/trpc/app-router";

type TableMap = Record<string, Record<string, any>[]>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Asserts that a test table exists and is properly initialized
 * @throws Error if table is undefined (indicates test setup issue)
 */
function assertTableExists<T>(
  table: T[] | undefined,
  tableName: string
): asserts table is T[] {
  if (!table) {
    throw new Error(`Test setup error: ${tableName} table not initialized`);
  }
}

class MockSupabase {
  private counters: Record<string, number> = {};

  constructor(public tables: TableMap) {
    for (const [table, rows] of Object.entries(this.tables)) {
      this.tables[table] = rows.map((row) => ({ ...row }));
      this.counters[table] = rows.length;
    }
  }

  generateId(table: string) {
    const next = (this.counters[table] ?? 0) + 1;
    this.counters[table] = next;
    return `${table}-${next}`;
  }

  from(table: string) {
    if (!this.tables[table]) {
      this.tables[table] = [];
      this.counters[table] = 0;
    }
    return new MockQuery(table, this);
  }
}

class MockQuery {
  private filters: ((row: Record<string, any>) => boolean)[] = [];
  private sort?: { column: string; ascending: boolean };
  private limitCount?: number;

  constructor(private table: string, private db: MockSupabase) {}

  select(_columns?: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    const set = new Set(values);
    this.filters.push((row) => set.has(row[column]));
    return this;
  }

  order(column: string, options: { ascending?: boolean }) {
    this.sort = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async maybeSingle() {
    const rows = this.apply();
    return { data: rows[0] ? clone(rows[0]) : null, error: null };
  }

  async single() {
    const rows = this.apply();
    if (rows.length === 0) {
      return {
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      };
    }
    return { data: clone(rows[0]), error: null };
  }

  insert(payload: Record<string, any> | Record<string, any>[]) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const inserted = rows.map((row) => {
      const next = { ...row };
      if (!("id" in next)) {
        next.id = this.db.generateId(this.table);
      }
      const table = this.db.tables[this.table];
      if (table) {
        table.push(next);
      }
      return next;
    });

    return {
      select: () => ({
        single: async () => ({ data: clone(inserted[0]), error: null }),
      }),
    };
  }

  update(values: Record<string, any>) {
    const table = this.table;
    const db = this.db;
    return {
      eq: async (column: string, value: any) => {
        const tableData = db.tables[table];
        if (!tableData) return { data: [], error: null };
        const targetRows = tableData.filter((row) => row[column] === value);
        targetRows.forEach((row) => Object.assign(row, values));
        return { data: targetRows.map((row) => clone(row)), error: null };
      },
    };
  }

  delete() {
    const table = this.table;
    const db = this.db;
    return {
      eq: async (column: string, value: any) => {
        const tableData = db.tables[table];
        if (tableData) {
          db.tables[table] = tableData.filter((row) => row[column] !== value);
        }
        return { error: null };
      },
    };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: Record<string, any>[]; error: null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    const payload = { data: this.apply().map((row) => clone(row)), error: null };
    return Promise.resolve(payload).then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) {
    return Promise.resolve({ data: this.apply(), error: null }).catch(onrejected);
  }

  private apply() {
    const tableData = this.db.tables[this.table];
    if (!tableData) return [];
    let results = [...tableData];
    if (this.filters.length > 0) {
      results = results.filter((row) => this.filters.every((fn) => fn(row)));
    }
    if (this.sort) {
      const { column, ascending } = this.sort;
      results.sort((a, b) => {
        if (a[column] === b[column]) return 0;
        return a[column] > b[column] ? 1 : -1;
      });
      if (!ascending) {
        results.reverse();
      }
    }
    if (this.limitCount !== undefined && Number.isFinite(this.limitCount)) {
      results = results.slice(0, this.limitCount);
    }
    return results;
  }
}

describe("PT workflow", () => {
  const originalFrom = supabaseAdmin.from.bind(supabaseAdmin);
  const originalRpc = (supabaseAdmin as any).rpc?.bind(supabaseAdmin);
  const originalRandomBytes = crypto.randomBytes.bind(crypto);
  let mockDb: MockSupabase;

  beforeEach(() => {
    mockDb = new MockSupabase({
      pt_profile_view: [
        {
          id: "pt-1",
          email: "pt@example.com",
          name: "Pat Trainer",
          is_pt: true,
        },
        {
          id: "client-1",
          email: "client@example.com",
          name: "Casey Client",
          is_pt: false,
        },
      ],
      pt_invitations: [],
      pt_client_relationships: [],
      programmes: [
        {
          id: "programme-1",
          user_id: "pt-1",
          name: "Strength Builder",
          days: 4,
          weeks: 8,
        },
      ],
      shared_programmes: [],
    });

    (supabaseAdmin as any).from = mockDb.from.bind(mockDb);
    (supabaseAdmin as any).rpc = (fnName: string, params: Record<string, unknown>) => {
      if (fnName === 'share_programme_atomic') {
        const row = {
          id: mockDb.generateId('shared_programmes'),
          pt_id: params.p_pt_id,
          programme_id: params.p_programme_id,
          client_id: params.p_client_id,
          created_at: new Date().toISOString(),
        };
        if (!mockDb.tables.shared_programmes) {
          mockDb.tables.shared_programmes = [];
        }
        mockDb.tables.shared_programmes.push(row);
        return { data: row, error: null };
      }
      return { data: null, error: { message: `Unknown RPC: ${fnName}`, code: 'UNKNOWN' } };
    };
    (crypto.randomBytes as any) = () =>
      Buffer.from("0123456789abcdef0123456789abcdef");
  });

  afterEach(() => {
    (supabaseAdmin as any).from = originalFrom;
    if (originalRpc) (supabaseAdmin as any).rpc = originalRpc;
    (crypto.randomBytes as any) = originalRandomBytes;
  });

  test("invite → accept → share workflow", async () => {
    const ptCaller = appRouter.createCaller({
      req: new Request("http://localhost"),
      requestId: "test-request-1",
      userId: "pt-1",
      userEmail: "pt@example.com",
    });

    const inviteResult = await ptCaller.pt.inviteClient({
      email: "client@example.com",
    });

    expect(inviteResult.success).toBe(true);
    assertTableExists(mockDb.tables.pt_invitations, 'pt_invitations');
    expect(mockDb.tables.pt_invitations.length).toBe(1);

    const invitationToken = mockDb.tables.pt_invitations[0]!.token;

    const clientCaller = appRouter.createCaller({
      req: new Request("http://localhost"),
      requestId: "test-request-2",
      userId: "client-1",
      userEmail: "client@example.com",
    });

    const acceptResult = await clientCaller.pt.acceptInvitation({
      token: invitationToken,
    });

    expect(acceptResult.success).toBe(true);
    assertTableExists(mockDb.tables.pt_client_relationships, 'pt_client_relationships');
    expect(mockDb.tables.pt_client_relationships.length).toBe(1);

    const shareResult = await ptCaller.pt.shareProgramme({
      programmeId: "programme-1",
      clientId: "client-1",
    });

    expect(shareResult.success).toBe(true);
    assertTableExists(mockDb.tables.shared_programmes, 'shared_programmes');
    expect(mockDb.tables.shared_programmes.length).toBe(1);

    const clientViewCaller = appRouter.createCaller({
      req: new Request("http://localhost"),
      requestId: "test-request-3",
      userId: "client-1",
      userEmail: "client@example.com",
    });

    const sharedProgrammes = await clientViewCaller.clients.listSharedProgrammes();
    assertTableExists(sharedProgrammes, 'sharedProgrammes result');
    expect(sharedProgrammes.length).toBe(1);
    expect(sharedProgrammes[0]!.programmeId).toBe("programme-1");
    expect(sharedProgrammes[0]!.ptName).toBe("Pat Trainer");
  });
});

