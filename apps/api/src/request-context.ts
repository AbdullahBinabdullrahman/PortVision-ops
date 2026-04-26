import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  userId: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function enterRequestContext(ctx: RequestContext): void {
  storage.enterWith(ctx);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}
