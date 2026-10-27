import { z } from "zod";
import { UUID, PaginationQuery } from "./common.js";

export const NotificationResponse = z.object({
  id: UUID,
  userId: UUID,
  type: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  data: z.record(z.string(), z.any()).nullable(),
  channel: z.enum(["in_app", "push", "email"]),
  status: z.enum(["pending", "delivered", "failed"]),
  externalId: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationResponse = z.infer<typeof NotificationResponse>;

export const MarkNotificationReadSchema = z.object({
  notificationId: UUID,
});
export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;

export const NotificationPreferenceResponse = z.object({
  id: UUID,
  userId: UUID,
  missionReminders: z.boolean(),
  achievementAlerts: z.boolean(),
  levelUpAlerts: z.boolean(),
  habitReminders: z.boolean(),
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NotificationPreferenceResponse = z.infer<typeof NotificationPreferenceResponse>;

export const UpdateNotificationPreferenceSchema = z.object({
  missionReminders: z.boolean().optional(),
  achievementAlerts: z.boolean().optional(),
  levelUpAlerts: z.boolean().optional(),
  habitReminders: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});
export type UpdateNotificationPreferenceInput = z.infer<typeof UpdateNotificationPreferenceSchema>;

export const NotificationsQuery = PaginationQuery.extend({
  unreadOnly: z.coerce.boolean().optional(),
});
export type NotificationsQuery = z.infer<typeof NotificationsQuery>;
