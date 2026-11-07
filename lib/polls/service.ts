import { createHash, createHmac, randomUUID } from "node:crypto";
import type { PollDatabase, PollExecutor } from "./database";
import {
  PollError,
  getPollState,
  type AdminPoll,
  type PollInput,
  type PollOption,
  type PollStatus,
  type PublicPoll,
} from "./types";

type Row = Omit<PollInput, "options"> & {
  id: string;
  coverImageUrl: string | null;
  status: PollStatus;
  creatorId: string;
  publishedAt: string | null;
  version: number;
  createdAt: string;
  serverNow: string;
  total: number;
  excluded: number;
  options: PollOption[];
};
export interface Voter {
  guestHash: string | null;
  userId: string | null;
  network: string | null;
  secret: string;
}
const projection = `p.id,p.title,p.description,p.status,p.visibility,p.results_visibility AS "resultsVisibility",p.security,p.cover_asset_id AS "coverAssetId",(SELECT url FROM private.poll_assets WHERE id=p.cover_asset_id) AS "coverImageUrl",
 p.min_choices AS "minChoices",p.max_choices AS "maxChoices",p.allow_change AS "allowChange",p.show_count AS "showCount",
 p.show_on_home AS "showOnHome",p.pinned,p.starts_at::text AS "startsAt",p.ends_at::text AS "endsAt",p.creator_id AS "creatorId",
 p.published_at::text AS "publishedAt",p.version,p.created_at::text AS "createdAt",clock_timestamp()::text AS "serverNow",
 (SELECT count(*)::int FROM private.poll_ballots b WHERE b.poll_id=p.id AND b.status='counted') AS total,
 (SELECT count(*)::int FROM private.poll_ballots b WHERE b.poll_id=p.id AND b.status='excluded') AS excluded,
 COALESCE((SELECT jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'assetId',o.asset_id,'mangaId',m.id,'imageUrl',COALESCE(a.url,m.cover_image),'width',a.width,'height',a.height,
 'votes',(SELECT count(*)::int FROM private.poll_ballot_choices c JOIN private.poll_ballots b ON b.id=c.ballot_id WHERE c.option_id=o.id AND b.status='counted')) ORDER BY o.position)
 FROM private.poll_options o LEFT JOIN private.poll_assets a ON a.id=o.asset_id LEFT JOIN public.manga m ON m.id=o.manga_id AND NOT m.is_hidden WHERE o.poll_id=p.id),'[]'::jsonb) AS options`;

async function load(tx: PollExecutor, id: string): Promise<Row> {
  const [row] = await tx.query<Row>(
    `SELECT ${projection} FROM private.polls p WHERE p.id=$1`,
    [id],
  );
  if (!row) throw new PollError("ไม่พบโพล", 404, "NOT_FOUND");
  return row;
}
export function voterClaims(id: string, voter: Voter) {
  const key = (kind: string, value: string) =>
    createHmac("sha256", voter.secret)
      .update(`${id}:${kind}:${value}`)
      .digest("hex");
  return {
    identity: [
      voter.guestHash && key("guest", voter.guestHash),
      voter.userId && key("member", voter.userId),
    ].filter((x): x is string => Boolean(x)),
    network: voter.network ? key("network", voter.network) : null,
  };
}
async function ownBallot(tx: PollExecutor, id: string, identities: string[]) {
  if (!identities.length) return null;
  const matches = await tx.query<{ id: string; status: string }>(
    `SELECT DISTINCT b.id,b.status FROM private.poll_claims c JOIN private.poll_ballots b ON b.id=c.ballot_id WHERE c.poll_id=$1 AND c.claim IN (SELECT jsonb_array_elements_text($2::jsonb))`,
    [id, JSON.stringify(identities)],
  );
  if (matches.length > 1)
    throw new PollError(
      "ตัวตนนี้มีบัตรโหวตมากกว่าหนึ่งใบ กรุณาติดต่อผู้ดูแล",
      409,
      "IDENTITY_CONFLICT",
    );
  return matches[0] ?? null;
}
async function choicesFor(tx: PollExecutor, ballot: string) {
  return (
    await tx.query<{ option_id: string }>(
      "SELECT option_id FROM private.poll_ballot_choices WHERE ballot_id=$1 ORDER BY option_id",
      [ballot],
    )
  ).map((row) => row.option_id);
}
export async function linkVoterIdentity(
  database: PollDatabase,
  id: string,
  voter: Voter,
) {
  if (!voter.guestHash || !voter.userId) return;
  const keys = voterClaims(id, voter);
  await database.transaction(async (tx) => {
    await tx.query("SELECT id FROM private.polls WHERE id=$1 FOR UPDATE", [id]);
    const ballot = await ownBallot(tx, id, keys.identity);
    if (!ballot) return;
    for (const claim of keys.identity)
      await tx.query(
        "INSERT INTO private.poll_claims(poll_id,claim,ballot_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [id, claim, ballot.id],
      );
  });
}
function publicView(
  row: Row,
  voted: boolean,
  selections: string[],
  admin = false,
): PublicPoll {
  const state = getPollState(row, Date.parse(row.serverNow));
  const allowed =
    admin ||
    row.resultsVisibility === "public" ||
    (row.resultsVisibility === "after_vote" && voted) ||
    (row.resultsVisibility === "after_close" && state === "closed");
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.coverImageUrl,
    state,
    visibility: row.visibility,
    resultsVisibility: row.resultsVisibility,
    security: row.security,
    minChoices: row.minChoices,
    maxChoices: row.maxChoices,
    allowChange: row.allowChange,
    showCount: row.showCount,
    startsAt: new Date(row.startsAt).toISOString(),
    endsAt: new Date(row.endsAt).toISOString(),
    serverNow: new Date(row.serverNow).toISOString(),
    total: admin || allowed || row.showCount ? row.total : null,
    resultsAllowed: allowed,
    hasVoted: voted,
    selections,
    options: row.options.map((option) => ({
      id: option.id,
      label: option.label,
      assetId: admin ? option.assetId : null,
      mangaId: admin ? option.mangaId : null,
      imageUrl: option.imageUrl,
      width: option.width,
      height: option.height,
      ...(allowed ? { votes: option.votes } : {}),
    })),
  };
}
export async function getPublicPoll(
  database: PollExecutor,
  id: string,
  voter?: Voter,
) {
  const row = await load(database, id);
  if (row.status === "draft" || row.status === "archived")
    throw new PollError("ไม่พบโพล", 404, "NOT_FOUND");
  const ballot = voter
    ? await ownBallot(database, id, voterClaims(id, voter).identity)
    : null;
  return publicView(
    row,
    Boolean(ballot),
    ballot ? await choicesFor(database, ballot.id) : [],
  );
}
export async function getAdminPoll(
  database: PollExecutor,
  id: string,
): Promise<AdminPoll> {
  const row = await load(database, id);
  return {
    ...publicView(row, false, [], true),
    status: row.status,
    coverAssetId: row.coverAssetId,
    showOnHome: row.showOnHome,
    pinned: row.pinned,
    version: row.version,
    createdAt: row.createdAt,
    excluded: row.excluded,
  };
}
export async function listPolls(
  database: PollExecutor,
  admin = false,
  featured = false,
  search = "",
  page = 1,
  state = "",
  sort = "newest",
) {
  const where = admin
    ? "($1='' OR p.title ILIKE '%' || $1 || '%')"
    : `p.status IN ('published','paused','closed') AND p.visibility='public' ${featured ? "AND p.status='published' AND p.show_on_home AND p.starts_at<=clock_timestamp() AND p.ends_at>clock_timestamp()" : ""} AND ($1='' OR p.title ILIKE '%' || $1 || '%')`;
  const filter = admin
    ? "AND ($4='' OR (CASE WHEN p.status IN ('draft','closed','archived') THEN p.status WHEN p.ends_at<=clock_timestamp() THEN 'closed' WHEN p.status='paused' THEN 'paused' WHEN p.starts_at>clock_timestamp() THEN 'scheduled' ELSE 'open' END)=$4)"
    : "AND $4=''";
  const order =
    admin && sort === "ending"
      ? "p.ends_at ASC,p.id"
      : admin && sort === "votes"
        ? "total DESC,p.created_at DESC,p.id"
        : "p.pinned DESC,p.published_at DESC NULLS LAST,p.created_at DESC,p.id";
  const rows = await database.query<Row>(
    `SELECT ${projection} FROM private.polls p WHERE ${where} ${filter} ORDER BY ${order} LIMIT $2 OFFSET $3`,
    [
      search.slice(0, 160),
      featured ? 1 : 20,
      (page - 1) * 20,
      admin ? state : "",
    ],
  );
  return rows.map((row) =>
    admin
      ? {
          ...publicView(row, false, [], true),
          status: row.status,
          coverAssetId: row.coverAssetId,
          showOnHome: row.showOnHome,
          pinned: row.pinned,
          version: row.version,
          createdAt: row.createdAt,
          excluded: row.excluded,
        }
      : publicView(row, false, []),
  );
}

async function audit(
  tx: PollExecutor,
  pollId: string,
  actor: string,
  action: string,
  reason = "",
) {
  await tx.query(
    "INSERT INTO private.poll_audit_events(poll_id,actor_id,action,reason) VALUES($1,$2,$3,$4)",
    [pollId, actor, action, reason],
  );
}
async function attachOptions(
  tx: PollExecutor,
  id: string,
  actor: string,
  input: PollInput,
  reusedAssets: string[] = [],
) {
  const ids = [
    ...input.options.flatMap((o) => (o.assetId ? [o.assetId] : [])),
    ...(input.coverAssetId ? [input.coverAssetId] : []),
  ];
  if (ids.length) {
    const assets = await tx.query<{ id: string; bytes: number }>(
      `SELECT id,bytes FROM private.poll_assets WHERE id IN (SELECT jsonb_array_elements_text($1::jsonb)::uuid)
      AND (creator_id=$2 OR id IN (SELECT asset_id FROM private.poll_options WHERE poll_id=$3) OR id=(SELECT cover_asset_id FROM private.polls WHERE id=$3) OR id IN (SELECT jsonb_array_elements_text($4::jsonb)::uuid))
      AND state<>'retired' AND (state='published' OR expires_at>clock_timestamp()) ORDER BY id FOR UPDATE`,
      [JSON.stringify(ids), actor, id, JSON.stringify(reusedAssets)],
    );
    if (new Set(assets.map((a) => a.id)).size !== new Set(ids).size)
      throw new PollError(
        "รูปภาพหมดอายุหรือไม่ใช่ไฟล์ที่คุณอัปโหลด กรุณาอัปโหลดใหม่",
      );
    if (assets.reduce((sum, a) => sum + a.bytes, 0) > 30 * 1024 * 1024)
      throw new PollError("รูปภาพในโพลต้องมีขนาดรวมไม่เกิน 30 MB");
  }
  for (const [position, option] of input.options.entries()) {
    if (option.mangaId) {
      const visible = await tx.query(
        "SELECT id FROM public.manga WHERE id=$1 AND NOT is_hidden",
        [option.mangaId],
      );
      if (!visible.length)
        throw new PollError("เลือกได้เฉพาะมังงะที่เผยแพร่แล้ว");
    }
    await tx.query(
      `INSERT INTO private.poll_options(id,poll_id,label,position,asset_id,manga_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET label=EXCLUDED.label,position=EXCLUDED.position,asset_id=EXCLUDED.asset_id,manga_id=EXCLUDED.manga_id WHERE private.poll_options.poll_id=EXCLUDED.poll_id`,
      [option.id, id, option.label, position, option.assetId, option.mangaId],
    );
  }
  const [{ count }] = await tx.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM private.poll_options WHERE poll_id=$1 AND id IN (SELECT jsonb_array_elements_text($2::jsonb)::uuid)",
    [id, JSON.stringify(input.options.map((o) => o.id))],
  );
  if (count !== input.options.length)
    throw new PollError("รหัสตัวเลือกถูกใช้ในโพลอื่นแล้ว");
  await tx.query(
    "DELETE FROM private.poll_options WHERE poll_id=$1 AND id NOT IN (SELECT jsonb_array_elements_text($2::jsonb)::uuid)",
    [id, JSON.stringify(input.options.map((o) => o.id))],
  );
  if (ids.length)
    await tx.query(
      "UPDATE private.poll_assets SET state='published',expires_at=clock_timestamp()+interval '180 days' WHERE id IN (SELECT jsonb_array_elements_text($1::jsonb)::uuid)",
      [JSON.stringify(ids)],
    );
  await tx.query("UPDATE private.polls SET cover_asset_id=$2 WHERE id=$1", [
    id,
    input.coverAssetId,
  ]);
}
export async function createPoll(
  database: PollDatabase,
  actor: string,
  input: PollInput,
  reusedAssets: string[] = [],
) {
  return database.transaction(async (tx) => {
    const [{ id }] = await tx.query<{ id: string }>(
      `INSERT INTO private.polls(title,description,creator_id,visibility,results_visibility,security,min_choices,max_choices,allow_change,show_count,show_on_home,pinned,starts_at,ends_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [
        input.title,
        input.description,
        actor,
        input.visibility,
        input.resultsVisibility,
        input.security,
        input.minChoices,
        input.maxChoices,
        input.allowChange,
        input.showCount,
        input.showOnHome,
        input.pinned,
        input.startsAt,
        input.endsAt,
      ],
    );
    await attachOptions(tx, id, actor, input, reusedAssets);
    await audit(tx, id, actor, "create");
    return getAdminPoll(tx, id);
  });
}
export async function updatePoll(
  database: PollDatabase,
  id: string,
  actor: string,
  input: PollInput,
  version: number,
) {
  return database.transaction(async (tx) => {
    await tx.query("SELECT id FROM private.polls WHERE id=$1 FOR UPDATE", [id]);
    const old = await load(tx, id);
    if (old.version !== version)
      throw new PollError(
        "โพลถูกแก้ไขจากหน้าต่างอื่น กรุณาโหลดข้อมูลใหม่",
        409,
        "VERSION_CONFLICT",
      );
    if (old.status === "archived")
      throw new PollError(
        "โพลนี้จัดเก็บแล้ว กรุณาทำสำเนาเพื่อสร้างโพลใหม่",
        409,
      );
    if (old.total + old.excluded > 0) {
      const structure = (options: PollInput["options"]) =>
        JSON.stringify(
          options.map((o) => ({
            id: o.id,
            label: o.label,
            assetId: o.assetId,
            mangaId: o.mangaId,
          })),
        );
      if (
        old.title !== input.title ||
        old.coverAssetId !== input.coverAssetId ||
        structure(old.options) !== structure(input.options) ||
        old.minChoices !== input.minChoices ||
        old.maxChoices !== input.maxChoices ||
        old.security !== input.security ||
        old.allowChange !== input.allowChange ||
        Date.parse(old.startsAt) !== Date.parse(input.startsAt)
      )
        throw new PollError(
          "โพลมีบัตรโหวตแล้ว เปลี่ยนคำถาม ตัวเลือก หรือกติกาไม่ได้ กรุณาทำสำเนา",
          409,
        );
    }
    if (
      old.publishedAt &&
      Date.parse(input.endsAt) <= Date.parse(old.serverNow) &&
      Date.parse(input.endsAt) !== Date.parse(old.endsAt)
    )
      throw new PollError("หากต้องการปิดทันที ให้ใช้คำสั่งปิดโพล");
    if (
      getPollState(old, Date.parse(old.serverNow)) === "closed" &&
      Date.parse(old.endsAt) !== Date.parse(input.endsAt)
    )
      throw new PollError("โพลปิดแล้ว เปลี่ยนช่วงเวลาไม่ได้ กรุณาทำสำเนา", 409);
    await attachOptions(tx, id, actor, input);
    await tx.query(
      `UPDATE private.polls SET title=$2,description=$3,visibility=$4,results_visibility=$5,security=$6,min_choices=$7,max_choices=$8,allow_change=$9,show_count=$10,show_on_home=$11,pinned=$12,starts_at=$13,ends_at=$14,version=version+1,updated_at=clock_timestamp() WHERE id=$1`,
      [
        id,
        input.title,
        input.description,
        input.visibility,
        input.resultsVisibility,
        input.security,
        input.minChoices,
        input.maxChoices,
        input.allowChange,
        input.showCount,
        input.showOnHome,
        input.pinned,
        input.startsAt,
        input.endsAt,
      ],
    );
    await audit(tx, id, actor, "update", `เวอร์ชัน ${version + 1}`);
    return getAdminPoll(tx, id);
  });
}
export async function transitionPoll(
  database: PollDatabase,
  id: string,
  actor: string,
  action: string,
  version: number,
) {
  return database.transaction(async (tx) => {
    await tx.query("SELECT id FROM private.polls WHERE id=$1 FOR UPDATE", [id]);
    const row = await load(tx, id);
    if (row.version !== version)
      throw new PollError("โพลถูกแก้ไข กรุณาโหลดข้อมูลใหม่", 409);
    const state = getPollState(row, Date.parse(row.serverNow));
    const allowed: Record<string, boolean> = {
      publish: row.status === "draft",
      pause: state === "open" || state === "scheduled",
      resume: row.status === "paused" && state !== "closed",
      close: ["published", "paused"].includes(row.status),
      archive: state === "closed" || state === "draft",
    };
    if (!allowed[action]) throw new PollError("เปลี่ยนสถานะนี้ไม่ได้", 409);
    if (
      ["publish", "resume"].includes(action) &&
      Date.parse(row.endsAt) <= Date.parse(row.serverNow)
    )
      throw new PollError("เวลาปิดโพลผ่านไปแล้ว");
    const status = {
      publish: "published",
      resume: "published",
      pause: "paused",
      close: "closed",
      archive: "archived",
    }[action];
    await tx.query(
      "UPDATE private.polls SET status=$2,published_at=CASE WHEN $2='published' THEN COALESCE(published_at,clock_timestamp()) ELSE published_at END,version=version+1,updated_at=clock_timestamp() WHERE id=$1",
      [id, status],
    );
    await audit(tx, id, actor, action);
    return getAdminPoll(tx, id);
  });
}

export async function vote(
  database: PollDatabase,
  id: string,
  voter: Voter,
  input: { requestId: string; choices: string[]; token?: string },
  verify: () => Promise<void>,
) {
  await linkVoterIdentity(database, id, voter);
  const keys = voterClaims(id, voter);
  if (!keys.identity.length)
    throw new PollError("กรุณาเปิดใช้งาน cookie เพื่อจดจำการโหวต", 401);
  const actor = keys.identity[0];
  const payload = createHash("sha256")
    .update(JSON.stringify([...input.choices].sort()))
    .digest("hex");
  const findRetry = async (tx: PollExecutor) => {
    const [retry] = await tx.query<{ payload: string; ballot_id: string }>(
      "SELECT payload,ballot_id FROM private.poll_requests WHERE poll_id=$1 AND actor=$2 AND request_id=$3",
      [id, actor, input.requestId],
    );
    if (retry && retry.payload !== payload)
      throw new PollError("รหัสคำขอนี้เคยใช้กับคำตอบอื่นแล้ว", 409);
    return retry;
  };
  const retry = await findRetry(database);
  if (retry) return { ballotId: retry.ballot_id, replayed: true };
  await verify(); // Never hold database locks while waiting on the challenge provider.
  return database.transaction(async (tx) => {
    // A short row lock serializes changes with closing, editing, and competing votes.
    await tx.query("SELECT id FROM private.polls WHERE id=$1 FOR UPDATE", [id]);
    const repeated = await findRetry(tx);
    if (repeated) return { ballotId: repeated.ballot_id, replayed: true };
    const row = await load(tx, id);
    if (getPollState(row, Date.parse(row.serverNow)) !== "open")
      throw new PollError(
        "โพลนี้ยังไม่เปิดหรือปิดรับโหวตแล้ว",
        409,
        "POLL_CLOSED",
      );
    if (row.security === "members" && !voter.userId)
      throw new PollError("โพลนี้เปิดให้สมาชิกที่เข้าสู่ระบบเท่านั้น", 403);
    if (
      input.choices.length < row.minChoices ||
      input.choices.length > row.maxChoices ||
      new Set(input.choices).size !== input.choices.length ||
      input.choices.some((id) => !row.options.some((o) => o.id === id))
    )
      throw new PollError(
        `กรุณาเลือกคำตอบ ${row.minChoices === row.maxChoices ? row.maxChoices : `${row.minChoices}–${row.maxChoices}`} ข้อจากโพลนี้`,
      );
    const own = await ownBallot(tx, id, keys.identity);
    if (own?.status === "excluded")
      throw new PollError("บัตรโหวตนี้ถูกระงับ กรุณาติดต่อผู้ดูแล", 403);
    if (own && !row.allowChange)
      throw new PollError("คุณโหวตในโพลนี้แล้ว", 409, "ALREADY_VOTED");
    const claims = [...keys.identity];
    if (row.security === "ip") {
      if (!keys.network)
        throw new PollError("ไม่สามารถยืนยันเครือข่ายได้ กรุณาลองใหม่", 503);
      claims.push(keys.network);
    }
    const matches = await tx.query<{ ballot_id: string }>(
      "SELECT ballot_id FROM private.poll_claims WHERE poll_id=$1 AND claim IN (SELECT jsonb_array_elements_text($2::jsonb))",
      [id, JSON.stringify(claims)],
    );
    if (matches.some((match) => match.ballot_id !== own?.id))
      throw new PollError(
        "ตัวตนหรือเครือข่ายนี้ใช้สิทธิ์โหวตแล้ว",
        409,
        "ALREADY_VOTED",
      );
    const ballotId = own?.id ?? randomUUID();
    if (!own)
      await tx.query(
        "INSERT INTO private.poll_ballots(id,poll_id) VALUES($1,$2)",
        [ballotId, id],
      );
    else {
      await tx.query(
        "DELETE FROM private.poll_ballot_choices WHERE ballot_id=$1",
        [ballotId],
      );
      await tx.query(
        "UPDATE private.poll_ballots SET updated_at=clock_timestamp() WHERE id=$1",
        [ballotId],
      );
    }
    for (const choice of input.choices)
      await tx.query(
        "INSERT INTO private.poll_ballot_choices(ballot_id,poll_id,option_id) VALUES($1,$2,$3)",
        [ballotId, id, choice],
      );
    for (const claim of claims)
      await tx.query(
        "INSERT INTO private.poll_claims(poll_id,claim,ballot_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [id, claim, ballotId],
      );
    await tx.query(
      "INSERT INTO private.poll_requests(poll_id,actor,request_id,payload,ballot_id) VALUES($1,$2,$3,$4,$5)",
      [id, actor, input.requestId, payload, ballotId],
    );
    return { ballotId, replayed: false };
  });
}

export async function duplicatePoll(
  database: PollDatabase,
  id: string,
  actor: string,
) {
  const source = await getAdminPoll(database, id);
  const assets = [
    ...source.options.flatMap((o) => (o.assetId ? [o.assetId] : [])),
    ...(source.coverAssetId ? [source.coverAssetId] : []),
  ];
  return createPoll(
    database,
    actor,
    {
      title: `${source.title.slice(0, 148)} (สำเนา)`,
      description: source.description,
      coverAssetId: source.coverAssetId,
      visibility: source.visibility,
      resultsVisibility: source.resultsVisibility,
      security: source.security,
      minChoices: source.minChoices,
      maxChoices: source.maxChoices,
      allowChange: source.allowChange,
      showCount: source.showCount,
      showOnHome: source.showOnHome,
      pinned: false,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      options: source.options.map((o) => ({
        id: randomUUID(),
        label: o.label,
        assetId: o.assetId,
        mangaId: o.mangaId,
      })),
    },
    assets,
  );
}

export async function moderateBallot(
  database: PollDatabase,
  id: string,
  ballotId: string,
  actor: string,
  exclude: boolean,
  reason: string,
) {
  if (!reason.trim() || reason.length > 500)
    throw new PollError("กรุณาระบุเหตุผลไม่เกิน 500 ตัวอักษร");
  await database.transaction(async (tx) => {
    await tx.query("SELECT id FROM private.polls WHERE id=$1 FOR UPDATE", [id]);
    const rows = await tx.query(
      "UPDATE private.poll_ballots SET status=$3,updated_at=clock_timestamp() WHERE poll_id=$1 AND id=$2 RETURNING id",
      [id, ballotId, exclude ? "excluded" : "counted"],
    );
    if (!rows.length) throw new PollError("ไม่พบบัตรโหวต", 404);
    await audit(
      tx,
      id,
      actor,
      exclude ? "exclude-ballot" : "restore-ballot",
      `${ballotId}: ${reason.trim()}`,
    );
  });
}

export async function pollActivity(
  database: PollExecutor,
  id: string,
  page = 1,
) {
  return {
    ballots: await database.query(
      "SELECT id,status,created_at,updated_at FROM private.poll_ballots WHERE poll_id=$1 ORDER BY created_at DESC LIMIT 30 OFFSET $2",
      [id, (page - 1) * 30],
    ),
    history: await database.query(
      "SELECT action,reason,actor_id,created_at FROM private.poll_audit_events WHERE poll_id=$1 ORDER BY created_at DESC LIMIT 50",
      [id],
    ),
    timeline: await database.query(
      "SELECT date_trunc('hour',created_at)::text AS hour,count(*)::int AS votes FROM private.poll_ballots WHERE poll_id=$1 AND status='counted' AND created_at>=clock_timestamp()-interval '7 days' GROUP BY 1 ORDER BY 1",
      [id],
    ),
    security: await database.query(
      "SELECT reason,sum(count)::int AS count FROM private.poll_security_counts WHERE poll_id=$1 AND hour>=clock_timestamp()-interval '7 days' GROUP BY reason ORDER BY reason",
      [id],
    ),
  };
}
export async function recordPollRejection(
  database: PollExecutor,
  id: string,
  reason: "verification" | "rate" | "duplicate" | "closed",
) {
  await database.query(
    `INSERT INTO private.poll_security_counts(poll_id,hour,reason,count)
    SELECT id,date_trunc('hour',clock_timestamp()),$2,1 FROM private.polls WHERE id=$1
    ON CONFLICT(poll_id,hour,reason) DO UPDATE SET count=LEAST(private.poll_security_counts.count+1,1000000000)`,
    [id, reason],
  );
}
