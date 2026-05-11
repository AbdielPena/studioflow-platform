"use server";

import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, fail, toActionResult, type ActionResult } from "@/packages/lib/errors";
import { sendEmail } from "@/packages/lib/email";
import { invoiceEmailTemplate, overdueReminderTemplate } from "@/packages/lib/email-templates";
import { getInvoiceService } from "../services/invoice.service";
import { prisma } from "@/packages/db";
import { audit } from "@/packages/lib/audit";
import { AuditAction } from "@prisma/client";

export async function sendInvoiceByEmailAction(opts: {
  invoiceId: string;
  to?: string;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_INVOICE_READ);

    const invoice = await getInvoiceService(ctx.companyId, opts.invoiceId);
    const company = await prisma.company.findUniqueOrThrow({
      where: { id: ctx.companyId },
    });

    const to = opts.to ?? invoice.customer.email;
    if (!to) {
      return fail("VALIDATION_ERROR", "El cliente no tiene correo registrado");
    }

    const html = invoiceEmailTemplate({
      customerName: invoice.customer.legalName,
      invoiceNumber: invoice.number,
      ncf: invoice.ncf,
      total: invoice.total.toString(),
      balanceDue: invoice.balanceDue.toString(),
      dueDate: invoice.dueDate,
      companyName: company.tradeName ?? company.legalName,
    });

    const result = await sendEmail({
      to,
      subject: `Factura ${invoice.number}${invoice.ncf ? ` · NCF ${invoice.ncf}` : ""}`,
      html,
    });

    if (!result.ok) {
      return fail("EXTERNAL_SERVICE_ERROR", result.error);
    }

    await audit({
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: AuditAction.SEND,
      module: "facturacion",
      entityType: "Invoice",
      entityId: invoice.id,
      after: { sentTo: to, emailId: result.id },
    });

    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function sendOverdueRemindersAction(): Promise<
  ActionResult<{ sent: number; failed: number }>
> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FINANZAS_RECEIVABLE_MANAGE);

    const now = new Date();
    const overdue = await prisma.accountReceivable.findMany({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        status: { in: ["OPEN", "PARTIALLY_PAID"] },
        dueDate: { lt: now },
      },
      include: { customer: true, invoice: true },
    });

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: ctx.companyId },
    });

    let sent = 0;
    let failed = 0;
    for (const r of overdue) {
      if (!r.customer.email) {
        failed++;
        continue;
      }
      const daysOverdue = Math.floor(
        (now.getTime() - (r.dueDate?.getTime() ?? now.getTime())) / (1000 * 60 * 60 * 24),
      );
      const html = overdueReminderTemplate({
        customerName: r.customer.legalName,
        invoiceNumber: r.invoice.number,
        balanceDue: r.balanceDue.toString(),
        dueDate: r.dueDate!,
        daysOverdue,
        companyName: company.tradeName ?? company.legalName,
      });
      const result = await sendEmail({
        to: r.customer.email,
        subject: `Recordatorio: factura ${r.invoice.number} vencida`,
        html,
      });
      if (result.ok) sent++;
      else failed++;
    }

    await audit({
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: AuditAction.SEND,
      module: "finanzas",
      entityType: "OverdueReminder",
      entityId: "batch",
      after: { sent, failed, total: overdue.length },
    });

    return ok({ sent, failed });
  } catch (err) {
    return toActionResult(err);
  }
}
