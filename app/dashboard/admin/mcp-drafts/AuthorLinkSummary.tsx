import { mergeSocialLinks, readSocialLinks } from '@/lib/social-link-details';
import SocialLinkLabel from './SocialLinkLabel';
import styles from './page.module.css';

export function authorAction(proposal: Record<string, unknown>) {
  return proposal.profile_url ? (readSocialLinks(proposal.social_links).length ? 'เปลี่ยนลิงก์หลักและช่องทาง' : 'เปลี่ยนลิงก์หลัก') : 'บันทึกช่องทาง';
}
export default function AuthorLinkSummary({ current, proposal }: { current: Record<string, unknown>; proposal: Record<string, unknown> }) {
  const existing = mergeSocialLinks([], readSocialLinks(current.social_link_details ?? current.social_links));
  const result = mergeSocialLinks(existing, readSocialLinks(proposal.social_links));
  const added = result.filter(link => !existing.some(old => old.url === link.url));
  const changed = result.filter(link => existing.some(old => old.url === link.url && (old.label !== link.label || old.icon !== link.icon)));
  const profile = typeof proposal.profile_url === 'string' ? proposal.profile_url : null;
  return <div className={styles.linkSummary}>
    {profile ? <><strong>เปลี่ยนลิงก์หลัก</strong><p><span className={styles.muted}>{String(current.profile_url || 'ยังไม่มี')} → </span>{profile}</p></> : <p className={styles.muted}>ลิงก์หลักคงเดิม: {String(current.profile_url || 'ยังไม่มี')}</p>}
    <p>เพิ่ม {added.length} · แก้ป้ายชื่อ/ไอคอน {changed.length} · เก็บลิงก์เดิม {existing.length}</p>
    <ul className={styles.linkRows}>{result.map(link => {
      const old = existing.find(v => v.url === link.url);
      const updated = changed.includes(link);
      return <li key={link.url}><span>{updated && old && <span className={styles.previousLink}><SocialLinkLabel link={old} /> →</span>}<SocialLinkLabel link={link} /></span><small>{!old ? 'เพิ่มใหม่' : updated ? 'แก้ป้ายชื่อ/ไอคอน' : 'เก็บไว้'}</small></li>;
    })}</ul>
  </div>;
}
