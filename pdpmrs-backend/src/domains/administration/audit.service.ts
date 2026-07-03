import { prisma } from "../../config/db";
import { ActorType } from "@prisma/client";

/**
 * Records a critical action for traceability (CON design principle:
 * Auditability). Failures here are logged but never block the
 * originating business action.
 */
export async function recordAudit(entry: {
  actorId?: string;
  actorType: ActorType;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorType: entry.actorType,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata as any,
    },
  });
}
