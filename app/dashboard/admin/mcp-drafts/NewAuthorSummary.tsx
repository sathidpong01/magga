import styles from './page.module.css';
import { mergeSocialLinks, readSocialLinks } from '@/lib/social-link-details';
import SocialLinkLabel from './SocialLinkLabel';

export default function NewAuthorSummary({ proposal, hasAuthor }: { proposal: Record<string, unknown>; hasAuthor: boolean }) {
  const links = mergeSocialLinks([], readSocialLinks(proposal.social_links));
  return <div className={styles.linkSummary}>
    <p>สร้างผู้แต่งใหม่: <strong>{typeof proposal.name === 'string' ? proposal.name : 'ข้อมูลไม่ถูกต้อง'}</strong></p>
    <p className={styles.muted}>{hasAuthor ? 'เรื่องนี้มีผู้แต่งแล้ว ต้องตรวจข้อเสนอใหม่ก่อนอนุมัติ' : 'ผูกกับเรื่องนี้เมื่ออนุมัติ · ไม่ตั้งลิงก์หลัก'}</p>
    <ul className={styles.linkRows}>{links.map(link => <li key={link.url}><SocialLinkLabel link={link} /><small>เพิ่มใหม่</small></li>)}</ul>
  </div>;
}
