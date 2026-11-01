import { z } from "zod";
export const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(12)
    .max(72)
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "Password must use at most 72 UTF-8 bytes",
    ),
});
export const registration = credentials.extend({
  name: z.string().trim().min(2).max(100),
  role: z.enum(["MEMBER", "TRAINER"]),
});
export const uuid = z.uuid();
export const slotInput = z
  .object({
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
  })
  .refine((v) => {
    const a = Date.parse(v.startsAt),
      b = Date.parse(v.endsAt);
    return (
      a > Date.now() &&
      a < Date.now() + 90 * 86400000 &&
      b > a &&
      b - a <= 4 * 3600000
    );
  }, "Choose a future slot within 90 days, lasting at most four hours");
const set = z
  .object({
    reps: z.number().int().positive().max(1000).optional(),
    weight: z.number().nonnegative().max(1500).optional(),
    duration: z.number().positive().max(86400).optional(),
    distance: z.number().positive().max(1000000).optional(),
  })
  .refine(
    (v) => v.reps !== undefined || v.duration !== undefined,
    "A set needs reps or duration in seconds",
  );
export const workoutInput = z.object({
  performedAt: z.iso
    .datetime({ offset: true })
    .refine(
      (v) => Date.parse(v) <= Date.now(),
      "Workout cannot be in the future",
    ),
  workoutType: z.enum(["STRENGTH", "CARDIO", "MIXED", "MOBILITY"]),
  notes: z.string().max(2000).default(""),
  exercises: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        sets: z.array(set).min(1).max(30),
      }),
    )
    .min(1)
    .max(30),
});
export const goalsInput = z.object({
  goals: z.string().trim().min(5).max(2000),
  category: z.enum(["STRENGTH", "CARDIO", "MOBILITY"]).optional(),
});
