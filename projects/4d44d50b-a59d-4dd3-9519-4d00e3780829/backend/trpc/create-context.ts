import { initTRPC } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getAuth } from "../lib/auth";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const authHeader = opts.req.headers.get("authorization");
  const user = authHeader ? await getAuth(authHeader) : null;

  return {
    user,
    req: opts.req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new Error("Unauthorized");
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.user,
    },
  });
});
