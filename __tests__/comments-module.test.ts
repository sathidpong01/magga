import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
const mock = vi.hoisted(()=>({getSession:vi.fn(),select:vi.fn(),insert:vi.fn(),update:vi.fn(),transaction:vi.fn(),reserve:vi.fn(),finalize:vi.fn(),quota:vi.fn(),retire:vi.fn()}));
vi.mock("@/db",()=>({db:{select:mock.select,insert:mock.insert,update:mock.update,transaction:mock.transaction}}));
vi.mock("@/lib/auth",()=>({auth:{api:{getSession:mock.getSession}}}));
vi.mock("./../lib/comments/assets",()=>({reserveCommentAsset:mock.reserve,finalizeCommentAsset:mock.finalize,retireCommentAssets:mock.retire,rollbackCommentAssetPublication:vi.fn(),discardPublishedCommentStaging:vi.fn(),decorateCommentImagePreviews:async(rows:unknown[])=>rows}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/comments/abuse",()=>({consumeCommentLimit:mock.quota}));
import { assertCommentOrigin, hashGuestToken, resolveCommentActor, publicCommentActor, verifyCommentChallenge } from "@/lib/comments/identity";
import { createComment, updateComment, deleteComment, getCommentCapabilities, isCommentOwner, voteComment } from "@/lib/comments";
import { validateCommentContent,validateImageIndex,requireUuid } from "@/lib/comments/validation";
import { parseCompositeCommentCursor,getNextCommentCursor } from "@/lib/comments/pagination";
const member = {kind:"member" as const,userId:"member-a",role:"user",name:"A",image:null};
const guest = {kind:"guest" as const,guestId:"11111111-1111-4111-8111-111111111111",sessionId:"session-a",name:"Guest",publicCode:"ABCD",verifiedUntil:null};
const headers = ()=>new Headers({origin:"https://magga.test",host:"magga.test"});
function selectRows(rows:unknown[]) { const q:any = {}; for(const key of ["from","where","innerJoin","leftJoin","orderBy","for"]) q[key]=vi.fn(()=>q); q.limit=vi.fn(async()=>rows); q.then=(resolve:(v:unknown[])=>unknown)=>Promise.resolve(rows).then(resolve); return q; }
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv("BETTER_AUTH_URL","https://magga.test");mock.getSession.mockResolvedValue(null);});
describe("guest comment security",()=>{
  it("requires matching origin, rejects cross-site and omitted origin",()=>{
    expect(()=>assertCommentOrigin(headers())).not.toThrow();
    expect(()=>assertCommentOrigin(new Headers({origin:"https://evil.test",host:"magga.test"}))).toThrow();
    expect(()=>assertCommentOrigin(new Headers({host:"magga.test"}))).toThrow();
    expect(()=>assertCommentOrigin(new Headers({origin:"https://magga.test","sec-fetch-site":"cross-site"}))).toThrow();
  });
  it("accepts the configured production fallback origin without trusting attacker Host",()=>{
    vi.stubEnv("NODE_ENV","production");
    for(const key of ["NEXT_PUBLIC_APP_URL","BETTER_AUTH_URL","AUTH_URL","NEXTAUTH_URL","VERCEL_URL"]) vi.stubEnv(key,"");
    expect(()=>assertCommentOrigin(new Headers({origin:"https://magga.vercel.app",host:"evil.test"}))).not.toThrow();
    expect(()=>assertCommentOrigin(new Headers({origin:"https://evil.test",host:"evil.test"}))).toThrow();
    vi.stubEnv("NODE_ENV","test");
  });
  it("hashes opaque tokens and exposes no guest ownership/session IDs",()=>{
    expect(hashGuestToken("opaque")).toMatch(/^[a-f0-9]{64}$/);
    const dto=publicCommentActor(guest);
    expect(dto).toMatchObject({name:"Guest",publicCode:"ABCD",canVote:false});
    expect(JSON.stringify(dto)).not.toMatch(/guestId|sessionId|verifiedUntil/);
  });
  it("does not fall back to guest when member auth fails",async()=>{
    mock.getSession.mockRejectedValue(new Error("auth offline"));
    await expect(resolveCommentActor(headers())).rejects.toThrow("auth offline");
    expect(mock.select).not.toHaveBeenCalled();
  });
  it("rechecks member ban from database even if session cache permits them",async()=>{
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValue(selectRows([{id:"member-a",isBanned:true,banned:false}]));
    await expect(resolveCommentActor(headers())).rejects.toMatchObject({status:403});
  });
  it("reads without creating guest identities",async()=>{
    expect(await resolveCommentActor(headers())).toBeNull();
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it("rejects banned guests even when moderation has revoked their matching session",async()=>{
    const token="a".repeat(43);
    mock.select.mockReturnValue(selectRows([{guest:{id:guest.guestId,isBanned:true},session:{revokedAt:new Date(),expiresAt:new Date(Date.now()+10000)}}]));
    const requestHeaders=headers();requestHeaders.set("cookie",`magga-comment=${token}`);
    await expect(resolveCommentActor(requestHeaders)).rejects.toMatchObject({status:403});
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it("keeps valid member capabilities usable when an unrelated guest cookie was banned", async () => {
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user",isBanned:false,banned:false}])).mockReturnValueOnce(selectRows([{guest:{id:guest.guestId,isBanned:true},session:{revokedAt:new Date(),expiresAt:new Date(Date.now()+10000)}}]));
    const requestHeaders=headers(); requestHeaders.set("cookie",`magga-comment=${"a".repeat(43)}`);
    await expect(getCommentCapabilities(requestHeaders,[])).resolves.toEqual({capabilities:{},comments:[]});
  });
  it("grants only member ownership when a retained guest cookie is banned", async () => {
    const otherId="22222222-2222-4222-8222-222222222222";
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user"}]))
      .mockReturnValueOnce(selectRows([{guest:{id:guest.guestId,isBanned:true},session:{revokedAt:new Date()}}]))
      .mockReturnValueOnce(selectRows([{comments:{id:guest.guestId,userId:"member-a",guestId:null,status:"published"}},{comments:{id:otherId,userId:null,guestId:guest.guestId,status:"published"}}]))
      .mockReturnValueOnce(selectRows([]));
    const requestHeaders=headers();requestHeaders.set("cookie",`magga-comment=${"a".repeat(43)}`);
    const result=await getCommentCapabilities(requestHeaders,[guest.guestId,otherId]);
    expect(result.capabilities[guest.guestId]).toEqual({canEdit:true,canDelete:true,userVote:null});
    expect(result.capabilities[otherId]).toEqual({canEdit:false,canDelete:false,userVote:null});
  });
  it("propagates a secondary guest database failure instead of silently dropping its check",async()=>{
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user"}])).mockImplementationOnce(()=>{throw new Error("guest database offline");});
    const requestHeaders=headers();requestHeaders.set("cookie",`magga-comment=${"a".repeat(43)}`);
    await expect(getCommentCapabilities(requestHeaders,[])).rejects.toThrow("guest database offline");
  });
  it.each(["edit","delete"] as const)("allows member %s of their own comment with an unrelated banned guest cookie",async(operation)=>{
    const row={id:guest.guestId,mangaId:"22222222-2222-4222-8222-222222222222",userId:"member-a",guestId:null,status:"published",content:"before",imageUrl:null};
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user"}])).mockReturnValueOnce(selectRows([row])).mockReturnValueOnce(selectRows([{id:row.mangaId,slug:"work",isHidden:false,pages:[]}])).mockReturnValueOnce(selectRows([{guest:{id:guest.guestId,isBanned:true},session:{revokedAt:new Date()}}])).mockReturnValueOnce(selectRows([{comment:{...row,content:"after"},profile:{id:"member-a",name:"A"},guest:null}]));
    const set=vi.fn(()=>({where:vi.fn(async()=>[])}));
    mock.update.mockReturnValue({set});mock.transaction.mockImplementation(async(fn:any)=>fn({update:mock.update,select:()=>selectRows([row])}));
    const requestHeaders=headers();requestHeaders.set("cookie",`magga-comment=${"a".repeat(43)}`);
    if(operation === "edit") expect((await updateComment(requestHeaders,{commentId:row.id,content:"after"})).content).toBe("after");
    else expect(await deleteComment(requestHeaders,row.id)).toEqual({success:true});
    expect(set).toHaveBeenCalledOnce();
  });
  it.each(["edit","delete"] as const)("does not grant member %s of a comment owned by their banned guest identity",async(operation)=>{
    const row={id:guest.guestId,mangaId:"22222222-2222-4222-8222-222222222222",userId:null,guestId:guest.guestId,status:"published",content:"before",imageUrl:null};
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user"}])).mockReturnValueOnce(selectRows([row])).mockReturnValueOnce(selectRows([{id:row.mangaId,slug:"work",isHidden:false,pages:[]}])).mockReturnValueOnce(selectRows([{guest:{id:guest.guestId,isBanned:true},session:{revokedAt:new Date()}}]));
    const requestHeaders=headers();requestHeaders.set("cookie",`magga-comment=${"a".repeat(43)}`);
    const result=operation === "edit" ? updateComment(requestHeaders,{commentId:row.id,content:"after"}) : deleteComment(requestHeaders,row.id);
    await expect(result).rejects.toMatchObject({status:403});expect(mock.update).not.toHaveBeenCalled();
  });
  it.each([true,false])("permits an empty edit only when the existing comment has an image (%s)",async(hasImage)=>{
    const row={id:guest.guestId,mangaId:"22222222-2222-4222-8222-222222222222",userId:"member-a",guestId:null,status:"published",content:"before",imageUrl:hasImage ? "/api/comments/media/image" : null};
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user"}])).mockReturnValueOnce(selectRows([row])).mockReturnValueOnce(selectRows([{id:row.mangaId,slug:"work",isHidden:false,pages:[]}])).mockReturnValueOnce(selectRows([{comment:{...row,content:""},profile:{id:"member-a",name:"A"},guest:null}]));
    const set=vi.fn(()=>({where:vi.fn(async()=>[])}));mock.update.mockReturnValue({set});mock.transaction.mockImplementation(async(fn:any)=>fn({update:mock.update,select:()=>selectRows([row])}));
    const result=updateComment(headers(),{commentId:row.id,content:"  "});
    if(hasImage){expect((await result).content).toBe("");expect(set).toHaveBeenCalledWith(expect.objectContaining({content:""}));}
    else{await expect(result).rejects.toMatchObject({status:400});expect(set).not.toHaveBeenCalled();}
  });
  it("requires a fresh member for voting and never grants guest vote",async()=>{
    await expect(voteComment(headers(),{commentId:"11111111-1111-4111-8111-111111111111",value:1})).rejects.toMatchObject({status:401});
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it("rejects untrusted CallerContext rather than using client-provided admin role",async()=>{
    await expect(createComment({user:{id:"attacker",role:"admin"},canModify:()=>true} as any,{mangaId:"bad",content:"x"})).rejects.toMatchObject({status:403});
  });
  it("owner checks distinguish member and guest namespaces",()=>{
    expect(isCommentOwner(guest,{userId:null,guestId:guest.guestId})).toBe(true);
    expect(isCommentOwner(member,{userId:member.userId,guestId:null})).toBe(true);
    expect(isCommentOwner(member,{userId:null,guestId:member.userId})).toBe(false);
    expect(isCommentOwner(guest,{userId:null,guestId:"another"})).toBe(false);
  });
  it("replays identical submitted requests without consuming quota or attaching a second asset",async()=>{
    const mangaId="22222222-2222-4222-8222-222222222222";
    const idempotencyKey="33333333-3333-4333-8333-333333333333";
    const requestHash=createHash("sha256").update(JSON.stringify({mangaId,assetId:null,content:"hello",imageIndex:null,parentId:null})).digest("hex");
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user",isBanned:false}])).mockReturnValueOnce(selectRows([{id:mangaId,slug:"work",isHidden:false,pages:[]}])).mockReturnValueOnce(selectRows([{comment:{id:"saved",content:"hello",userId:"member-a",guestId:null,status:"published"},profile:{id:"member-a",name:"A"},guest:null}]));
    const tx={execute:vi.fn(),select:vi.fn(()=>selectRows([{id:"saved",requestHash}]))};
    mock.transaction.mockImplementation(async(fn:any)=>fn(tx));
    const result=await createComment(headers(),{mangaId,content:"hello",idempotencyKey});
    expect(result.id).toBe("saved");
    expect(tx.execute).toHaveBeenCalledOnce();
    expect(mock.quota).not.toHaveBeenCalled();
    expect(mock.reserve).not.toHaveBeenCalled();
  });
  it('publishes guest URL comments immediately and persists direct R2 image URLs',async()=>{
    vi.stubEnv('GUEST_COMMENTS_ENABLED','true');
    const mangaId='22222222-2222-4222-8222-222222222222', assetId='33333333-3333-4333-8333-333333333333';
    const directUrl='https://comment-r2.test/comments/'+assetId+'.webp';
    const requestHeaders=headers();requestHeaders.set('cookie',`magga-comment=${'a'.repeat(43)}`);
    mock.select.mockReturnValueOnce(selectRows([{guest:{id:guest.guestId,name:'Guest',publicCode:'ABCD',isBanned:false},session:{id:'session-a',expiresAt:new Date(Date.now()+600000),verifiedUntil:new Date(Date.now()+600000)}}]))
      .mockReturnValueOnce(selectRows([{id:mangaId,slug:'work',isHidden:false,pages:[]}]))
      .mockReturnValueOnce(selectRows([{comment:{id:'saved',content:'https://example.test',guestId:guest.guestId,status:'published',imageUrl:directUrl},profile:null,guest:{name:'Guest',publicCode:'ABCD'}}]));
    const values=vi.fn().mockResolvedValue([]),set=vi.fn(()=>({where:vi.fn().mockResolvedValue([])}));
    const tx={execute:vi.fn(),select:vi.fn(()=>selectRows([])),insert:vi.fn(()=>({values})),update:vi.fn(()=>({set}))};
    mock.finalize.mockResolvedValue(directUrl);mock.transaction.mockImplementation(async(fn:any)=>fn(tx));
    const result=await createComment(requestHeaders,{mangaId,assetId,content:'https://example.test',idempotencyKey:'44444444-4444-4444-8444-444444444444'});
    expect(values).toHaveBeenCalledWith(expect.objectContaining({status:'published',guestId:guest.guestId}));
    expect(mock.finalize).toHaveBeenCalledWith(tx,assetId,expect.any(String),'published');
    expect(set).toHaveBeenCalledWith({imageUrl:directUrl});expect(result.imageUrl).toBe(directUrl);
  });
  it("rejects reused idempotency keys with changed payload",async()=>{
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user"}])).mockReturnValueOnce(selectRows([{id:"work",slug:"work",isHidden:false,pages:[]}]));
    mock.transaction.mockImplementation(async(fn:any)=>fn({execute:vi.fn(),select:vi.fn(()=>selectRows([{id:"saved",requestHash:"different"}]))}));
    await expect(createComment(headers(),{mangaId:"22222222-2222-4222-8222-222222222222",content:"hello",idempotencyKey:"33333333-3333-4333-8333-333333333333"})).rejects.toMatchObject({status:400});
    expect(mock.reserve).not.toHaveBeenCalled();
    expect(mock.quota).not.toHaveBeenCalled();
  });
  it("rejects replies to another manga or page before writing comment or asset",async()=>{
    mock.getSession.mockResolvedValue({user:{id:"member-a"}});
    mock.select.mockReturnValueOnce(selectRows([{id:"member-a",name:"A",role:"user"}])).mockReturnValueOnce(selectRows([{id:"work",slug:"work",isHidden:false,pages:[]}]));
    const select=vi.fn().mockReturnValueOnce(selectRows([])).mockReturnValueOnce(selectRows([{mangaId:"other",imageIndex:null,parentId:null,status:"published"}]));
    mock.transaction.mockImplementation(async(fn:any)=>fn({execute:vi.fn(),select}));
    await expect(createComment(headers(),{mangaId:"22222222-2222-4222-8222-222222222222",content:"reply",parentId:"44444444-4444-4444-8444-444444444444",idempotencyKey:"33333333-3333-4333-8333-333333333333"})).rejects.toMatchObject({status:400});
    expect(mock.reserve).not.toHaveBeenCalled();
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it("fails closed without verification configuration",async()=>{
    vi.stubEnv("TURNSTILE_SECRET_KEY","");
    await expect(verifyCommentChallenge(headers(),"token")).rejects.toMatchObject({status:503});
  });
  it("rejects Turnstile replay, wrong hostname and wrong action",async()=>{
    vi.stubEnv("TURNSTILE_SECRET_KEY","test-secret");
    for(const result of [{success:false},{success:true,hostname:"evil.test",action:"comment"},{success:true,hostname:"magga.test",action:"another"}]) {
      vi.stubGlobal("fetch",vi.fn(async()=>Response.json(result)));
      await expect(verifyCommentChallenge(headers(),"token")).rejects.toMatchObject({status:400});
    }
    vi.unstubAllGlobals();
  });
  it("accepts Thai and emoji plain text without mutating it into HTML entities",()=>{
    expect(validateCommentContent(' สวัสดี 🦊 <script> & ')).toBe('สวัสดี 🦊 <script> &');
    expect(()=>validateCommentContent("x".repeat(501))).toThrow();
    expect(()=>validateCommentContent(10)).toThrow();
    expect(()=>validateImageIndex(NaN)).toThrow();
    expect(()=>validateImageIndex(-1)).toThrow();
    expect(()=>requireUuid("arbitrary","id")).toThrow();
  });
  it("composite cursor preserves deterministic ordering for equal timestamps",()=>{
    const timestamp="2026-10-07T01:00:00.000Z";
    const id="11111111-1111-4111-8111-111111111111";
    expect(parseCompositeCommentCursor(getNextCommentCursor(timestamp,id))).toEqual({createdAt:new Date(timestamp),id});
    expect(parseCompositeCommentCursor(timestamp)).toEqual({createdAt:new Date(timestamp),id:null});
    expect(parseCompositeCommentCursor(`${timestamp}|invalid`)).toBeNull();
  });
});
