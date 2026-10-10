import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helpers";
import { createSubmission, submissionSchema, SubmissionQuotaError } from "@/lib/submissions";
export async function POST(req: Request) {
  try {
    const result = await authenticateRequest(req);
    if (!result.ok) return result.response;
    const parsed = submissionSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const submission = await createSubmission(result.caller.user.id, parsed.data);
    return NextResponse.json({ success: true, submissionId: submission.id });
  } catch (error) {
    if (error instanceof SubmissionQuotaError) return NextResponse.json({ error: error.message }, { status: 429 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    console.error("Submission failed");
    return NextResponse.json({ error: "Failed to submit manga. Please try again later." }, { status: 500 });
  }
}
