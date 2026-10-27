import { z } from "zod";
import { UUID, PaginationQuery } from "./common.js";

export const XpLedgerEntryResponse = z.object({
  id: UUID,
  userId: UUID,
  amount: z.number(),
  reason: z.string(),
  referenceId: z.string().nullable(),
  referenceType: z.string().nullable(),
  levelBefore: z.number(),
  levelAfter: z.number(),
  xpBefore: z.number(),
  xpAfter: z.number(),
  createdAt: z.string(),
});
export type XpLedgerEntryResponse = z.infer<typeof XpLedgerEntryResponse>;

export const XpMeResponse = z.object({
  userId: UUID,
  xp: z.number(),
  level: z.number(),
  xpForCurrentLevel: z.number(),
  xpForNextLevel: z.number(),
  progressPercent: z.number(),
  xpToNextLevel: z.number(),
});
export type XpMeResponse = z.infer<typeof XpMeResponse>;

export const XpLedgerQuery = PaginationQuery.extend({
  reason: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type XpLedgerQuery = z.infer<typeof XpLedgerQuery>;

export const RecalculateResponse = z.object({
  userId: UUID,
  xp: z.number(),
  level: z.number(),
  eventsProcessed: z.number(),
});
export type RecalculateResponse = z.infer<typeof RecalculateResponse>;
