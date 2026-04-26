import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { getRequestContext } from "../request-context.js";

const TRACKED_MODELS = new Set(["Container", "Operator", "Headset", "Alert", "Action"]);
const TRACKED_OPS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

export function registerAuditMiddleware(): void {
  prisma.$use(async (params, next) => {
    if (!params.model || !TRACKED_MODELS.has(params.model) || !TRACKED_OPS.has(params.action)) {
      return next(params);
    }

    let oldData: Prisma.JsonValue | null = null;
    if (
      (params.action === "update" || params.action === "delete") &&
      params.args?.where?.id
    ) {
      try {
        const model = (prisma as unknown as Record<string, { findUnique: (a: unknown) => Promise<unknown> }>)[
          params.model.charAt(0).toLowerCase() + params.model.slice(1)
        ];
        const before = await model.findUnique({ where: { id: params.args.where.id } });
        oldData = before ? JSON.parse(JSON.stringify(before)) : null;
      } catch {
        oldData = null;
      }
    }

    const result = await next(params);

    const action =
      params.action === "create" || params.action === "createMany"
        ? "insert"
        : params.action === "delete" || params.action === "deleteMany"
          ? "delete"
          : "update";

    let recordId: string | null = null;
    let newData: Prisma.JsonValue | null = null;
    if (result && typeof result === "object" && "id" in result) {
      recordId = (result as { id: string }).id;
      newData = JSON.parse(JSON.stringify(result));
    } else if (params.args?.where?.id) {
      recordId = params.args.where.id as string;
    }

    try {
      await prisma.auditLog.create({
        data: {
          tableName: params.model,
          recordId,
          action,
          oldData: oldData ?? Prisma.JsonNull,
          newData: newData ?? Prisma.JsonNull,
          performedBy: getRequestContext()?.userId ?? null,
        },
      });
    } catch {
      // Audit failure must never break the request.
    }

    return result;
  });
}
