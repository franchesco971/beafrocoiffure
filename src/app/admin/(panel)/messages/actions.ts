"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export async function setMessageHandled(id: number, handled: boolean): Promise<void> {
  const admin = await requireAdmin();

  const { count } = await db.contactMessage.updateMany({ where: { id }, data: { handled } });
  if (count > 0) await audit(admin.id, handled ? "MESSAGE_HANDLED" : "MESSAGE_REOPENED", "contact_message", id);
  redirect("/admin/messages");
}

export async function deleteMessage(id: number): Promise<FormState> {
  const admin = await requireAdmin();

  const { count } = await db.contactMessage.deleteMany({ where: { id } });
  if (count > 0) await audit(admin.id, "MESSAGE_DELETE", "contact_message", id);
  redirect("/admin/messages");
}
