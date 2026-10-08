import { stubEnv, restoreEnvs } from "./helpers/env";
import { afterEach, expect, it, jest, mock } from 'bun:test';
const mocks = {cleanup:jest.fn()};
mock.module('@/lib/comments/assets',()=>({cleanupCommentAssets:mocks.cleanup}));
mock.module('@/lib/comments',()=>({handleCommentError:()=>new Response(null,{status:500})}));
const { GET } = await import('@/app/api/cron/comment-cleanup/route');
afterEach(()=>{restoreEnvs();jest.clearAllMocks();});
it('rejects missing, incorrect and multibyte credentials before any cleanup',async()=>{
 stubEnv('CRON_SECRET','aaaa');
 for(const authorization of ['', 'Bearer bbbb', 'Bearer éééé']) {
  expect((await GET(new Request('https://example.test/api/cron/comment-cleanup',{headers:{authorization}}))).status).toBe(401);
 }
 expect(mocks.cleanup).not.toHaveBeenCalled();
});
it('requires the exact bearer secret and disables cleanup when no secret is configured',async()=>{
 stubEnv('CRON_SECRET','');
 expect((await GET(new Request('https://example.test/api/cron/comment-cleanup',{headers:{authorization:'Bearer '}}))).status).toBe(401);
 stubEnv('CRON_SECRET','fixture-only');mocks.cleanup.mockResolvedValue({deleted:2});
 const r=await GET(new Request('https://example.test/api/cron/comment-cleanup',{headers:{authorization:'Bearer fixture-only'}}));
 expect(r.status).toBe(200);expect(await r.json()).toEqual({deleted:2});expect(mocks.cleanup).toHaveBeenCalledTimes(1);
});
