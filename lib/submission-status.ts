export const submissionStatuses = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
export function normalizeSubmissionStatus(value: unknown): typeof submissionStatuses[number] {
  return submissionStatuses.find((status) => status === value) ?? "ALL";
}
