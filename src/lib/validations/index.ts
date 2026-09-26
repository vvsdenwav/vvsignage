import { z } from "zod";

export const screenSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  pairingCode: z.string().optional(),
});

export const screenUpdateSchema = z.object({
  playlistId: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
  showWeather: z.boolean().optional(),
  showClock: z.boolean().optional(),
  rssFeedUrl: z.string().url().nullable().optional(),
  overrideType: z.string().nullable().optional(),
  overridePayload: z.string().nullable().optional(),
  autoStart: z.boolean().optional(),
  lastScreenshotUrl: z.string().nullable().optional(),
  lastScreenshotAt: z.string().or(z.date()).nullable().optional(),
  operatingHoursActive: z.boolean().optional(),
  wakeTime: z.string().nullable().optional(),
  sleepTime: z.string().nullable().optional(),
  sleepMode: z.string().nullable().optional(),
  alertActive: z.boolean().optional(),
  alertPayload: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

export const userSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'AGENT']).optional(),
  permissions: z.string().optional(),
});

export const userUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'AGENT']).optional(),
  permissions: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const tvAccountSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  screenIds: z.array(z.string()).optional(),
});

export const tvAccountUpdateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  screenIds: z.array(z.string()).optional(),
});

export const widgetSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  position: z.string().optional(),
  dataPayload: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export const widgetUpdateSchema = widgetSchema.partial();

export const mediaWebSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  folderId: z.string().nullable().optional(),
});
