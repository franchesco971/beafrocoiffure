"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { ReviewStatus } from "@/generated/prisma/enums";
import type { FormState } from "@/lib/admin/forms";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { REVIEWS_TAG } from "@/lib/reviews";

export async function setReviewStatus(id: number, status: ReviewStatus): Promise<void> {
  const admin = await requireAdmin();

  const { count } = await db.review.updateMany({ where: { id }, data: { status } });
  if (count > 0) await audit(admin.id, `REVIEW_${status}`, "review", id);
  updateTag(REVIEWS_TAG);
  redirect("/admin/avis");
}

export async function deleteReview(id: number): Promise<FormState> {
  const admin = await requireAdmin();

  const { count } = await db.review.deleteMany({ where: { id } });
  if (count > 0) await audit(admin.id, "REVIEW_DELETE", "review", id);
  updateTag(REVIEWS_TAG);
  redirect("/admin/avis");
}
