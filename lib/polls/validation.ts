import { z } from "zod";
import { PollError, type PollInput } from "./types";

const schema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(4000),
    coverAssetId: z.uuid().nullable().default(null),
    visibility: z.enum(["public", "unlisted"]),
    resultsVisibility: z.enum(["public", "after_vote", "after_close", "admin"]),
    security: z.enum(["standard", "ip", "members"]),
    minChoices: z.number().int().min(1).max(30),
    maxChoices: z.number().int().min(1).max(30),
    allowChange: z.boolean(),
    showCount: z.boolean(),
    showOnHome: z.boolean(),
    pinned: z.boolean(),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    options: z
      .array(
        z
          .object({
            id: z.uuid(),
            label: z.string().trim().min(1).max(120),
            assetId: z.uuid().nullable(),
            mangaId: z.uuid().nullable().default(null),
          })
          .strict(),
      )
      .min(2)
      .max(30),
  })
  .strict();

export function parsePollInput(body: unknown): PollInput {
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new PollError(
      "กรุณาตรวจชื่อโพล ตัวเลือก และการตั้งค่า (ชื่อไม่เกิน 160 ตัวอักษร และมี 2–30 ตัวเลือก)",
    );
  const value = parsed.data;
  if (
    value.minChoices > value.maxChoices ||
    value.maxChoices > value.options.length
  )
    throw new PollError("จำนวนข้อที่เลือกได้ไม่สอดคล้องกับตัวเลือก");
  if (Date.parse(value.endsAt) <= Date.parse(value.startsAt))
    throw new PollError("เวลาปิดต้องอยู่หลังเวลาเปิดโพล");
  if (new Set(value.options.map((o) => o.id)).size !== value.options.length)
    throw new PollError("ตัวเลือกซ้ำกัน");
  return value;
}
export function requirePollId(id: unknown): string {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) throw new PollError("ไม่พบโพล", 404, "NOT_FOUND");
  return parsed.data;
}
export function parseVote(body: unknown) {
  const result = z
    .object({
      requestId: z.uuid(),
      choices: z.array(z.uuid()).min(1).max(30),
      token: z.string().max(2048).optional(),
    })
    .strict()
    .safeParse(body);
  if (
    !result.success ||
    new Set(result.data.choices).size !== result.data.choices.length
  )
    throw new PollError("คำตอบไม่ถูกต้องหรือมีตัวเลือกซ้ำกัน");
  return { ...result.data, choices: [...result.data.choices].sort() };
}
export function csvCell(value: string | number) {
  const text = String(value);
  return `"${(/^[\s]*[=+\-@]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
}
