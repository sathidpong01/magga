import { pollDatabase } from "@/lib/polls/database";
import { pollAdmin, pollFailure, pollJson } from "@/lib/polls/http";
import { consumePollLimit } from "@/lib/polls/security";
import { readCommentFormData } from "@/lib/comments/request";
import { deleteAssets, storeAsset } from "@/lib/storage";
import { PollError } from "@/lib/polls/types";
export async function POST(request: Request) {
  try {
    const caller = await pollAdmin(request, true);
    await consumePollLimit(pollDatabase, `upload:${caller.user.id}`, 60, 900);
    const form = await readCommentFormData(request, 3 * 1024 * 1024 + 65536);
    const file = form.get("file");
    if (!(file instanceof File)) throw new PollError("กรุณาเลือกรูปภาพ");
    let stored;
    try {
      stored = await storeAsset(file, {
        kind: "poll-image",
        userId: caller.user.id,
      });
    } catch {
      throw new PollError(
        "อัปโหลดไม่สำเร็จ ใช้ภาพ JPEG, PNG หรือ WebP ไม่เกิน 3 MB และ 20 ล้านพิกเซล",
        400,
      );
    }
    try {
      const [asset] = await pollDatabase.query<{ id: string }>(
        "INSERT INTO private.poll_assets(creator_id,object_key,url,bytes,width,height,expires_at) VALUES($1,$2,$3,$4,$5,$6,clock_timestamp()+interval '1 day') RETURNING id",
        [
          caller.user.id,
          stored.key,
          stored.url,
          stored.size,
          stored.width,
          stored.height,
        ],
      );
      return pollJson(
        {
          id: asset.id,
          url: stored.url,
          width: stored.width,
          height: stored.height,
        },
        201,
      );
    } catch (error) {
      await deleteAssets([stored.key]).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return pollFailure(error);
  }
}
