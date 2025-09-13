import { z } from "zod";
import { ActivityType, DealStatus, MembershipRole } from "@prisma/client";

/**
 * Central zod schemas used to validate and sanitize
 * incoming data for core CRM entities. These schemas
 * intentionally mirror the Prisma models but only expose
 * the fields that can be set through the API.
 */

export const companySchema = z.object({
  name: z.string().trim().min(1),
  domain: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  website: z.string().trim().optional(),
});

export const contactSchema = z.object({
  companyId: z.string().cuid().optional(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
});

export const dealSchema = z.object({
  companyId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  pipelineId: z.string().cuid(),
  stageId: z.string().cuid(),
  title: z.string().trim().min(1),
  valueCents: z.number().int().nonnegative(),
  currency: z.string().trim().length(3),
  status: z.nativeEnum(DealStatus).default(DealStatus.OPEN),
  closeDate: z.coerce.date().optional(),
});

export const activitySchema = z.object({
  dealId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  type: z.nativeEnum(ActivityType),
  title: z.string().trim().min(1),
  note: z.string().trim().optional(),
  dueAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
});

export const noteSchema = z.object({
  dealId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  body: z.string().trim().min(1),
});

export const tagSchema = z.object({
  name: z.string().trim().min(1),
});

export const pipelineSchema = z.object({
  name: z.string().trim().min(1),
});

export const stageSchema = z.object({
  pipelineId: z.string().cuid(),
  name: z.string().trim().min(1),
  order: z.number().int().nonnegative(),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
});

export const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.nativeEnum(MembershipRole),
});

export const membershipSchema = z.object({
  role: z.nativeEnum(MembershipRole),
});

