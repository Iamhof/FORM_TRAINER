import { afterEach, beforeEach, describe, expect, test } from "vitest";
import crypto from "crypto";
import { appRouter } from "@/backend/trpc/app-router";
import { supabaseAdmin } from "@/backend/lib/auth";

type TableMap = Record<string, Array<Record<string, any>>>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

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
  private filters: Array<(row: Record<string, any>) => boolean> = [];
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

  insert(payload: Record<string, any> | Array<Record<string, any>>) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const inserted = rows.map((row) => {
      const next = { ...row };
      if (!("id" in next)) {
        next.id = this.db.generateId(this.table);
      }
      this.db.tables[this.table].push(next);
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
        const targetRows = db.tables[table].filter((row) => row[column] === value);
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
        db.tables[table] = db.tables[table].filter((row) => row[column] !== value);
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
    let results = [...this.db.tables[this.table]];
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
    (crypto.randomBytes as any) = () =>
      Buffer.from("0123456789abcdef0123456789abcdef");
  });

  afterEach(() => {
    (supabaseAdmin as any).from = originalFrom;
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
    expect(mockDb.tables.pt_invitations.length).toBe(1);

    const invitationToken = mockDb.tables.pt_invitations[0].token;

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
    expect(mockDb.tables.pt_client_relationships.length).toBe(1);

    const shareResult = await ptCaller.pt.shareProgramme({
      programmeId: "programme-1",
      clientId: "client-1",
    });

    expect(shareResult.success).toBe(true);
    expect(mockDb.tables.shared_programmes.length).toBe(1);

    const clientViewCaller = appRouter.createCaller({
      req: new Request("http://localhost"),
      requestId: "test-request-3",
      userId: "client-1",
      userEmail: "client@example.com",
    });

    const sharedProgrammes = await clientViewCaller.clients.listSharedProgrammes();
    expect(sharedProgrammes.length).toBe(1);
    expect(sharedProgrammes[0].programmeId).toBe("programme-1");
    expect(sharedProgrammes[0].ptName).toBe("Pat Trainer");
  });
});

