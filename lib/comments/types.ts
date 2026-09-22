import type { CallerContext } from "@/lib/auth-helpers";

// ============================================================================
// Domain Errors
// ============================================================================

export class CommentError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "CommentError";
  }
}

export class UnauthorizedCommentError extends CommentError {
  constructor(message = "กรุณาเข้าสู่ระบบก่อนดำเนินการ") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedCommentError";
  }
}

export class ForbiddenCommentError extends CommentError {
  constructor(message = "คุณไม่มีสิทธิ์ดำเนินการนี้") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenCommentError";
  }
}

export class NotFoundCommentError extends CommentError {
  constructor(message = "ไม่พบความคิดเห็น") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundCommentError";
  }
}

export class RateLimitCommentError extends CommentError {
  constructor(
    message: string,
    public readonly resetTime?: number,
    public readonly waitMinutes?: number
  ) {
    super(message, 429, "RATE_LIMITED");
    this.name = "RateLimitCommentError";
  }
}

export class ValidationCommentError extends CommentError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationCommentError";
  }
}

// ============================================================================
// Input & Output Interfaces
// ============================================================================

export type CallerInput = CallerContext | Request | Headers | HeadersInit;

export interface CreateCommentInput {
  mangaId: string;
  content: string;
  imageIndex?: number | null;
  imageUrl?: string | null;
  parentId?: string | null;
}

export interface UpdateCommentInput {
  commentId: string;
  content: string;
}

export interface VoteCommentInput {
  commentId: string;
  value: 1 | -1;
}

export interface ListCommentsOptions {
  mangaId: string;
  imageIndex?: number | null;
  cursor?: string | null;
  limit?: number;
}

export interface CommentUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export interface CommentVote {
  userId: string;
  value: number;
}

export interface CommentItem {
  id: string;
  content: string;
  imageUrl: string | null;
  voteScore: number;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  mangaId: string;
  userId: string;
  imageIndex: number | null;
  parentId: string | null;
  user: CommentUser;
  votes: CommentVote[];
  replies?: CommentItem[];
}

export interface CommentVoteResult {
  voteScore: number;
  userVote: number | null;
}

export interface CommentListResult {
  comments: CommentItem[];
  nextCursor: string | null;
}
