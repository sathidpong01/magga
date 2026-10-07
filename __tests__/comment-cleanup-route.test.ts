import { afterEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({cleanup:vi.fn()}));
vi.mock('@/lib/comments/assets',()=>({cleanupCommentAssets:mocks.cleanup}));
vi.mock('@/lib/comments',()=>({handleCommentError:()=>new Response(null,{status:500})}));
import { GET } from '@/app/api/cron/comment-cleanup/route';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it('rejects missing, incorrect and multibyte credentials before any cleanup',async()=>{
 vi.stubEnv('CRON_SECRET','aaaa');
 for(const authorization of ['', 'Bearer bbbb', 'Bearer éééé']) {
  expect((await GET(new Request('https://example.test/api/cron/comment-cleanup',{headers:{authorization}}))).status).toBe(401);
 }
 expect(mocks.cleanup).not.toHaveBeenCalled();
});
it('requires the exact bearer secret and disables cleanup when no secret is configured',async()=>{
 vi.stubEnv('CRON_SECRET','');
 expect((await GET(new Request('https://example.test/api/cron/comment-cleanup',{headers:{authorization:'Bearer '}}))).status).toBe(401);
 vi.stubEnv('CRON_SECRET','fixture-only');mocks.cleanup.mockResolvedValue({deleted:2});
 const r=await GET(new Request('https://example.test/api/cron/comment-cleanup',{headers:{authorization:'Bearer fixture-only'}}));
 expect(r.status).toBe(200);expect(await r.json()).toEqual({deleted:2});expect(mocks.cleanup).toHaveBeenCalledOnce();
});
