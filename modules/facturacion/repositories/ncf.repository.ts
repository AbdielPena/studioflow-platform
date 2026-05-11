import { prisma } from "@/packages/db";
import { NcfStatus, type NcfType } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { formatNcf } from "@/lib/fiscal";

/**
 * Asigna atómicamente el siguiente NCF de una secuencia.
 * Usa SELECT FOR UPDATE para evitar race conditions.
 * Marca como EXHAUSTED si llega al rangeTo.
 *
 * DEBE ejecutarse DENTRO de una transacción Prisma.
 */
export async function assignNextNcf(opts: {
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
  companyId: string;
  type: NcfType;
  branchId?: string | null;
}): Promise<{ sequenceId: string; ncf: string; prefix: string; sequence: number }> {
  const sequences = await opts.tx.$queryRaw<
    Array<{
      id: string;
      prefix: string;
      currentValue: number;
      rangeFrom: number;
      rangeTo: number;
      expiresAt: Date | null;
    }>
  >`
    SELECT id, prefix, "currentValue", "rangeFrom", "rangeTo", "expiresAt"
    FROM ncf_sequences
    WHERE "companyId" = ${opts.companyId}
      AND type = ${opts.type}::"NcfType"
      AND status = ${NcfStatus.ACTIVE}::"NcfStatus"
      AND "deletedAt" IS NULL
      AND ("branchId" = ${opts.branchId ?? null} OR "branchId" IS NULL)
      AND "currentValue" < "rangeTo"
      AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
    ORDER BY "branchId" NULLS LAST, "rangeFrom" ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `;

  const seq = sequences[0];
  if (!seq) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: `No hay secuencia NCF activa de tipo ${opts.type} con cupo disponible`,
    });
  }

  const nextValue = Math.max(seq.currentValue + 1, seq.rangeFrom);
  const willBeExhausted = nextValue >= seq.rangeTo;

  await opts.tx.ncfSequence.update({
    where: { id: seq.id },
    data: {
      currentValue: nextValue,
      status: willBeExhausted ? NcfStatus.EXHAUSTED : NcfStatus.ACTIVE,
    },
  });

  return {
    sequenceId: seq.id,
    prefix: seq.prefix,
    sequence: nextValue,
    ncf: formatNcf(seq.prefix, nextValue),
  };
}
