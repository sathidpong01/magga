'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
export default function RefreshButton({ className }: { className: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className={className} disabled={pending} onClick={() => startTransition(() => router.refresh())} aria-busy={pending}>{pending ? 'กำลังโหลด…' : 'โหลดข้อมูลล่าสุด'}</button>;
}
