export type PollStatus =
  "draft" | "published" | "paused" | "closed" | "archived";
export type PollState =
  "draft" | "scheduled" | "open" | "paused" | "closed" | "archived";
export type PollVisibility = "public" | "unlisted";
export type ResultsVisibility =
  "public" | "after_vote" | "after_close" | "admin";
export type PollSecurity = "standard" | "ip" | "members";
export interface PollOption {
  id: string;
  label: string;
  assetId: string | null;
  mangaId: string | null;
  imageUrl: string | null;
  width: number | null;
  height: number | null;
  votes?: number;
}
export interface PollInput {
  title: string;
  description: string;
  coverAssetId: string | null;
  visibility: PollVisibility;
  resultsVisibility: ResultsVisibility;
  security: PollSecurity;
  minChoices: number;
  maxChoices: number;
  allowChange: boolean;
  showCount: boolean;
  showOnHome: boolean;
  pinned: boolean;
  startsAt: string;
  endsAt: string;
  options: {
    id: string;
    label: string;
    assetId: string | null;
    mangaId: string | null;
  }[];
}
export interface PublicPoll {
  id: string;
  title: string;
  description: string;
  state: PollState;
  visibility: PollVisibility;
  resultsVisibility: ResultsVisibility;
  security: PollSecurity;
  minChoices: number;
  maxChoices: number;
  allowChange: boolean;
  showCount: boolean;
  startsAt: string;
  endsAt: string;
  serverNow: string;
  total: number | null;
  resultsAllowed: boolean;
  hasVoted: boolean;
  selections: string[];
  options: PollOption[];
  coverImageUrl: string | null;
}
export interface AdminPoll extends PublicPoll {
  status: PollStatus;
  coverAssetId: string | null;
  version: number;
  showOnHome: boolean;
  pinned: boolean;
  createdAt: string;
  excluded: number;
}
export const pollStateLabels: Record<PollState, string> = {
  draft: "ฉบับร่าง",
  scheduled: "ตั้งเวลาแล้ว",
  open: "เปิดรับโหวต",
  paused: "พักรับโหวต",
  closed: "ปิดรับโหวต",
  archived: "จัดเก็บแล้ว",
};
export const resultsLabels: Record<ResultsVisibility, string> = {
  public: "ทุกคนดูได้",
  after_vote: "หลังจากโหวต",
  after_close: "เมื่อปิดโพล",
  admin: "เฉพาะแอดมิน",
};
export function getPollState(
  poll: { status: PollStatus; startsAt: string; endsAt: string },
  now = Date.now(),
): PollState {
  if (
    poll.status === "draft" ||
    poll.status === "archived" ||
    poll.status === "closed"
  )
    return poll.status;
  if (now >= Date.parse(poll.endsAt)) return "closed";
  if (poll.status === "paused") return "paused";
  return now < Date.parse(poll.startsAt) ? "scheduled" : "open";
}
export class PollError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "INVALID_POLL",
    public retryAfter?: number,
  ) {
    super(message);
  }
}
